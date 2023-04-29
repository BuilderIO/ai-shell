import os from 'os';
import path from 'path';
import i18n from './i18n';

export function detectShell() {
  try {
    // Detect if we're running on win32 and assume powershell
    if (os.platform() === 'win32') {
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
