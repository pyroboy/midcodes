<script lang="ts">
	import type { WallMeta, DoorType, WindowType, SwingDir, OpenDir } from './wallEngine';

	let {
		kind,
		meta,
		anchorPx,
		gridWidth,
		gridHeight,
		onUpdate,
		onDelete,
		onClose
	}: {
		kind: 'door' | 'window';
		meta: WallMeta;
		anchorPx: { x: number; y: number };
		gridWidth: number;
		gridHeight: number;
		onUpdate: (meta: WallMeta) => void;
		onDelete: () => void;
		onClose: () => void;
	} = $props();

	const DOOR_TYPES: { value: DoorType; label: string; desc: string }[] = [
		{ value: 'single', label: 'Single', desc: 'Standard hinged door' },
		{ value: 'double', label: 'Double', desc: 'Two-leaf hinged door' },
		{ value: 'sliding', label: 'Sliding', desc: 'Slides along track' },
		{ value: 'pocket', label: 'Pocket', desc: 'Slides into wall' },
		{ value: 'bifold', label: 'Bifold', desc: 'Folds in half' },
		{ value: 'french', label: 'French', desc: 'Glass panel double door' }
	];

	const WINDOW_TYPES: { value: WindowType; label: string; desc: string }[] = [
		{ value: 'fixed', label: 'Fixed', desc: 'Non-opening glass' },
		{ value: 'sliding', label: 'Sliding', desc: 'Horizontal slide' },
		{ value: 'casement', label: 'Casement', desc: 'Side-hinged, swings out' },
		{ value: 'awning', label: 'Awning', desc: 'Top-hinged, tilts out' },
		{ value: 'bay', label: 'Bay', desc: 'Projects outward' }
	];

	// Local state — intentionally captures initial prop values (popup doesn't re-open with new meta)
	// svelte-ignore state_referenced_locally
	let doorType = $state<DoorType>(meta.door ?? 'single');
	// svelte-ignore state_referenced_locally
	let swingDir = $state<SwingDir>(meta.swing ?? 'left');
	// svelte-ignore state_referenced_locally
	let openDir = $state<OpenDir>(meta.openDir ?? 'inward');
	// svelte-ignore state_referenced_locally
	let doorWidth = $state(meta.doorWidth ?? 80);

	// svelte-ignore state_referenced_locally
	let windowType = $state<WindowType>(meta.window ?? 'fixed');
	// svelte-ignore state_referenced_locally
	let sillHeight = $state(meta.sill ?? 0.9);
	// svelte-ignore state_referenced_locally
	let windowWidth = $state(meta.windowWidth ?? 100);
	// svelte-ignore state_referenced_locally
	let windowHeight = $state(meta.windowHeight ?? 120);

	// Build and apply immediately on every change
	function applyNow() {
		const updated: WallMeta = kind === 'door'
			? { ...meta, door: doorType, swing: swingDir, openDir, doorWidth, window: undefined, sill: undefined, windowWidth: undefined, windowHeight: undefined }
			: { ...meta, window: windowType, sill: sillHeight, windowWidth, windowHeight, door: undefined, swing: undefined, openDir: undefined, doorWidth: undefined };
		onUpdate(updated);
	}

	// Wrappers that update local state + apply immediately
	function setDoorType(v: DoorType) { doorType = v; applyNow(); }
	function setSwing(v: SwingDir) { swingDir = v; applyNow(); }
	function setOpenDir(v: OpenDir) { openDir = v; applyNow(); }
	function setDoorWidth(v: number) { doorWidth = v; applyNow(); }
	function setWindowType(v: WindowType) { windowType = v; applyNow(); }
	function setSill(v: number) { sillHeight = v; applyNow(); }
	function setWindowWidth(v: number) { windowWidth = v; applyNow(); }
	function setWindowHeight(v: number) { windowHeight = v; applyNow(); }

	// Position: offset to the right of the click. If near right edge, flip to left.
	const POPUP_W = 288; // w-72 = 18rem = 288px
	const POPUP_GAP = 20;
	let popupLeft = $derived(
		anchorPx.x + POPUP_GAP + POPUP_W < gridWidth
			? anchorPx.x + POPUP_GAP           // right of click
			: anchorPx.x - POPUP_W - POPUP_GAP // left of click
	);
	let popupTop = $derived(Math.max(8, Math.min(anchorPx.y - 40, gridHeight - 450)));
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="absolute z-40 bg-background border rounded-xl shadow-xl w-72 overflow-hidden"
	style="left: {Math.max(8, popupLeft)}px; top: {popupTop}px;"
	onmousedown={(e) => e.stopPropagation()}
	onmouseup={(e) => e.stopPropagation()}
>
	<div class="flex items-center justify-between px-4 py-2.5 border-b bg-muted/30">
		<span class="text-sm font-semibold text-slate-800">
			{kind === 'door' ? 'Door' : 'Window'} Properties
		</span>
		<button class="text-muted-foreground hover:text-foreground text-lg leading-none" onclick={onClose}>&times;</button>
	</div>

	<div class="p-4 space-y-4 max-h-[400px] overflow-y-auto">
		{#if kind === 'door'}
			<div>
				<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Type</p>
				<div class="grid grid-cols-3 gap-1.5">
					{#each DOOR_TYPES as dt}
						<button
							class="flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-center
								{doorType === dt.value
									? 'border-primary bg-primary/5 ring-1 ring-primary'
									: 'border-transparent bg-muted/40 hover:bg-muted'}"
							onclick={() => setDoorType(dt.value)}
							title={dt.desc}
						>
							<svg viewBox="0 0 32 32" class="w-8 h-8">
								{#if dt.value === 'single'}
									<line x1="4" y1="16" x2="4" y2="28" stroke="#334155" stroke-width="2" />
									<line x1="4" y1="28" x2="20" y2="28" stroke="#64748b" stroke-width="1.5" />
									<path d="M 4 28 A 16 16 0 0 1 20 16" stroke="#64748b" stroke-width="1" fill="none" stroke-dasharray="2 2" />
								{:else if dt.value === 'double'}
									<line x1="4" y1="28" x2="16" y2="28" stroke="#64748b" stroke-width="1.5" />
									<line x1="28" y1="28" x2="16" y2="28" stroke="#64748b" stroke-width="1.5" />
									<path d="M 4 28 A 12 12 0 0 1 16 18" stroke="#64748b" stroke-width="1" fill="none" stroke-dasharray="2 2" />
									<path d="M 28 28 A 12 12 0 0 0 16 18" stroke="#64748b" stroke-width="1" fill="none" stroke-dasharray="2 2" />
								{:else if dt.value === 'sliding'}
									<rect x="4" y="14" width="12" height="4" fill="#94a3b8" rx="1" />
									<rect x="14" y="14" width="12" height="4" fill="#64748b" rx="1" />
								{:else if dt.value === 'pocket'}
									<rect x="4" y="12" width="8" height="8" fill="#94a3b8" rx="1" />
									<rect x="12" y="14" width="14" height="4" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2 2" rx="1" />
								{:else if dt.value === 'bifold'}
									<line x1="6" y1="28" x2="16" y2="18" stroke="#64748b" stroke-width="1.5" />
									<line x1="16" y1="18" x2="26" y2="28" stroke="#64748b" stroke-width="1.5" />
									<circle cx="16" cy="18" r="2" fill="#94a3b8" />
								{:else if dt.value === 'french'}
									<path d="M 4 28 A 12 12 0 0 1 16 18" stroke="#64748b" stroke-width="1" fill="none" stroke-dasharray="2 2" />
									<path d="M 28 28 A 12 12 0 0 0 16 18" stroke="#64748b" stroke-width="1" fill="none" stroke-dasharray="2 2" />
									<line x1="8" y1="24" x2="12" y2="20" stroke="#93c5fd" stroke-width="0.8" />
									<line x1="20" y1="20" x2="24" y2="24" stroke="#93c5fd" stroke-width="0.8" />
								{/if}
							</svg>
							<span class="text-[10px] font-medium leading-tight">{dt.label}</span>
						</button>
					{/each}
				</div>
			</div>

			<div>
				<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Hinge Side</p>
				<div class="flex rounded-md border overflow-hidden">
					<button class="flex-1 px-3 py-1.5 text-xs font-medium transition-colors {swingDir === 'left' ? 'bg-slate-800 text-white' : 'bg-secondary'}" onclick={() => setSwing('left')}>Left</button>
					<button class="flex-1 px-3 py-1.5 text-xs font-medium transition-colors {swingDir === 'right' ? 'bg-slate-800 text-white' : 'bg-secondary'}" onclick={() => setSwing('right')}>Right</button>
				</div>
			</div>

			<div>
				<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Opens</p>
				<div class="flex rounded-md border overflow-hidden">
					<button class="flex-1 px-3 py-1.5 text-xs font-medium transition-colors {openDir === 'inward' ? 'bg-slate-800 text-white' : 'bg-secondary'}" onclick={() => setOpenDir('inward')}>Inward</button>
					<button class="flex-1 px-3 py-1.5 text-xs font-medium transition-colors {openDir === 'outward' ? 'bg-slate-800 text-white' : 'bg-secondary'}" onclick={() => setOpenDir('outward')}>Outward</button>
				</div>
			</div>

			<div>
				<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Width</p>
				<div class="flex items-center gap-2">
					<button class="px-2 py-1 rounded border text-xs hover:bg-secondary" onclick={() => setDoorWidth(Math.max(60, doorWidth - 10))}>-</button>
					<span class="flex-1 text-center text-sm font-medium">{doorWidth} cm</span>
					<button class="px-2 py-1 rounded border text-xs hover:bg-secondary" onclick={() => setDoorWidth(Math.min(240, doorWidth + 10))}>+</button>
				</div>
			</div>

		{:else}
			<div>
				<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Type</p>
				<div class="grid grid-cols-3 gap-1.5">
					{#each WINDOW_TYPES as wt}
						<button
							class="flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-center
								{windowType === wt.value
									? 'border-primary bg-primary/5 ring-1 ring-primary'
									: 'border-transparent bg-muted/40 hover:bg-muted'}"
							onclick={() => setWindowType(wt.value)}
							title={wt.desc}
						>
							<svg viewBox="0 0 32 32" class="w-8 h-8">
								{#if wt.value === 'fixed'}
									<rect x="4" y="8" width="24" height="16" fill="#bae6fd" stroke="#334155" stroke-width="1.5" rx="1" />
									<line x1="16" y1="8" x2="16" y2="24" stroke="#334155" stroke-width="0.8" />
									<line x1="4" y1="16" x2="28" y2="16" stroke="#334155" stroke-width="0.8" />
								{:else if wt.value === 'sliding'}
									<rect x="4" y="10" width="13" height="12" fill="#bae6fd" stroke="#334155" stroke-width="1" rx="1" />
									<rect x="15" y="10" width="13" height="12" fill="#93c5fd" stroke="#334155" stroke-width="1" rx="1" />
								{:else if wt.value === 'casement'}
									<rect x="4" y="8" width="24" height="16" fill="#bae6fd" stroke="#334155" stroke-width="1.5" rx="1" />
									<path d="M 4 24 L 16 16 L 4 8" stroke="#64748b" stroke-width="1" fill="none" stroke-dasharray="2 2" />
								{:else if wt.value === 'awning'}
									<rect x="4" y="8" width="24" height="16" fill="#bae6fd" stroke="#334155" stroke-width="1.5" rx="1" />
									<line x1="4" y1="8" x2="16" y2="18" stroke="#64748b" stroke-width="1" stroke-dasharray="2 2" />
									<line x1="28" y1="8" x2="16" y2="18" stroke="#64748b" stroke-width="1" stroke-dasharray="2 2" />
								{:else if wt.value === 'bay'}
									<line x1="4" y1="20" x2="10" y2="10" stroke="#334155" stroke-width="1.5" />
									<line x1="10" y1="10" x2="22" y2="10" stroke="#334155" stroke-width="1.5" />
									<line x1="22" y1="10" x2="28" y2="20" stroke="#334155" stroke-width="1.5" />
									<polygon points="4,20 10,10 22,10 28,20" fill="#bae6fd" fill-opacity="0.5" />
								{/if}
							</svg>
							<span class="text-[10px] font-medium leading-tight">{wt.label}</span>
						</button>
					{/each}
				</div>
			</div>

			<div>
				<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Sill Height</p>
				<div class="flex items-center gap-2">
					<button class="px-2 py-1 rounded border text-xs hover:bg-secondary" onclick={() => setSill(Math.max(0, +(sillHeight - 0.1).toFixed(1)))}>-</button>
					<span class="flex-1 text-center text-sm font-medium">{sillHeight.toFixed(1)} m</span>
					<button class="px-2 py-1 rounded border text-xs hover:bg-secondary" onclick={() => setSill(Math.min(2.5, +(sillHeight + 0.1).toFixed(1)))}>+</button>
				</div>
				<p class="text-[10px] text-muted-foreground mt-0.5">
					{sillHeight === 0 ? 'Floor-to-ceiling' : sillHeight >= 1.2 ? 'Privacy height' : 'Standard'}
				</p>
			</div>

			<div>
				<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Width</p>
				<div class="flex items-center gap-2">
					<button class="px-2 py-1 rounded border text-xs hover:bg-secondary" onclick={() => setWindowWidth(Math.max(40, windowWidth - 10))}>-</button>
					<span class="flex-1 text-center text-sm font-medium">{windowWidth} cm</span>
					<button class="px-2 py-1 rounded border text-xs hover:bg-secondary" onclick={() => setWindowWidth(Math.min(300, windowWidth + 10))}>+</button>
				</div>
			</div>

			<div>
				<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Height</p>
				<div class="flex items-center gap-2">
					<button class="px-2 py-1 rounded border text-xs hover:bg-secondary" onclick={() => setWindowHeight(Math.max(30, windowHeight - 10))}>-</button>
					<span class="flex-1 text-center text-sm font-medium">{windowHeight} cm</span>
					<button class="px-2 py-1 rounded border text-xs hover:bg-secondary" onclick={() => setWindowHeight(Math.min(250, windowHeight + 10))}>+</button>
				</div>
			</div>
		{/if}
	</div>

	<div class="flex items-center gap-2 px-4 py-3 border-t bg-muted/20">
		<button class="px-3 py-1.5 rounded border text-xs font-medium text-destructive hover:bg-red-50 transition-colors" onclick={onDelete}>Remove</button>
		<div class="flex-1"></div>
		<button class="px-3 py-1.5 rounded border text-xs hover:bg-secondary transition-colors" onclick={onClose}>Done</button>
	</div>
</div>
