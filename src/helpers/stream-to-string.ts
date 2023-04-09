import { IncomingMessage } from 'http';

export async function streamToString(stream: IncomingMessage): Promise<string> {
  let str = '';
  for await (const chunk of stream) {
    str += chunk;
  }
  return str;
}
