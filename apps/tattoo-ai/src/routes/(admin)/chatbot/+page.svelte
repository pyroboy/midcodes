<script lang="ts">
	import { MessageSquare, Workflow, Zap, ArrowRightLeft, Plus, Play, Pause, FileEdit, Eye, Sparkles } from 'lucide-svelte';

	type FlowStatus = 'active' | 'draft' | 'paused';

	interface Flow {
		id: string;
		name: string;
		description: string;
		status: FlowStatus;
		steps: number;
		triggers: number;
		lastEdited: string;
	}

	const stats = [
		{ label: 'Conversations', value: '1,247', icon: MessageSquare, bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
		{ label: 'Active Flows', value: '5', icon: Workflow, bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
		{ label: 'Auto-Replies', value: '892', icon: Zap, bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
		{ label: 'Handoff Rate', value: '12%', icon: ArrowRightLeft, bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' }
	];

	const flows: Flow[] = [
		{ id: 'greeting', name: 'Greeting Flow', description: 'Welcome message and initial routing for new conversations', status: 'active', steps: 4, triggers: 3, lastEdited: '2 hours ago' },
		{ id: 'booking', name: 'Booking Flow', description: 'Collect style, size, reference, and schedule a session', status: 'active', steps: 6, triggers: 5, lastEdited: '1 day ago' },
		{ id: 'pricing', name: 'Pricing Flow', description: 'Provide estimates based on style and size selection', status: 'active', steps: 5, triggers: 4, lastEdited: '3 days ago' },
		{ id: 'portfolio', name: 'Portfolio Flow', description: 'Share gallery links and artist-specific portfolios', status: 'active', steps: 3, triggers: 3, lastEdited: '1 week ago' },
		{ id: 'aftercare', name: 'Aftercare Flow', description: 'Post-session care instructions and follow-up reminders', status: 'active', steps: 4, triggers: 2, lastEdited: '2 weeks ago' },
		{ id: 'hours-location', name: 'Hours & Location', description: 'Studio hours, address, and directions', status: 'draft', steps: 2, triggers: 2, lastEdited: '3 weeks ago' }
	];

	const statusConfig: Record<FlowStatus, { label: string; bg: string; text: string }> = {
		active: { label: 'Active', bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
		draft: { label: 'Draft', bg: 'bg-amber-500/10', text: 'text-amber-500' },
		paused: { label: 'Paused', bg: 'bg-muted', text: 'text-muted-foreground' }
	};
</script>

<div class="p-6 lg:p-8">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
		<div>
			<h1 class="text-3xl lg:text-4xl font-display font-bold text-foreground uppercase tracking-wider">Chatbot</h1>
			<p class="text-muted-foreground mt-1">Manage your AI booking assistant</p>
		</div>
		<button class="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition shadow-lg shadow-primary/20">
			<Plus class="w-4 h-4" />
			Create New Flow
		</button>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
		{#each stats as stat (stat.label)}
			<div class="bg-card border {stat.border} rounded-xl p-4 lg:p-6 hover:border-primary/30 transition-all">
				<div class="flex items-center justify-between mb-3">
					<div class="{stat.bg} p-2 rounded-lg">
						<stat.icon class="w-4 h-4 {stat.text}" />
					</div>
					<span class="text-2xl lg:text-3xl font-mono font-bold text-foreground">{stat.value}</span>
				</div>
				<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
			</div>
		{/each}
	</div>

	<!-- Pre-built Flows Suggestion -->
	<div class="bg-gradient-to-r from-primary/10 via-card to-card border border-primary/20 rounded-xl p-5 lg:p-6 mb-8">
		<div class="flex items-start gap-3">
			<div class="p-2 bg-primary/10 rounded-lg shrink-0">
				<Sparkles class="w-5 h-5 text-primary" />
			</div>
			<div>
				<h3 class="font-display font-semibold text-foreground text-sm uppercase tracking-wide">Pre-built Flows Available</h3>
				<p class="text-xs text-muted-foreground mt-1">
					Greeting, Booking, Pricing, Portfolio, and Aftercare flows are ready to use. Customize them to match your studio's voice.
				</p>
			</div>
		</div>
	</div>

	<!-- Flows List -->
	<div class="space-y-3">
		<div class="flex items-center justify-between mb-4">
			<h2 class="font-display font-semibold text-foreground text-sm uppercase tracking-wide">All Flows</h2>
			<span class="text-xs font-mono bg-muted px-2.5 py-1 rounded-md text-muted-foreground">{flows.length} flows</span>
		</div>

		{#each flows as flow (flow.id)}
			<a
				href="/chatbot/flows/{flow.id}"
				class="block bg-card border border-border rounded-xl p-4 lg:p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group"
			>
				<div class="flex items-start justify-between gap-4">
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-3 mb-1.5">
							<h3 class="font-medium text-foreground group-hover:text-primary transition-colors truncate">{flow.name}</h3>
							<span class="shrink-0 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full {statusConfig[flow.status].bg} {statusConfig[flow.status].text}">
								{statusConfig[flow.status].label}
							</span>
						</div>
						<p class="text-xs text-muted-foreground line-clamp-1">{flow.description}</p>
						<div class="flex items-center gap-4 mt-3">
							<span class="text-[10px] font-mono text-muted-foreground">{flow.steps} steps</span>
							<span class="text-[10px] font-mono text-muted-foreground">{flow.triggers} triggers</span>
							<span class="text-[10px] font-mono text-muted-foreground">Edited {flow.lastEdited}</span>
						</div>
					</div>
					<div class="flex items-center gap-1.5 shrink-0">
						<button
							onclick={(e) => e.preventDefault()}
							class="p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
							title="Preview"
						>
							<Eye class="w-4 h-4" />
						</button>
						<button
							onclick={(e) => e.preventDefault()}
							class="p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
							title="Edit"
						>
							<FileEdit class="w-4 h-4" />
						</button>
						{#if flow.status === 'active'}
							<button
								onclick={(e) => e.preventDefault()}
								class="p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
								title="Pause"
							>
								<Pause class="w-4 h-4" />
							</button>
						{:else}
							<button
								onclick={(e) => e.preventDefault()}
								class="p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
								title="Activate"
							>
								<Play class="w-4 h-4" />
							</button>
						{/if}
					</div>
				</div>
			</a>
		{/each}
	</div>
</div>
