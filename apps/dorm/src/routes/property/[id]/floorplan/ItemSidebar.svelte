<script lang="ts">
	import { Pencil, Eraser, MousePointer2, DoorOpen, Columns2 } from 'lucide-svelte';
	import type { DrawTool } from './types';

	let {
		unplacedUnits,
		placedCount,
		totalCount,
		tool = 'draw' as DrawTool,
		onToolChange
	}: {
		unplacedUnits: any[];
		placedCount: number;
		totalCount: number;
		tool: DrawTool;
		onToolChange: (tool: DrawTool) => void;
	} = $props();

	let progressPct = $derived(totalCount > 0 ? (placedCount / totalCount) * 100 : 0);
</script>

<div class="w-56 flex flex-col gap-3 p-4 border-r bg-background overflow-y-auto shrink-0">
	<!-- Tool Toggle -->
	<div class="grid grid-cols-3 rounded-lg border overflow-hidden">
		<button
			class="flex items-center justify-center gap-1 px-2 py-2 text-[11px] font-medium transition-colors
				{tool === 'select'
					? 'bg-blue-600 text-white'
					: 'bg-secondary hover:bg-secondary/80 text-muted-foreground'}"
			onclick={() => onToolChange('select')}
			title="Select walls (S)"
		>
			<MousePointer2 class="w-3.5 h-3.5 shrink-0" />
			<span class="truncate">Select</span>
		</button>
		<button
			class="flex items-center justify-center gap-1 px-2 py-2 text-[11px] font-medium transition-colors
				{tool === 'draw'
					? 'bg-slate-800 text-white'
					: 'bg-secondary hover:bg-secondary/80 text-muted-foreground'}"
			onclick={() => onToolChange('draw')}
			title="Draw walls (D)"
		>
			<Pencil class="w-3.5 h-3.5 shrink-0" />
			<span class="truncate">Draw</span>
		</button>
		<button
			class="flex items-center justify-center gap-1 px-2 py-2 text-[11px] font-medium transition-colors
				{tool === 'erase'
					? 'bg-red-600 text-white'
					: 'bg-secondary hover:bg-secondary/80 text-muted-foreground'}"
			onclick={() => onToolChange('erase')}
			title="Erase walls (E)"
		>
			<Eraser class="w-3.5 h-3.5 shrink-0" />
			<span class="truncate">Erase</span>
		</button>
	</div>

	<!-- Door / Window tools -->
	<div class="grid grid-cols-2 rounded-lg border overflow-hidden">
		<button
			class="flex items-center justify-center gap-1 px-2 py-2 text-[11px] font-medium transition-colors
				{tool === 'door'
					? 'bg-amber-600 text-white'
					: 'bg-secondary hover:bg-secondary/80 text-muted-foreground'}"
			onclick={() => onToolChange('door')}
			title="Place door on wall"
		>
			<DoorOpen class="w-3.5 h-3.5 shrink-0" />
			<span class="truncate">Door</span>
		</button>
		<button
			class="flex items-center justify-center gap-1 px-2 py-2 text-[11px] font-medium transition-colors
				{tool === 'window'
					? 'bg-sky-600 text-white'
					: 'bg-secondary hover:bg-secondary/80 text-muted-foreground'}"
			onclick={() => onToolChange('window')}
			title="Place window on wall"
		>
			<Columns2 class="w-3.5 h-3.5 shrink-0" />
			<span class="truncate">Window</span>
		</button>
	</div>

	<!-- Instructions -->
	<div class="rounded-lg border bg-slate-50 p-3 space-y-1.5">
		{#if tool === 'select'}
			<p class="text-xs font-semibold text-blue-700">Select & Assign</p>
			<ul class="text-xs text-slate-600 space-y-0.5">
				<li>Drag over walls to select & delete</li>
				<li>Drag an empty area to assign a room</li>
			</ul>
		{:else if tool === 'draw'}
			<p class="text-xs font-semibold text-slate-700">Draw Walls</p>
			<ul class="text-xs text-slate-600 space-y-0.5">
				<li>Drag to draw wall segments</li>
				<li>Click an enclosed room to assign it</li>
			</ul>
		{:else if tool === 'door'}
			<p class="text-xs font-semibold text-amber-700">Place Doors</p>
			<ul class="text-xs text-slate-600 space-y-0.5">
				<li>Click a wall to toggle a door</li>
				<li>Doors show a gap with swing arc</li>
				<li>Rooms stay enclosed (visual only)</li>
			</ul>
		{:else if tool === 'window'}
			<p class="text-xs font-semibold text-sky-700">Place Windows</p>
			<ul class="text-xs text-slate-600 space-y-0.5">
				<li>Click a wall to toggle a window</li>
				<li>Windows show a glass pane overlay</li>
				<li>Rooms stay enclosed (visual only)</li>
			</ul>
		{:else}
			<p class="text-xs font-semibold text-red-700">Erase Walls</p>
			<ul class="text-xs text-slate-600 space-y-0.5">
				<li>Drag over walls to erase them</li>
				<li>Click a single wall to remove it</li>
			</ul>
		{/if}
		<p class="text-[10px] text-slate-400">
			Keys: <kbd class="px-1 py-0.5 rounded bg-slate-200 text-slate-600 font-mono">S</kbd> select
			<kbd class="px-1 py-0.5 rounded bg-slate-200 text-slate-600 font-mono">D</kbd> draw
			<kbd class="px-1 py-0.5 rounded bg-slate-200 text-slate-600 font-mono">E</kbd> erase
		</p>
	</div>

	<!-- Progress -->
	{#if totalCount > 0}
		<div class="space-y-1">
			<div class="text-sm text-muted-foreground">
				{placedCount} of {totalCount} units assigned
			</div>
			<div class="w-full bg-secondary rounded-full h-2">
				<div
					class="bg-primary h-2 rounded-full transition-all duration-300"
					style="width: {progressPct}%"
				></div>
			</div>
		</div>
	{/if}

	<!-- Unplaced units -->
	{#if unplacedUnits.length > 0}
		<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
			Unassigned Units
		</p>
		{#each unplacedUnits as unit (unit.id)}
			<div class="p-2 rounded border bg-card text-xs">
				<div class="font-medium">{unit.name}</div>
				<div class="text-muted-foreground mt-0.5">cap. {unit.capacity} · {unit.type}</div>
			</div>
		{/each}
	{:else if totalCount > 0}
		<p class="text-xs text-green-600 text-center mt-2 font-medium">All units assigned!</p>
	{/if}
</div>
