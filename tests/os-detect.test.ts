import assert from 'node:assert/strict';
import { detectWindowsShell } from '../src/helpers/os-detect';

assert.equal(
  detectWindowsShell({
    SHELL: 'C:\\Program Files\\Git\\usr\\bin\\bash.exe',
    ComSpec: 'C:\\Windows\\System32\\cmd.exe',
  }),
  'bash'
);

assert.equal(
  detectWindowsShell({
    MSYSTEM: 'MINGW64',
    ComSpec: 'C:\\Windows\\System32\\cmd.exe',
  }),
  'bash'
);

assert.equal(
  detectWindowsShell({ ComSpec: 'C:\\Windows\\System32\\cmd.exe' }),
  'cmd'
);
assert.equal(
  detectWindowsShell({
    ComSpec: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
  }),
  'powershell'
);

console.log('os-detect regression checks passed');
