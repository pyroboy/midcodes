/**
 * Template Update Integration Test Configuration
 * 
 * Configuration and utilities for running template update integration tests
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types.js';

export interface TestConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  testTimeout: number;
  cleanupOnFailure: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export const defaultConfig: TestConfig = {
  supabaseUrl: 'https://db.wnkqlrfmtiibrqnncgqu.supabase.co',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  testTimeout: 30000, // 30 seconds
  cleanupOnFailure: true,
  logLevel: 'info'
};

export function createTestClient(config: TestConfig = defaultConfig) {
  if (!config.supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required for integration tests');
  }

  return createClient<Database>(config.supabaseUrl, config.supabaseServiceKey);
}

export function log(level: TestConfig['logLevel'], message: string, data?: any) {
  const levels = ['debug', 'info', 'warn', 'error'];
  const configLevel = defaultConfig.logLevel;
  
  if (levels.indexOf(level) >= levels.indexOf(configLevel)) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }
}

export const testConstants = {
  TEST_TIMEOUT: 30000,
  CLEANUP_TIMEOUT: 15000,
  UPDATE_TIMESTAMP_TOLERANCE: 5000, // 5 seconds
  BULK_OPERATION_TIMEOUT: 10000,
  PERFORMANCE_THRESHOLD: 2000, // 2 seconds for large operations
  
  // Test data sizes
  LARGE_ELEMENT_COUNT: 100,
  BULK_TEMPLATE_COUNT: 10,
  
  // Sample URLs for testing
  SAMPLE_IMAGE_URL: 'https://example.com/test-image.jpg',
  SAMPLE_BACKGROUND_URL: 'https://example.com/test-background.jpg',
  
  // Error messages to check for
  EXPECTED_ERRORS: {
    UNAUTHORIZED: 'Unauthorized',
    NOT_FOUND: 'Template not found',
    INVALID_DATA: 'Invalid template data',
    PERMISSION_DENIED: 'Permission denied'
  }
} as const;

export type TestConstants = typeof testConstants;