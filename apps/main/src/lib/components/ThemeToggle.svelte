<script lang="ts">
	import { Sun, Moon, Monitor } from 'lucide-svelte';
	import { theme, type Theme } from '$lib/stores/theme';
	
	let showDropdown = $state(false);
	
	const themes: { value: Theme; label: string; icon: any }[] = [
		{ value: 'light', label: 'Light', icon: Sun },
		{ value: 'dark', label: 'Dark', icon: Moon },
		{ value: 'auto', label: 'System', icon: Monitor }
	];
	
	function toggleTheme() {
		showDropdown = !showDropdown;
	}
	
	function selectTheme(selectedTheme: Theme) {
		theme.set(selectedTheme);
		showDropdown = false;
	}
	
	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as Element;
		if (!target.closest('.theme-toggle')) {
			showDropdown = false;
		}
	}
</script>

<svelte:document onclick={handleClickOutside} />

<div class="theme-toggle relative">
	<button
		onclick={toggleTheme}
		class="btn-secondary relative p-3 rounded-full transition-all duration-200 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
		aria-label="Toggle theme"
		aria-expanded={showDropdown}
	>
		{#if $theme === 'light'}
			<Sun class="h-5 w-5 text-foreground" />
		{:else if $theme === 'dark'}
			<Moon class="h-5 w-5 text-foreground" />
		{:else}
			<Monitor class="h-5 w-5 text-foreground" />
		{/if}
		
		<!-- Animated background effect -->
		<div 
			class="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 opacity-0 transition-opacity duration-300 hover:opacity-100"
		></div>
	</button>
	
	{#if showDropdown}
		<div class="absolute right-0 top-full mt-2 w-36 bg-card border border-border rounded-lg shadow-lg z-50 animate-scale-in">
			<div class="p-1">
				{#each themes as themeOption}
					{@const IconComponent = themeOption.icon}
					<button
						onclick={() => selectTheme(themeOption.value)}
						class="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors duration-150 {$theme === themeOption.value ? 'bg-accent text-accent-foreground' : ''}"
					>
						<IconComponent class="h-4 w-4" />
						{themeOption.label}
						{#if $theme === themeOption.value}
							<div class="ml-auto h-1.5 w-1.5 rounded-full bg-primary"></div>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	@keyframes scale-in {
		0% {
			opacity: 0;
			transform: scale(0.95);
		}
		100% {
			opacity: 1;
			transform: scale(1);
		}
	}
	
	.animate-scale-in {
		animation: scale-in 0.1s ease-out;
	}
</style>