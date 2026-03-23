<script lang="ts">
	import { Plus, Edit3, Power, Dumbbell } from 'lucide-svelte';

	type CourtItem = {
		id: string;
		name: string;
		type: 'Indoor' | 'Outdoor' | 'Covered';
		pricePerHour: number;
		status: 'active' | 'maintenance';
		surface: string;
	};

	let courts = $state<CourtItem[]>([
		{ id: 'c1', name: 'Court A', type: 'Indoor', pricePerHour: 500, status: 'active', surface: 'Acrylic' },
		{ id: 'c2', name: 'Court B', type: 'Indoor', pricePerHour: 500, status: 'active', surface: 'Acrylic' },
		{ id: 'c3', name: 'Court C', type: 'Covered', pricePerHour: 400, status: 'maintenance', surface: 'Concrete' },
		{ id: 'c4', name: 'Court D', type: 'Outdoor', pricePerHour: 350, status: 'active', surface: 'Concrete' }
	]);

	let showAddForm = $state(false);
	let newName = $state('');
	let newType = $state<'Indoor' | 'Outdoor' | 'Covered'>('Indoor');
	let newPrice = $state('500');
	let newSurface = $state('Acrylic');

	function addCourt() {
		if (!newName.trim()) return;
		courts = [...courts, {
			id: 'c' + (courts.length + 1),
			name: newName.trim(),
			type: newType,
			pricePerHour: parseInt(newPrice) || 500,
			status: 'active',
			surface: newSurface
		}];
		newName = '';
		newPrice = '500';
		showAddForm = false;
	}

	function toggleStatus(id: string) {
		courts = courts.map(c =>
			c.id === id ? { ...c, status: c.status === 'active' ? 'maintenance' : 'active' } : c
		);
	}

	function formatPeso(amount: number): string {
		return `P${amount.toLocaleString()}`;
	}

	function typeColor(type: string): string {
		if (type === 'Indoor') return 'bg-violet-500/10 text-violet-600 border-violet-200';
		if (type === 'Outdoor') return 'bg-amber-500/10 text-amber-600 border-amber-200';
		return 'bg-cyan-500/10 text-cyan-600 border-cyan-200';
	}
</script>

<svelte:head>
	<title>Courts - Bohol Pickle Hub</title>
</svelte:head>

<div class="p-4 sm:p-6 lg:p-8 max-w-4xl">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Courts</h1>
			<p class="mt-1 text-sm text-muted-foreground">Manage your pickleball courts.</p>
		</div>
		<button
			onclick={() => { showAddForm = !showAddForm; }}
			class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
		>
			<Plus class="h-4 w-4" />
			Add Court
		</button>
	</div>

	<!-- Add court form -->
	{#if showAddForm}
		<div class="mb-6 rounded-xl border border-border bg-background p-5">
			<h3 class="text-sm font-bold mb-4">New Court</h3>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
				<div>
					<label for="courtName" class="block text-sm font-medium mb-1.5">Court Name</label>
					<input
						id="courtName"
						type="text"
						bind:value={newName}
						class="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
						placeholder="e.g., Court E"
					/>
				</div>
				<div>
					<label for="courtType" class="block text-sm font-medium mb-1.5">Type</label>
					<select
						id="courtType"
						bind:value={newType}
						class="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					>
						<option value="Indoor">Indoor</option>
						<option value="Outdoor">Outdoor</option>
						<option value="Covered">Covered</option>
					</select>
				</div>
				<div>
					<label for="courtPrice" class="block text-sm font-medium mb-1.5">Price per Hour (PHP)</label>
					<input
						id="courtPrice"
						type="number"
						bind:value={newPrice}
						step="50"
						min="0"
						class="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					/>
				</div>
				<div>
					<label for="courtSurface" class="block text-sm font-medium mb-1.5">Surface</label>
					<select
						id="courtSurface"
						bind:value={newSurface}
						class="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					>
						<option value="Acrylic">Acrylic</option>
						<option value="Concrete">Concrete</option>
						<option value="Cushion">Cushion</option>
					</select>
				</div>
			</div>
			<div class="flex gap-2">
				<button
					onclick={addCourt}
					class="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
				>
					Save Court
				</button>
				<button
					onclick={() => { showAddForm = false; }}
					class="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
				>
					Cancel
				</button>
			</div>
		</div>
	{/if}

	<!-- Courts grid -->
	<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
		{#each courts as court (court.id)}
			<div class="rounded-xl border border-border bg-background p-5 {court.status === 'maintenance' ? 'opacity-60' : ''}">
				<div class="flex items-start justify-between mb-3">
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
							<Dumbbell class="h-5 w-5 text-primary" />
						</div>
						<div>
							<h3 class="text-base font-bold">{court.name}</h3>
							<span class="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold {typeColor(court.type)}">
								{court.type}
							</span>
						</div>
					</div>
					<span class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize {court.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}">
						{court.status}
					</span>
				</div>

				<div class="grid grid-cols-2 gap-3 text-sm mb-4">
					<div>
						<p class="text-xs text-muted-foreground">Price/hr</p>
						<p class="font-bold">{formatPeso(court.pricePerHour)}</p>
					</div>
					<div>
						<p class="text-xs text-muted-foreground">Surface</p>
						<p class="font-medium">{court.surface}</p>
					</div>
				</div>

				<div class="flex gap-2 pt-3 border-t border-border">
					<button class="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-xs font-medium hover:bg-muted transition-colors">
						<Edit3 class="h-3 w-3" />
						Edit
					</button>
					<button
						onclick={() => toggleStatus(court.id)}
						class="flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-1.5 text-xs font-medium transition-colors {court.status === 'active' ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}"
					>
						<Power class="h-3 w-3" />
						{court.status === 'active' ? 'Deactivate' : 'Activate'}
					</button>
				</div>
			</div>
		{/each}
	</div>
</div>
