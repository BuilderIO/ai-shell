import { cli } from 'cleye';
import { red } from 'kolorist';
import { version } from '../package.json';
import config from './commands/config';
import update from './commands/update';
import chat from './commands/chat';
import { commandName } from './helpers/constants';
import { handleCliError } from './helpers/error';
import { prompt } from './prompt';

cli(
  {
    name: commandName,
    version: version,
    flags: {
      prompt: {
        type: String,
        description: 'Prompt to run',
        alias: 'p',
      },
      silent: {
        type: Boolean,
        description: 'Less verbose, skip printing the command explanation ',
        alias: 's',
      },
    },
    commands: [config, chat, update],
  },
  (argv) => {
    const silentMode = argv.flags.silent;
    const promptText = argv._.join(' ');

    if (promptText.trim() === 'update') {
      update.callback?.(argv);
    } else {
      prompt({ usePrompt: promptText, silentMode }).catch((error) => {
        console.error(`\n${red('✖')} ${error.message}`);
        handleCliError(error);
        process.exit(1);
      });
    }
  }
);
