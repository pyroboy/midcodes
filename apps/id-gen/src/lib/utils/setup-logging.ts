import { dev } from '$app/environment';
// import { logger } from './logger'; // REMOVED: This caused the infinite loop

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
        // FIX: Call the original function directly instead of the logger wrapper
        // This prevents the infinite recursion of console.log -> logger -> console.log
        fn(...args);
      } catch {
        // Fallback to original if something fails
        fn(...args);
      }
    };
  }

  console.log = forward('debug', original.log) as typeof console.log;
  console.info = forward('info', original.info) as typeof console.info;
  console.warn = forward('warn', original.warn) as typeof console.warn;
  console.error = forward('error', original.error) as typeof console.error;
}

