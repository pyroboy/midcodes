const globals = typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : (
  // @ts-ignore Node typings have this
  global
);
export {
  globals as g
};
