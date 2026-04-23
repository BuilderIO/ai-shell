import os from 'os';
import path from 'path';
import i18n from './i18n';

function trimExecutableExtension(shell: string) {
  return shell.replace(/\.(exe|cmd)$/i, '').toLowerCase();
}

function shellNameFromPath(shellPath: string) {
  return trimExecutableExtension(
    path.win32.basename(shellPath) || path.posix.basename(shellPath)
  );
}

function normalizeWindowsShell(shellName: string) {
  if (shellName === 'pwsh' || shellName === 'powershell') {
    return 'powershell';
  }

  if (shellName === 'cmd') {
    return 'cmd';
  }

  if (shellName === 'bash' || shellName === 'zsh' || shellName === 'fish') {
    return shellName;
  }
}

function detectWindowsShell(env: NodeJS.ProcessEnv) {
  const shellFromEnv = env.SHELL
    ? normalizeWindowsShell(shellNameFromPath(env.SHELL))
    : undefined;
  if (shellFromEnv) {
    return shellFromEnv;
  }

  const comSpecShell = env.ComSpec
    ? normalizeWindowsShell(shellNameFromPath(env.ComSpec))
    : undefined;
  if (comSpecShell) {
    return comSpecShell;
  }

  return 'powershell';
}

export function detectShell() {
  try {
    if (os.platform() === 'win32') {
      return detectWindowsShell(process.env);
    }

    return path.basename(os.userInfo().shell ?? 'bash');
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw new Error(
        `${i18n.t('Shell detection failed unexpectedly')}: ${err.message}`
      );
    }
  }
}
