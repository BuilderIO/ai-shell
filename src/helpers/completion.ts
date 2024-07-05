import axios from 'axios';
import dedent from 'dedent';
import { IncomingMessage } from 'http';
import { KnownError } from './error';
import { streamToIterable } from './stream-to-iterable';
import { detectShell } from './os-detect';
import { streamToString } from './stream-to-string';
import './replace-all-polyfill';
import i18n from './i18n';
import { stripRegexPatterns } from './strip-regex-patterns';
import readline from 'readline';
import Anthropic from '@anthropic-ai/sdk';

const explainInSecondRequest = true;

function getAnthropicClient(key: string) {
  return new Anthropic({
    apiKey: key,
  });
}

const shellCodeExclusions = [/```[a-zA-Z]*\n*/gi, /```[a-zA-Z]*/gi, '\n'];

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
  return {
    readScript: readData(iterableStream, ...shellCodeExclusions),
    readInfo: readData(iterableStream, ...shellCodeExclusions),
  };
}

export async function generateCompletion({
  prompt,
  number = 1,
  key,
  model,
}: {
  prompt: string | { role: string; content: string }[];
  number?: number;
  model?: string;
  key: string;
}) {
  const anthropicClient = getAnthropicClient(key);
  try {
    const response = await anthropicClient.messages.create({
      messages: Array.isArray(prompt)
        ? prompt
        : [{ role: 'user', content: prompt }],
      model: model || 'claude-3-5-sonnet-20240620',
      max_tokens: 200,
      stream: true,
    });

    return response;
  } catch (err: any) {
    if (err.code === 'ENOTFOUND') {
      throw new KnownError(
        `Error connecting to ${err.hostname} (${err.syscall}). Are you connected to the internet?`
      );
    }

    const response = err.response;
    let message = response?.data;
    if (response && message instanceof IncomingMessage) {
      message = await streamToString(message);
      try {
        message = JSON.parse(message);
      } catch (e) {
        // Ignore
      }
    }

    const messageString = message && JSON.stringify(message, null, 2);
    if (response?.status === 429) {
      throw new KnownError(
        dedent`
        Request to Anthropic failed with status 429. This may be due to rate limiting or quota issues.

        Full message from Anthropic:
      ` +
          '\n\n' +
          messageString +
          '\n'
      );
    } else if (response && message) {
      throw new KnownError(
        dedent`
        Request to Anthropic failed with status ${response?.status}:
      ` +
          '\n\n' +
          messageString +
          '\n'
      );
    }

    throw err;
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
  return { readExplanation: readData(iterableStream) };
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
    readScript: readData(iterableStream, ...shellCodeExclusions),
  };
}

export const readData =
  (
    iterableStream: AsyncGenerator<string, void>,
    ...excluded: (RegExp | string | undefined)[]
  ) =>
  (writer: (data: string) => void): Promise<string> =>
    new Promise(async (resolve) => {
      let stopTextStream = false;
      let data = '';
      let content = '';
      let dataStart = false;
      let buffer = ''; // This buffer will temporarily hold incoming data only for detecting the start

      const [excludedPrefix] = excluded;
      const stopTextStreamKeys = ['q', 'escape']; //Group of keys that stop the text stream

      const rl = readline.createInterface({
        input: process.stdin,
      });

      process.stdin.setRawMode(true);

      process.stdin.on('keypress', (key, data) => {
        if (stopTextStreamKeys.includes(data.name)) {
          stopTextStream = true;
        }
      });
      for await (const chunk of iterableStream) {
        const payloads = chunk.toString().split('\n');
        payloads.forEach((payload, index) => {
          if (index > 0) {
              console.log(); // Print a newline
          }
          // TODO: why do we need this
          if (payload.includes('[DONE]') || stopTextStream) {
            dataStart = false;
            resolve(data);
            return;
          }

          content = payload;
          // console.log('debug: ' + content)
          // console.log('datastart: ' + dataStart)
          // Use buffer only for start detection
          if (!dataStart) {
            // Append content to the buffer
            buffer += content;
            if (buffer.match(excludedPrefix ?? '')) {
              dataStart = true;
              // Clear the buffer once it has served its purpose
              buffer = '';
              if (excludedPrefix) return;
            }
          }

          if (dataStart && content) {
            const contentWithoutExcluded = stripRegexPatterns(
              content,
              excluded
            );
            // console.log('debugstripped: ' + contentWithoutExcluded)
            data += contentWithoutExcluded;
            writer(contentWithoutExcluded);
          }
        })
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
    ${explainScript} Please reply in ${i18n.getCurrentLanguagenName()}

    The script: ${script}
  `;
}

function getShellDetails() {
  const shellDetails = detectShell();

  return dedent`
      The target shell is ${shellDetails}
  `;
}
const shellDetails = getShellDetails();

const explainScript = dedent`
  Please provide a clear, concise description of the script, using minimal words. Outline the steps in a list format.
`;

function getOperationSystemDetails() {
  const os = require('@nexssp/os/legacy');
  return os.name();
}
const generationDetails = dedent`
    Only reply with the single line command surrounded by three backticks. It must be able to be directly run in the target shell. Do not include any other text.

    Make sure the command runs on ${getOperationSystemDetails()} operating system.
  `;

function getFullPrompt(prompt: string) {
  return dedent`
    Create a single line command that one can enter in a terminal and run, based on what is specified in the prompt.

    ${shellDetails}

    ${generationDetails}

    ${explainInSecondRequest ? '' : explainScript}

    The prompt is: ${prompt}
  `;
}

function getRevisionPrompt(prompt: string, code: string) {
  return dedent`
    Update the following script based on what is asked in the following prompt.

    The script: ${code}

    The prompt: ${prompt}

    ${generationDetails}
  `;
}

export async function getModels(): Promise<string[]> {
  // Anthropic doesn't have a public API for listing models, so we'll return a static list
  return ['claude-2', 'claude-instant-1', 'claude-3-5-sonnet-20240620'];
}
