<script lang="ts">
	import { navigating } from '$app/stores';
	import { fade } from 'svelte/transition';
	
	// Import all page-specific skeletons
	import AllIdsPageSkeleton from './skeletons/AllIdsPageSkeleton.svelte';
	import TemplatesPageSkeleton from './skeletons/TemplatesPageSkeleton.svelte';
	import AccountPageSkeleton from './skeletons/AccountPageSkeleton.svelte';
	import PricingPageSkeleton from './skeletons/PricingPageSkeleton.svelte';
	import HomePageSkeleton from './skeletons/HomePageSkeleton.svelte';
	
	// Determine which skeleton to show based on navigation target
	let targetPath = $derived($navigating?.to?.url?.pathname || '');
	let isNavigating = $derived(!!$navigating);
	
	// Map routes to their skeleton types
	function getSkeletonType(path: string): string | null {
		if (path === '/') return 'home';
		if (path === '/all-ids' || path.startsWith('/all-ids')) return 'all-ids';
		if (path === '/templates' || path.startsWith('/templates')) return 'templates';
		if (path === '/account' || path.startsWith('/account')) return 'account';
		if (path === '/pricing' || path.startsWith('/pricing')) return 'pricing';
		return null;
	}
	
	let skeletonType = $derived(getSkeletonType(targetPath));
</script>

{#if isNavigating && skeletonType}
	<!-- Loading bar at top of content area -->
	<div class="fixed top-16 left-0 lg:left-64 right-0 h-1 bg-muted z-40 overflow-hidden">
		<div class="h-full bg-primary animate-loading-bar"></div>
	</div>
	
	<!-- Skeleton overlay - positioned to not cover header/footer -->
	<div 
		class="fixed top-16 lg:top-16 lg:left-64 left-0 right-0 bottom-16 lg:bottom-0 z-30 bg-background overflow-auto"
		transition:fade={{ duration: 100 }}
	>
		<!-- Show route-specific skeleton -->
		{#if skeletonType === 'all-ids'}
			<AllIdsPageSkeleton />
		{:else if skeletonType === 'templates'}
			<TemplatesPageSkeleton />
		{:else if skeletonType === 'account'}
			<AccountPageSkeleton />
		{:else if skeletonType === 'pricing'}
			<PricingPageSkeleton />
		{:else if skeletonType === 'home'}
			<HomePageSkeleton />
		{/if}
	</div>
{/if}

<style>
	@keyframes loading-bar {
		0% { width: 0%; margin-left: 0; }
		50% { width: 50%; margin-left: 25%; }
		100% { width: 0%; margin-left: 100%; }
	}
	
	.animate-loading-bar {
		animation: loading-bar 1.5s ease-in-out infinite;
	}
</style>
