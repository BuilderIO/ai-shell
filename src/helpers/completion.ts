import { OpenAIApi, Configuration } from 'openai';
import { KnownError } from './error';
import dedent from 'dedent';
import { detectShell } from './os-detect';

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
  const { choices } = await generateCompletion({
    prompt: fullPrompt,
    number: 1,
    key,
    model,
  });
  const message = choices[0].message!.content;
  const script = message.split('```')[1].trim();
  const info = message.split('```')[2].trim() as string | undefined;
  return { script, info };
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
    const completion = await openAi.createChatCompletion({
      model: model || 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      n: Math.min(number, 10),
    });
    return completion.data;
  } catch (err) {
    const errorAsAny = err as any;
    if (errorAsAny.code === 'ENOTFOUND') {
      throw new KnownError(
        `Error connecting to ${errorAsAny.hostname} (${errorAsAny.syscall}). Are you connected to the internet?`
      );
    }

    throw errorAsAny;
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
  const result = await generateCompletion({
    prompt,
    key,
    number: 1,
    model,
  });
  return result.choices[0].message!.content.trim();
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
  const result = await generateCompletion({
    prompt: fullPrompt,
    key,
    number: 1,
    model,
  });
  const message = result.choices[0].message!.content;
  const script = message.split('```')[1].trim();
  return script;
}

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

const generationDetails = dedent`
  Please only reply with the single line command surrounded by 3 backticks. It should be able to be directly run in a terminal. Do not include any other text.
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
