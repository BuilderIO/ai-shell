import * as p from '@clack/prompts';
import { bgCyan, black } from 'kolorist';
import { commandName } from './helpers/constants';
import { getConfig } from './helpers/config';
import { KnownError } from './helpers/error';
import {
  getExplanation,
  getRevision,
  getScriptAndInfo,
} from './helpers/completion';
import { execaCommand } from 'execa';

const sample = <T>(arr: T[]): T | undefined => {
  const len = arr == null ? 0 : arr.length;
  return len ? arr[Math.floor(Math.random() * len)] : undefined;
};

const examples = [
  'delete all log files',
  'list js files',
  'fetch me a random joke',
  'list all commits',
];

async function getPrompt(prompt?: string) {
  const group = p.group(
    {
      prompt: () =>
        p.text({
          message: 'What would you like me to to do?',
          placeholder: `e.g. ${sample(examples)}`,
          initialValue: prompt,
          defaultValue: 'Say hello',
          validate: (value) => {
            if (!value) return 'Please enter a prompt.';
          },
        }),
    },
    {
      onCancel: () => {
        p.cancel('Goodbye!');
        process.exit(0);
      },
    }
  );
  return (await group).prompt;
}

async function promptForRevision() {
  const group = p.group(
    {
      prompt: () =>
        p.text({
          message: 'What would you like me to to change in this script?',
          placeholder: 'e.g. change the folder name',
          validate: (value) => {
            if (!value) return 'Please enter a prompt.';
          },
        }),
    },
    {
      onCancel: () => {
        p.cancel('Goodbye!');
        process.exit(0);
      },
    }
  );
  return (await group).prompt;
}

export async function prompt({ usePrompt }: { usePrompt?: string } = {}) {
  const { OPENAI_KEY: key } = await getConfig();
  if (!key) {
    throw new KnownError(
      'Please set your OpenAI API key via `ai-shell config set OPENAI_KEY=<your token>`'
    );
  }
  parseAssert('OPENAI_KEY', key.startsWith('sk-'), 'Must start with "sk-"');

  console.log('');
  p.intro(`${bgCyan(black(` ${commandName} `))}`);

  const thePrompt = usePrompt || (await getPrompt());

  const spin = p.spinner();
  spin.start(`Loading...`);
  let { script, info } = await getScriptAndInfo({ prompt: thePrompt, key });
  spin.stop(`Your script:`);
  p.log.message(script);
  if (!info) {
    const spin = p.spinner();
    spin.start(`Getting explanation...`);
    info = await getExplanation({ script, key });
    spin.stop(`Explanation:`);
  }
  p.log.message(info);

  await runOrReviseFlow(script, key);
}

async function runOrReviseFlow(script: string, key: string) {
  const answer = await p.select({
    message: 'Run this script?',
    options: [
      { label: '✅ Yes', value: 'yes', hint: 'Lets go!' },
      {
        label: '📝 Revise',
        value: 'revise',
        hint: 'Give feedback your prompt and get a new result',
      },
      { label: '❌ Cancel', value: 'cancel', hint: 'Exit the program' },
    ],
  });

  const confirmed = answer === 'yes';
  const cancel = answer === 'cancel';
  const revisePrompt = answer === 'revise';

  if (revisePrompt) {
    await revisionFlow(script, key);
  } else if (confirmed) {
    p.outro(`Running: ${script}`);
    console.log('');
    await execaCommand(script, { stdio: 'inherit' }).catch((err) => {
      // Nothign needed, it'll output to stderr
    });
  } else if (cancel) {
    p.cancel('Goodbye!');
    process.exit(0);
  }
}

async function revisionFlow(currentScript: string, key: string) {
  const revision = await promptForRevision();
  const spin = p.spinner();
  spin.start(`Loading...`);
  const script = await getRevision({
    prompt: revision,
    code: currentScript,
    key,
  });
  spin.stop(`Your new script:`);
  p.log.message(script);
  const infoSpin = p.spinner();
  infoSpin.start(`Getting explanation...`);
  const info = await getExplanation({ script, key });
  infoSpin.stop(`Explanation:`);
  p.log.message(info);

  await runOrReviseFlow(script, key);
}

const parseAssert = (name: string, condition: any, message: string) => {
  if (!condition) {
    throw new KnownError(`Invalid config property ${name}: ${message}`);
  }
};
