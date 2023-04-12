import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import ini from 'ini';
import type { TiktokenModel } from '@dqbd/tiktoken';
import { commandName } from './constants';
import { KnownError, handleCliError } from './error';
import * as p from '@clack/prompts';
import { red } from 'kolorist';

const { hasOwnProperty } = Object.prototype;
export const hasOwn = (object: unknown, key: PropertyKey) =>
  hasOwnProperty.call(object, key);

const parseAssert = (name: string, condition: any, message: string) => {
  if (!condition) {
    throw new KnownError(`Invalid config property ${name}: ${message}`);
  }
};

const configParsers = {
  OPENAI_KEY(key?: string) {
    if (!key) {
      throw new KnownError(
        `Please set your OpenAI API key via \`${commandName} config set OPENAI_KEY=<your token>\``
      );
    }
    parseAssert('OPENAI_KEY', key.startsWith('sk-'), 'Must start with "sk-"');

    return key;
  },
  model(model?: string) {
    if (!model || model.length === 0) {
      return 'gpt-3.5-turbo';
    }

    return model as TiktokenModel;
  },
  SILENT_MODE(mode?: string) {
    return String(mode).toLowerCase() === 'true';
  },
  OPENAI_API_ENDPOINT(apiEndpoint?: string) {
    return apiEndpoint || 'https://api.openai.com/v1';
  },
} as const;

type ConfigKeys = keyof typeof configParsers;

type RawConfig = {
  [key in ConfigKeys]?: string;
};

type ValidConfig = {
  [Key in ConfigKeys]: ReturnType<(typeof configParsers)[Key]>;
};

const configPath = path.join(os.homedir(), '.ai-shell');

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

export const setConfigs = async (keyValues: [key: string, value: string][]) => {
  const config = await readConfigFile();

  for (const [key, value] of keyValues) {
    if (!hasOwn(configParsers, key)) {
      throw new KnownError(`Invalid config property: ${key}`);
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
      message: 'Set config:',
      options: [
        {
          label: 'OpenAI Key',
          value: 'OPENAI_KEY',
          hint: hasOwn(config, 'OPENAI_KEY')
            ? // Obfuscate the key
              'sk-...' + config.OPENAI_KEY.slice(-3)
            : '(not set)',
        },
        {
          label: 'OpenAI API Endpoint',
          value: 'OPENAI_API_ENDPOINT',
          hint: hasOwn(config, 'OPENAI_API_ENDPOINT')
            ? config.OPENAI_API_ENDPOINT
            : '(not set)',
        },
        {
          label: 'Silent Mode',
          value: 'SILENT_MODE',
          hint: hasOwn(config, 'SILENT_MODE')
            ? config.SILENT_MODE.toString()
            : '(not set)',
        },
        {
          label: 'Model',
          value: 'model',
          hint: hasOwn(config, 'model') ? config.model : '(not set)',
        },
        {
          label: 'Cancel',
          value: 'cancel',
          hint: 'Exit the program',
        },
      ],
    })) as ConfigKeys | 'cancel' | symbol;

    if (p.isCancel(choice)) return;

    if (choice === 'OPENAI_KEY') {
      const key = await p.text({
        message: 'Enter your OpenAI API key',
        validate: (value) => {
          if (!value.startsWith('sk-')) return 'Must start with "sk-"';
        },
      });
      if (p.isCancel(key)) return;
      setConfigs([['OPENAI_KEY', key]]);
    } else if (choice === 'OPENAI_API_ENDPOINT') {
      const apiEndpoint = await p.text({
        message: 'Enter your OpenAI API Endpoint',
      });
      if (p.isCancel(apiEndpoint)) return;
      setConfigs([['OPENAI_API_ENDPOINT', apiEndpoint]]);
    } else if (choice === 'SILENT_MODE') {
      const silentMode = await p.confirm({
        message: 'Enable silent mode?',
      });
      if (p.isCancel(silentMode)) return;
      setConfigs([['SILENT_MODE', silentMode ? 'true' : 'false']]);
    } else if (choice === 'model') {
      const model = await p.text({
        message: 'Enter the model you want to use',
      });
      if (p.isCancel(model)) return;
      setConfigs([['model', model]]);
    }
    if (choice === 'cancel') return;
    showConfigUI();
  } catch (error: any) {
    console.error(`\n${red('✖')} ${error.message}`);
    handleCliError(error);
    process.exit(1);
  }
};
