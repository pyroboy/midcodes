import { vi } from 'vitest';
import { createMockComponent } from '../../../../utils';

export const Root = vi.fn(() => createMockComponent());
export const Header = vi.fn(() => createMockComponent());
export const Title = vi.fn(() => createMockComponent());
export const Content = vi.fn(() => createMockComponent());
