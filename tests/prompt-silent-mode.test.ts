import assert from 'node:assert/strict';
import { createExplanationOption, shouldOfferExplanation } from '../src/prompt';

assert.equal(shouldOfferExplanation(true, false), true);
assert.equal(shouldOfferExplanation(false, false), false);
assert.equal(shouldOfferExplanation(true, true), false);

void (async () => {
  let explanationRequested = false;
  const option = createExplanationOption(async () => {
    explanationRequested = true;
  });

  assert.equal(option.label, '💡 Explanation');
  await option.value();
  assert.equal(explanationRequested, true);

  console.log('silent-mode explanation checks passed');
})();
