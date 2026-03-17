<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select';
	import { Palette, Clock, CheckCircle, XCircle, Filter } from '@lucide/svelte';

	let { data } = $props();

	let statusFilter = $state<string>('all');

	const filteredRequests = $derived(
		statusFilter === 'all'
			? data.requests
			: data.requests.filter((r: any) => r.status === statusFilter)
	);

	const pendingCount = $derived(data.requests.filter((r: any) => r.status === 'pending').length);
	const inProgressCount = $derived(data.requests.filter((r: any) => r.status === 'in_progress').length);
	const completedCount = $derived(data.requests.filter((r: any) => r.status === 'completed').length);

	function truncate(text: string, maxLength: number): string {
		if (text.length <= maxLength) return text;
		return text.slice(0, maxLength) + '...';
	}

	function formatDate(date: string | Date | null): string {
		if (!date) return '—';
		return new Date(date).toLocaleDateString('en-PH', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'completed': return 'default';
			case 'in_progress': return 'secondary';
			case 'rejected': return 'destructive';
			default: return 'outline';
		}
	}

	function getStatusClass(status: string): string {
		switch (status) {
			case 'pending':
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200';
			case 'in_progress':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200';
			case 'completed':
				return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200';
			case 'rejected':
				return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200';
			default:
				return '';
		}
	}

	function formatStatus(status: string): string {
		return status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}
</script>

<svelte:head>
	<title>Design Requests | Kanaya Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold tracking-tight flex items-center gap-2">
			<Palette class="h-8 w-8" />
			Design Requests
		</h1>
		<p class="text-muted-foreground mt-1">Review and manage custom design requests from users.</p>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<Card>
			<CardContent class="pt-4 pb-4">
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<Clock class="h-4 w-4 text-yellow-500" />
					Pending
				</div>
				<div class="mt-1 text-2xl font-bold">{pendingCount}</div>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="pt-4 pb-4">
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<Clock class="h-4 w-4 text-blue-500" />
					In Progress
				</div>
				<div class="mt-1 text-2xl font-bold">{inProgressCount}</div>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="pt-4 pb-4">
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<CheckCircle class="h-4 w-4 text-green-500" />
					Completed
				</div>
				<div class="mt-1 text-2xl font-bold">{completedCount}</div>
			</CardContent>
		</Card>
	</div>

	<!-- Filter -->
	<div class="flex items-center gap-2">
		<Filter class="h-4 w-4 text-muted-foreground" />
		<Select type="single" value={statusFilter} onValueChange={(v) => { if (v) statusFilter = v; }}>
			<SelectTrigger class="w-[160px]">
				{statusFilter === 'all' ? 'All Statuses' : formatStatus(statusFilter)}
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="all">All Statuses</SelectItem>
				<SelectItem value="pending">Pending</SelectItem>
				<SelectItem value="in_progress">In Progress</SelectItem>
				<SelectItem value="completed">Completed</SelectItem>
				<SelectItem value="rejected">Rejected</SelectItem>
			</SelectContent>
		</Select>
	</div>

	<!-- Table -->
	<Card>
		<CardHeader>
			<CardTitle>Requests ({filteredRequests.length})</CardTitle>
		</CardHeader>
		<CardContent>
			{#if filteredRequests.length > 0}
				<!-- Desktop Table -->
				<div class="hidden md:block overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Requester</TableHead>
								<TableHead>Size</TableHead>
								<TableHead>Instructions</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Created</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each filteredRequests as request (request.id)}
								<TableRow>
									<TableCell class="text-muted-foreground">
										{request.requesterEmail || 'Unknown'}
									</TableCell>
									<TableCell class="whitespace-nowrap">
										{request.sizeName}
										<span class="text-xs text-muted-foreground">
											({request.widthPixels}x{request.heightPixels})
										</span>
									</TableCell>
									<TableCell class="max-w-xs" title={request.designInstructions}>
										{truncate(request.designInstructions, 80)}
									</TableCell>
									<TableCell>
										<Badge variant={getStatusVariant(request.status)} class={getStatusClass(request.status)}>
											{formatStatus(request.status)}
										</Badge>
									</TableCell>
									<TableCell class="whitespace-nowrap text-muted-foreground">
										{formatDate(request.createdAt)}
									</TableCell>
									<TableCell>
										<!-- TODO: Add approve/reject action handlers -->
										<span class="text-xs text-muted-foreground">—</span>
									</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				</div>

				<!-- Mobile Card View -->
				<div class="md:hidden space-y-4">
					{#each filteredRequests as request (request.id)}
						<div class="border rounded-lg p-4 space-y-3">
							<div class="flex items-start justify-between">
								<div class="text-sm text-muted-foreground">
									{request.requesterEmail || 'Unknown'}
								</div>
								<Badge variant={getStatusVariant(request.status)} class={getStatusClass(request.status)}>
									{formatStatus(request.status)}
								</Badge>
							</div>
							<div class="text-sm">
								<span class="font-medium">{request.sizeName}</span>
								<span class="text-xs text-muted-foreground ml-1">
									({request.widthPixels}x{request.heightPixels})
								</span>
							</div>
							<p class="text-sm text-muted-foreground">
								{truncate(request.designInstructions, 120)}
							</p>
							<div class="text-xs text-muted-foreground">
								{formatDate(request.createdAt)}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center py-12">
					<Palette class="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
					<p class="text-muted-foreground">
						{statusFilter !== 'all'
							? 'No requests match your filter.'
							: 'No design requests yet.'}
					</p>
				</div>
			{/if}
		</CardContent>
	</Card>
</div>
