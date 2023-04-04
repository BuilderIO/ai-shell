import * as p from '@clack/prompts';
import color from 'picocolors';
import { commandName, repoUrl } from './helpers/constants';
import { getConfig } from './helpers/config';
import { KnownError } from './helpers/error';
import { getScriptAndInfo } from './helpers/completion';
import { $, execaCommand } from 'execa';

async function getPrompt() {
  const group = p.group(
    {
      prompt: () =>
        p.text({
          message: 'What would you like me to to do?',
          placeholder: 'Delete all *.log files',
          validate: (value) => {
            if (!value) return 'Please enter a prompt.';
          },
        }),
    },
    {
      onCancel: () => {
        p.cancel('Operation cancelled.');
        process.exit(0);
      },
    }
  );
  return (await group).prompt;
}

export async function prompt(usePrompt?: string) {
  console.clear();

  const { OPENAI_KEY: key } = await getConfig();
  if (!key) {
    throw new KnownError(
      'Please set your OpenAI API key via `aicommits config set OPENAI_KEY=<your token>`'
    );
  }
  parseAssert('OPENAI_KEY', key.startsWith('sk-'), 'Must start with "sk-"');

  p.intro(`${color.bgCyan(color.black(` ${commandName} `))}`);

  const thePrompt = usePrompt || (await getPrompt());

  p.log.step(`Loading...`);
  const spin = p.spinner();
  spin.start();
  const { script, info } = await getScriptAndInfo({ prompt: thePrompt, key });
  spin.stop();
  p.log.step(`Your script:`);
  p.log.message(script);
  p.log.step(`Explanation:`);
  p.log.message(info);

  const answer = await p.select({
    message: 'Run this script?',
    options: [
      { label: 'Yes', value: 'yes', hint: 'Lets go!' },
      { label: 'Retry', value: 'retry', hint: 'Generate a new result' },
      { label: 'New prompt', value: 'new', hint: 'Modify your prompt' },
      { label: 'Cancel', value: 'cancel', hint: 'Exit the program' },
    ],
  });

  const retry = answer === 'retry';
  const confirmed = answer === 'yes';
  const cancel = answer === 'cancel';
  const newPrompt = answer === 'new';

  if (retry) {
    await prompt(thePrompt);
  } else if (newPrompt) {
    await prompt();
  } else if (confirmed) {
    p.outro(`Running: ${script}`);
    console.log('');
    await execaCommand(script, { stdio: 'inherit' });
  } else if (cancel) {
    p.cancel('Operation cancelled.');
    process.exit(0);
  }
}

const parseAssert = (name: string, condition: any, message: string) => {
  if (!condition) {
    throw new KnownError(`Invalid config property ${name}: ${message}`);
  }
};
