import { vi } from 'vitest';

interface ButtonProps {
  [key: string]: any;
}

const Button = vi.fn((props: ButtonProps) => {
  const dispatch = vi.fn();

  return {
    props,
    $$slots: {},
    $$scope: {},
    $$: {
      fragment: {
        c: vi.fn(),
        m: vi.fn(),
        p: vi.fn(),
        d: vi.fn()
      },
      ctx: []
    },
    $on: (event: string, handler: () => void) => {
      if (event === 'click') {
        props.on_click = handler;
      }
      return { destroy: vi.fn() };
    },
    $set: vi.fn(),
    $destroy: vi.fn()
  };
});

export default Button;
