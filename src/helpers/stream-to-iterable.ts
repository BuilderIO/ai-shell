import { IncomingMessage } from 'http';
import type { ChatCompletions } from "@azure/openai";

export async function* streamToIterable(stream: IncomingMessage | AsyncIterable<ChatCompletions>) {
  let previous = '';
  if(!(stream instanceof IncomingMessage)) {
    for await (const chunk of stream) {
      for (const choice of chunk.choices) {
        const delta = choice.delta?.content;
        if (delta !== undefined) {
          previous += delta;
        }
      }
    }

    // changing single line code blocks to multilines
    previous = previous.replace(/^```([^\n]+)```$/ig, '```\n$1\n```');
    const lines  = previous.split('\n');
    for(let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if(i < lines.length - 1) {
        line = `${line}\n`;
      }
      const msg = {
        choices: [{delta: {content: line}}],
      };
      yield `data: ${JSON.stringify(msg)}`;
    }
  } else {
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
}
