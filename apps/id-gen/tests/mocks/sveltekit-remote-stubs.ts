// Vitest stub for SvelteKit remote function modules used by Vite transforms
// Provides a pass-through wrapper and a no-op refresh for query/command wrappers.
export default function remoteWrapper(schemaOrMaybeFn: any, maybeFn?: any) {
  const fn = typeof schemaOrMaybeFn === 'function' ? schemaOrMaybeFn : maybeFn;
  if (typeof fn !== 'function') {
    const noop = () => {};
    (noop as any).refresh = async () => {};
    return noop as any;
  }
  (fn as any).refresh = async () => {};
  return fn as any;
}

