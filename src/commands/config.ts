import { command } from 'cleye';
import { red } from 'kolorist';
import {
  hasOwn,
  getConfig,
  setConfigs,
  showConfigUI,
} from '../helpers/config.js';
import { KnownError, handleCliError } from '../helpers/error.js';
import i18n from '../helpers/i18n.js';

export default command(
  {
    name: 'config',
    parameters: ['[mode]', '[key=value...]'],
    help: {
      description: 'Configure the CLI',
    },
  },
  (argv) => {
    (async () => {
      const { mode, keyValue: keyValues } = argv._;

      if (mode === 'ui' || !mode) {
        await showConfigUI();
        return;
      }

      if (!keyValues.length) {
        console.error(
          `${i18n.t('Error')}: ${i18n.t(
            'Missing required parameter'
          )} "key=value"\n`
        );
        argv.showHelp();
        return process.exit(1);
      }

      if (mode === 'get') {
        const config = await getConfig();
        for (const key of keyValues) {
          if (hasOwn(config, key)) {
            console.log(`${key}=${config[key as keyof typeof config]}`);
          } else {
            throw new KnownError(
              `${i18n.t('Invalid config property')}: ${key}`
            );
          }
        }
        return;
      }

      if (mode === 'set') {
        await setConfigs(
          keyValues.map((keyValue) => keyValue.split('=') as [string, string])
        );
        return;
      }

      throw new KnownError(`${i18n.t('Invalid mode')}: ${mode}`);
    })().catch((error) => {
      console.error(`\n${red('✖')} ${error.message}`);
      handleCliError(error);
      process.exit(1);
    });
  }
);
