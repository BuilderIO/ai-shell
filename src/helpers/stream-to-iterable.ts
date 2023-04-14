import { IncomingMessage } from 'http';

export async function* streamToIterable(stream: IncomingMessage) {
  let previous = '';
  for await (const chunk of stream) {
    const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    previous += bufferChunk;
    let eolIndex;
    while ((eolIndex = previous.indexOf('\n')) >= 0) {
      // line includes the EOL
      const line = previous.slice(0, eolIndex + 1).trimEnd();
      if (line.startsWith('data: ')) yield line;
      previous = previous.slice(eolIndex + 1);
    }
  }
}
