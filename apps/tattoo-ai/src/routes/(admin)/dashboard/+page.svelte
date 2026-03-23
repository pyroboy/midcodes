<script lang="ts">
	import { Clock, CheckCircle, XCircle, Trophy, TrendingUp, Users, DollarSign } from 'lucide-svelte';

	let { data } = $props();

	const statuses = [
		{ key: 'pending', label: 'Pending', icon: Clock, bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
		{ key: 'approved', label: 'Approved', icon: CheckCircle, bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
		{ key: 'completed', label: 'Completed', icon: Trophy, bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
		{ key: 'cancelled', label: 'Cancelled', icon: XCircle, bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20' }
	];

	function getInquiriesByStatus(status: string) {
		return data.inquiries?.filter((i: any) => i.status === status) || [];
	}

	let totalRevenue = $derived(
		data.inquiries
			?.filter((i: any) => i.quoted_price && (i.status === 'approved' || i.status === 'completed'))
			.reduce((sum: number, i: any) => sum + parseFloat(i.quoted_price), 0) || 0
	);
</script>

<div class="p-6 lg:p-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl lg:text-4xl font-display font-bold text-foreground uppercase tracking-wider">Dashboard</h1>
		<p class="text-muted-foreground mt-1">Manage tattoo inquiries and bookings</p>
	</div>

	<!-- Quick Stats -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
		{#each statuses as stat (stat.key)}
			<div class="bg-card border {stat.border} rounded-xl p-4 lg:p-6 group hover:border-primary/30 transition-all">
				<div class="flex items-center justify-between mb-3">
					<div class="{stat.bg} p-2 rounded-lg">
						<stat.icon class="w-4 h-4 {stat.text}" />
					</div>
					<span class="text-2xl lg:text-3xl font-mono font-bold text-foreground">{getInquiriesByStatus(stat.key).length}</span>
				</div>
				<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
			</div>
		{/each}
	</div>

	<!-- Revenue card -->
	<div class="bg-gradient-to-r from-primary/10 via-card to-card border border-primary/20 rounded-xl p-6 mb-8">
		<div class="flex items-center gap-3 mb-2">
			<DollarSign class="w-5 h-5 text-primary" />
			<span class="text-sm font-medium text-muted-foreground uppercase tracking-wide">Projected Revenue</span>
		</div>
		<p class="text-3xl font-mono font-bold text-foreground">
			P {totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
		</p>
	</div>

	<!-- Kanban Board -->
	<div class="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
		{#each statuses as status (status.key)}
			<div class="bg-card/50 border border-border rounded-xl p-4">
				<div class="flex items-center gap-2 mb-4 pb-3 border-b border-border">
					<div class="{status.bg} p-1.5 rounded-md">
						<status.icon class="w-3.5 h-3.5 {status.text}" />
					</div>
					<h2 class="font-display font-semibold text-foreground text-sm uppercase tracking-wide">{status.label}</h2>
					<span class="ml-auto text-xs font-mono bg-muted px-2 py-0.5 rounded-md text-muted-foreground">
						{getInquiriesByStatus(status.key).length}
					</span>
				</div>

				<div class="space-y-3">
					{#each getInquiriesByStatus(status.key) as inquiry (inquiry.id)}
						<a
							href="/inquiries/{inquiry.id}"
							class="block p-4 bg-background border border-border rounded-lg hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all group"
						>
							<p class="font-medium text-foreground text-sm truncate group-hover:text-primary transition-colors">
								{inquiry.concept}
							</p>
							<p class="text-xs text-muted-foreground mt-2 font-mono">
								{inquiry.placement} / {inquiry.size}
							</p>
							{#if inquiry.quoted_price}
								<p class="text-xs font-mono font-semibold text-primary mt-2">
									P{parseFloat(inquiry.quoted_price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
								</p>
							{/if}
						</a>
					{/each}

					{#if getInquiriesByStatus(status.key).length === 0}
						<p class="text-center text-muted-foreground text-xs py-8 font-mono">No inquiries</p>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
