<script lang="ts">
	import { page } from '$app/stores';
	import { chapters } from './chapters';

    let { children } = $props();

	let currentSlug = $derived($page.url.pathname.split('/').pop());
	let currentIndex = $derived(chapters.findIndex((c) => c.slug === currentSlug));

	let prev = $derived(chapters[currentIndex - 1]);
	let next = $derived(chapters[currentIndex + 1]);
</script>

<div class="bp-layout">
	<!-- Top Navigation for Chapters -->
	<nav class="chapter-nav">
		{#if prev}
			<a href="/docs/business-plan/{prev.slug}" class="nav-item prev">
				<span class="label">PREVIOUS</span>
				<span class="title">← {prev.title}</span>
			</a>
		{:else}
			<div class="nav-item empty"></div>
		{/if}

		<div class="nav-center">
			<a href="/" class="home-link">◆ DASHBOARD</a>
		</div>

		{#if next}
			<a href="/docs/business-plan/{next.slug}" class="nav-item next">
				<span class="label">NEXT</span>
				<span class="title">{next.title} →</span>
			</a>
		{:else}
			<div class="nav-item empty"></div>
		{/if}
	</nav>

	<div class="page-content">
		{@render children()}
	</div>
    
</div>

<style>
	.bp-layout {
		background-color: var(--color-gray-100);
		min-height: 100vh;
	}

	.chapter-nav {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		padding: 1rem 2rem;
		background: white;
		border-bottom: 2px solid var(--color-black);
		position: sticky;
		top: 0;
		z-index: 50;
        gap: 1rem;
	}

	.nav-item {
		display: flex;
		flex-direction: column;
		text-decoration: none;
		color: var(--color-gray-500);
		transition: all 0.2s;
        min-width: 0;
	}

	.nav-item:hover {
		color: var(--color-black);
	}
    
    .nav-item.prev { align-items: flex-start; }
    .nav-item.next { align-items: flex-end; text-align: right; }

	.nav-item .label {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		opacity: 0.6;
		margin-bottom: 2px;
	}

	.nav-item .title {
		font-size: 0.9rem;
		font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
	}

    .nav-center .home-link {
        font-size: 0.8rem;
        font-weight: 800;
        color: var(--color-gray-400);
        text-decoration: none;
        letter-spacing: 1px;
        padding: 0.5rem 1rem;
        border: 2px solid var(--color-gray-200);
        transition: all 0.2s;
    }
    .nav-center .home-link:hover {
        color: var(--color-black);
        border-color: var(--color-black);
        background: var(--color-gray-100);
    }

    @media (max-width: 640px) {
        .chapter-nav { padding: 0.75rem 1rem; }
        .nav-item .title { display: none; }
        .nav-center { display: none; }
    }
</style>
