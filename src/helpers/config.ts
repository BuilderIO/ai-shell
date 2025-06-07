import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import ini from 'ini';
import type { TiktokenModel } from '@dqbd/tiktoken';
import { commandName } from './constants';
import { KnownError, handleCliError } from './error';
import * as p from '@clack/prompts';
import { red } from 'kolorist';
import i18n from './i18n';
import { logger } from './logger';
import { EngineConfig, EngineType } from './engines/config-engine';
import { createEngine } from './engines/engine-factory';

const { hasOwnProperty } = Object.prototype;
export const hasOwn = (object: unknown, key: PropertyKey) =>
  hasOwnProperty.call(object, key);

const languagesOptions = Object.entries(i18n.languages).map(([key, value]) => ({
  value: key,
  label: value,
}));

const parseAssert = (name: string, condition: any, message: string) => {
  if (!condition) {
    throw new KnownError(
      `${i18n.t('Invalid config property')} ${name}: ${message}`
    );
  }
};

const configParsers = {
  AI_ENGINE(engine?: string) {
    if (!engine || !Object.values(EngineType).includes(engine as EngineType)) {
      return EngineType.OPENAI;
    }
    return engine as EngineType;
  },

  OPENAI_KEY(key?: string) {
    if (!key) {
      throw new KnownError(
        `Please set your OpenAI API key via \`${commandName} config set OPENAI_KEY=<your token>\`` // TODO: i18n
      );
    }

    return key;
  },
  OPENAI_MODEL(model?: string) {
    if (!model || model.length === 0) {
      return 'gpt-4.1-nano';
    }

    return model as TiktokenModel;
  },
  OPENAI_API_ENDPOINT(apiEndpoint?: string) {
    return apiEndpoint || 'https://api.openai.com/v1';
  },
  OPENAI_ALLPROXY(proxy?: string) {
    return proxy || '';
  },

  GIGACHAT_KEY(key?: string) {
    if (!key) {
      throw new KnownError(
        `Please set your GigaChat API key via \`${commandName} config set GIGACHAT_KEY=<your token>\`` // TODO: i18n
      );
    }

    return key;
  },
  GIGACHAT_MODEL(model?: string) {
    if (!model || model.length === 0) {
      return 'GigaChat-2';
    }

    return model as TiktokenModel;
  },
  GIGACHAT_API_ENDPOINT(apiEndpoint?: string) {
    return apiEndpoint || 'https://gigachat.devices.sberbank.ru/api/v1';
  },
  GIGACHAT_ALLPROXY(proxy?: string) {
    return proxy || '';
  },

  PROXY_PAC_URL(pacUrl?: string) {
    return pacUrl || '';
  },
  SILENT_MODE(mode?: string) {
    return String(mode).toLowerCase() === 'true';
  },
  LANGUAGE(language?: string) {
    return language || 'en';
  },
} as const;

type ConfigKeys = keyof typeof configParsers;

type RawConfig = {
  [key in ConfigKeys]?: string;
};

type ValidConfig = {
  [Key in ConfigKeys]: ReturnType<(typeof configParsers)[Key]>;
};

const configPath = process.env.AI_SHELL_CONFIG_PATH
  || path.join(os.homedir(), '.ai-shell');
logger.debug(`Config path: ${configPath}`);

const fileExists = (filePath: string) =>
  fs.lstat(filePath).then(
    () => true,
    () => false
  );

const readConfigFile = async (): Promise<RawConfig> => {
  const configExists = await fileExists(configPath);
  if (!configExists) {
    return Object.create(null);
  }

  const configString = await fs.readFile(configPath, 'utf8');
  return ini.parse(configString);
};

export const getConfig = async (
  cliConfig?: RawConfig
): Promise<ValidConfig> => {
  const config = await readConfigFile();
  const parsedConfig: Record<string, unknown> = {};

  for (const key of Object.keys(configParsers) as ConfigKeys[]) {
    const parser = configParsers[key];
    const value = cliConfig?.[key] ?? config[key];
    parsedConfig[key] = parser(value);
  }

  return parsedConfig as ValidConfig;
};

export function getEngineConfig(
  config: ValidConfig,
  forcedEngineType?: EngineType,
): EngineConfig {
  const engineType = forcedEngineType || config.AI_ENGINE;
  if (engineType === EngineType.OPENAI) {
    return {
      engineType: EngineType.OPENAI,
      apiKey: config.OPENAI_KEY,
      apiEndpoint: config.OPENAI_API_ENDPOINT,
      modelName: config.OPENAI_MODEL,
      proxy: config.OPENAI_ALLPROXY,
      proxyPacUrl: config.PROXY_PAC_URL,
    };
  } else if (engineType === EngineType.GIGACHAT) {
    return {
      engineType: EngineType.GIGACHAT,
      apiKey: config.GIGACHAT_KEY,
      apiEndpoint: config.GIGACHAT_API_ENDPOINT,
      modelName: config.GIGACHAT_MODEL,
      proxy: config.GIGACHAT_ALLPROXY,
      proxyPacUrl: config.PROXY_PAC_URL,
    };
  } else {
    throw new Error(`Unsupported engine type: ${engineType}`);
  }
}


export const setConfigs = async (keyValues: [key: string, value: string][]) => {
  const config = await readConfigFile();

  for (const [key, value] of keyValues) {
    if (!hasOwn(configParsers, key)) {
      throw new KnownError(`${i18n.t('Invalid config property')}: ${key}`);
    }

    const parsed = configParsers[key as ConfigKeys](value);
    config[key as ConfigKeys] = parsed as any;
  }

  await fs.writeFile(configPath, ini.stringify(config), 'utf8');
};

export const showConfigUI = async () => {
  try {
    const config = await getConfig();
    const choice = (await p.select({
      message: i18n.t('Set config') + ':',
      options: [
        {
          label: i18n.t('AI Engine'),
          value: 'AI_ENGINE',
          hint: hasOwn(config, 'AI_ENGINE')
            ? config.AI_ENGINE
            : i18n.t('(not set)'),
        },
        {
          label: i18n.t('[OpenAI] Key'),
          value: 'OPENAI_KEY',
          hint: hasOwn(config, 'OPENAI_KEY')
            ? // Obfuscate the key
              'sk-...' + config.OPENAI_KEY.slice(-3)
            : i18n.t('(not set)'),
        },
        {
          label: i18n.t('[OpenAI] Model'),
          value: 'OPENAI_MODEL',
          hint: hasOwn(config, 'OPENAI_MODEL') ? config.OPENAI_MODEL : i18n.t('(not set)'),
        },
        {
          label: i18n.t('[OpenAI] API Endpoint'),
          value: 'OPENAI_API_ENDPOINT',
          hint: hasOwn(config, 'OPENAI_API_ENDPOINT')
            ? config.OPENAI_API_ENDPOINT
            : i18n.t('(not set)'),
        },
        {
          label: i18n.t('[OpenAI] ALL_PROXY'),
          value: 'OPENAI_ALLPROXY',
          hint: hasOwn(config, 'OPENAI_ALLPROXY')
            ? config.OPENAI_ALLPROXY
            : i18n.t('(not set)'),
        },

        {
          label: i18n.t('[GigaChat] Key'),
          value: 'GIGACHAT_KEY',
          hint: hasOwn(config, 'GIGACHAT_KEY')
            ? // Obfuscate the key
              'Bearer-...' + config.GIGACHAT_KEY.slice(-3)
            : i18n.t('(not set)'),
        },
        {
          label: i18n.t('[GigaChat] Model'),
          value: 'GIGACHAT_MODEL',
          hint: hasOwn(config, 'GIGACHAT_MODEL') ? config.GIGACHAT_MODEL : i18n.t('(not set)'),
        },
        {
          label: i18n.t('[GigaChat] API Endpoint'),
          value: 'GIGACHAT_API_ENDPOINT',
          hint: hasOwn(config, 'GIGACHAT_API_ENDPOINT')
            ? config.GIGACHAT_API_ENDPOINT
            : i18n.t('(not set)'),
        },
        {
          label: i18n.t('[GigaChat] ALL_PROXY'),
          value: 'GIGACHAT_ALLPROXY',
          hint: hasOwn(config, 'GIGACHAT_ALLPROXY')
            ? config.GIGACHAT_ALLPROXY
            : i18n.t('(not set)'),
        },
        {
          label: i18n.t('[Common] Proxy PAC URL'),
          value: 'PROXY_PAC_URL',
          hint: hasOwn(config, 'PROXY_PAC_URL')
            ? config.PROXY_PAC_URL
            : i18n.t('(not set)'),
        },
        {
          label: i18n.t('Silent Mode'),
          value: 'SILENT_MODE',
          hint: hasOwn(config, 'SILENT_MODE')
            ? config.SILENT_MODE.toString()
            : i18n.t('(not set)'),
        },
        {
          label: i18n.t('Language'),
          value: 'LANGUAGE',
          hint: hasOwn(config, 'LANGUAGE')
            ? config.LANGUAGE
            : i18n.t('(not set)'),
        },
        {
          label: i18n.t('Cancel'),
          value: 'cancel',
          hint: i18n.t('Exit the program'),
        },
      ],
    })) as ConfigKeys | 'cancel' | symbol;

    if (p.isCancel(choice)) return;

    if (choice === 'AI_ENGINE') {
      const engineType = await p.select({
        initialValue: (await getConfig()).AI_ENGINE.toString(),
        message: i18n.t('Select AI Engine'),
        options: Object.values(EngineType).map((m: string) => {
          return { value: m, label: m };
        }),
      });
      if (p.isCancel(engineType)) return;
      await setConfigs([['AI_ENGINE', engineType as string]]);
    
    } else if (choice === 'OPENAI_KEY') {
      const key = await p.text({
        message: i18n.t('Enter your OpenAI API key'),
        validate: (value) => {
          if (!value.length) {
            return i18n.t('Please enter a key');
          }
        },
      });
      if (p.isCancel(key)) return;
      await setConfigs([['OPENAI_KEY', key]]);
    } else if (choice === 'GIGACHAT_KEY') {
      const key = await p.text({
        message: i18n.t('Enter your GigaChat API key'),
        validate: (value) => {
          if (!value.length) {
            return i18n.t('Please enter a key');
          }
        },
      });
      if (p.isCancel(key)) return;
      await setConfigs([['GIGACHAT_KEY', key]]);
    } else if (choice === 'OPENAI_API_ENDPOINT') {
      const apiEndpoint = await p.text({
        message: i18n.t('Enter your OpenAI API Endpoint'),
      });
      if (p.isCancel(apiEndpoint)) return;
      await setConfigs([['OPENAI_API_ENDPOINT', apiEndpoint]]);
    } else if (choice === 'GIGACHAT_API_ENDPOINT') {
      const apiEndpoint = await p.text({
        message: i18n.t('Enter your GigaChat API Endpoint'),
      });
      if (p.isCancel(apiEndpoint)) return;
      await setConfigs([['GIGACHAT_API_ENDPOINT', apiEndpoint]]);
    } else if (choice === 'OPENAI_ALLPROXY') {
      const proxy = await p.text({
        message: i18n.t('Enter your OpenAI ALL_PROXY'),
      });
      if (p.isCancel(proxy)) return;
      await setConfigs([['OPENAI_ALLPROXY', proxy]]);
    } else if (choice === 'GIGACHAT_ALLPROXY') {
      const proxy = await p.text({
        message: i18n.t('Enter your GigaChat ALL_PROXY'),
      });
      if (p.isCancel(proxy)) return;
      await setConfigs([['GIGACHAT_ALLPROXY', proxy]]);
    } else if (choice === 'PROXY_PAC_URL') {
      const pacUrl = await p.text({
        message: i18n.t('Enter your Proxy PAC URL'),
      });
      if (p.isCancel(pacUrl)) return;
      await setConfigs([['PROXY_PAC_URL', pacUrl]]);
    } else if (choice === 'SILENT_MODE') {
      const silentMode = await p.confirm({
        initialValue: (await getConfig()).SILENT_MODE,
        message: i18n.t('Enable silent mode?'),
      });
      if (p.isCancel(silentMode)) return;
      await setConfigs([['SILENT_MODE', silentMode ? 'true' : 'false']]);
    } else if (choice === 'OPENAI_MODEL') {
      const config = await getConfig();
      const engineConfig = getEngineConfig(config, EngineType.OPENAI);
      const engine = createEngine(engineConfig);
      const models = await engine.getModels();
      const model = (await p.select({
        initialValue: engineConfig.modelName,
        message: 'Pick a model.',
        options: models.map((m: string) => {
          return { value: m, label: m };
        }),
      })) as string;

      if (p.isCancel(model)) return;
      await setConfigs([['OPENAI_MODEL', model]]);
    } else if (choice === 'GIGACHAT_MODEL') {
      const config = await getConfig();
      const engineConfig = getEngineConfig(config, EngineType.GIGACHAT);
      const engine = createEngine(engineConfig);
      const models = await engine.getModels();
      const model = (await p.select({
        initialValue: engineConfig.modelName,
        message: 'Pick a model.',
        options: models.map((m: string) => {
          return { value: m, label: m };
        }),
      })) as string;

      if (p.isCancel(model)) return;
      await setConfigs([['GIGACHAT_MODEL', model]]);
    } else if (choice === 'LANGUAGE') {
      const language = (await p.select({
        initialValue: (await getConfig()).LANGUAGE,
        message: i18n.t('Enter the language you want to use'),
        options: languagesOptions,
      })) as string;
      if (p.isCancel(language)) return;
      await setConfigs([['LANGUAGE', language]]);
      i18n.setLanguage(language);
    }
    if (choice === 'cancel') return;
    showConfigUI();
  } catch (error: any) {
    console.error(`\n${red('✖')} ${error.message}`);
    handleCliError(error);
    process.exit(1);
  }
};
