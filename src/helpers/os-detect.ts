import os from 'os';
import path from 'path';
import i18n from './i18n';

export function detectWindowsShell(env = process.env): string {
  const shell = env.SHELL;
  if (shell) {
    return path
      .basename(shell)
      .replace(/\.exe$/i, '')
      .toLowerCase();
  }

  const comSpec = env.ComSpec;
  if (comSpec) {
    const shellName = path
      .basename(comSpec)
      .replace(/\.exe$/i, '')
      .toLowerCase();
    if (
      shellName === 'cmd' ||
      shellName === 'powershell' ||
      shellName === 'pwsh'
    ) {
      return shellName;
    }
  }

  return 'powershell';
}

export function detectShell() {
  try {
    // Detect Windows shells from environment first, instead of assuming PowerShell.
    if (os.platform() === 'win32') {
      return detectWindowsShell();
    }
    // otherwise return current shell; default to bash
    return path.basename(os.userInfo().shell ?? 'bash');
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw new Error(
        `${i18n.t('Shell detection failed unexpectedly')}: ${err.message}`
      );
    }
  }
}
