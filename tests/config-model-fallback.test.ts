import assert from 'node:assert/strict';
import { getModelSelectionOptions } from '../src/helpers/config';

const emptyOptions = getModelSelectionOptions([]);
assert.equal(emptyOptions.length, 1);
assert.equal(emptyOptions[0].value, '__custom_model__');

const options = getModelSelectionOptions([
  { id: 'gpt-4o', object: 'model' },
  { id: '', object: 'model' },
]);
assert.deepEqual(options, [
  { value: 'gpt-4o', label: 'gpt-4o' },
  { label: 'Enter the model you want to use', value: '__custom_model__' },
]);

console.log('config model fallback checks passed');
