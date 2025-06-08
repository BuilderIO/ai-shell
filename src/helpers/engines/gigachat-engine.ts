import GigaChat from 'gigachat';
import { Agent } from 'node:https';
import dedent from 'dedent';
import { IncomingMessage } from 'http';
import { KnownError } from '../error';
import { streamToIterable } from '../stream-to-iterable';
import { detectShell } from '../os-detect';
import '../replace-all-polyfill';
import i18n from '../i18n';
import { stripRegexPatterns } from '../strip-regex-patterns';
import { logger } from '../logger';
import { EngineConfig } from './config-engine';
import { EngineApi, ChatMessage } from './engine-api';

const explainInSecondRequest = true;

function getGigaChat(engineConfig: EngineConfig): GigaChat {
  const httpsAgent = new Agent({
    rejectUnauthorized: false, // Disable root certificate verification
  });
  return new GigaChat({
    credentials: engineConfig.apiKey,
    baseUrl: engineConfig.apiEndpoint,
    model: engineConfig.modelName,
    timeout: 600,
    profanityCheck: false,
    httpsAgent: httpsAgent,
  });
}

// GigaChat also uses markdown formatting for code
const shellCodeExclusions = [/```[a-zA-Z]*\n/gi, /```[a-zA-Z]*/gi, '\n'];

export async function getScriptAndInfo({
  prompt,
  engineConfig,
}: {
  prompt: string;
  engineConfig: EngineConfig;
}): Promise<{
  readScript: (writer: (data: string) => void) => Promise<string>;
  readInfo: (writer: (data: string) => void) => Promise<string>;
}> {
  const fullPrompt = getFullPrompt(prompt);
  const stream = await generateCompletion({
    prompt: fullPrompt,
    number: 1,
    engineConfig,
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
  engineConfig,
}: {
  prompt: string | ChatMessage[];
  number?: number;
  engineConfig: EngineConfig;
}): Promise<IncomingMessage> {
  const gigaChat = getGigaChat(engineConfig);

  try {
    logger.debug('Generating completion with GigaChat', {
      promptType: typeof prompt,
      number,
    });

    // Format messages for GigaChat
    const messages = Array.isArray(prompt)
      ? prompt.map((msg) => ({ role: msg.role, content: msg.content }))
      : [{ role: 'user' as const, content: prompt }];

    // Get stream from GigaChat
    const streamEmitter = await gigaChat.stream_readable({
      messages,
      model: engineConfig.modelName || 'GigaChat-Pro',
      stream: true,
    });

    // Create proper readable stream
    const { Readable } = await import('stream');
    const mockStream = new Readable({
      read() {
        // Do nothing, data will arrive asynchronously
      },
    }) as IncomingMessage;

    // Forward events
    streamEmitter.on('chunk', (chunk: any) => {
      try {
        // Format chunk in Server-Sent Events format
        const content = chunk.choices?.[0]?.delta?.content || '';
        if (content) {
          const sseData = `data: ${JSON.stringify({
            choices: [
              {
                delta: { content },
              },
            ],
          })}\n\n`;
          mockStream.push(sseData);
        }
      } catch (err) {
        logger.error('Error processing chunk', { error: err?.toString() });
        mockStream.destroy(err as Error);
      }
    });

    streamEmitter.on('end', () => {
      const endData = 'data: [DONE]\n\n';
      mockStream.push(endData);
      mockStream.push(null); // End stream
    });

    streamEmitter.on('error', (error: any) => {
      logger.error('GigaChat stream error', { error: error?.toString() });
      mockStream.destroy(error);
    });

    return mockStream;
  } catch (err: any) {
    logger.error('GigaChat completion error', err);

    if (
      err.message?.includes('401') ||
      err.message?.includes('authentication')
    ) {
      throw new KnownError(
        dedent`
        Request to GigaChat failed with authentication error. Please check your credentials and ensure:
        1. Your GigaChat API key is valid
        2. You have proper access to the GigaChat API
        3. Your credentials haven't expired
        
        Full error: ${err.message}
        `
      );
    }

    if (err.message?.includes('429')) {
      throw new KnownError(
        dedent`
        Request to GigaChat failed with rate limit error (429). Please:
        1. Wait a few moments before retrying
        2. Check your usage quotas
        3. Consider upgrading your plan if needed
        
        Full error: ${err.message}
        `
      );
    }

    throw new KnownError(
      dedent`
      Request to GigaChat failed: ${err.message}
      
      Please check your network connection and GigaChat service status.
      `
    );
  }
}

export async function getExplanation({
  script,
  engineConfig,
}: {
  script: string;
  engineConfig: EngineConfig;
}): Promise<{
  readExplanation: (writer: (data: string) => void) => Promise<string>;
}> {
  const prompt = getExplanationPrompt(script);
  const stream = await generateCompletion({
    prompt,
    number: 1,
    engineConfig,
  });
  const iterableStream = streamToIterable(stream);
  return { readExplanation: readData(iterableStream) };
}

export async function getRevision({
  prompt,
  code,
  engineConfig,
}: {
  prompt: string;
  code: string;
  engineConfig: EngineConfig;
}): Promise<{
  readScript: (writer: (data: string) => void) => Promise<string>;
}> {
  const fullPrompt = getRevisionPrompt(prompt, code);
  const stream = await generateCompletion({
    prompt: fullPrompt,
    number: 1,
    engineConfig,
  });
  const iterableStream = streamToIterable(stream);
  return {
    readScript: readData(iterableStream, ...shellCodeExclusions),
  };
}

export function readData(
  iterableStream: AsyncGenerator<string, void>,
  ...excluded: (RegExp | string | undefined)[]
): (writer: (data: string) => void) => Promise<string> {
  return (writer: (data: string) => void): Promise<string> =>
    new Promise(async (resolve: (value: string) => void) => {
      readDataImpl(iterableStream, excluded, writer, resolve);
    });
}

async function readDataImpl(
  iterableStream: AsyncGenerator<string, void>,
  excluded: (RegExp | string | undefined)[],
  writer: (data: string) => void,
  resolve: (data: string) => void
): Promise<void> {
  const handleStreamChunk = (chunk: string): string => {
    const parsed = parseContent(chunk);
    if (parsed) {
      const sanitized = stripRegexPatterns(parsed, excluded);
      writer(sanitized);
      return sanitized;
    }
    return '';
  };

  try {
    let fullResponse = '';
    for await (const chunk of iterableStream) {
      const content = handleStreamChunk(chunk);
      fullResponse += content;
    }
    resolve(fullResponse);
  } catch (error) {
    logger.error('Error reading data stream', error);
    resolve('');
  }
}

function parseContent(payload: string): string {
  try {
    if (payload.startsWith('data: ')) {
      const jsonStr = payload.slice(6);
      if (jsonStr === '[DONE]') {
        return '';
      }
      const parsed = JSON.parse(jsonStr);
      return parsed.choices?.[0]?.delta?.content || '';
    }
  } catch (err) {
    logger.debug('Failed to parse content', { payload, error: err });
  }
  return '';
}

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

export async function getModels(
  engineConfig: EngineConfig,
): Promise<string[]> {
  logger.debug('Requesting GigaChat models list...');
  const gigaChat = getGigaChat(engineConfig);
  const response = await gigaChat.getModels();
  const models = response.data?.map((model: any) => model.id);
  logger.debug(`Retrieved ${models.length} models`, { models });
  return models;
}

export function createGigaChatEngine(
  engineConfig: EngineConfig
): EngineApi {
  return {
    async getScriptAndInfo(params: { prompt: string }) {
      return getScriptAndInfo({ ...params, engineConfig });
    },

    async generateCompletion(params: {
      prompt: string | ChatMessage[];
      number?: number;
    }) {
      return generateCompletion({ ...params, engineConfig });
    },

    async getExplanation(params: { script: string }) {
      return getExplanation({ ...params, engineConfig });
    },

    async getRevision(params: { prompt: string; code: string }) {
      return getRevision({ ...params, engineConfig });
    },

    readData(
      iterableStream: AsyncGenerator<string, void>,
      ...excluded: (RegExp | string | undefined)[]
    ) {
      return readData(iterableStream, ...excluded);
    },

    async getModels() {
      return getModels(engineConfig);
    },
  };
}
