import { OpenAIApi, Configuration } from 'openai';
import { KnownError } from './error';
import dedent from 'dedent';

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
  const info = message.split('```')[2].trim();
  return { script, info, message };
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

function getFullPrompt(prompt: string) {
  return dedent`
  I will give you a prompt to create a single line bash command that one can enter in a terminal and run, based on what is asked in the prompt.

  Please only reply with the single line bash command surrounded by 3 backticks. It should be able to be directly run in a bash terminal. Do not include any other text.

  Then please describe the bash script in plain english, step  by step, what exactly it does.

  The prompt is: ${prompt}
  `;
}
