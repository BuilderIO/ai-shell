import { cli } from 'cleye';
import { version } from '../package.json';
import config from './commands/config';
import { commandName } from './helpers/constants';
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
        description: 'less verbose, skip printing the command explanation ',
        alias: 's',
      },
    },
    commands: [config],
  },
  (argv) => {
    const silentMode = argv.flags.silent;
    const promptText = argv._.join(' ');
    prompt({ usePrompt: promptText, silentMode });
  }
);
