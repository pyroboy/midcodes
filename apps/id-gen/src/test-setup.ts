import '@testing-library/jest-dom';
import { beforeAll } from 'vitest';
import { config } from 'dotenv';

// Load environment variables from .env.local for tests
beforeAll(() => {
  config({ path: '.env.local' });
});