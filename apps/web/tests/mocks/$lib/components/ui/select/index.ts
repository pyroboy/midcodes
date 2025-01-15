import { vi } from 'vitest';
import { createMockComponent } from '../../../../utils';

export const Root = vi.fn(() => createMockComponent());
export const Trigger = vi.fn(() => createMockComponent());
export const Value = vi.fn(() => createMockComponent());
export const Content = vi.fn(() => createMockComponent());
export const Item = vi.fn(() => createMockComponent());
