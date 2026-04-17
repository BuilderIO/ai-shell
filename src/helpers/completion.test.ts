import assert from 'node:assert/strict';
import { extractCommandFromBuffer } from './completion.ts';

const test = (name: string, fn: () => void) => {
  fn();
  console.log(`ok - ${name}`);
};

test('extracts fenced commands with a language tag', () => {
  const result = extractCommandFromBuffer('```bash\nls -la\n```');
  assert.equal(result, 'ls -la');
});

test('extracts fenced commands when the opening fence is split across chunks', () => {
  let result = extractCommandFromBuffer('``');
  assert.equal(result, null);

  result = extractCommandFromBuffer('```bash\nprintf "ok"\n```');
  assert.equal(result, 'printf "ok"');
});

test('extracts inline fenced commands without leaking backticks', () => {
  const result = extractCommandFromBuffer('```npm test```');
  assert.equal(result, 'npm test');
});

test('extracts raw one-line commands after the stream finalizes', () => {
  const result = extractCommandFromBuffer('git status', true);
  assert.equal(result, 'git status');
});

test('stops raw command parsing at the first newline', () => {
  const result = extractCommandFromBuffer(
    'git status\nThis command checks the working tree.'
  );
  assert.equal(result, 'git status');
});
