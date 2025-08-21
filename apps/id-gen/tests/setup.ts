import { vi } from 'vitest';

// Mock the File API for jsdom environment
if (!global.File) {
  global.File = class MockFile {
    constructor(bits, name, options = {}) {
      this.bits = bits;
      this.name = name;
      this.type = options.type || '';
      this.size = bits.reduce((acc, bit) => acc + (bit.length || 0), 0);
    }
  };
}

