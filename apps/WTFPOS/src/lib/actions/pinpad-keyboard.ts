/**
 * Svelte action that maps physical keyboard keys to PIN pad handlers.
 * Apply to the modal content element so it captures keydown events.
 *
 * Usage:
 *   <div use:pinpadKeyboard={{ onDigit, onBackspace, onClear, onSubmit, canSubmit }}>
 */

export interface PinpadKeyboardOptions {
	onDigit: (digit: string) => void;
	onBackspace: () => void;
	onClear: () => void;
	onSubmit: () => void;
	/** Reactive getter — Enter only fires when this returns true */
	canSubmit?: () => boolean;
}

export function pinpadKeyboard(node: HTMLElement, options: PinpadKeyboardOptions) {
	let opts = options;

	function handleKeydown(e: KeyboardEvent) {
		// Don't interfere if user is typing in an input/textarea
		const tag = (e.target as HTMLElement)?.tagName;
		if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

		if (e.key >= '0' && e.key <= '9') {
			e.preventDefault();
			opts.onDigit(e.key);
			return;
		}

		if (e.key === 'Backspace') {
			e.preventDefault();
			opts.onBackspace();
			return;
		}

		if (e.key === 'Delete') {
			e.preventDefault();
			opts.onClear();
			return;
		}

		if (e.key === 'Enter') {
			const submit = opts.canSubmit ?? (() => true);
			if (submit()) {
				e.preventDefault();
				opts.onSubmit();
			}
		}
	}

	node.addEventListener('keydown', handleKeydown);

	return {
		update(newOptions: PinpadKeyboardOptions) {
			opts = newOptions;
		},
		destroy() {
			node.removeEventListener('keydown', handleKeydown);
		}
	};
}
