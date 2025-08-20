import { dev } from '$app/environment';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (!dev) {
      return level === 'error' || level === 'warn';
    }
    return true;
  }

  debug(message?: any, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(message, ...args);
    }
  }

  info(message?: any, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(message, ...args);
    }
  }

  warn(message?: any, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(message, ...args);
    }
  }

  error(message?: any, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(message, ...args);
    }
  }
}

export const logger = new Logger();

