import assert from 'node:assert/strict';
import { detectWindowsShell } from './os-detect.ts';

const test = (name: string, fn: () => void) => {
  fn();
  console.log(`ok - ${name}`);
};

test('prefers SHELL when Git Bash is available on Windows', () => {
  const detected = detectWindowsShell({
    SHELL: 'C:/Program Files/Git/bin/bash.exe',
    ComSpec: 'C:/Windows/System32/cmd.exe',
  });

  assert.equal(detected, 'bash');
});

test('falls back to cmd from ComSpec when SHELL is absent', () => {
  const detected = detectWindowsShell({
    ComSpec: 'C:/Windows/System32/cmd.exe',
  });

  assert.equal(detected, 'cmd');
});

test('keeps pwsh distinct from powershell', () => {
  const detected = detectWindowsShell({
    ComSpec: 'C:/Program Files/PowerShell/7/pwsh.exe',
  });

  assert.equal(detected, 'pwsh');
});
