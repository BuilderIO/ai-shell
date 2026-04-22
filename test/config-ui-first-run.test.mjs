import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import jitiFactory from 'jiti';

const jiti = jitiFactory(import.meta.url, { interopDefault: true });
const { getConfig, getUIConfig } = await jiti('../src/helpers/config.ts');

test('getUIConfig works on first run without OPENAI_KEY', async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-shell-home-'));
  const originalHome = process.env.HOME;

  process.env.HOME = home;
  try {
    const config = await getUIConfig();
    assert.equal(config.OPENAI_KEY, undefined);
    assert.equal(config.MODEL, 'gpt-4o-mini');
    assert.equal(config.OPENAI_API_ENDPOINT, 'https://api.openai.com/v1');
    assert.equal(config.SILENT_MODE, false);
    assert.equal(config.LANGUAGE, 'en');
  } finally {
    process.env.HOME = originalHome;
    await fs.rm(home, { recursive: true, force: true });
  }
});

test('getConfig still requires OPENAI_KEY for runtime flows', async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-shell-home-'));
  const originalHome = process.env.HOME;

  process.env.HOME = home;
  try {
    await assert.rejects(getConfig(), /Please set your OpenAI API key/);
  } finally {
    process.env.HOME = originalHome;
    await fs.rm(home, { recursive: true, force: true });
  }
});
