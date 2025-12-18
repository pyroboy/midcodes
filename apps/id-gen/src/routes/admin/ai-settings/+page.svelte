<script lang="ts">
	import { browser } from '$app/environment';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Tabs from '$lib/components/ui/tabs';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import {
		getAISettings,
		getAIUsageStats,
		updateAISettings,
		addAICredits,
		rotateAPIKey,
		deleteAPIKey
	} from '$lib/remote/ai-settings.remote';
	import { Key, Bot, Sparkles, Users, Settings, AlertTriangle, Eye, EyeOff, Plus, RefreshCw, Trash2 } from 'lucide-svelte';

	// State
	let activeTab = $state('overview');
	let showApiKey = $state(false);
	let newApiKey = $state('');
	let isUpdating = $state(false);
	let successMessage = $state('');
	let errorMessage = $state('');
	
	// Settings form state
	let provider = $state('nano_banana');
	let model = $state('default');
	let isEnabled = $state(true);
	let rateLimit = $state(60);
	let creditsToAdd = $state(100);

	// Remote data
	const settings = getAISettings();
	const usage = getAIUsageStats();

	// Initialize form from settings
	$effect(() => {
		settings.then(s => {
			if (s) {
				provider = s.provider || 'nano_banana';
				model = s.model || 'default';
				isEnabled = s.isEnabled ?? true;
				rateLimit = s.rateLimitPerMinute || 60;
			}
		});
	});

	function formatNumber(num: number): string {
		return num.toLocaleString('en-PH');
	}

	function clearMessages() {
		successMessage = '';
		errorMessage = '';
	}

	async function handleSaveSettings() {
		clearMessages();
		isUpdating = true;
		try {
			await updateAISettings({
				api_key: newApiKey || undefined,
				provider,
				model,
				is_enabled: isEnabled,
				rate_limit_per_minute: rateLimit
			});
			successMessage = 'Settings saved successfully';
			newApiKey = '';
			await settings.refresh();
		} catch (e: any) {
			errorMessage = e.message || 'Failed to save settings';
		} finally {
			isUpdating = false;
		}
	}

	async function handleAddCredits() {
		clearMessages();
		if (creditsToAdd < 1) return;
		isUpdating = true;
		try {
			const result = await addAICredits({ amount: creditsToAdd, reason: 'Manual addition' });
			successMessage = `Added ${formatNumber(creditsToAdd)} credits. New balance: ${formatNumber(result.newBalance)}`;
			await settings.refresh();
		} catch (e: any) {
			errorMessage = e.message || 'Failed to add credits';
		} finally {
			isUpdating = false;
		}
	}

	async function handleRotateKey() {
		clearMessages();
		if (!newApiKey) {
			errorMessage = 'Please enter a new API key';
			return;
		}
		isUpdating = true;
		try {
			await rotateAPIKey({ newKey: newApiKey });
			successMessage = 'API key rotated successfully';
			newApiKey = '';
			await settings.refresh();
		} catch (e: any) {
			errorMessage = e.message || 'Failed to rotate API key';
		} finally {
			isUpdating = false;
		}
	}

	async function handleDeleteKey() {
		clearMessages();
		if (!confirm('Are you sure you want to delete the API key? This will disable AI features.')) return;
		isUpdating = true;
		try {
			await deleteAPIKey();
			successMessage = 'API key deleted and AI features disabled';
			await settings.refresh();
		} catch (e: any) {
			errorMessage = e.message || 'Failed to delete API key';
		} finally {
			isUpdating = false;
		}
	}
</script>

<svelte:head>
	<title>AI Settings | Admin Dashboard</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold tracking-tight flex items-center gap-3">
				<Bot class="w-8 h-8 text-primary" />
				AI Settings
			</h1>
			<p class="text-muted-foreground mt-1">
				Configure Nano Banana AI integration for template generation
			</p>
		</div>
	</div>

	<!-- Messages -->
	{#if successMessage}
		<div class="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg flex items-center gap-2">
			<Sparkles class="w-4 h-4" />
			{successMessage}
			<button class="ml-auto text-green-600 hover:text-green-800" onclick={() => successMessage = ''}>×</button>
		</div>
	{/if}

	{#if errorMessage}
		<div class="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg flex items-center gap-2">
			<AlertTriangle class="w-4 h-4" />
			{errorMessage}
			<button class="ml-auto text-red-600 hover:text-red-800" onclick={() => errorMessage = ''}>×</button>
		</div>
	{/if}

	<!-- Overview Stats -->
	{#await settings}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{#each Array(4) as _}
				<Card>
					<CardHeader class="pb-2">
						<div class="h-4 w-24 bg-muted animate-pulse rounded"></div>
						<div class="h-8 w-16 bg-muted animate-pulse rounded mt-2"></div>
					</CardHeader>
				</Card>
			{/each}
		</div>
	{:then settingsData}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<Card>
				<CardHeader class="pb-2">
					<CardDescription class="flex items-center gap-2">
						<Key class="w-4 h-4" />
						API Status
					</CardDescription>
					<CardTitle class="text-2xl">
						{#if settingsData?.apiKeyLastFour}
							<span class="text-green-600">Connected</span>
						{:else}
							<span class="text-amber-600">Not Configured</span>
						{/if}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-xs text-muted-foreground">
						{#if settingsData?.apiKeyLastFour}
							Key ending in ...{settingsData.apiKeyLastFour}
						{:else}
							Add an API key to enable AI features
						{/if}
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="pb-2">
					<CardDescription class="flex items-center gap-2">
						<Sparkles class="w-4 h-4" />
						AI Credits Balance
					</CardDescription>
					<CardTitle class="text-2xl">{formatNumber(settingsData?.creditsBalance || 0)}</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-xs text-muted-foreground">
						{formatNumber(settingsData?.creditsUsed || 0)} used total
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="pb-2">
					<CardDescription class="flex items-center gap-2">
						<Bot class="w-4 h-4" />
						Provider
					</CardDescription>
					<CardTitle class="text-2xl capitalize">{settingsData?.provider || 'Not Set'}</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-xs text-muted-foreground">
						Model: {settingsData?.model || 'default'}
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="pb-2">
					<CardDescription class="flex items-center gap-2">
						<Settings class="w-4 h-4" />
						Status
					</CardDescription>
					<CardTitle class="text-2xl">
						{#if settingsData?.isEnabled}
							<span class="text-green-600">Enabled</span>
						{:else}
							<span class="text-red-600">Disabled</span>
						{/if}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-xs text-muted-foreground">
						Rate limit: {settingsData?.rateLimitPerMinute || 60}/min
					</p>
				</CardContent>
			</Card>
		</div>
	{/await}

	<!-- Tabs -->
	<Tabs.Root bind:value={activeTab}>
		<Tabs.List>
			<Tabs.Trigger value="overview">Overview</Tabs.Trigger>
			<Tabs.Trigger value="api-key">API Key</Tabs.Trigger>
			<Tabs.Trigger value="credits">Credits</Tabs.Trigger>
			<Tabs.Trigger value="config">Configuration</Tabs.Trigger>
		</Tabs.List>

		<!-- Overview Tab -->
		<Tabs.Content value="overview" class="mt-6">
			{#await usage}
				<Card><CardContent class="pt-6"><p class="text-muted-foreground">Loading usage stats...</p></CardContent></Card>
			{:then usageData}
				<div class="grid gap-6 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Usage Summary</CardTitle>
							<CardDescription>AI generation statistics</CardDescription>
						</CardHeader>
						<CardContent class="space-y-4">
							<div class="flex justify-between">
								<span class="text-muted-foreground">Total Generations</span>
								<span class="font-semibold">{formatNumber(usageData.totalGenerations)}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-muted-foreground">This Month</span>
								<span class="font-semibold text-blue-600">{formatNumber(usageData.generationsThisMonth)}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-muted-foreground">Credits Used (Month)</span>
								<span class="font-semibold text-amber-600">{formatNumber(usageData.creditsUsedThisMonth)}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-muted-foreground">Avg Credits/Generation</span>
								<span class="font-semibold">{usageData.averageCreditsPerGeneration.toFixed(1)}</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle class="flex items-center gap-2">
								<Users class="w-5 h-5" />
								Top AI Users
							</CardTitle>
							<CardDescription>Users with most AI generations</CardDescription>
						</CardHeader>
						<CardContent>
							{#if usageData.topUsers.length > 0}
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>User</TableHead>
											<TableHead class="text-right">Generations</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{#each usageData.topUsers as user}
											<TableRow>
												<TableCell class="truncate max-w-[200px]">{user.email}</TableCell>
												<TableCell class="text-right font-medium">{formatNumber(user.count)}</TableCell>
											</TableRow>
										{/each}
									</TableBody>
								</Table>
							{:else}
								<p class="text-sm text-muted-foreground py-4 text-center">No AI usage data yet</p>
							{/if}
						</CardContent>
					</Card>
				</div>
			{/await}
		</Tabs.Content>

		<!-- API Key Tab -->
		<Tabs.Content value="api-key" class="mt-6">
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Key class="w-5 h-5" />
						API Key Management
					</CardTitle>
					<CardDescription>
						Manage your Nano Banana API key. Keep this key secure.
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-6">
					{#await settings then settingsData}
						{#if settingsData?.apiKeyMasked}
							<div class="space-y-2">
								<span class="text-sm font-medium">Current API Key</span>
								<div class="flex items-center gap-2">
									<div class="flex-1 font-mono text-sm bg-muted px-3 py-2 rounded">
										{showApiKey ? settingsData.apiKeyMasked : '••••••••••••••••••••••••••••••••' + settingsData.apiKeyLastFour}
									</div>
									<Button variant="outline" size="sm" onclick={() => showApiKey = !showApiKey}>
										{#if showApiKey}
											<EyeOff class="w-4 h-4" />
										{:else}
											<Eye class="w-4 h-4" />
										{/if}
									</Button>
								</div>
							</div>
						{/if}
					{/await}

					<div class="space-y-2">
						<span class="text-sm font-medium">{$effect.tracking() ? 'New' : 'New'} API Key</span>
						<Input
							type="password"
							placeholder="Enter new API key..."
							bind:value={newApiKey}
						/>
						<p class="text-xs text-muted-foreground">
							Get your API key from <a href="https://nanobanana.com" target="_blank" rel="noopener" class="text-primary hover:underline">nanobanana.com</a>
						</p>
					</div>

					<div class="flex gap-2 flex-wrap">
						<Button onclick={handleRotateKey} disabled={isUpdating || !newApiKey}>
							<RefreshCw class="w-4 h-4 mr-2" />
							{isUpdating ? 'Saving...' : 'Save API Key'}
						</Button>
						{#await settings then settingsData}
							{#if settingsData?.apiKeyLastFour}
								<Button variant="destructive" onclick={handleDeleteKey} disabled={isUpdating}>
									<Trash2 class="w-4 h-4 mr-2" />
									Delete Key
								</Button>
							{/if}
						{/await}
					</div>
				</CardContent>
			</Card>
		</Tabs.Content>

		<!-- Credits Tab -->
		<Tabs.Content value="credits" class="mt-6">
			<div class="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<Sparkles class="w-5 h-5" />
							Credit Balance
						</CardTitle>
						<CardDescription>
							AI credits are consumed when generating templates
						</CardDescription>
					</CardHeader>
					<CardContent>
						{#await settings then settingsData}
							<div class="text-center py-4">
								<p class="text-5xl font-bold text-primary">{formatNumber(settingsData?.creditsBalance || 0)}</p>
								<p class="text-sm text-muted-foreground mt-2">credits available</p>
							</div>
							<div class="text-sm text-muted-foreground text-center">
								Total used: {formatNumber(settingsData?.creditsUsed || 0)}
							</div>
						{/await}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<Plus class="w-5 h-5" />
							Add Credits
						</CardTitle>
						<CardDescription>
							Manually add AI credits to your balance
						</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="space-y-2">
							<span class="text-sm font-medium">Amount to Add</span>
							<Input
								type="number"
								min="1"
								bind:value={creditsToAdd}
							/>
						</div>
						<div class="flex gap-2">
							{#each [100, 500, 1000] as amount}
								<Button variant="outline" size="sm" onclick={() => creditsToAdd = amount}>
									+{formatNumber(amount)}
								</Button>
							{/each}
						</div>
						<Button class="w-full" onclick={handleAddCredits} disabled={isUpdating}>
							<Plus class="w-4 h-4 mr-2" />
							{isUpdating ? 'Adding...' : `Add ${formatNumber(creditsToAdd)} Credits`}
						</Button>
					</CardContent>
				</Card>
			</div>
		</Tabs.Content>

		<!-- Configuration Tab -->
		<Tabs.Content value="config" class="mt-6">
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Settings class="w-5 h-5" />
						AI Configuration
					</CardTitle>
					<CardDescription>
						Configure AI provider settings and rate limits
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-6">
					<div class="grid gap-4 md:grid-cols-2">
						<div class="space-y-2">
							<span class="text-sm font-medium">Provider</span>
							<select
								class="w-full px-3 py-2 border rounded-md bg-background"
								bind:value={provider}
							>
								<option value="nano_banana">Nano Banana</option>
								<option value="openai" disabled>OpenAI (Coming Soon)</option>
								<option value="anthropic" disabled>Anthropic (Coming Soon)</option>
							</select>
						</div>

						<div class="space-y-2">
							<span class="text-sm font-medium">Model</span>
							<select
								class="w-full px-3 py-2 border rounded-md bg-background"
								bind:value={model}
							>
								<option value="default">Default</option>
								<option value="fast">Fast (Lower Quality)</option>
								<option value="quality">Quality (Slower)</option>
							</select>
						</div>

						<div class="space-y-2">
							<span class="text-sm font-medium">Rate Limit (per minute)</span>
							<Input
								type="number"
								min="1"
								max="1000"
								bind:value={rateLimit}
							/>
						</div>

						<div class="space-y-2">
							<span class="text-sm font-medium">Status</span>
							<div class="flex items-center gap-3 pt-2">
								<button
									class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {isEnabled ? 'bg-primary' : 'bg-muted'}"
									onclick={() => isEnabled = !isEnabled}
									aria-label="Toggle AI features"
								>
									<span
										class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {isEnabled ? 'translate-x-6' : 'translate-x-1'}"
									></span>
								</button>
								<span class="text-sm">{isEnabled ? 'Enabled' : 'Disabled'}</span>
							</div>
						</div>
					</div>

					<Button onclick={handleSaveSettings} disabled={isUpdating}>
						{isUpdating ? 'Saving...' : 'Save Configuration'}
					</Button>
				</CardContent>
			</Card>
		</Tabs.Content>
	</Tabs.Root>
</div>
