import { vi } from 'vitest';
import { readable } from 'svelte/store';

export const page = readable({
  data: {
    user: { role: 'staff' }
  }
});

export const navigating = readable(null);
export const updated = readable(false);
