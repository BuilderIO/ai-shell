import test from 'node:test';
import assert from 'node:assert/strict';
import jitiFactory from 'jiti';

const jiti = jitiFactory(import.meta.url, { interopDefault: true });
const configModule = await jiti('../src/helpers/config.ts');
const completionModule = await jiti('../src/helpers/completion.ts');

const { normalizeModelOptions, pickModelWithFallback } = configModule;

test('normalizeModelOptions keeps only usable ids', () => {
  assert.deepEqual(normalizeModelOptions([{ id: 'gpt-4o-mini' }, { id: '' }, {}, { id: ' custom-model ' }]), [
    { value: 'gpt-4o-mini', label: 'gpt-4o-mini' },
    { value: 'custom-model', label: 'custom-model' },
  ]);
});

test('pickModelWithFallback prompts for manual model id when model list is empty', async (t) => {
  const original = completionModule.getModels;
  completionModule.getModels = async () => [];
  t.after(() => { completionModule.getModels = original; });

  const calls = [];
  const result = await pickModelWithFallback('key', 'endpoint', {
    select: async (opts) => { calls.push(['select', opts]); return 'unexpected'; },
    text: async (opts) => { calls.push(['text', opts]); return 'manual-model'; },
  });

  assert.equal(result, 'manual-model');
  assert.equal(calls[0][0], 'text');
});

test('pickModelWithFallback uses select when model list has usable ids', async (t) => {
  const original = completionModule.getModels;
  completionModule.getModels = async () => [{ id: 'gpt-4o-mini' }];
  t.after(() => { completionModule.getModels = original; });

  const calls = [];
  const result = await pickModelWithFallback('key', 'endpoint', {
    select: async (opts) => { calls.push(['select', opts]); return 'gpt-4o-mini'; },
    text: async (opts) => { calls.push(['text', opts]); return 'manual-model'; },
  });

  assert.equal(result, 'gpt-4o-mini');
  assert.equal(calls[0][0], 'select');
  assert.deepEqual(calls[0][1].options, [{ value: 'gpt-4o-mini', label: 'gpt-4o-mini' }]);
});
