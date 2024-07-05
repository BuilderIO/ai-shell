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
import { getModels } from './completion';

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
  ANTHROPIC_KEY(key?: string) {
    if (!key) {
      throw new KnownError(
        `Please set your Anthropic API key via \`${commandName} config set ANTHROPIC_KEY=<your token>\``
      );
    }

    return key;
  },
  MODEL(model?: string) {
    if (!model || model.length === 0) {
      return 'claude-3-5-sonnet-20240620';
    }

    return model;
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
          label: i18n.t('Anthropic Key'),
          value: 'ANTHROPIC_KEY',
          hint: hasOwn(config, 'ANTHROPIC_KEY')
            ? // Obfuscate the key
              'sk-...' + config.ANTHROPIC_KEY.slice(-3)
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
          label: i18n.t('Model'),
          value: 'MODEL',
          hint: hasOwn(config, 'MODEL') ? config.MODEL : i18n.t('(not set)'),
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

    if (choice === 'ANTHROPIC_KEY') {
      const key = await p.text({
        message: i18n.t('Enter your anthropic API key'),
        validate: (value) => {
          if (!value.length) {
            return i18n.t('Please enter a key');
          }
        },
      });
      if (p.isCancel(key)) return;
      await setConfigs([['ANTHROPIC_KEY', key]]);
    } else if (choice === 'SILENT_MODE') {
      const silentMode = await p.confirm({
        message: i18n.t('Enable silent mode?'),
      });
      if (p.isCancel(silentMode)) return;
      await setConfigs([['SILENT_MODE', silentMode ? 'true' : 'false']]);
    } else if (choice === 'MODEL') {
      const { ANTHROPIC_KEY: key } = await getConfig();
      const models = await getModels();
      const model = (await p.select({
        message: 'Pick a model.',
        options: models.map((m: string) => {
          return { value: m, label: m };
        }),
      })) as string;

      if (p.isCancel(model)) return;
      await setConfigs([['MODEL', model]]);
    } else if (choice === 'LANGUAGE') {
      const language = (await p.select({
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
