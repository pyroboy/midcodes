// $app/server test stub for Vitest
// Provides minimal implementations of query, command, and getRequestEvent used by server-side modules
import { vi } from 'vitest';

// Hold a mutable request event reference to allow tests to set it
let currentEvent: any = {
  locals: {
    user: null,
    supabase: { from: vi.fn() },
    org_id: null,
  }
};

export function setTestRequestEvent(event: any) {
  currentEvent = event;
}

export function getRequestEvent() {
  return currentEvent;
}

export function query(schemaOrFn: any, maybeFn?: any) {
  const fn = typeof schemaOrFn === 'function' ? schemaOrFn : maybeFn;
  const wrapped = (...args: any[]) => fn(...args);
  (wrapped as any).refresh = async () => {};
  return wrapped as any;
}

export function command(schemaOrType: any, maybeFn?: any) {
  const fn = typeof schemaOrType === 'function' ? schemaOrType : maybeFn;
  return (...args: any[]) => fn(...args);
}

