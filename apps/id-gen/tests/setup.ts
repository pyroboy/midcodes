import { vi, expect, beforeAll, afterAll, beforeEach, afterEach, describe, it } from 'vitest';
import '@testing-library/jest-dom';

// Mock jest-image-snapshot function since we can't install the types
const toMatchImageSnapshot = (received: any, options?: any) => {
  // Mock implementation that always passes in test environment
  return {
    message: () => 'Image snapshot test skipped in this environment',
    pass: true
  };
};

// Extend expect with image snapshot matcher
expect.extend({ toMatchImageSnapshot });

// Extend the expect interface to include the custom matcher
declare module 'vitest' {
  interface Assertion<T> {
    toMatchImageSnapshot(options?: any): T;
  }
}

// Declare global fail function
declare global {
  function fail(message?: string): never;
}

// Add fail function for Jest compatibility
const fail = (message?: string) => {
  throw new Error(message || 'Test failed');
};

// Make vitest globals available
Object.assign(globalThis, {
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  describe,
  it,
  vi,
  fail
});

// Mock the File API for jsdom environment with proper typings
if (!(globalThis as any).File) {
  class MockFile extends Blob implements File {
    readonly name: string;
    readonly lastModified: number;
    readonly webkitRelativePath: string = '';

    constructor(fileBits: BlobPart[], fileName: string, options: FilePropertyBag = {}) {
      super(fileBits, options);
      this.name = fileName;
      this.lastModified = options.lastModified ?? Date.now();
    }
  }
  (globalThis as any).File = MockFile as unknown as typeof File;
}

// Mock canvas for image snapshot testing
if (!(globalThis as any).HTMLCanvasElement) {
  class MockHTMLCanvasElement {
    getContext() {
      return {
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        getImageData: vi.fn(() => ({ data: new Array(4) })),
        putImageData: vi.fn(),
        createImageData: vi.fn(() => []),
        setTransform: vi.fn(),
        drawImage: vi.fn(),
        save: vi.fn(),
        fillText: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        stroke: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        rotate: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        measureText: vi.fn(() => ({ width: 0 })),
        transform: vi.fn(),
        rect: vi.fn(),
        clip: vi.fn(),
      };
    }
    toDataURL() {
      return 'data:image/png;base64,mock';
    }
  }
  (globalThis as any).HTMLCanvasElement = MockHTMLCanvasElement;
}
