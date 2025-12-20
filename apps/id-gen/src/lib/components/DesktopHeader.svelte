<script lang="ts">
	import { Bell, Wallet, Sparkles, Loader2, AlertCircle } from 'lucide-svelte';
	import SearchTrigger from './SearchTrigger.svelte';
	import CreditsDisplay from './ui/CreditsDisplay.svelte';
	import { Button } from './ui/button';
	import UserDropdown from './UserDropdown.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import { aiModelStore } from '$lib/stores/aiModel';

	let { user, class: className = '' } = $props();

	let aiState = $derived($aiModelStore);
</script>

<header class="hidden lg:block bg-background border-b border-border sticky top-0 z-50 {className}">
	<div class="h-16 px-6 flex items-center justify-between">
		<!-- Left: Logo + Search -->
		<div class="flex items-center gap-6 flex-1">
			<!-- Logo -->
			<a href="/" class="flex items-center gap-3">
				<div class="flex items-center gap-2">
					<span class="text-2xl font-normal text-foreground/80">ᜃ</span>
					<span class="text-xl font-black tracking-tight text-foreground">Kanaya</span>
				</div>
			</a>

			<!-- Search - Desktop optimized -->
			<div class="flex-1 max-w-md">
				<SearchTrigger />
			</div>
		</div>

		<!-- Right: Actions + User -->
		<div class="flex items-center gap-4">
			<!-- Notifications -->
			<Button variant="ghost" size="icon" aria-label="Notifications">
				<Bell class="h-5 w-5 text-muted-foreground" />
			</Button>

			<!-- Notifications -->
			<Button variant="ghost" size="icon" aria-label="Notifications">
				<Bell class="h-5 w-5 text-muted-foreground" />
			</Button>

			<!-- AI Status Indicator -->
			<div
				class="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-muted/30 text-xs font-medium transition-colors"
				class:border-green-500-20={aiState.status === 'ready'}
				class:bg-green-500-10={aiState.status === 'ready'}
				class:text-green-600={aiState.status === 'ready'}
				class:dark-text-green-400={aiState.status === 'ready'}
			>
				{#if aiState.status === 'loading'}
					<Loader2 class="h-3.5 w-3.5 animate-spin text-blue-500" />
					<span class="text-xs text-muted-foreground">AI Loading {aiState.progress}%</span>
				{:else if aiState.status === 'ready'}
					<Sparkles class="h-3.5 w-3.5 text-green-500" />
					<span class="hidden xl:inline text-green-600 dark:text-green-400">AI Ready</span>
				{:else if aiState.status === 'error'}
					<AlertCircle class="h-3.5 w-3.5 text-red-500" />
					<span class="hidden xl:inline text-red-500">AI Error</span>
				{:else}
					<Sparkles class="h-3.5 w-3.5 text-muted-foreground/50" />
				{/if}
			</div>

			<!-- Theme Toggle -->
			<ThemeToggle variant="ghost" />

			<!-- Credits -->
			<CreditsDisplay {user} />

			<!-- User Menu -->
			<UserDropdown {user} />
		</div>
	</div>
</header>
