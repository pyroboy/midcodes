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
	import { Shield, Clock, User, Filter, ChevronDown, ChevronUp } from '@lucide/svelte';
	import { formatDate, formatRelativeTime } from '$lib/utils/dateFormat';

	let { data } = $props();

	let actionFilter = $state('');
	let dateRange = $state<string>('all');
	let expandedRow = $state<string | null>(null);

	const dateRanges = [
		{ value: 'all', label: 'All time' },
		{ value: '24h', label: 'Last 24h' },
		{ value: '7d', label: 'Last 7 days' },
		{ value: '30d', label: 'Last 30 days' }
	] as const;

	function getDateCutoff(range: string): Date | null {
		const now = new Date();
		switch (range) {
			case '24h':
				return new Date(now.getTime() - 24 * 60 * 60 * 1000);
			case '7d':
				return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			case '30d':
				return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
			default:
				return null;
		}
	}

	let filteredLogs = $derived(
		data.logs.filter((log) => {
			const matchesAction =
				!actionFilter || log.action.toLowerCase().includes(actionFilter.toLowerCase());

			const cutoff = getDateCutoff(dateRange);
			const matchesDate = !cutoff || (log.createdAt && new Date(log.createdAt) >= cutoff);

			return matchesAction && matchesDate;
		})
	);

	function toggleRow(id: string) {
		expandedRow = expandedRow === id ? null : id;
	}

	function formatMetadata(metadata: unknown): string {
		if (!metadata) return '-';
		try {
			return JSON.stringify(metadata, null, 2);
		} catch {
			return String(metadata);
		}
	}
</script>

<svelte:head>
	<title>Audit Log | Kanaya Admin</title>
</svelte:head>

<div class="space-y-8">
	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold tracking-tight flex items-center gap-2">
			<Shield class="h-8 w-8" />
			Audit Log
		</h1>
		<p class="text-muted-foreground mt-1">Review administrative actions and system events.</p>
	</div>

	<!-- Filters -->
	<div class="flex flex-col sm:flex-row gap-4">
		<div class="relative flex-1 max-w-sm">
			<Filter class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
			<Input
				placeholder="Filter by action..."
				bind:value={actionFilter}
				class="pl-10"
			/>
		</div>
		<div class="flex gap-2 flex-wrap">
			{#each dateRanges as range}
				<Button
					variant={dateRange === range.value ? 'default' : 'outline'}
					size="sm"
					onclick={() => (dateRange = range.value)}
				>
					<Clock class="h-3.5 w-3.5 mr-1" />
					{range.label}
				</Button>
			{/each}
		</div>
	</div>

	<!-- Audit Log Table -->
	<Card>
		<CardHeader>
			<CardTitle>Logs ({filteredLogs.length})</CardTitle>
		</CardHeader>
		<CardContent>
			{#if filteredLogs.length > 0}
				<!-- Desktop Table -->
				<div class="hidden md:block relative overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Timestamp</TableHead>
								<TableHead>Admin</TableHead>
								<TableHead>Action</TableHead>
								<TableHead>Target Type</TableHead>
								<TableHead>Target ID</TableHead>
								<TableHead>IP Address</TableHead>
								<TableHead class="w-10"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each filteredLogs as log}
								<TableRow
									class="cursor-pointer hover:bg-muted/50"
									onclick={() => toggleRow(log.id)}
								>
									<TableCell class="text-muted-foreground whitespace-nowrap">
										<span title={log.createdAt ? formatDate(log.createdAt, 'full') : ''}>
											{log.createdAt ? formatRelativeTime(log.createdAt) : '-'}
										</span>
									</TableCell>
									<TableCell>
										<div class="flex items-center gap-1.5">
											<User class="h-3.5 w-3.5 text-muted-foreground" />
											<span class="text-sm">{log.adminEmail ?? log.adminId}</span>
										</div>
									</TableCell>
									<TableCell>
										<Badge variant="secondary">{log.action}</Badge>
									</TableCell>
									<TableCell class="text-muted-foreground">
										{log.targetType ?? '-'}
									</TableCell>
									<TableCell class="text-muted-foreground font-mono text-xs max-w-[120px] truncate">
										{log.targetId ?? '-'}
									</TableCell>
									<TableCell class="text-muted-foreground text-xs">
										{log.ipAddress ?? '-'}
									</TableCell>
									<TableCell>
										{#if log.metadata}
											{#if expandedRow === log.id}
												<ChevronUp class="h-4 w-4 text-muted-foreground" />
											{:else}
												<ChevronDown class="h-4 w-4 text-muted-foreground" />
											{/if}
										{/if}
									</TableCell>
								</TableRow>
								{#if expandedRow === log.id && log.metadata}
									<TableRow>
										<TableCell colspan={7} class="bg-muted/30">
											<div class="p-3">
												<p class="text-xs font-medium text-muted-foreground mb-1">Metadata</p>
												<pre class="text-xs bg-muted rounded p-2 overflow-x-auto whitespace-pre-wrap">{formatMetadata(log.metadata)}</pre>
												{#if log.userAgent}
													<p class="text-xs font-medium text-muted-foreground mt-2 mb-1">User Agent</p>
													<p class="text-xs text-muted-foreground break-all">{log.userAgent}</p>
												{/if}
											</div>
										</TableCell>
									</TableRow>
								{/if}
							{/each}
						</TableBody>
					</Table>
				</div>

				<!-- Mobile Card View -->
				<div class="md:hidden space-y-4">
					{#each filteredLogs as log}
						<div
							class="border rounded-lg p-4 space-y-3 cursor-pointer"
							onclick={() => toggleRow(log.id)}
							onkeydown={(e) => e.key === 'Enter' && toggleRow(log.id)}
							role="button"
							tabindex="0"
						>
							<div class="flex items-start justify-between">
								<Badge variant="secondary">{log.action}</Badge>
								<span class="text-xs text-muted-foreground">
									{log.createdAt ? formatRelativeTime(log.createdAt) : '-'}
								</span>
							</div>
							<div class="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
								<div>
									<span class="font-medium">Admin:</span>
									{log.adminEmail ?? log.adminId}
								</div>
								<div>
									<span class="font-medium">Target:</span>
									{log.targetType ?? '-'}
								</div>
								<div>
									<span class="font-medium">Target ID:</span>
									<span class="font-mono">{log.targetId ?? '-'}</span>
								</div>
								<div>
									<span class="font-medium">IP:</span>
									{log.ipAddress ?? '-'}
								</div>
							</div>
							{#if expandedRow === log.id && log.metadata}
								<div class="pt-2 border-t">
									<p class="text-xs font-medium text-muted-foreground mb-1">Metadata</p>
									<pre class="text-xs bg-muted rounded p-2 overflow-x-auto whitespace-pre-wrap">{formatMetadata(log.metadata)}</pre>
									{#if log.userAgent}
										<p class="text-xs font-medium text-muted-foreground mt-2 mb-1">User Agent</p>
										<p class="text-xs text-muted-foreground break-all">{log.userAgent}</p>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center py-12">
					<Shield class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
					<p class="text-muted-foreground">
						{actionFilter || dateRange !== 'all'
							? 'No logs match your filters.'
							: 'No audit logs found.'}
					</p>
				</div>
			{/if}
		</CardContent>
	</Card>
</div>
