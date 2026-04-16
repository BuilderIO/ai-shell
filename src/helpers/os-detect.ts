import os from 'os';
import path from 'path';
import i18n from './i18n';

function basenameWithoutExtension(value: string) {
  return path.basename(value).replace(/\.exe$/i, '');
}

export function detectShell() {
  try {
    if (os.platform() === 'win32') {
      if (process.env.SHELL) {
        return basenameWithoutExtension(process.env.SHELL);
      }
      if (process.env.ComSpec) {
        return basenameWithoutExtension(process.env.ComSpec);
      }
      return 'powershell';
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
