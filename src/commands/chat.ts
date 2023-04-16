import { command } from 'cleye';
import { spinner, intro, outro, text, isCancel } from '@clack/prompts';
import { cyan, green } from 'kolorist';
import { generateCompletion, readData } from '../helpers/completion';
import { parseAssert } from '../prompt';
import { KnownError } from '../helpers/error';
import { getConfig } from '../helpers/config';
import { streamToIterable } from '../helpers/stream-to-iterable';

export default command(
  {
    name: 'chat',
    description:
      'start a new chat session to send and receive messages, continue replying until the user chooses to exit.',
  },
  async () => {
    const { OPENAI_KEY: key, OPENAI_API_ENDPOINT: apiEndpoint } =
      await getConfig();

    if (!key) {
      throw new KnownError(
        'Please set your OpenAI API key via `ai-shell config set OPENAI_KEY=<your token>`'
      );
    }
    parseAssert('OPENAI_KEY', key.startsWith('sk-'), 'Must start with "sk-"');

    console.log('');
    intro('statring new conversation');
    const prompt = async () => {
      const userPrompt = (await text({
        message: `${cyan('you')}`,
        placeholder: `send a message ('exit' to quit)`,
        validate: (value) => {
          if (!value) return 'Please enter a prompt.';
        },
      })) as string;

      if (isCancel(userPrompt) || userPrompt === 'exit') {
        outro('GoodBYE');
        process.exit(0);
      }

      const infoSpin = spinner();
      infoSpin.start(`THINKING...`);
      const { readResponse } = await getResponse({
        prompt: userPrompt,
        key,
        apiEndpoint,
      });

      infoSpin.stop(`${green('chatgpt')}`);
      console.log('');
      await readResponse(process.stdout.write.bind(process.stdout));
      console.log('');
      console.log('');
      prompt();
    };

    prompt();
  }
);

async function getResponse({
  prompt,
  number = 1,
  key,
  model,
  apiEndpoint,
}: {
  prompt: string;
  number?: number;
  model?: string;
  key: string;
  apiEndpoint: string;
}) {
  const stream = await generateCompletion({
    prompt,
    key,
    model,
    number,
    apiEndpoint,
  });

  const iterableStream = streamToIterable(stream);

  return { readResponse: readData(iterableStream, () => true) };
}
