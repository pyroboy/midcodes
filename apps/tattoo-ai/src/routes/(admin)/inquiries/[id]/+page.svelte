<script lang="ts">
	import { enhance } from '$app/forms';
	import { ArrowLeft, AlertCircle, Image } from 'lucide-svelte';

	let { data } = $props();

	let quotedPrice = $state(data.inquiry?.quoted_price ? parseFloat(data.inquiry.quoted_price) : 0);
	let scheduledDate = $state(
		data.inquiry?.scheduled_at
			? new Date(data.inquiry.scheduled_at).toISOString().split('T')[0]
			: ''
	);
	let scheduledTime = $state(
		data.inquiry?.scheduled_at
			? new Date(data.inquiry.scheduled_at).toISOString().split('T')[1]?.split(':').slice(0, 2).join(':')
			: ''
	);

	const statusStyles: Record<string, string> = {
		pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
		approved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
		completed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
		rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
		cancelled: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
	};
</script>

<div class="p-6 lg:p-8">
	<!-- Header -->
	<div class="mb-8 flex items-center gap-4">
		<a href="/dashboard" class="p-2 hover:bg-muted rounded-lg transition">
			<ArrowLeft class="w-5 h-5 text-foreground" />
		</a>
		<div>
			<h1 class="text-2xl lg:text-3xl font-display font-bold text-foreground uppercase tracking-wider">Inquiry Details</h1>
			<p class="text-xs text-muted-foreground font-mono mt-1">{data.inquiry?.id}</p>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Main Content -->
		<div class="lg:col-span-2 space-y-4">
			<!-- Client Info -->
			<div class="bg-card border border-border rounded-xl p-5 lg:p-6">
				<h2 class="text-sm font-display font-semibold text-foreground mb-4 uppercase tracking-wide">Client Information</h2>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<p class="text-xs text-muted-foreground uppercase tracking-wide font-medium">Name</p>
						<p class="text-foreground font-medium mt-1">{data.user?.name}</p>
					</div>
					<div>
						<p class="text-xs text-muted-foreground uppercase tracking-wide font-medium">Phone</p>
						<p class="text-foreground font-mono text-sm mt-1">{data.user?.phone_number || 'Not provided'}</p>
					</div>
				</div>
			</div>

			<!-- Tattoo Details -->
			<div class="bg-card border border-border rounded-xl p-5 lg:p-6">
				<h2 class="text-sm font-display font-semibold text-foreground mb-4 uppercase tracking-wide">Tattoo Details</h2>
				<div class="space-y-4">
					<div>
						<p class="text-xs text-muted-foreground uppercase tracking-wide font-medium">Concept</p>
						<p class="text-foreground mt-1">{data.inquiry?.concept}</p>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<p class="text-xs text-muted-foreground uppercase tracking-wide font-medium">Placement</p>
							<p class="text-foreground font-mono text-sm mt-1">{data.inquiry?.placement}</p>
						</div>
						<div>
							<p class="text-xs text-muted-foreground uppercase tracking-wide font-medium">Size</p>
							<p class="text-foreground font-mono text-sm mt-1">{data.inquiry?.size}</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Reference Image -->
			{#if data.inquiry?.reference_image_url}
				<div class="bg-card border border-border rounded-xl p-5 lg:p-6">
					<h2 class="text-sm font-display font-semibold text-foreground mb-4 uppercase tracking-wide">Reference Image</h2>
					<img
						src={data.inquiry.reference_image_url}
						alt="Reference"
						class="w-full rounded-lg max-h-80 object-cover"
					/>
				</div>
			{:else}
				<div class="bg-muted/30 border border-dashed border-border rounded-xl p-6 flex items-center gap-3">
					<Image class="w-5 h-5 text-muted-foreground" />
					<p class="text-sm text-muted-foreground font-mono">No reference image provided</p>
				</div>
			{/if}
		</div>

		<!-- Sidebar -->
		<div class="space-y-4">
			<!-- Status -->
			<div class="bg-card border border-border rounded-xl p-5">
				<h3 class="text-xs font-display font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Status</h3>
				<span class="inline-block px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border {statusStyles[data.inquiry?.status] || ''}">
					{data.inquiry?.status?.toUpperCase()}
				</span>
			</div>

			<!-- Quote & Schedule -->
			<form action="?/approve" method="POST" use:enhance class="bg-card border border-border rounded-xl p-5 space-y-4">
				<div>
					<label for="quotedPrice" class="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
						Quoted Price (PHP)
					</label>
					<input
						type="number"
						id="quotedPrice"
						name="quotedPrice"
						bind:value={quotedPrice}
						step="100"
						min="0"
						class="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
					/>
				</div>

				<div>
					<label for="scheduledDate" class="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
						Date
					</label>
					<input
						type="date"
						id="scheduledDate"
						name="scheduledDate"
						bind:value={scheduledDate}
						class="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
					/>
				</div>

				<div>
					<label for="scheduledTime" class="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
						Time
					</label>
					<input
						type="time"
						id="scheduledTime"
						name="scheduledTime"
						bind:value={scheduledTime}
						class="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
					/>
				</div>

				<button
					type="submit"
					class="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-display font-semibold uppercase tracking-wider hover:bg-primary/90 transition-all text-sm"
				>
					Approve & Schedule
				</button>
			</form>

			<!-- Actions -->
			<div class="space-y-2">
				<form action="?/reject" method="POST" use:enhance>
					<button
						type="submit"
						class="w-full px-4 py-2.5 border border-red-500/30 text-red-500 rounded-lg hover:bg-red-500/10 transition font-medium text-sm"
					>
						Reject
					</button>
				</form>

				<form action="?/cancel" method="POST" use:enhance>
					<button
						type="submit"
						class="w-full px-4 py-2.5 border border-border text-muted-foreground rounded-lg hover:bg-muted transition font-medium text-sm"
					>
						Cancel
					</button>
				</form>
			</div>

			<!-- Meta -->
			<div class="bg-muted/30 rounded-xl p-4 text-xs text-muted-foreground font-mono space-y-2">
				<div>
					<p class="font-semibold uppercase tracking-wide">Created</p>
					<p>{new Date(data.inquiry?.created_at).toLocaleString()}</p>
				</div>
				{#if data.inquiry?.scheduled_at}
					<div>
						<p class="font-semibold uppercase tracking-wide">Scheduled</p>
						<p>{new Date(data.inquiry.scheduled_at).toLocaleString()}</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
