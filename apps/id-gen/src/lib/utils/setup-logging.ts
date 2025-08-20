import { dev } from '$app/environment';
import { logger } from './logger';

// Only patch once
if (!(globalThis as any).__LOG_PATCHED__) {
  (globalThis as any).__LOG_PATCHED__ = true;

  const original = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console)
  } as const;

  // Helper to forward while respecting env-based filtering
  function forward(level: 'debug' | 'info' | 'warn' | 'error', fn: (...args: any[]) => void) {
    return (...args: any[]) => {
      // In production, only allow warn/error
      if (!dev && !(level === 'warn' || level === 'error')) return;

      try {
        switch (level) {
          case 'debug':
            logger.debug(...args);
            break;
          case 'info':
            logger.info(...args);
            break;
          case 'warn':
            logger.warn(...args);
            break;
          case 'error':
            logger.error(...args);
            break;
        }
      } catch {
        // Fallback to original if logger fails for any reason
        fn(...args);
      }
    };
  }

  console.log = forward('debug', original.log) as typeof console.log;
  console.info = forward('info', original.info) as typeof console.info;
  console.warn = forward('warn', original.warn) as typeof console.warn;
  console.error = forward('error', original.error) as typeof console.error;
}

