import { OpenAIApi, Configuration } from 'openai';
import dedent from 'dedent';
import { IncomingMessage } from 'http';
import { KnownError } from './error';
import { streamToIterable } from './stream-to-iterable';
import { detectShell } from './os-detect';
import { platform } from 'os';
import type { AxiosError } from 'axios';
import { streamToString } from './stream-to-string';

const explainInSecondRequest = true;

function getOpenAi(key: string) {
  const openAi = new OpenAIApi(new Configuration({ apiKey: key }));
  return openAi;
}

export async function getScriptAndInfo({
  prompt,
  key,
  model,
}: {
  prompt: string;
  key: string;
  model?: string;
}) {
  const fullPrompt = getFullPrompt(prompt);
  const stream = await generateCompletion({
    prompt: fullPrompt,
    number: 1,
    key,
    model,
  });
  const iterableStream = streamToIterable(stream);
  const codeBlock = '```';
  return {
    readScript: readData(iterableStream, () => true, codeBlock),
    readInfo: readData(
      iterableStream,
      (content) => content.endsWith(codeBlock),
      codeBlock
    ),
  };
}

export async function generateCompletion({
  prompt,
  number = 1,
  key,
  model,
}: {
  prompt: string;
  number?: number;
  model?: string;
  key: string;
}) {
  const openAi = getOpenAi(key);
  try {
    const completion = await openAi.createChatCompletion(
      {
        model: model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        n: Math.min(number, 10),
        stream: true,
      },
      { responseType: 'stream' }
    );

    return completion.data as unknown as IncomingMessage;
  } catch (err) {
    const error = err as AxiosError;

    if (error.code === 'ENOTFOUND') {
      throw new KnownError(
        `Error connecting to ${error.request.hostname} (${error.request.syscall}). Are you connected to the internet?`
      );
    }

    const response = error.response;
    const message =
      response &&
      JSON.parse(
        await streamToString(response.data as unknown as IncomingMessage)
      );

    const messageString = message && JSON.stringify(message, null, 2);
    if (response?.status === 429) {
      throw new KnownError(
        dedent`
        Request to OpenAI failed with status 429. This is due to incorrect billing setup or excessive quota usage. Please follow this guide to fix it: https://help.openai.com/en/articles/6891831-error-code-429-you-exceeded-your-current-quota-please-check-your-plan-and-billing-details

        You can activate billing here: https://platform.openai.com/account/billing/overview . Make sure to add a payment method if not under an active grant from OpenAI.

        Full message from OpenAI: 
      ` +
          '\n\n' +
          messageString +
          '\n'
      );
    } else if (response && message) {
      throw new KnownError(
        dedent`
        Request to OpenAI failed with status ${response?.status}: 
      ` +
          '\n\n' +
          messageString +
          '\n'
      );
    }

    throw error;
  }
}

export async function getExplanation({
  script,
  key,
  model,
}: {
  script: string;
  key: string;
  model?: string;
}) {
  const prompt = getExplanationPrompt(script);
  const stream = await generateCompletion({
    prompt,
    key,
    number: 1,
    model,
  });
  const iterableStream = streamToIterable(stream);
  return { readExplanation: readData(iterableStream, () => true) };
}

export async function getRevision({
  prompt,
  code,
  key,
  model,
}: {
  prompt: string;
  code: string;
  key: string;
  model?: string;
}) {
  const fullPrompt = getRevisionPrompt(prompt, code);
  const stream = await generateCompletion({
    prompt: fullPrompt,
    key,
    number: 1,
    model,
  });
  const iterableStream = streamToIterable(stream);
  return {
    readScript: readData(iterableStream, () => true, '```'),
  };
}

const readData =
  (
    iterableStream: AsyncGenerator<string, void>,
    startSignal: (content: string) => boolean,
    excluded?: string
  ) =>
  (writer: (data: string) => void): Promise<string> =>
    new Promise(async (resolve) => {
      let data = '';
      let content = '';
      let dataStart = false;

      for await (const chunk of iterableStream) {
        const payloads = chunk.toString().split('\n\n');

        for (const payload of payloads) {
          if (payload.includes('[DONE]')) {
            dataStart = false;
            resolve(data);
            return;
          }

          if (payload.startsWith('data:')) {
            content = parseContent(payload);
            if (!dataStart && content.includes(excluded ?? '')) {
              dataStart = startSignal(content);
              if (excluded) break;
            }

            if (dataStart && content) {
              const contentWithoutExcluded = excluded
                ? content.replaceAll(excluded, '')
                : content;
              data += contentWithoutExcluded;
              writer(contentWithoutExcluded);
            }
          }
        }
      }

      function parseContent(payload: string): string {
        const data = payload.replaceAll(/(\n)?^data:\s*/g, '');
        try {
          const delta = JSON.parse(data.trim());
          return delta.choices?.[0].delta?.content ?? '';
        } catch (error) {
          return `Error with JSON.parse and ${payload}.\n${error}`;
        }
      }

      resolve(data);
    });

function getExplanationPrompt(script: string) {
  return dedent`
    ${explainScript}

    The script: ${script}
  `;
}

const shellDetails = dedent`
  The target terminal is ${detectShell}.
`;

const explainScript = dedent`
  Then please describe the script in plain english, step by step, what exactly it does.
  Please describe succintly, use as few words as possible, do not be verbose. 
  If there are multiple steps, please display them as a list.
`;

function getOsType() {
  const type = platform();
  return type === 'darwin' ? 'Mac OS' : type;
}

const generationDetails = dedent`
  Please only reply with the single line command surrounded by 3 backticks. It should be able to be directly run in a terminal. Do not include any other text.

  Please make sure the script runs on ${getOsType()} operating system.
`;

// TODO: gather the current OS (Windows, Mac, Linux) and add that to the prompt that it should support this system.
function getFullPrompt(prompt: string) {
  return dedent`
    I will give you a prompt to create a single line command that one can enter in a terminal and run, based on what is asked in the prompt.

    ${shellDetails}

    ${generationDetails}

    ${explainInSecondRequest ? '' : explainScript}

    The prompt is: ${prompt}
  `;
}

function getRevisionPrompt(prompt: string, code: string) {
  return dedent`
    Please update the following script based on what is asked in the following prompt.

    The script: ${code}

    The prompt: ${prompt}

    ${generationDetails}
  `;
}
