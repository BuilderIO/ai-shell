import os from 'os';
import path from 'path';
import i18n from './i18n';

function shellName(shell: string): string {
  return path.posix
    .basename(shell.trim().replaceAll('\\', '/'))
    .replace(/\.exe$/i, '')
    .toLowerCase();
}

export function detectWindowsShell(env: NodeJS.ProcessEnv): string {
  if (env.SHELL) {
    return shellName(env.SHELL);
  }

  // Git Bash and MSYS terminals may expose MSYSTEM without ComSpec pointing
  // at the shell that is actually running the CLI.
  if (env.MSYSTEM) {
    return 'bash';
  }

  const commandShell = env.ComSpec || env.COMSPEC;
  if (commandShell) {
    const name = shellName(commandShell);
    if (name === 'cmd') {
      return 'cmd';
    }
    if (name === 'powershell' || name === 'pwsh') {
      return 'powershell';
    }
  }

  return 'powershell';
}

export function detectShell() {
  try {
    if (os.platform() === 'win32') {
      return detectWindowsShell(process.env);
    }

    // otherwise return current shell; default to bash
    return shellName(os.userInfo().shell ?? 'bash');
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw new Error(
        `${i18n.t('Shell detection failed unexpectedly')}: ${err.message}`
      );
    }
  }
}
