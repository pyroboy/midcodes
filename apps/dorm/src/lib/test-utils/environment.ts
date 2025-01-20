// src/lib/test-utils/environment.ts
import { vi } from 'vitest'; // Add vitest import

// Interface definitions first to avoid export conflicts
interface SnapshotConfig {
  failureThreshold: number;
  failureThresholdType: 'percent' | 'pixel';
  allowSizeMismatch: boolean;
  blur: number;
  customSnapshotIdentifier: (options: { currentTestName: string; counter: number }) => string;
  customSnapshotsDir: string;
}

interface TestEnvironment {
  setup: () => {
    normalizeHtml: (html: string) => string;
    snapshotConfig: SnapshotConfig;
  };
  teardown: () => void;
  createSnapshotMatcher: (customConfig?: Partial<SnapshotConfig>) => SnapshotConfig;
  sanitizeSnapshot: (content: string) => string;
  constants: {
    VIEWPORT_WIDTH: number;
    VIEWPORT_HEIGHT: number;
    DEFAULT_TIMEOUT: number;
    ANIMATION_DURATION: number;
  };
}

/**
 * Default snapshot configuration options that can be used across tests
 */
export const defaultSnapshotConfig: SnapshotConfig = {
  // Customizable threshold for image comparison
  failureThreshold: 0.01,
  failureThresholdType: 'percent',
  // Allow for small variations in anti-aliasing and rendering
  allowSizeMismatch: true,
  blur: 2,
  // Customize snapshot naming
  customSnapshotIdentifier: ({ currentTestName, counter }: { currentTestName: string; counter: number }) => 
    `${currentTestName.replace(/\s+/g, '-').toLowerCase()}-${counter}`,
  // Set directory for snapshot storage
  customSnapshotsDir: '__snapshots__',
};

/**
 * Utility function to normalize HTML for consistent snapshot testing
 */
export const normalizeHtml = (html: string): string => {
  return html
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/>\s+</g, '><');
};

/**
 * Configures the test environment for snapshot testing
 * This includes setup for both DOM and image snapshots
 */
export const configureTestEnv = (): TestEnvironment => {
  // Store original environment
  const originalEnv = { ...process.env };
  
  return {
    setup: () => {
      // Set consistent timezone for tests
      process.env.TZ = 'UTC';

      // Set consistent date for snapshots
      const mockDate = new Date('2024-01-01T00:00:00.000Z');
      vi.setSystemTime(mockDate);

      // Configure DOM environment
      if (typeof window !== 'undefined') {
        // Set consistent window dimensions
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1024,
        });
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: 768,
        });

        // Mock window.matchMedia
        window.matchMedia = window.matchMedia || function() {
          return {
            matches: false,
            addListener: function() {},
            removeListener: function() {},
          };
        };
      }

      // Add any other necessary setup
      return {
        normalizeHtml,
        snapshotConfig: defaultSnapshotConfig,
      };
    },

    teardown: () => {
      // Restore original environment
      process.env = { ...originalEnv };
      
      // Clear all mocks
      vi.useRealTimers();
      vi.clearAllMocks();
      vi.clearAllTimers();

      // Clear any DOM modifications
      if (typeof window !== 'undefined') {
        // Reset any window property modifications
        window.localStorage?.clear();
        window.sessionStorage?.clear();
      }
    },

    /**
     * Helper method to create custom snapshot matchers
     */
    createSnapshotMatcher: (customConfig = {}) => ({
      ...defaultSnapshotConfig,
      ...customConfig,
    }),

    /**
     * Utility to sanitize dynamic content for consistent snapshots
     */
    sanitizeSnapshot: (content: string): string => {
      return content
        // Remove dynamic dates
        .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/g, '[DATE]')
        // Remove dynamic IDs
        .replace(/id=["'][^"']*["']/g, 'id="[ID]"')
        // Remove dynamic class names (if using tailwind/dynamic classes)
        .replace(/class=["'][^"']*["']/g, 'class="[CLASSES]"');
    },

    /**
     * Constants for test environment
     */
    constants: {
      VIEWPORT_WIDTH: 1024,
      VIEWPORT_HEIGHT: 768,
      DEFAULT_TIMEOUT: 5000,
      ANIMATION_DURATION: 300,
    }
  };
};

// Export types separately to avoid conflicts
export type { TestEnvironment, SnapshotConfig };