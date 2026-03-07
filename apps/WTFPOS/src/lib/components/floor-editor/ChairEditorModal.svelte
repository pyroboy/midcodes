<script lang="ts">
	import { untrack } from 'svelte';
	import type { Table, ChairConfig, ChairSide, ChairType } from '$lib/types';
	import { floorEditor } from '$lib/stores/floor-editor.svelte';
	import { updateTableChairs } from '$lib/stores/pos/tables.svelte';
	import TableSVG from './TableSVG.svelte';

	interface Props {
		table: Table;
	}

	let { table }: Props = $props();

	const CHAIR_TYPES: { value: ChairType; label: string; desc: string }[] = [
		{ value: 'none',       label: 'None',       desc: 'No chairs on this side' },
		{ value: 'individual', label: 'Individual',  desc: 'Separate chairs (set count)' },
		{ value: 'lounge',     label: 'Lounge',      desc: 'One wide bench seat' },
		{ value: 'l-shape',    label: 'L-Shape',     desc: 'L-shaped corner booth' },
		{ value: 'diner',      label: 'Diner',       desc: 'Two side-by-side booths' },
	];

	const PRESET_COLORS = ['#9ca3af', '#f87171', '#60a5fa', '#4ade80', '#fbbf24', '#a78bfa'];

	const SIDES = ['top', 'bottom', 'left', 'right'] as const;

	function defaultSide(type: ChairType = 'none'): ChairSide {
		return { type, count: 2, color: '#9ca3af', opacity: 0.85 };
	}

	function buildConfig(source?: ChairConfig | null): ChairConfig {
		return {
			top:    source ? { ...defaultSide(), ...source.top    } : defaultSide('individual'),
			bottom: source ? { ...defaultSide(), ...source.bottom } : defaultSide('individual'),
			left:   source ? { ...defaultSide(), ...source.left   } : defaultSide('none'),
			right:  source ? { ...defaultSide(), ...source.right  } : defaultSide('none'),
		};
	}

	// Initialize from existing chairConfig or defaults
	let cfg = $state<ChairConfig>(untrack(() => buildConfig(table.chairConfig)));

	let activeSide = $state<'top' | 'bottom' | 'left' | 'right'>('top');
	const side = $derived(cfg[activeSide]);

	// Preview table positioned at center of a small SVG
	const PREVIEW_SIZE = 280;
	const TABLE_W = 100;
	const TABLE_H = 100;
	const previewTable = $derived<Table>({
		...table,
		x: (PREVIEW_SIZE - TABLE_W) / 2,
		y: (PREVIEW_SIZE - TABLE_H) / 2,
		width: TABLE_W,
		height: TABLE_H,
		chairConfig: cfg,
		rotation: 0
	});

	function patchSide(patch: Partial<ChairSide>) {
		cfg = { ...cfg, [activeSide]: { ...cfg[activeSide], ...patch } };
	}

	async function apply() {
		floorEditor.patchTable(table.id, { chairConfig: cfg });
		await updateTableChairs(table.id, cfg);
		floorEditor.closeChairModal();
	}

	function clearAll() {
		cfg = buildConfig(null);
	}
</script>

<!-- Modal backdrop -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	role="presentation"
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
	onclick={(e) => { if (e.target === e.currentTarget) floorEditor.closeChairModal(); }}
>
	<div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col">

		<!-- Header -->
		<div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
			<div>
				<h2 class="text-lg font-bold text-gray-900">Chair Editor — {table.label}</h2>
				<p class="text-sm text-gray-500">Configure seating on each side of the table</p>
			</div>
			<button onclick={() => floorEditor.closeChairModal()} class="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none">✕</button>
		</div>

		<div class="flex gap-0 flex-1 min-h-0">
			<!-- Live preview -->
			<div class="w-72 bg-gray-50 flex flex-col items-center justify-center p-6 border-r border-gray-100 shrink-0">
				<p class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Live Preview</p>
				<svg width={PREVIEW_SIZE} height={PREVIEW_SIZE} class="rounded-xl border border-gray-200 bg-white">
					<TableSVG table={previewTable} selected={false} mode="display" />
				</svg>
				<p class="text-xs text-gray-400 mt-3 text-center">Editing: <span class="font-semibold text-gray-700 capitalize">{activeSide}</span> side</p>
			</div>

			<!-- Side selector + controls -->
			<div class="flex-1 flex flex-col overflow-y-auto">
				<!-- Side tabs -->
				<div class="flex border-b border-gray-100">
					{#each SIDES as s}
						<button
							class="flex-1 py-3 text-sm font-semibold capitalize transition-colors
								{activeSide === s ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-gray-500 hover:text-gray-900'}"
							onclick={() => activeSide = s}
						>{s}</button>
					{/each}
				</div>

				<div class="p-5 flex flex-col gap-5">
					<!-- Chair type -->
					<div>
						<span class="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Chair Type</span>
						<div class="flex flex-col gap-1.5">
							{#each CHAIR_TYPES as ct}
								<button
									class="flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors
										{side.type === ct.value
											? 'border-accent bg-accent/5 text-accent'
											: 'border-gray-200 hover:border-gray-300 text-gray-700'}"
									onclick={() => patchSide({ type: ct.value })}
								>
									<span class="w-20 text-sm font-semibold shrink-0">{ct.label}</span>
									<span class="text-xs text-gray-500">{ct.desc}</span>
								</button>
							{/each}
						</div>
					</div>

					<!-- Count (only for individual / diner) -->
					{#if side.type === 'individual' || side.type === 'diner'}
						<div>
							<label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
								Count {side.type === 'diner' ? '(per booth half)' : ''}
							</label>
							<div class="flex items-center gap-3">
								<button
									class="w-9 h-9 rounded-lg border border-gray-200 text-lg font-bold text-gray-700 hover:border-accent hover:text-accent"
									onclick={() => patchSide({ count: Math.max(1, (side.count ?? 2) - 1) })}
								>−</button>
								<span class="text-2xl font-bold font-mono text-gray-900 w-8 text-center">{side.count ?? 2}</span>
								<button
									class="w-9 h-9 rounded-lg border border-gray-200 text-lg font-bold text-gray-700 hover:border-accent hover:text-accent"
									onclick={() => patchSide({ count: Math.min(10, (side.count ?? 2) + 1) })}
								>+</button>
							</div>
						</div>
					{/if}

					<!-- Color -->
					{#if side.type !== 'none'}
						<div>
							<span class="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Chair Color</span>
							<div class="flex items-center gap-2 flex-wrap">
								{#each PRESET_COLORS as c}
									<button
										aria-label="Chair color {c}"
										class="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110
											{side.color === c ? 'border-gray-900 scale-110' : 'border-transparent'}"
										style="background-color: {c}"
										onclick={() => patchSide({ color: c })}
									></button>
								{/each}
								<input
									type="color"
									value={side.color ?? '#9ca3af'}
									class="w-8 h-8 rounded-full border border-gray-300 cursor-pointer"
									oninput={(e) => patchSide({ color: (e.target as HTMLInputElement).value })}
								/>
							</div>
						</div>

						<!-- Opacity -->
						<div>
							<label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
								Opacity — {Math.round((side.opacity ?? 0.85) * 100)}%
							</label>
							<input
								type="range" min="0" max="1" step="0.05"
								value={side.opacity ?? 0.85}
								class="w-full accent-accent"
								oninput={(e) => patchSide({ opacity: parseFloat((e.target as HTMLInputElement).value) })}
							/>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Footer -->
		<div class="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
			<button onclick={clearAll} class="btn-secondary text-sm px-4">Clear All</button>
			<div class="flex gap-2">
				<button onclick={() => floorEditor.closeChairModal()} class="btn-secondary text-sm px-4">Cancel</button>
				<button onclick={apply} class="btn-primary text-sm px-6">Apply Chairs</button>
			</div>
		</div>
	</div>
</div>
