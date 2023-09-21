import { command } from 'cleye';
import { spinner, intro, outro, text, isCancel } from '@clack/prompts';
import { cyan, green } from 'kolorist';
import { generateCompletion, readData } from '../helpers/completion';
import { getConfig } from '../helpers/config';
import { streamToIterable } from '../helpers/stream-to-iterable';
import { ChatCompletionRequestMessage } from 'openai';
import i18n from '../helpers/i18n';

export default command(
  {
    name: 'chat',
    help: {
      description:
        'Start a new chat session to send and receive messages, continue replying until the user chooses to exit.',
    },
  },
  async () => {
    const {
      OPENAI_KEY: key,
      OPENAI_API_ENDPOINT: apiEndpoint,
      MODEL: model,
    } = await getConfig();
    const chatHistory: ChatCompletionRequestMessage[] = [];

    console.log('');
    intro(i18n.t('Starting new conversation'));
    const prompt = async () => {
      const msgYou = `${i18n.t('You')}:`;
      const userPrompt = (await text({
        message: `${cyan(msgYou)}`,
        placeholder: i18n.t(`send a message ('exit' to quit)`),
        validate: (value) => {
          if (!value) return i18n.t('Please enter a prompt.');
        },
      })) as string;

      if (isCancel(userPrompt) || userPrompt === 'exit') {
        outro(i18n.t('Goodbye!'));
        process.exit(0);
      }

      const infoSpin = spinner();
      infoSpin.start(i18n.t(`THINKING...`));
      chatHistory.push({
        role: 'user',
        content: userPrompt,
      });
      const { readResponse } = await getResponse({
        prompt: chatHistory,
        key,
        model,
        apiEndpoint,
      });

      infoSpin.stop(`${green('AI Shell:')}`);
      console.log('');
      const fullResponse = await readResponse(
        process.stdout.write.bind(process.stdout)
      );
      chatHistory.push({
        role: 'assistant',
        content: fullResponse,
      });
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
  prompt: string | ChatCompletionRequestMessage[];
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

  return { readResponse: readData(iterableStream) };
}
