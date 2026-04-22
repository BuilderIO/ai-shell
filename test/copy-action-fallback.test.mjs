import test from 'node:test';
import assert from 'node:assert/strict';
import jitiFactory from 'jiti';

const jiti = jitiFactory(import.meta.url, { interopDefault: true });
const { copyScriptWithFallback } = await jiti('../src/prompt.ts');

test('copy fallback prints the script when clipboard write fails', async () => {
  const notes = [];
  const outros = [];
  await copyScriptWithFallback(
    'echo hello',
    async () => {
      throw new Error('clipboard backend unavailable');
    },
    {
      note: (...args) => notes.push(args),
      outro: (...args) => outros.push(args),
    }
  );
  assert.equal(notes.length, 1);
  assert.deepEqual(notes[0], ['echo hello', 'Clipboard unavailable. Copy the script manually:']);
  assert.equal(outros.at(-1)?.[0], 'Clipboard copy failed; script printed for manual copy.');
});

test('copy success still reports clipboard success', async () => {
  const notes = [];
  const outros = [];
  await copyScriptWithFallback('echo hello', async () => {}, {
    note: (...args) => notes.push(args),
    outro: (...args) => outros.push(args),
  });
  assert.equal(notes.length, 0);
  assert.equal(outros.at(-1)?.[0], 'Copied to clipboard!');
});
