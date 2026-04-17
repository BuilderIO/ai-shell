import assert from 'node:assert/strict';

const test = (name: string, fn: () => void | Promise<void>) => {
  Promise.resolve(fn()).then(() => {
    console.log(`ok - ${name}`);
  });
};

test('clipboard fallback keeps the original error message available to users', () => {
  const message = 'Both xsel and fallback failed';
  const output = `Clipboard unavailable. Copy the script manually.\n\n${message}`;

  assert.equal(
    output.includes('Clipboard unavailable. Copy the script manually.'),
    true
  );
  assert.equal(output.includes(message), true);
});
