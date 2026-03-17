<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogFooter,
		DialogDescription
	} from '$lib/components/ui/dialog';
	import { CreditCard, Eye, Ban, ShieldCheck, Search, ExternalLink } from '@lucide/svelte';
	import { formatDate, formatRelativeTime } from '$lib/utils/dateFormat';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let searchQuery = $state('');
	let statusFilter = $state<string>('all');
	let changingStatus = $state<string | null>(null);
	let confirmBan = $state<{ id: string; slug: string } | null>(null);

	const statuses = ['all', 'unclaimed', 'active', 'suspended', 'banned', 'expired'] as const;

	const statusColors: Record<string, string> = {
		active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
		unclaimed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
		suspended: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
		banned: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
		expired: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
	};

	let filteredCards = $derived(
		data.cards.filter((card) => {
			const matchesStatus = statusFilter === 'all' || card.status === statusFilter;
			const matchesSearch =
				!searchQuery ||
				card.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				card.recipientEmail?.toLowerCase().includes(searchQuery.toLowerCase());
			return matchesStatus && matchesSearch;
		})
	);

	let totalCount = $derived(
		Object.values(data.statusCounts).reduce((sum: number, c) => sum + (c as number), 0)
	);

	async function handleStatusChange(cardId: string, newStatus: string) {
		changingStatus = cardId;
		try {
			const res = await fetch('/api/admin/digital-cards/status', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ cardId, status: newStatus })
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({ error: 'Unknown error' }));
				throw new Error(err.error || 'Failed to update status');
			}
			await invalidateAll();
			toast.success(`Card status updated to ${newStatus}`);
		} catch (err) {
			console.error('Status change failed:', err);
			toast.error((err as Error).message || 'Failed to update card status');
		} finally {
			changingStatus = null;
			confirmBan = null;
		}
	}
</script>

<svelte:head>
	<title>Digital Cards | Kanaya Admin</title>
</svelte:head>

<div class="space-y-8">
	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold tracking-tight flex items-center gap-2">
			<CreditCard class="h-8 w-8" />
			Digital Cards
		</h1>
		<p class="text-muted-foreground mt-1">Manage digital card statuses and monitor usage.</p>
	</div>

	<!-- Stats Row -->
	<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
		<Card>
			<CardContent class="pt-4 pb-4">
				<p class="text-sm text-muted-foreground">Total</p>
				<p class="text-2xl font-bold">{totalCount}</p>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="pt-4 pb-4">
				<p class="text-sm text-green-600">Active</p>
				<p class="text-2xl font-bold">{data.statusCounts['active'] ?? 0}</p>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="pt-4 pb-4">
				<p class="text-sm text-yellow-600">Unclaimed</p>
				<p class="text-2xl font-bold">{data.statusCounts['unclaimed'] ?? 0}</p>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="pt-4 pb-4">
				<p class="text-sm text-orange-600">Suspended</p>
				<p class="text-2xl font-bold">{data.statusCounts['suspended'] ?? 0}</p>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="pt-4 pb-4">
				<p class="text-sm text-red-600">Banned</p>
				<p class="text-2xl font-bold">{data.statusCounts['banned'] ?? 0}</p>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="pt-4 pb-4">
				<p class="text-sm text-gray-600">Expired</p>
				<p class="text-2xl font-bold">{data.statusCounts['expired'] ?? 0}</p>
			</CardContent>
		</Card>
	</div>

	<!-- Filters -->
	<div class="flex flex-col sm:flex-row gap-4">
		<div class="relative flex-1 max-w-sm">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
			<Input
				placeholder="Search by slug or email..."
				bind:value={searchQuery}
				class="pl-10"
			/>
		</div>
		<div class="flex gap-2 flex-wrap">
			{#each statuses as status}
				<Button
					variant={statusFilter === status ? 'default' : 'outline'}
					size="sm"
					onclick={() => (statusFilter = status)}
				>
					{status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
				</Button>
			{/each}
		</div>
	</div>

	<!-- Cards Table -->
	<Card>
		<CardHeader>
			<CardTitle>Cards ({filteredCards.length})</CardTitle>
		</CardHeader>
		<CardContent>
			{#if filteredCards.length > 0}
				<!-- Desktop Table -->
				<div class="hidden md:block relative overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Slug</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Recipient Email</TableHead>
								<TableHead>Views</TableHead>
								<TableHead>Created</TableHead>
								<TableHead class="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each filteredCards as card}
								<TableRow>
									<TableCell class="font-medium">
										<a
											href="/id/{card.slug}"
											class="text-blue-600 hover:underline dark:text-blue-400"
										>
											{card.slug}
										</a>
									</TableCell>
									<TableCell>
										<span
											class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold {statusColors[
												card.status ?? 'unclaimed'
											] ?? statusColors['unclaimed']}"
										>
											{card.status ?? 'unclaimed'}
										</span>
									</TableCell>
									<TableCell class="text-muted-foreground">
										{card.recipientEmail ?? '-'}
									</TableCell>
									<TableCell>{card.views ?? 0}</TableCell>
									<TableCell class="text-muted-foreground">
										{card.createdAt ? formatRelativeTime(card.createdAt) : '-'}
									</TableCell>
									<TableCell class="text-right">
										<div class="flex justify-end gap-2">
											<Button
												variant="outline"
												size="sm"
												onclick={() => window.open(`/id/${card.slug}`, '_blank')}
											>
												<ExternalLink class="h-4 w-4 mr-1" />
												View
											</Button>
											{#if card.status === 'active'}
												<Button
													variant="outline"
													size="sm"
													disabled={changingStatus === card.id}
												onclick={() => handleStatusChange(card.id, 'suspended')}
												>
													<Ban class="h-4 w-4 mr-1" />
													Suspend
												</Button>
											{:else if card.status === 'suspended'}
												<Button
													variant="outline"
													size="sm"
													disabled={changingStatus === card.id}
												onclick={() => handleStatusChange(card.id, 'active')}
												>
													<ShieldCheck class="h-4 w-4 mr-1" />
													Activate
												</Button>
												<Button
													variant="destructive"
													size="sm"
													disabled={changingStatus === card.id}
													onclick={() => (confirmBan = { id: card.id, slug: card.slug })}
												>
													<Ban class="h-4 w-4 mr-1" />
													Ban
												</Button>
											{:else if card.status === 'banned'}
												<Button
													variant="outline"
													size="sm"
													disabled={changingStatus === card.id}
												onclick={() => handleStatusChange(card.id, 'active')}
												>
													<ShieldCheck class="h-4 w-4 mr-1" />
													Activate
												</Button>
											{:else if card.status === 'unclaimed'}
												<Badge variant="outline">Pending claim</Badge>
											{/if}
										</div>
									</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				</div>

				<!-- Mobile Card View -->
				<div class="md:hidden space-y-4">
					{#each filteredCards as card}
						<div class="border rounded-lg p-4 space-y-3">
							<div class="flex items-start justify-between">
								<a
									href="/id/{card.slug}"
									class="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
								>
									{card.slug}
								</a>
								<span
									class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold {statusColors[
										card.status ?? 'unclaimed'
									] ?? statusColors['unclaimed']}"
								>
									{card.status ?? 'unclaimed'}
								</span>
							</div>
							<div class="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
								<div>
									<span class="font-medium">Email:</span>
									{card.recipientEmail ?? '-'}
								</div>
								<div>
									<span class="font-medium">Views:</span>
									{card.views ?? 0}
								</div>
								<div>
									<span class="font-medium">Created:</span>
									{card.createdAt ? formatRelativeTime(card.createdAt) : '-'}
								</div>
							</div>
							<div class="flex gap-2 pt-2">
								<Button
									variant="outline"
									size="sm"
									class="flex-1"
									onclick={() => window.open(`/id/${card.slug}`, '_blank')}
								>
									<ExternalLink class="h-4 w-4 mr-1" />
									View
								</Button>
								{#if card.status === 'active'}
									<Button
										variant="outline"
										size="sm"
										class="flex-1"
										disabled={changingStatus === card.id}
												onclick={() => handleStatusChange(card.id, 'suspended')}
									>
										Suspend
									</Button>
								{:else if card.status === 'suspended' || card.status === 'banned'}
									<Button
										variant="outline"
										size="sm"
										class="flex-1"
										disabled={changingStatus === card.id}
												onclick={() => handleStatusChange(card.id, 'active')}
									>
										Activate
									</Button>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center py-12">
					<CreditCard class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
					<p class="text-muted-foreground">
						{searchQuery || statusFilter !== 'all'
							? 'No cards match your filters.'
							: 'No digital cards found.'}
					</p>
				</div>
			{/if}
		</CardContent>
	</Card>
</div>

<!-- Ban Confirmation Dialog -->
<Dialog open={!!confirmBan} onOpenChange={(open) => { if (!open) confirmBan = null; }}>
	<DialogContent class="sm:max-w-sm">
		<DialogHeader>
			<DialogTitle>Ban Digital Card</DialogTitle>
			<DialogDescription>
				Are you sure you want to ban card <strong>{confirmBan?.slug}</strong>? The cardholder will lose access to their digital profile.
			</DialogDescription>
		</DialogHeader>
		<DialogFooter>
			<Button variant="outline" onclick={() => (confirmBan = null)} disabled={!!changingStatus}>Cancel</Button>
			<Button variant="destructive" onclick={() => confirmBan && handleStatusChange(confirmBan.id, 'banned')} disabled={!!changingStatus}>
				{changingStatus ? 'Banning...' : 'Ban Card'}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
