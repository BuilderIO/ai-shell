import { IncomingMessage } from 'http';

export async function* streamToIterable(stream: IncomingMessage) {
	for await (const chunk of stream) {
		yield chunk;
	}
}