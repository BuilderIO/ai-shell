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

const clipboardy = require('clipboardy');

async function runScript(script: string) {
  p.outro(`Running: ${script}`);
  console.log('');
  await execaCommand(script, {
    stdio: 'inherit',
    shell: process.env.SHELL || true,
  }).catch(() => {
    // Nothing needed, it'll output to stderr
  });
}

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

export async function prompt({
  usePrompt,
  silentMode,
}: { usePrompt?: string; silentMode?: boolean } = {}) {
  const {
    OPENAI_KEY: key,
    SILENT_MODE,
    OPENAI_API_ENDPOINT: apiEndpoint,
  } = await getConfig();
  const skipCommandExplanation = silentMode || SILENT_MODE;

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
    apiEndpoint,
  });
  spin.stop(`Your script:`);
  console.log('');
  const script = await readScript(process.stdout.write.bind(process.stdout));
  console.log('');
  console.log('');
  console.log(dim('•'));
  if (!skipCommandExplanation) {
    spin.start(`Getting explanation...`);
    const info = await readInfo(process.stdout.write.bind(process.stdout));
    if (!info) {
      const { readExplanation } = await getExplanation({
        script,
        key,
        apiEndpoint,
      });
      spin.stop(`Explanation:`);
      console.log('');
      await readExplanation(process.stdout.write.bind(process.stdout));
      console.log('');
      console.log('');
      console.log(dim('•'));
    }
  }

  await runOrReviseFlow(script, key, apiEndpoint, silentMode);
}

async function runOrReviseFlow(
  script: string,
  key: string,
  apiEndpoint: string,
  silentMode?: boolean
) {
  const nonEmptyScript = script.trim() !== '';

  const answer = await p.select({
    message: nonEmptyScript ? 'Run this script?' : 'Revise this script?',
    options: [
      ...(nonEmptyScript
        ? [
            { label: '✅ Yes', value: 'yes', hint: 'Lets go!' },
            {
              label: '📝 Edit',
              value: 'edit',
              hint: 'Make some adjustments before running',
            },
          ]
        : []),
      {
        label: '🔁 Revise',
        value: 'revise',
        hint: 'Give feedback via prompt and get a new result',
      },
      {
        label: '📋 Copy',
        value: 'copy',
        hint: 'Copy the generated script to your clipboard',
      },
      { label: '❌ Cancel', value: 'cancel', hint: 'Exit the program' },
    ],
  });

  const confirmed = answer === 'yes';
  const cancel = answer === 'cancel';
  const revisePrompt = answer === 'revise';
  const copy = answer === 'copy';
  const edit = answer === 'edit';

  if (revisePrompt) {
    await revisionFlow(script, key, apiEndpoint, silentMode);
  } else if (confirmed) {
    await runScript(script);
  } else if (cancel) {
    p.cancel('Goodbye!');
    process.exit(0);
  } else if (copy) {
    await clipboardy.write(script);
    p.outro('Copied to clipboard!');
  } else if (edit) {
    const newScript = await p.text({
      message: 'you can edit script here:',
      initialValue: script,
    });
    if (!p.isCancel(newScript)) {
      await runScript(newScript);
    }
  }
}

async function revisionFlow(
  currentScript: string,
  key: string,
  apiEndpoint: string,
  silentMode?: boolean
) {
  const revision = await promptForRevision();
  const spin = p.spinner();
  spin.start(`Loading...`);
  const { readScript } = await getRevision({
    prompt: revision,
    code: currentScript,
    key,
    apiEndpoint,
  });
  spin.stop(`Your new script:`);

  console.log('');
  const script = await readScript(process.stdout.write.bind(process.stdout));
  console.log('');
  console.log('');
  console.log(dim('•'));

  if (!silentMode) {
    const infoSpin = p.spinner();
    infoSpin.start(`Getting explanation...`);
    const { readExplanation } = await getExplanation({
      script,
      key,
      apiEndpoint,
    });

    infoSpin.stop(`Explanation:`);
    console.log('');
    await readExplanation(process.stdout.write.bind(process.stdout));
    console.log('');
    console.log('');
    console.log(dim('•'));
  }

  await runOrReviseFlow(script, key, apiEndpoint, silentMode);
}

export const parseAssert = (name: string, condition: any, message: string) => {
  if (!condition) {
    throw new KnownError(`Invalid config property ${name}: ${message}`);
  }
};
