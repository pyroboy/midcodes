<script lang="ts">
	import { navigating } from '$app/stores';
	import { fade } from 'svelte/transition';

	// Import page-specific skeletons (not home - it uses the 3D scene's built-in loader)
	import AllIdsPageSkeleton from './skeletons/AllIdsPageSkeleton.svelte';
	import TemplatesPageSkeleton from './skeletons/TemplatesPageSkeleton.svelte';
	import AccountPageSkeleton from './skeletons/AccountPageSkeleton.svelte';
	import PricingPageSkeleton from './skeletons/PricingPageSkeleton.svelte';

	// Determine which skeleton to show based on navigation target
	let targetPath = $derived($navigating?.to?.url?.pathname || '');
	let isNavigating = $derived(!!$navigating);

	// Map routes to their skeleton types
	// Note: Home page (/) returns null to only show the loading bar, not a skeleton
	// The 3D scene on the home page has its own loading indicator
	function getSkeletonType(path: string): string | null {
		// Home page: no skeleton, only top loading bar (3D scene has its own loader)
		if (path === '/') return null;
		if (path === '/all-ids' || path.startsWith('/all-ids')) return 'all-ids';
		if (path === '/templates' || path.startsWith('/templates')) return 'templates';
		if (path === '/account' || path.startsWith('/account')) return 'account';
		if (path === '/pricing' || path.startsWith('/pricing')) return 'pricing';
		return null;
	}

	let skeletonType = $derived(getSkeletonType(targetPath));
</script>

{#if isNavigating}
	<!-- Loading bar at top of content area - shown for ALL page navigations -->
	<div class="fixed top-16 left-0 lg:left-64 right-0 h-1 bg-muted z-40 overflow-hidden">
		<div class="h-full bg-primary animate-loading-bar"></div>
	</div>

	<!-- Skeleton overlay - only shown for pages with a skeleton type -->
	{#if skeletonType}
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
			{/if}
		</div>
	{/if}
{/if}

<style>
	@keyframes loading-bar {
		0% {
			width: 0%;
			margin-left: 0;
		}
		50% {
			width: 50%;
			margin-left: 25%;
		}
		100% {
			width: 0%;
			margin-left: 100%;
		}
	}

	.animate-loading-bar {
		animation: loading-bar 1.5s ease-in-out infinite;
	}
</style>
