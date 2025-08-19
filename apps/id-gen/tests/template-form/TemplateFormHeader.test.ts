import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import TemplateFormHeader from '$lib/components/template-form/TemplateFormHeader.svelte';

describe('TemplateFormHeader', () => {
  it('emits callbacks on button clicks', async () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    const { getByText } = render(TemplateFormHeader, { props: { title: 'T', onSave, onCancel } });

    await fireEvent.click(getByText('Cancel'));
    await fireEvent.click(getByText('Save'));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledOnce();
  });
});

