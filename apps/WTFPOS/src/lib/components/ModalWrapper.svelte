<script lang="ts" module>
	// Module-level: shared across ALL ModalWrapper instances
	const modalStack: HTMLElement[] = [];

	function isTopModal(el: HTMLElement): boolean {
		return modalStack.length > 0 && modalStack[modalStack.length - 1] === el;
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	interface Props {
		open: boolean;
		onclose: () => void;
		zIndex?: number;
		ariaLabel: string;
		backdropClose?: boolean;
		trapFocus?: boolean;
		autoFocus?: boolean;
		restoreFocus?: boolean;
		children: Snippet;
		class?: string;
		contentClass?: string;
	}

	let {
		open,
		onclose,
		zIndex = 50,
		ariaLabel,
		backdropClose = true,
		trapFocus = true,
		autoFocus = true,
		restoreFocus = true,
		children,
		class: className,
		contentClass
	}: Props = $props();

	// ── Instance state ──
	let dialogEl: HTMLElement | undefined = $state(undefined);
	let previousFocus: HTMLElement | null = null;

	const FOCUSABLE = [
		'a[href]',
		'button:not([disabled])',
		'input:not([disabled])',
		'select:not([disabled])',
		'textarea:not([disabled])',
		'[tabindex]:not([tabindex="-1"])'
	].join(', ');

	function getFocusable(): HTMLElement[] {
		if (!dialogEl) return [];
		return Array.from(dialogEl.querySelectorAll<HTMLElement>(FOCUSABLE));
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!dialogEl || !isTopModal(dialogEl)) return;

		if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			onclose();
			return;
		}

		if (e.key === 'Tab' && trapFocus) {
			const focusable = getFocusable();
			if (focusable.length === 0) {
				e.preventDefault();
				return;
			}

			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			const active = document.activeElement as HTMLElement;

			if (e.shiftKey) {
				// If focus is on first element or outside the dialog, wrap to last
				if (active === first || !dialogEl.contains(active)) {
					e.preventDefault();
					last.focus();
				}
			} else {
				// If focus is on last element or outside the dialog, wrap to first
				if (active === last || !dialogEl.contains(active)) {
					e.preventDefault();
					first.focus();
				}
			}
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		// Only close if clicking the backdrop itself, not the content
		if (backdropClose && e.target === e.currentTarget) {
			onclose();
		}
	}

	// ── Lifecycle: push/pop stack, save/restore focus, auto-focus ──
	$effect(() => {
		if (open && dialogEl) {
			// Save focus
			if (restoreFocus) {
				previousFocus = document.activeElement as HTMLElement;
			}

			// Push onto stack
			modalStack.push(dialogEl);

			// Auto-focus: prefer [autofocus], then first focusable, then dialog itself
			if (autoFocus) {
				// Use microtask so DOM content has rendered
				queueMicrotask(() => {
					if (!dialogEl) return;
					const autofocusEl = dialogEl.querySelector<HTMLElement>('[autofocus]');
					if (autofocusEl) {
						autofocusEl.focus();
						return;
					}
					const focusable = getFocusable();
					if (focusable.length > 0) {
						focusable[0].focus();
					} else {
						dialogEl.focus();
					}
				});
			}

			return () => {
				// Pop from stack
				const idx = modalStack.indexOf(dialogEl!);
				if (idx !== -1) modalStack.splice(idx, 1);

				// Restore focus
				if (restoreFocus && previousFocus) {
					queueMicrotask(() => {
						previousFocus?.focus();
						previousFocus = null;
					});
				}
			};
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class={cn('fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto', className)}
		style="z-index: {zIndex};"
		onclick={handleBackdropClick}
		role="presentation"
	>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			bind:this={dialogEl}
			role="dialog"
			aria-modal="true"
			aria-label={ariaLabel}
			tabindex="-1"
			class={cn('w-full flex flex-col items-center', contentClass)}
			onclick={handleBackdropClick}
		>
			{@render children()}
		</div>
	</div>
{/if}
