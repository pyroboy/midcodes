<script lang="ts">
	import { Search, Users, FileText, CalendarDays } from 'lucide-svelte';

	let searchQuery = $state('');

	// Demo data
	const clients = [
		{ fb_id: 'user-1', name: 'Marco Reyes', phone_number: '0917-123-4567', created_at: '2026-02-15', inquiries: 3 },
		{ fb_id: 'user-2', name: 'Jessa Santos', phone_number: '0918-234-5678', created_at: '2026-03-01', inquiries: 1 },
		{ fb_id: 'user-3', name: 'Carlo Mendoza', phone_number: null, created_at: '2026-03-10', inquiries: 2 },
		{ fb_id: 'user-4', name: 'Ana Cruz', phone_number: '0919-345-6789', created_at: '2026-03-18', inquiries: 1 }
	];

	let filteredClients = $derived(
		clients.filter(
			(c) =>
				c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(c.phone_number?.includes(searchQuery) || false)
		)
	);
</script>

<div class="p-6 lg:p-8">
	<div class="mb-8">
		<h1 class="text-3xl lg:text-4xl font-display font-bold text-foreground uppercase tracking-wider">Clients</h1>
		<p class="text-muted-foreground mt-1">Manage your tattoo inquiry clients</p>
	</div>

	<!-- Search -->
	<div class="mb-6">
		<div class="relative">
			<Search class="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
			<input
				type="text"
				placeholder="Search by name or phone..."
				bind:value={searchQuery}
				class="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition font-mono text-sm"
			/>
		</div>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-3 gap-3 lg:gap-4 mb-8">
		<div class="bg-card border border-border rounded-xl p-4 lg:p-6">
			<div class="flex items-center gap-2 mb-2">
				<Users class="w-4 h-4 text-muted-foreground" />
				<p class="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total Clients</p>
			</div>
			<p class="text-2xl font-mono font-bold text-foreground">{clients.length}</p>
		</div>
		<div class="bg-card border border-border rounded-xl p-4 lg:p-6">
			<div class="flex items-center gap-2 mb-2">
				<FileText class="w-4 h-4 text-muted-foreground" />
				<p class="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total Inquiries</p>
			</div>
			<p class="text-2xl font-mono font-bold text-foreground">{clients.reduce((a, c) => a + c.inquiries, 0)}</p>
		</div>
		<div class="bg-card border border-border rounded-xl p-4 lg:p-6">
			<div class="flex items-center gap-2 mb-2">
				<CalendarDays class="w-4 h-4 text-muted-foreground" />
				<p class="text-xs text-muted-foreground uppercase tracking-wide font-medium">This Month</p>
			</div>
			<p class="text-2xl font-mono font-bold text-foreground">
				{clients.filter((c) => new Date(c.created_at).getMonth() === new Date().getMonth()).length}
			</p>
		</div>
	</div>

	<!-- Client Cards (mobile-friendly) -->
	<div class="space-y-3">
		{#each filteredClients as client (client.fb_id)}
			<div class="bg-card border border-border rounded-xl p-4 lg:p-5 hover:border-primary/30 transition-all group">
				<div class="flex items-start justify-between">
					<div>
						<p class="font-medium text-foreground group-hover:text-primary transition-colors">{client.name}</p>
						<p class="text-xs text-muted-foreground font-mono mt-1">{client.phone_number || 'No phone'}</p>
					</div>
					<div class="text-right">
						<span class="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-mono font-semibold">
							{client.inquiries} {client.inquiries === 1 ? 'inquiry' : 'inquiries'}
						</span>
						<p class="text-xs text-muted-foreground font-mono mt-2">
							Joined {new Date(client.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
						</p>
					</div>
				</div>
			</div>
		{/each}

		{#if filteredClients.length === 0}
			<div class="text-center py-12 text-muted-foreground">
				<Users class="w-10 h-10 mx-auto mb-3 opacity-30" />
				<p class="font-mono text-sm">No clients found</p>
			</div>
		{/if}
	</div>
</div>
