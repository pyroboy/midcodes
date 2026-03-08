<script lang="ts">
	import { cn, formatKg } from '$lib/utils';
	import { MEAT_ONTOLOGY_NODES, DEFAULT_MEAT_EDGES, PROTEIN_ORDER, type MeatProtein, type MeatCutRole } from '$lib/stores/stock.constants';
	import { getYieldPct, setYieldPct } from '$lib/stores/stock.svelte';
	import type { MeatReportRow } from '$lib/stores/reports.svelte';
	import { MANAGER_PIN } from '$lib/stores/session.svelte';

	interface Props {
		rows: MeatReportRow[];
	}

	let { rows }: Props = $props();

	let proteinFilter: MeatProtein | 'all' = $state('all');
	let selectedNodeId: string | null = $state(null);
	let editingEdge: { from: string; to: string } | null = $state(null);
	let editValue: string = $state('');
	let pinInput: string = $state('');
	let pinError: boolean = $state(false);

	const filteredNodes = $derived(
		MEAT_ONTOLOGY_NODES.filter(n => proteinFilter === 'all' || n.protein === proteinFilter)
	);

	const filteredEdges = $derived(
		DEFAULT_MEAT_EDGES.filter(e => {
			const fromNode = MEAT_ONTOLOGY_NODES.find(n => n.id === e.from);
			return fromNode && (proteinFilter === 'all' || fromNode.protein === proteinFilter);
		})
	);

	// Build a lookup from ontology menuItemId → row data (avoids store access + fragile label matching)
	const rowByMenuItemId = $derived(
		new Map(rows.map(r => {
			const node = MEAT_ONTOLOGY_NODES.find(n => n.label === r.cut);
			return node ? [node.menuItemId, r] as const : null;
		}).filter((e): e is [string, MeatReportRow] => e !== null))
	);

	function getNodeData(node: typeof MEAT_ONTOLOGY_NODES[0]): { current: number; status: string } {
		const row = rowByMenuItemId.get(node.menuItemId);
		if (!row) return { current: 0, status: 'ok' };
		return { current: row.closing, status: row.stockStatus };
	}

	function getNodeRow(node: typeof MEAT_ONTOLOGY_NODES[0]): MeatReportRow | undefined {
		return rowByMenuItemId.get(node.menuItemId);
	}

	// Layout columns by role — compact to fit ~360px sidebar
	const columnX: Record<MeatCutRole, number> = { primal: 10, processed: 130, portioned: 250, byproduct: 250, direct: 130 };

	// Compute node positions
	const nodePositions = $derived.by(() => {
		const positions: Record<string, { x: number; y: number }> = {};
		const activeProteins = proteinFilter === 'all' ? PROTEIN_ORDER.filter(p => p !== 'other') : [proteinFilter];

		let globalY = 24;
		for (const protein of activeProteins) {
			const proteinNodes = filteredNodes.filter(n => n.protein === protein);
			const byColumn: Record<string, typeof proteinNodes> = {};
			for (const n of proteinNodes) {
				const col = columnX[n.role];
				const key = String(col);
				if (!byColumn[key]) byColumn[key] = [];
				byColumn[key].push(n);
			}

			let maxY = globalY;
			for (const [colX, nodes] of Object.entries(byColumn)) {
				let y = globalY;
				for (const n of nodes) {
					positions[n.id] = { x: Number(colX), y };
					y += 44;
				}
				maxY = Math.max(maxY, y);
			}
			globalY = maxY + 14;
		}

		return positions;
	});

	const svgHeight = $derived.by(() => {
		const ys = Object.values(nodePositions).map(p => p.y);
		return ys.length > 0 ? Math.max(...ys) + 44 : 150;
	});

	const statusDotColor: Record<string, string> = {
		ok: 'fill-status-green',
		low: 'fill-status-yellow',
		critical: 'fill-status-red',
	};

	const proteinColors: Record<MeatProtein, string> = {
		pork: '#EA580C',
		beef: '#DC2626',
		chicken: '#CA8A04',
		other: '#6B7280',
	};

	function startEdgeEdit(from: string, to: string) {
		editingEdge = { from, to };
		editValue = String(getYieldPct(from, to));
		pinInput = '';
		pinError = false;
	}

	function confirmEdgeEdit() {
		if (pinInput !== MANAGER_PIN) {
			pinError = true;
			return;
		}
		if (editingEdge) {
			const pct = Math.max(0, Math.min(100, Number(editValue) || 0));
			setYieldPct(editingEdge.from, editingEdge.to, pct);
		}
		editingEdge = null;
		pinInput = '';
		pinError = false;
	}

	function cancelEdgeEdit() {
		editingEdge = null;
		pinInput = '';
		pinError = false;
	}

	// Bezier path between two points
	function edgePath(x1: number, y1: number, x2: number, y2: number): string {
		const mx = (x1 + x2) / 2;
		return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
	}

	const selectedDetail = $derived.by(() => {
		if (!selectedNodeId) return null;
		const node = MEAT_ONTOLOGY_NODES.find(n => n.id === selectedNodeId);
		if (!node) return null;
		const data = getNodeData(node);
		const row = getNodeRow(node);
		return { node, data, row };
	});
</script>

<div class="rounded-xl border border-border bg-white p-3 max-w-xl">
	<!-- Header + Protein filter -->
	<div class="mb-2 flex items-center justify-between">
		<h3 class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Conversion Graph</h3>
		<div class="flex gap-0.5">
			{#each (['all', 'pork', 'beef', 'chicken'] as const) as f (f)}
				<button
					class={cn(
						'rounded-md px-2 py-1 text-[10px] font-semibold transition-colors',
						proteinFilter === f
							? 'bg-accent text-white'
							: 'bg-gray-100 text-gray-500 hover:bg-gray-200'
					)}
					onclick={() => { proteinFilter = f; selectedNodeId = null; }}
				>
					{f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
				</button>
			{/each}
		</div>
	</div>

	<!-- Column headers -->
	<div class="mb-0.5 flex text-[8px] font-semibold uppercase tracking-widest text-gray-300">
		<span style="margin-left: 8px; width: 120px;">Primal</span>
		<span style="width: 120px;">Processed</span>
		<span>Portioned / Byproduct</span>
	</div>

	<!-- SVG DAG -->
	<svg width="100%" viewBox="0 0 360 {svgHeight}" class="select-none">
		<!-- Edges -->
		{#each filteredEdges as edge (`${edge.from}-${edge.to}`)}
			{@const fromPos = nodePositions[edge.from]}
			{@const toPos = nodePositions[edge.to]}
			{#if fromPos && toPos}
				{@const fromNode = MEAT_ONTOLOGY_NODES.find(n => n.id === edge.from)}
				<path
					d={edgePath(fromPos.x + 60, fromPos.y + 14, toPos.x - 2, toPos.y + 14)}
					fill="none"
					stroke={proteinColors[fromNode?.protein ?? 'other']}
					stroke-width="1.5"
					stroke-opacity="0.3"
				/>
				{@const mx = (fromPos.x + 60 + toPos.x - 2) / 2}
				{@const my = (fromPos.y + toPos.y) / 2 + 14}
				<g
					class="cursor-pointer"
					onclick={() => startEdgeEdit(edge.from, edge.to)}
					role="button"
					tabindex="0"
					onkeydown={(e) => { if (e.key === 'Enter') startEdgeEdit(edge.from, edge.to); }}
				>
					<rect
						x={mx - 14}
						y={my - 8}
						width="28"
						height="14"
						rx="7"
						fill="white"
						stroke={proteinColors[fromNode?.protein ?? 'other']}
						stroke-width="0.8"
						stroke-opacity="0.4"
					/>
					<text
						x={mx}
						y={my + 1}
						text-anchor="middle"
						font-size="8"
						font-weight="600"
						fill={proteinColors[fromNode?.protein ?? 'other']}
					>
						{getYieldPct(edge.from, edge.to)}%
					</text>
				</g>
			{/if}
		{/each}

		<!-- Nodes -->
		{#each filteredNodes as node (node.id)}
			{@const pos = nodePositions[node.id]}
			{#if pos}
				{@const data = getNodeData(node)}
				<g
					class="cursor-pointer"
					onclick={() => { selectedNodeId = selectedNodeId === node.id ? null : node.id; }}
					role="button"
					tabindex="0"
					onkeydown={(e) => { if (e.key === 'Enter') selectedNodeId = selectedNodeId === node.id ? null : node.id; }}
				>
					<rect
						x={pos.x}
						y={pos.y}
						width="110"
						height="28"
						rx="6"
						fill={selectedNodeId === node.id ? proteinColors[node.protein] + '18' : 'white'}
						stroke={proteinColors[node.protein]}
						stroke-width={selectedNodeId === node.id ? '1.5' : '0.8'}
						stroke-opacity={selectedNodeId === node.id ? '0.8' : '0.3'}
					/>
					<circle
						cx={pos.x + 9}
						cy={pos.y + 14}
						r="3"
						class={statusDotColor[data.status]}
					/>
					<text
						x={pos.x + 17}
						y={pos.y + 11}
						font-size="8.5"
						font-weight="600"
						fill="#111827"
					>
						{node.label}
					</text>
					<text
						x={pos.x + 17}
						y={pos.y + 22}
						font-size="8"
						fill="#6B7280"
						font-family="JetBrains Mono, monospace"
					>
						{formatKg(data.current)}
					</text>
				</g>
			{/if}
		{/each}
	</svg>

	<!-- Selected node detail -->
	{#if selectedDetail}
		<div class="mt-2 rounded-lg border border-border bg-gray-50 p-2">
			<div class="flex items-center gap-2 text-xs">
				<span class="font-bold text-gray-900">{selectedDetail.node.label}</span>
				<span class={cn('rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
					selectedDetail.data.status === 'ok' ? 'bg-status-green-light text-status-green' :
					selectedDetail.data.status === 'low' ? 'bg-status-yellow-light text-status-yellow' :
					'bg-status-red-light text-status-red'
				)}>
					{selectedDetail.data.status.toUpperCase()}
				</span>
			</div>
			<div class="mt-1 grid grid-cols-4 gap-2 text-[10px]">
				<div>
					<span class="text-gray-400">Stock</span>
					<p class="font-mono font-semibold text-gray-900">{formatKg(selectedDetail.data.current)}</p>
				</div>
				{#if selectedDetail.row}
					<div>
						<span class="text-gray-400">Sold</span>
						<p class="font-mono font-semibold text-gray-900">{formatKg(selectedDetail.row.soldGrams)}</p>
					</div>
					<div>
						<span class="text-gray-400">Waste</span>
						<p class="font-mono font-semibold text-status-red">{formatKg(selectedDetail.row.wasteAmount)}</p>
					</div>
					<div>
						<span class="text-gray-400">Variance</span>
						<p class={cn('font-mono font-semibold',
							selectedDetail.row.variancePct < -15 ? 'text-status-red' : selectedDetail.row.variancePct > 10 ? 'text-status-yellow' : 'text-status-green'
						)}>
							{selectedDetail.row.variancePct > 0 ? '+' : ''}{selectedDetail.row.variancePct}%
						</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Inline yield edit modal -->
	{#if editingEdge}
		<div class="mt-2 rounded-lg border border-accent/30 bg-accent-light p-2">
			<p class="mb-1 text-[10px] font-semibold text-gray-700">
				Edit yield: {editingEdge.from} &rarr; {editingEdge.to}
			</p>
			<div class="flex items-center gap-1.5">
				<input
					type="number"
					min="0"
					max="100"
					bind:value={editValue}
					class="pos-input w-16 text-xs"
					placeholder="%"
				/>
				<span class="text-[10px] text-gray-500">%</span>
				<input
					type="password"
					inputmode="numeric"
					maxlength="4"
					bind:value={pinInput}
					class={cn('pos-input w-20 text-xs', pinError && 'border-status-red')}
					placeholder="PIN"
					onkeydown={(e) => { if (e.key === 'Enter') confirmEdgeEdit(); }}
				/>
				<button class="btn-primary text-[10px] px-2 py-1" onclick={confirmEdgeEdit}>Save</button>
				<button class="btn-ghost text-[10px] px-2 py-1" onclick={cancelEdgeEdit}>Cancel</button>
			</div>
			{#if pinError}
				<p class="mt-0.5 text-[10px] text-status-red">Invalid manager PIN</p>
			{/if}
		</div>
	{/if}
</div>
