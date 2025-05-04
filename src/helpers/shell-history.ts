import fs from 'fs';
import os from 'os';
import path from 'path';

// Function to get the history file based on the shell
function getHistoryFile(): string | null {
  if (process.env.HISTFILE) {
    return process.env.HISTFILE;
  }

  const shell = process.env.SHELL || '';
  const homeDir = os.homedir();

  switch (path.basename(shell)) {
    case 'bash':
    case 'sh':
      return path.join(homeDir, '.bash_history');
    case 'zsh':
      return path.join(homeDir, '.zsh_history');
    case 'fish':
      return path.join(homeDir, '.local', 'share', 'fish', 'fish_history');
    case 'ksh':
      return path.join(homeDir, '.ksh_history');
    case 'tcsh':
      return path.join(homeDir, '.history');
    default:
      return null;
  }
}

// Function to get the last command from the history file
function getLastCommand(historyFile: string): string | null {
  try {
    const data = fs.readFileSync(historyFile, 'utf8');
    const commands = data.trim().split('\n');
    return commands[commands.length - 1];
  } catch (err) {
    // Ignore any errors
    return null;
  }
}

// Function to append the command to the history file if it's not the same as the last command
export function appendToShellHistory(command: string): void {
  const historyFile = getHistoryFile();
  if (historyFile) {
    const lastCommand = getLastCommand(historyFile);
    if (lastCommand !== command) {
      fs.appendFile(historyFile, `${command}\n`, (err) => {
        if (err) {
          // Ignore any errors
        }
      });
    }
  }
}
