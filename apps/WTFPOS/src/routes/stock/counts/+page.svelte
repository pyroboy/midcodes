<script lang="ts">
	import { cn } from '$lib/utils';

	type CountStatus = 'pending' | 'done';
	type CountPeriod = '10am' | '4pm' | '10pm';

	interface CountItem {
		id: string;
		name: string;
		unit: string;
		expected: number;
		counted: { '10am': number | null; '4pm': number | null; '10pm': number | null };
	}

	let activePeriod = $state<CountPeriod>('10am');

	const periods: { id: CountPeriod; label: string; time: string; status: CountStatus }[] = [
		{ id: '10am', label: 'Morning',   time: '10:00 AM', status: 'done' },
		{ id: '4pm',  label: 'Afternoon', time: '4:00 PM',  status: 'done' },
		{ id: '10pm', label: 'Evening',   time: '10:00 PM', status: 'pending' }
	];

	let items = $state<CountItem[]>([
		{ id: 'c1', name: 'Samgyupsal',          unit: 'g',       expected: 4200, counted: { '10am': 4180, '4pm': 2100, '10pm': null } },
		{ id: 'c2', name: 'Chadolbaegi',         unit: 'g',       expected: 3000, counted: { '10am': 2950, '4pm': 1800, '10pm': null } },
		{ id: 'c3', name: 'Galbi',               unit: 'g',       expected: 2000, counted: { '10am': 1920, '4pm': 900,  '10pm': null } },
		{ id: 'c4', name: 'US Beef Belly',       unit: 'g',       expected: 3000, counted: { '10am': 3000, '4pm': 2600, '10pm': null } },
		{ id: 'c5', name: 'Kimchi',              unit: 'portions', expected: 20, counted: { '10am': 20,   '4pm': 18,   '10pm': null } },
		{ id: 'c6', name: 'Japchae',             unit: 'portions', expected: 10, counted: { '10am': 10,   '4pm': 6,    '10pm': null } },
		{ id: 'c7', name: 'Soju (Original)',     unit: 'bottles', expected: 30,  counted: { '10am': 30,   '4pm': 24,   '10pm': null } },
		{ id: 'c8', name: 'San Miguel Beer',     unit: 'bottles', expected: 24,  counted: { '10am': 24,   '4pm': 18,   '10pm': null } }
	]);

	function variance(item: CountItem, period: CountPeriod) {
		const c = item.counted[period];
		if (c === null) return null;
		return c - item.expected;
	}

	function varianceClass(v: number | null) {
		if (v === null) return 'text-gray-300';
		if (v < -50) return 'text-status-red font-semibold';   // severe loss
		if (v < -3)  return 'text-status-yellow font-semibold'; // minor variance
		if (v < 0)   return 'text-status-yellow font-semibold';
		return 'text-status-green font-semibold';
	}

	const currentPeriodStatus = $derived(periods.find((p) => p.id === activePeriod)?.status);
	const isPending = $derived(currentPeriodStatus === 'pending');
</script>

<!-- Period selector -->
<div class="mb-5 flex items-center gap-3">
	{#each periods as p}
		<button
			onclick={() => (activePeriod = p.id)}
			class={cn(
				'flex items-center gap-2 rounded-xl border px-4 py-2.5 transition-all',
				activePeriod === p.id
					? 'border-accent bg-accent-light text-accent shadow-sm'
					: 'border-border bg-white text-gray-600 hover:bg-gray-50'
			)}
			style="min-height: unset"
		>
			<div class="text-left">
				<p class="text-sm font-bold">{p.label}</p>
				<p class="text-xs text-gray-400">{p.time}</p>
			</div>
			<span class={cn(
				'ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
				p.status === 'done' ? 'bg-status-green-light text-status-green' : 'bg-amber-50 text-amber-600'
			)}>
				{p.status}
			</span>
		</button>
	{/each}
</div>

{#if isPending}
	<div class="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
		<span class="text-amber-600">⏳</span>
		<p class="text-sm font-medium text-amber-700">Count not yet started. Enter actual counts below to complete this session.</p>
	</div>
{/if}

<div class="overflow-hidden rounded-xl border border-border bg-white">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-border bg-gray-50">
				<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Item</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Expected</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Counted</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Variance</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-border">
			{#each items as item (item.id)}
				{@const v = variance(item, activePeriod)}
				{@const counted = item.counted[activePeriod]}
				<tr class="hover:bg-gray-50">
					<td class="px-4 py-3 font-medium text-gray-900">{item.name}</td>
					<td class="px-4 py-3 text-right font-mono text-gray-500">{item.expected} {item.unit}</td>
					<td class="px-4 py-3 text-right">
						{#if isPending}
							<input
								type="number"
								placeholder="—"
								min="0"
								bind:value={item.counted[activePeriod]}
								class="w-24 rounded-md border border-border px-2 py-1 text-right font-mono text-sm outline-none focus:border-accent"
							/>
						{:else if counted !== null}
							<span class="font-mono font-semibold text-gray-900">{counted} {item.unit}</span>
						{:else}
							<span class="text-gray-300">—</span>
						{/if}
					</td>
					<td class={cn('px-4 py-3 text-right font-mono', varianceClass(v))}>
						{v === null ? '—' : v >= 0 ? `+${v}` : v} {v !== null ? item.unit : ''}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

{#if isPending}
	<div class="mt-4 flex justify-end">
		<button class="btn-primary">Submit Count</button>
	</div>
{/if}
