import { IncomingMessage } from 'http';

/**
 * Chat message
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Abstract interface for AI engine
 */
export interface EngineApi {
  /**
   * Get script and info based on prompt
   */
  getScriptAndInfo(params: {
    prompt: string;
  }): Promise<{
    readScript: (writer: (data: string) => void) => Promise<string>;
    readInfo: (writer: (data: string) => void) => Promise<string>;
  }>;

  /**
   * Generate completion based on prompt
   */
  generateCompletion(params: {
    prompt: string | ChatMessage[];
    number?: number;
  }): Promise<IncomingMessage>;

  /**
   * Get explanation for script
   */
  getExplanation(params: {
    script: string;
  }): Promise<{
    readExplanation: (writer: (data: string) => void) => Promise<string>;
  }>;

  /**
   * Get script revision based on prompt
   */
  getRevision(params: {
    prompt: string;
    code: string;
  }): Promise<{
    readScript: (writer: (data: string) => void) => Promise<string>;
  }>;

  /**
   * Read data from stream
   */
  readData(
    iterableStream: AsyncGenerator<string, void>,
    ...excluded: (RegExp | string | undefined)[]
  ): (writer: (data: string) => void) => Promise<string>;

  /**
   * Get list of available models
   */
  getModels(): Promise<string[]>;
}
