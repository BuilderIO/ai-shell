import { IncomingMessage } from 'http';

export async function streamToString(stream: IncomingMessage): Promise<string> {
  let str = '';
  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      str += event.delta.text;
    }
  }
  return str;
}
