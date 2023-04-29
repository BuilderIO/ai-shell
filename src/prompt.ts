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
import i18n from './helpers/i18n';

const init = async () => {
  const { LANGUAGE: language } = await getConfig();
  i18n.setLanguage(language);
};

let examples: string[] = [];
init().then(() => {
  examples.push(i18n.t('delete all log files'));
  examples.push(i18n.t('list js files'));
  examples.push(i18n.t('fetch me a random joke'));
  examples.push(i18n.t('list all commits'));
});

const sample = <T>(arr: T[]): T | undefined => {
  const len = arr == null ? 0 : arr.length;
  return len ? arr[Math.floor(Math.random() * len)] : undefined;
};

const clipboardy = require('clipboardy');

async function runScript(script: string) {
  p.outro(`${i18n.t('Running')}: ${script}`);
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
          message: i18n.t('What would you like me to to do?'),
          placeholder: `${i18n.t('e.g.')} ${sample(examples)}`,
          initialValue: prompt,
          defaultValue: i18n.t('Say hello'),
          validate: (value) => {
            if (!value) return i18n.t('Please enter a prompt.');
          },
        }),
    },
    {
      onCancel: () => {
        p.cancel(i18n.t('Goodbye!'));
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
          message: i18n.t(
            'What would you like me to to change in this script?'
          ),
          placeholder: i18n.t('e.g. change the folder name'),
          validate: (value) => {
            if (!value) return i18n.t('Please enter a prompt.');
          },
        }),
    },
    {
      onCancel: () => {
        p.cancel(i18n.t('Goodbye!'));
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
      i18n.t(
        'Please set your OpenAI API key via `ai-shell config set OPENAI_KEY=<your token>`'
      )
    );
  }

  console.log('');
  p.intro(`${cyan(`${projectName}`)}`);

  const thePrompt = usePrompt || (await getPrompt());
  const spin = p.spinner();
  spin.start(i18n.t(`Loading...`));
  const { readInfo, readScript } = await getScriptAndInfo({
    prompt: thePrompt,
    key,
    apiEndpoint,
  });
  spin.stop(`${i18n.t('Your script')}:`);
  console.log('');
  const script = await readScript(process.stdout.write.bind(process.stdout));
  console.log('');
  console.log('');
  console.log(dim('•'));
  if (!skipCommandExplanation) {
    spin.start(i18n.t(`Getting explanation...`));
    const info = await readInfo(process.stdout.write.bind(process.stdout));
    if (!info) {
      const { readExplanation } = await getExplanation({
        script,
        key,
        apiEndpoint,
      });
      spin.stop(`${i18n.t('Explanation')}:`);
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
    message: nonEmptyScript
      ? i18n.t('Run this script?')
      : i18n.t('Revise this script?'),
    options: [
      ...(nonEmptyScript
        ? [
            {
              label: '✅ ' + i18n.t('Yes'),
              value: 'yes',
              hint: i18n.t('Lets go!'),
            },
            {
              label: '📝 ' + i18n.t('Edit'),
              value: 'edit',
              hint: i18n.t('Make some adjustments before running'),
            },
          ]
        : []),
      {
        label: '🔁 ' + i18n.t('Revise'),
        value: 'revise',
        hint: i18n.t('Give feedback via prompt and get a new result'),
      },
      {
        label: '📋 ' + i18n.t('Copy'),
        value: 'copy',
        hint: i18n.t('Copy the generated script to your clipboard'),
      },
      {
        label: '❌ ' + i18n.t('Cancel'),
        value: 'cancel',
        hint: i18n.t('Exit the program'),
      },
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
    p.cancel(i18n.t('Goodbye!'));
    process.exit(0);
  } else if (copy) {
    await clipboardy.write(script);
    p.outro(cyan(i18n.t('Copied to clipboard!')));
  } else if (edit) {
    const newScript = await p.text({
      message: i18n.t('you can edit script here') + ':',
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
  spin.start(i18n.t(`Loading...`));
  const { readScript } = await getRevision({
    prompt: revision,
    code: currentScript,
    key,
    apiEndpoint,
  });
  spin.stop(`${i18n.t(`Your new script`)}:`);

  console.log('');
  const script = await readScript(process.stdout.write.bind(process.stdout));
  console.log('');
  console.log('');
  console.log(dim('•'));

  if (!silentMode) {
    const infoSpin = p.spinner();
    infoSpin.start(i18n.t(`Getting explanation...`));
    const { readExplanation } = await getExplanation({
      script,
      key,
      apiEndpoint,
    });

    infoSpin.stop(`${i18n.t('Explanation')}:`);
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
    throw new KnownError(
      `${i18n.t('Invalid config property')} ${name}: ${message}`
    );
  }
};
