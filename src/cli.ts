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
    },
    commands: [config],
  },
  (argv) => {
    const promptText = argv._.join(' ');
    prompt({ usePrompt: promptText }).catch(console.error);
  }
);
