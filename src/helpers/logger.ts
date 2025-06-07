import fs from 'fs';
import path from 'path';
import { createWriteStream } from 'fs';
import { Transform } from 'stream';

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'ai-shell.log');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type LogLevel = 'debug' | 'info' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private stream: fs.WriteStream | null = null;
  private isDevMode: boolean = false;
  private closed = false;
  private seen?: WeakSet<object>;

  constructor() {
    this.isDevMode = process.argv[1].includes('npx');
    if (this.isDevMode) {
      this.ensureLogDirectory();
      this.rotateIfNeeded();
      this.stream = createWriteStream(LOG_FILE, {
        flags: 'a',
        autoClose: false,
      });
    }
    // Proper log closing without process.exit()
    process.on('exit', () => this.close());
    process.on('SIGINT', () => this.close());
    process.on('SIGTERM', () => this.close());
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
  }

  private rotateIfNeeded() {
    if (fs.existsSync(LOG_FILE)) {
      const stats = fs.statSync(LOG_FILE);
      if (stats.size >= MAX_FILE_SIZE) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(LOG_DIR, `gigachat-${timestamp}.log`);
        fs.renameSync(LOG_FILE, backupFile);
      }
    }
  }

  private formatLogEntry(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    let dataString = '';
    if (data) {
      try {
        dataString = JSON.stringify(data, null, 2);
      } catch (err) {
        // Handle circular objects
        dataString = JSON.stringify(
          data,
          (key, value) => {
            if (typeof value === 'object' && value !== null) {
              if (this.seen && this.seen.has(value)) {
                return '[Circular]';
              }
              this.seen = this.seen || new WeakSet();
              this.seen.add(value);
            }
            return value;
          },
          2
        );
        this.seen = undefined;
      }
    }
    return `${timestamp} [${level}] ${message} ${dataString}\n`;
  }

  debug(message: string, data?: any) {
    if (this.isDevMode && this.stream) {
      this.stream.write(this.formatLogEntry('debug', message, data));
    }
  }

  info(message: string, data?: any) {
    if (this.isDevMode && this.stream) {
      this.stream.write(this.formatLogEntry('info', message, data));
    }
  }

  error(message: string, data?: any) {
    if (this.isDevMode && this.stream) {
      this.stream.write(this.formatLogEntry('error', message, data));
    }
  }

  close() {
    if (this.stream && !this.closed) {
      this.closed = true;
      try {
        this.stream.end();
        this.stream = null;
      } catch (err) {
        // Ignore errors when closing the logging stream
      }
    }
  }
}

export const logger = new Logger();
