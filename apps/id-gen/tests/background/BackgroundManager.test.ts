import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import BackgroundManager from '$lib/components/background/BackgroundManager.svelte';

describe('BackgroundManager', () => {
  it('renders uploader and conditionally shows cropper/preview', async () => {
    const { container, rerender } = render(BackgroundManager, {
      props: { imageUrl: null, templateDimensions: { width: 300, height: 200 } }
    });
    expect(container.textContent).toContain('Background image');

    await rerender({ imageUrl: 'data:image/png;base64,xyz', templateDimensions: { width: 300, height: 200 } });
    expect(container.textContent).toContain('Crop');
    expect(container.textContent).toContain('Preview');
  });
});

