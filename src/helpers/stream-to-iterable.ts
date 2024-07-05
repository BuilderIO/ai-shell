import { IncomingMessage } from 'http';

export async function* streamToIterable(stream: IncomingMessage) {
  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text;
    }
  }
}
