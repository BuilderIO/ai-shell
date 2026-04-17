import assert from 'node:assert/strict';
import i18n from './i18n.ts';

const test = (name: string, fn: () => void) => {
  fn();
  console.log(`ok - ${name}`);
};

test('registers Turkish in the language selector', () => {
  assert.equal(i18n.languages.tr, 'Türkçe');
});

test('loads Turkish translations instead of falling back to English keys', () => {
  i18n.setLanguage('tr');
  assert.notEqual(
    i18n.t('What would you like me to do?'),
    'What would you like me to do?'
  );
  assert.equal(i18n.getCurrentLanguagenName(), 'Türkçe');
  i18n.setLanguage('en');
});
