import * as p from '@clack/prompts';
import { execaCommand } from 'execa';
import { cyan, dim } from 'kolorist';
import {
  getExplanation,
  getRevision,
  getScriptAndInfo,
} from './helpers/completion';
import { getConfig } from './helpers/config';
import { projectName } from './helpers/constants';
import { KnownError } from './helpers/error';

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
  const { OPENAI_KEY: key, SILENT_MODE: isSilent } = await getConfig();
  if (!key) {
    throw new KnownError(
      'Please set your OpenAI API key via `ai-shell config set OPENAI_KEY=<your token>`'
    );
  }
  parseAssert('OPENAI_KEY', key.startsWith('sk-'), 'Must start with "sk-"');

  console.log('');
  p.intro(`${cyan(`${projectName}`)}`);

  const thePrompt = usePrompt || (await getPrompt());
  const spin = p.spinner();
  spin.start(`Loading...`);
  const { readInfo, readScript } = await getScriptAndInfo({
    prompt: thePrompt,
    key,
  });
  spin.stop(`Your script:`);
  console.log('');
  const script = await readScript(process.stdout.write.bind(process.stdout));

  if (!isSilent) {
    console.log('');
    console.log('');
    console.log(dim('•'));
    spin.start(`Getting explanation...`);
    let info = await readInfo(process.stdout.write.bind(process.stdout));
    if (!info) {
      const { readExplanation } = await getExplanation({ script, key });
      spin.stop(`Explanation:`);
      console.log('');
      await readExplanation(process.stdout.write.bind(process.stdout));
      console.log('');
      console.log('');
      console.log(dim('•'));
    }
  }

  await runOrReviseFlow(script, key);
}

async function runOrReviseFlow(script: string, key: string) {
  const nonEmptyScript = script.trim() !== '';

  const answer = await p.select({
    message: nonEmptyScript ? 'Run this script?' : 'Revise this script?',
    options: [
      ...(nonEmptyScript
        ? [{ label: '✅ Yes', value: 'yes', hint: 'Lets go!' }]
        : []),
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
    await execaCommand(script, {
      stdio: 'inherit',
      shell: process.env.SHELL || true,
    }).catch(() => {
      // Nothing needed, it'll output to stderr
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
  const { readScript } = await getRevision({
    prompt: revision,
    code: currentScript,
    key,
  });
  spin.stop(`Your new script:`);

  console.log('');
  const script = await readScript(process.stdout.write.bind(process.stdout));
  console.log('');
  console.log('');
  console.log(dim('•'));

  const infoSpin = p.spinner();
  infoSpin.start(`Getting explanation...`);
  const { readExplanation } = await getExplanation({ script, key });

  infoSpin.stop(`Explanation:`);
  console.log('');
  await readExplanation(process.stdout.write.bind(process.stdout));
  console.log('');
  console.log('');
  console.log(dim('•'));

  await runOrReviseFlow(script, key);
}

const parseAssert = (name: string, condition: any, message: string) => {
  if (!condition) {
    throw new KnownError(`Invalid config property ${name}: ${message}`);
  }
};
