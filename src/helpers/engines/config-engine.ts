export enum EngineType {
  OPENAI = 'OpenAI',
  GIGACHAT = 'GigaChat'
}

export interface EngineConfig {
  engineType: EngineType;
  apiKey: string;
  apiEndpoint: string;
  modelName: string;
  proxy: string;
  proxyPacUrl: string;
}
