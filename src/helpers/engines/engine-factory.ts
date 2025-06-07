import { EngineConfig, EngineType } from "./config-engine";
import { EngineApi } from "./engine-api";
import { createOpenAiEngine } from "../completion";
import { createGigaChatEngine } from "./gigachat-engine";
import { logger } from "../logger";

export function createEngine(
  engineConfig: EngineConfig,
): EngineApi {
  if (engineConfig.engineType === EngineType.OPENAI) {
    logger.debug(`Creating OpenAI engine`);
    return createOpenAiEngine(engineConfig);
  }
  if (engineConfig.engineType === EngineType.GIGACHAT) {
    logger.debug(`Creating GigaChat engine`);
    return createGigaChatEngine(engineConfig);
  }
  throw new Error(`Unsupported engine: ${engineConfig.engineType}`);
}
