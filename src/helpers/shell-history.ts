import fs from 'fs';
import os from 'os';
import path from 'path';

// Interface for shell history handlers
interface ShellHistoryHandler {
  getHistoryFile(): string;
  getLastCommand(historyFile: string): string | null;
  appendCommand(historyFile: string, command: string): void;
}

// Base handler for simple newline-separated history files (bash, sh, ksh, tcsh)
class SimpleHistoryHandler implements ShellHistoryHandler {
  constructor(private historyFilePath: string) {}

  getHistoryFile(): string {
    return this.historyFilePath;
  }

  getLastCommand(historyFile: string): string | null {
    try {
      const data = fs.readFileSync(historyFile, 'utf8');
      const commands = data.trim().split('\n');
      return commands[commands.length - 1];
    } catch (err) {
      // Ignore any errors
      return null;
    }
  }

  appendCommand(historyFile: string, command: string): void {
    fs.appendFile(historyFile, `${command}\n`, (err) => {
      if (err) {
        // Ignore any errors
      }
    });
  }
}

// Handler for zsh history which may include timestamps
class ZshHistoryHandler extends SimpleHistoryHandler {
  getLastCommand(historyFile: string): string | null {
    try {
      const data = fs.readFileSync(historyFile, 'utf8');
      const lines = data.trim().split('\n');
      
      // Find the last non-empty line
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (line) {
          // Extract command from zsh history format (may have timestamp prefix)
          const match = line.match(/^(?::\s*\d+:\d+;)?(.*)$/);
          return match ? match[1] : line;
        }
      }
      return null;
    } catch (err) {
      // Ignore any errors
      return null;
    }
  }
}

// Handler for fish history which uses a YAML-like format
class FishHistoryHandler implements ShellHistoryHandler {
  constructor(private historyFilePath: string) {}

  getHistoryFile(): string {
    return this.historyFilePath;
  }

  getLastCommand(historyFile: string): string | null {
    try {
      const data = fs.readFileSync(historyFile, 'utf8');
      const lines = data.trim().split('\n');
      
      // Fish history format is like:
      // - cmd: command
      //   when: timestamp
      let lastCommand = null;
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (line.startsWith('- cmd:')) {
          lastCommand = line.substring('- cmd:'.length).trim();
          break;
        }
      }
      return lastCommand;
    } catch (err) {
      // Ignore any errors
      return null;
    }
  }

  appendCommand(historyFile: string, command: string): void {
    const timestamp = Math.floor(Date.now() / 1000);
    const entry = `- cmd: ${command}\n  when: ${timestamp}\n`;
    
    fs.appendFile(historyFile, entry, (err) => {
      if (err) {
        // Ignore any errors
      }
    });
  }
}

// Function to get the appropriate shell history handler
function getShellHistoryHandler(): ShellHistoryHandler | null {
  const shell = process.env.SHELL || '';
  const homeDir = os.homedir();
  const shellName = path.basename(shell);

  switch (shellName) {
    case 'bash':
    case 'sh':
      return new SimpleHistoryHandler(path.join(homeDir, '.bash_history'));
    case 'zsh':
      return new ZshHistoryHandler(path.join(homeDir, '.zsh_history'));
    case 'fish':
      return new FishHistoryHandler(path.join(homeDir, '.local', 'share', 'fish', 'fish_history'));
    case 'ksh':
      return new SimpleHistoryHandler(path.join(homeDir, '.ksh_history'));
    case 'tcsh':
      return new SimpleHistoryHandler(path.join(homeDir, '.history'));
    default:
      return null;
  }
}

// Function to append the command to the history file if it's not the same as the last command
export function appendToShellHistory(command: string): void {
  const handler = getShellHistoryHandler();
  if (handler) {
    const historyFile = handler.getHistoryFile();
    const lastCommand = handler.getLastCommand(historyFile);
    
    if (lastCommand !== command) {
      try {
        handler.appendCommand(historyFile, command);
      } catch (err) {
        // Ignore any errors
      }
    }
  }
}
