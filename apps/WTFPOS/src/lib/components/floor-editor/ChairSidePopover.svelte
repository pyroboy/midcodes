<script lang="ts">
	import type { Table, ChairConfig, ChairSide, ChairType } from '$lib/types';
	import { floorEditor } from '$lib/stores/floor-editor.svelte';

	interface Props {
		table: Table;
		side: 'top' | 'bottom' | 'left' | 'right';
		x: number;
		y: number;
		onclose: () => void;
	}

	let { table, side, x, y, onclose }: Props = $props();

	// ─── Simplified type mapping ─────────────────────────────────────────────
	// UI shows 3 options; legacy types (l-shape, diner) map to the closest match
	type UiType = 'none' | 'chairs' | 'bench';

	function toUi(t: ChairType): UiType {
		if (t === 'individual' || t === 'diner') return 'chairs';
		if (t === 'lounge' || t === 'l-shape') return 'bench';
		return 'none';
	}

	function toStorage(ui: UiType): ChairType {
		if (ui === 'chairs') return 'individual';
		if (ui === 'bench') return 'lounge';
		return 'none';
	}

	const COLORS = ['#9ca3af', '#f87171', '#60a5fa', '#4ade80', '#fbbf24', '#a78bfa'];

	function defaultSide(type: ChairType = 'none'): ChairSide {
		return { type, count: 2, color: '#9ca3af', opacity: 0.85 };
	}

	function getCurrentConfig(): ChairConfig {
		const src = table.chairConfig;
		return {
			top: src?.top ? { ...defaultSide(), ...src.top } : defaultSide(),
			bottom: src?.bottom ? { ...defaultSide(), ...src.bottom } : defaultSide(),
			left: src?.left ? { ...defaultSide(), ...src.left } : defaultSide(),
			right: src?.right ? { ...defaultSide(), ...src.right } : defaultSide(),
		};
	}

	let cfg = $state(getCurrentConfig());
	const current = $derived(cfg[side]);
	const uiType = $derived(toUi(current.type));

	// Check if adjacent sides are bench (for corner auto-fill hint)
	const adjacentBench = $derived.by(() => {
		const adj = side === 'top' || side === 'bottom'
			? [cfg.left, cfg.right]
			: [cfg.top, cfg.bottom];
		return adj.some(s => s.type === 'lounge' || s.type === 'l-shape');
	});

	function patch(p: Partial<ChairSide>) {
		cfg = { ...cfg, [side]: { ...cfg[side], ...p } };
		floorEditor.patchTable(table.id, { chairConfig: cfg });
	}

	function setType(ui: UiType) {
		patch({ type: toStorage(ui) });
	}

	// ─── Positioning ─────────────────────────────────────────────────────────
	const posStyle = $derived.by(() => {
		let transform = '';
		switch (side) {
			case 'top':    transform = 'translate(-50%, calc(-100% - 14px))'; break;
			case 'bottom': transform = 'translate(-50%, 14px)'; break;
			case 'left':   transform = 'translate(calc(-100% - 14px), -50%)'; break;
			case 'right':  transform = 'translate(14px, -50%)'; break;
		}
		return `left: ${x}px; top: ${y}px; transform: ${transform};`;
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed z-[60] bg-white rounded-xl shadow-2xl border border-gray-200 w-56"
	style={posStyle}
	onclick={(e) => e.stopPropagation()}
	onpointerdown={(e) => e.stopPropagation()}
>
	<!-- Header -->
	<div class="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100 rounded-t-xl">
		<span class="text-xs font-bold uppercase tracking-wider text-gray-500 capitalize">{side} side</span>
		<button
			onclick={onclose}
			class="text-gray-400 hover:text-gray-700 text-sm font-bold leading-none w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 transition-colors"
		>✕</button>
	</div>

	<div class="p-3 flex flex-col gap-3">
		<!-- Type selector: segmented control with mini SVG previews -->
		<div class="flex rounded-lg border border-gray-200 overflow-hidden">
			<!-- None -->
			<button
				class="flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors border-r border-gray-200
					{uiType === 'none' ? 'bg-accent/10 text-accent' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}"
				onclick={() => setType('none')}
			>
				<svg class="w-8 h-3" viewBox="0 0 32 12">
					<line x1="8" y1="6" x2="24" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 3" />
				</svg>
				<span>None</span>
			</button>

			<!-- Chairs -->
			<button
				class="flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors border-r border-gray-200
					{uiType === 'chairs' ? 'bg-accent/10 text-accent' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}"
				onclick={() => setType('chairs')}
			>
				<svg class="w-8 h-3" viewBox="0 0 32 12">
					<rect x="2" y="1" width="7" height="10" rx="2" fill="currentColor" opacity="0.6" />
					<rect x="12.5" y="1" width="7" height="10" rx="2" fill="currentColor" opacity="0.6" />
					<rect x="23" y="1" width="7" height="10" rx="2" fill="currentColor" opacity="0.6" />
				</svg>
				<span>Chairs</span>
			</button>

			<!-- Bench -->
			<button
				class="flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors
					{uiType === 'bench' ? 'bg-accent/10 text-accent' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}"
				onclick={() => setType('bench')}
			>
				<svg class="w-8 h-3" viewBox="0 0 32 12">
					<rect x="2" y="1" width="28" height="10" rx="3" fill="currentColor" opacity="0.6" />
				</svg>
				<span>Bench</span>
			</button>
		</div>

		<!-- Count stepper (chairs only) -->
		{#if uiType === 'chairs'}
			<div class="flex items-center justify-between">
				<span class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Seats</span>
				<div class="flex items-center gap-1.5">
					<button
						class="w-7 h-7 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 hover:border-accent hover:text-accent flex items-center justify-center transition-colors"
						onclick={() => patch({ count: Math.max(1, (current.count ?? 2) - 1) })}
					>−</button>
					<span class="text-base font-bold font-mono w-5 text-center text-gray-900">{current.count ?? 2}</span>
					<button
						class="w-7 h-7 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 hover:border-accent hover:text-accent flex items-center justify-center transition-colors"
						onclick={() => patch({ count: Math.min(10, (current.count ?? 2) + 1) })}
					>+</button>
				</div>
			</div>
		{/if}

		<!-- Corner auto-fill hint (bench only, when adjacent side is also bench) -->
		{#if uiType === 'bench' && adjacentBench}
			<p class="text-[10px] text-accent/70 bg-accent/5 rounded-md px-2 py-1 text-center">
				Corners auto-fill where benches meet
			</p>
		{/if}

		<!-- Color + Opacity -->
		{#if uiType !== 'none'}
			<div class="flex flex-col gap-2">
				<div class="flex items-center gap-1.5">
					{#each COLORS as c}
						<button
							aria-label="Color {c}"
							class="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110
								{current.color === c ? 'border-gray-800 scale-110' : 'border-transparent'}"
							style="background-color: {c}"
							onclick={() => patch({ color: c })}
						></button>
					{/each}
					<input
						type="color"
						value={current.color ?? '#9ca3af'}
						class="w-5 h-5 rounded-full border border-gray-300 cursor-pointer"
						oninput={(e) => patch({ color: (e.target as HTMLInputElement).value })}
					/>
				</div>

				<div class="flex items-center gap-2">
					<span class="text-[10px] text-gray-400 font-mono w-7 shrink-0 text-right">{Math.round((current.opacity ?? 0.85) * 100)}%</span>
					<input
						type="range" min="0" max="1" step="0.05"
						value={current.opacity ?? 0.85}
						class="flex-1 accent-accent h-1"
						oninput={(e) => patch({ opacity: parseFloat((e.target as HTMLInputElement).value) })}
					/>
				</div>
			</div>
		{/if}
	</div>
</div>
