// src/lib/test-utils/types.d.ts
declare module 'jest-image-snapshot' {
  export function toMatchImageSnapshot(): {
    message: () => string;
    pass: boolean;
  };
}
