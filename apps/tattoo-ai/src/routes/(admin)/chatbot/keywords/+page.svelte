<script lang="ts">
	import { Hash, Plus, Search, X, ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from 'lucide-svelte';

	interface KeywordTrigger {
		id: string;
		keywords: string[];
		matchType: 'contains' | 'exact' | 'starts_with';
		linkedFlow: string;
		linkedFlowId: string;
		priority: number;
		active: boolean;
	}

	let triggers = $state<KeywordTrigger[]>([
		{ id: 'k1', keywords: ['book', 'appointment', 'schedule', 'reserve'], matchType: 'contains', linkedFlow: 'Booking Flow', linkedFlowId: 'booking', priority: 1, active: true },
		{ id: 'k2', keywords: ['price', 'cost', 'how much', 'rate', 'estimate'], matchType: 'contains', linkedFlow: 'Pricing Flow', linkedFlowId: 'pricing', priority: 2, active: true },
		{ id: 'k3', keywords: ['portfolio', 'gallery', 'work', 'samples', 'photos'], matchType: 'contains', linkedFlow: 'Portfolio Flow', linkedFlowId: 'portfolio', priority: 3, active: true },
		{ id: 'k4', keywords: ['aftercare', 'healing', 'care', 'maintenance', 'wash'], matchType: 'contains', linkedFlow: 'Aftercare Flow', linkedFlowId: 'aftercare', priority: 4, active: true },
		{ id: 'k5', keywords: ['hours', 'open', 'location', 'address', 'where', 'when'], matchType: 'contains', linkedFlow: 'Hours & Location', linkedFlowId: 'hours-location', priority: 5, active: true },
		{ id: 'k6', keywords: ['hi', 'hello', 'hey', 'good morning', 'good afternoon'], matchType: 'starts_with', linkedFlow: 'Greeting Flow', linkedFlowId: 'greeting', priority: 10, active: true }
	]);

	let searchQuery = $state('');
	let showAddForm = $state(false);
	let newKeyword = $state('');
	let newKeywords = $state<string[]>([]);
	let newMatchType = $state<'contains' | 'exact' | 'starts_with'>('contains');
	let newLinkedFlow = $state('booking');
	let newPriority = $state(6);

	const flowOptions = [
		{ id: 'booking', name: 'Booking Flow' },
		{ id: 'pricing', name: 'Pricing Flow' },
		{ id: 'portfolio', name: 'Portfolio Flow' },
		{ id: 'aftercare', name: 'Aftercare Flow' },
		{ id: 'greeting', name: 'Greeting Flow' },
		{ id: 'hours-location', name: 'Hours & Location' }
	];

	const matchTypeConfig: Record<string, { label: string; bg: string; text: string }> = {
		contains: { label: 'Contains', bg: 'bg-blue-500/10', text: 'text-blue-500' },
		exact: { label: 'Exact', bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
		starts_with: { label: 'Starts With', bg: 'bg-amber-500/10', text: 'text-amber-500' }
	};

	let filteredTriggers = $derived(
		triggers
			.filter((t) => {
				if (!searchQuery) return true;
				const q = searchQuery.toLowerCase();
				return t.keywords.some((k) => k.includes(q)) || t.linkedFlow.toLowerCase().includes(q);
			})
			.sort((a, b) => a.priority - b.priority)
	);

	function toggleTrigger(id: string) {
		const trigger = triggers.find((t) => t.id === id);
		if (trigger) trigger.active = !trigger.active;
	}

	function addKeywordToNew() {
		const trimmed = newKeyword.trim().toLowerCase();
		if (trimmed && !newKeywords.includes(trimmed)) {
			newKeywords = [...newKeywords, trimmed];
			newKeyword = '';
		}
	}

	function removeKeywordFromNew(kw: string) {
		newKeywords = newKeywords.filter((k) => k !== kw);
	}

	function addTrigger() {
		if (newKeywords.length === 0) return;
		const flow = flowOptions.find((f) => f.id === newLinkedFlow);
		triggers = [
			...triggers,
			{
				id: `k-${Date.now()}`,
				keywords: [...newKeywords],
				matchType: newMatchType,
				linkedFlow: flow?.name || 'Unknown',
				linkedFlowId: newLinkedFlow,
				priority: newPriority,
				active: true
			}
		];
		newKeywords = [];
		newKeyword = '';
		showAddForm = false;
	}
</script>

<div class="p-6 lg:p-8">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
		<div>
			<h1 class="text-3xl lg:text-4xl font-display font-bold text-foreground uppercase tracking-wider">Keywords</h1>
			<p class="text-muted-foreground mt-1">Manage keyword triggers that route conversations to flows</p>
		</div>
		<button
			onclick={() => (showAddForm = !showAddForm)}
			class="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition shadow-lg shadow-primary/20"
		>
			<Plus class="w-4 h-4" />
			Add Keyword Trigger
		</button>
	</div>

	<!-- Search -->
	<div class="mb-6">
		<div class="relative">
			<Search class="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
			<input
				type="text"
				placeholder="Search keywords or flows..."
				bind:value={searchQuery}
				class="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition font-mono text-sm"
			/>
		</div>
	</div>

	<!-- Add form (inline) -->
	{#if showAddForm}
		<div class="bg-card border border-primary/30 rounded-xl p-5 mb-6">
			<h3 class="font-display font-semibold text-foreground text-sm uppercase tracking-wide mb-4">New Keyword Trigger</h3>
			<div class="space-y-4">
				<!-- Keywords input -->
				<div>
					<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Keywords</label>
					<div class="flex gap-2">
						<input
							type="text"
							placeholder="Type a keyword and press Enter"
							bind:value={newKeyword}
							onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeywordToNew(); }}}
							class="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
						/>
						<button
							onclick={addKeywordToNew}
							class="px-3 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition"
						>
							Add
						</button>
					</div>
					{#if newKeywords.length > 0}
						<div class="flex flex-wrap gap-1.5 mt-2">
							{#each newKeywords as kw (kw)}
								<span class="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-mono border border-primary/20">
									{kw}
									<button onclick={() => removeKeywordFromNew(kw)} class="hover:text-primary/70">
										<X class="w-3 h-3" />
									</button>
								</span>
							{/each}
						</div>
					{/if}
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<!-- Match Type -->
					<div>
						<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Match Type</label>
						<select
							bind:value={newMatchType}
							class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
						>
							<option value="contains">Contains</option>
							<option value="exact">Exact Match</option>
							<option value="starts_with">Starts With</option>
						</select>
					</div>

					<!-- Linked Flow -->
					<div>
						<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Linked Flow</label>
						<select
							bind:value={newLinkedFlow}
							class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
						>
							{#each flowOptions as flow (flow.id)}
								<option value={flow.id}>{flow.name}</option>
							{/each}
						</select>
					</div>

					<!-- Priority -->
					<div>
						<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Priority</label>
						<input
							type="number"
							bind:value={newPriority}
							min={1}
							max={100}
							class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
						/>
					</div>
				</div>

				<div class="flex justify-end gap-2 pt-2">
					<button
						onclick={() => { showAddForm = false; newKeywords = []; newKeyword = ''; }}
						class="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition"
					>
						Cancel
					</button>
					<button
						onclick={addTrigger}
						disabled={newKeywords.length === 0}
						class="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Save Trigger
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Triggers List -->
	<div class="space-y-3">
		{#each filteredTriggers as trigger (trigger.id)}
			<div class="bg-card border border-border rounded-xl p-4 lg:p-5 hover:border-primary/30 transition-all {!trigger.active ? 'opacity-50' : ''}">
				<div class="flex items-start justify-between gap-4">
					<div class="flex-1 min-w-0">
						<!-- Keywords chips -->
						<div class="flex flex-wrap gap-1.5 mb-3">
							{#each trigger.keywords as kw (kw)}
								<span class="inline-flex items-center gap-1 px-2.5 py-1 bg-muted text-foreground rounded-full text-xs font-mono">
									<Hash class="w-3 h-3 text-muted-foreground" />
									{kw}
								</span>
							{/each}
						</div>

						<!-- Meta row -->
						<div class="flex flex-wrap items-center gap-3">
							<span class="text-[10px] font-mono font-semibold px-2 py-0.5 rounded {matchTypeConfig[trigger.matchType].bg} {matchTypeConfig[trigger.matchType].text}">
								{matchTypeConfig[trigger.matchType].label}
							</span>
							<a
								href="/chatbot/flows/{trigger.linkedFlowId}"
								class="text-xs font-medium text-primary hover:underline"
							>
								{trigger.linkedFlow}
							</a>
							<span class="text-[10px] font-mono text-muted-foreground">Priority: {trigger.priority}</span>
						</div>
					</div>

					<!-- Active toggle -->
					<button
						onclick={() => toggleTrigger(trigger.id)}
						class="shrink-0 p-1 transition"
						title={trigger.active ? 'Deactivate' : 'Activate'}
					>
						{#if trigger.active}
							<ToggleRight class="w-8 h-8 text-emerald-500" />
						{:else}
							<ToggleLeft class="w-8 h-8 text-muted-foreground" />
						{/if}
					</button>
				</div>
			</div>
		{/each}

		{#if filteredTriggers.length === 0}
			<div class="text-center py-12 text-muted-foreground">
				<Hash class="w-10 h-10 mx-auto mb-3 opacity-30" />
				<p class="font-mono text-sm">No keyword triggers found</p>
			</div>
		{/if}
	</div>
</div>
