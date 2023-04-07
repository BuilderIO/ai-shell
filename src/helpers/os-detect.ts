import os from 'os';
import path from 'path';

export function detectShell() {
  try {
    // Detect if we're running on win32 and assume powershell
    if (os.platform() === 'win32') {
      return 'powershell';
    }
    // otherwise return current shell
    return path.basename(os.userInfo().shell ?? 'bash');
  } catch (err: unknown) {
    if (err instanceof Error) {
      return {
        message: `Shell detection failed unexpectedly: (${err.message})`,
      };
    }
  }
}
