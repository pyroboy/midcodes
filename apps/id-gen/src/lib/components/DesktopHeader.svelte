<script lang="ts">
	import { Bell, Wallet } from 'lucide-svelte';
	import SearchTrigger from './SearchTrigger.svelte';
	import CreditsDisplay from './ui/CreditsDisplay.svelte';
	import { Button } from './ui/button';
	import UserDropdown from './UserDropdown.svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	let { user, class: className = '' } = $props();
</script>

<header class="hidden lg:block bg-background border-b border-border sticky top-0 z-50 {className}">
	<div class="h-16 px-6 flex items-center justify-between">
		<!-- Left: Logo + Search -->
		<div class="flex items-center gap-6 flex-1">
			<!-- Logo -->
			<a href="/" class="flex items-center gap-3">
				<div class="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
					<Wallet class="h-6 w-6 text-primary-foreground" />
				</div>
				<span class="text-xl font-bold text-foreground"> ID Generator </span>
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

			<!-- Theme Toggle -->
			<ThemeToggle variant="ghost" />

			<!-- Credits -->
			<CreditsDisplay {user} />

			<!-- User Menu -->
			<UserDropdown {user} />
		</div>
	</div>
</header>
