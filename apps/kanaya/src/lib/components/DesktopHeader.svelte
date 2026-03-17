<script lang="ts">
	import SearchTrigger from './SearchTrigger.svelte';
	import CreditsDisplay from './ui/CreditsDisplay.svelte';
	import UserDropdown from './UserDropdown.svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	let { user, class: className = '' } = $props();
</script>

<header class="hidden lg:block bg-background border-b border-border sticky top-0 z-50 {className}">
	<div class="h-16 px-6 flex items-center justify-between">
		<!-- Left: Logo + Search -->
		<div class="flex items-center gap-6 flex-1">
			<!-- Logo -->
			<a href="/dashboard" class="flex items-center gap-3">
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
			<!-- Theme Toggle -->
			<ThemeToggle variant="ghost" />

			<!-- Credits -->
			<CreditsDisplay {user} />

			<!-- User Menu -->
			<UserDropdown {user} />
		</div>
	</div>
</header>
