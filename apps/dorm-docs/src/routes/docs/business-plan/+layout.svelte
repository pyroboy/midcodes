<script lang="ts">
    import { page } from '$app/stores';
    import { chapters } from './chapters';
    import type { Snippet } from 'svelte';

    interface Props {
        children: Snippet;
    }

    let { children }: Props = $props();

    let currentSlug = $derived($page.url.pathname.split('/').pop() || '');
    let currentChapter = $derived(chapters.find(c => c.slug === currentSlug));
    let currentIndex = $derived(chapters.findIndex(c => c.slug === currentSlug));
    let prevChapter = $derived(currentIndex > 0 ? chapters[currentIndex - 1] : null);
    let nextChapter = $derived(currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null);
</script>

<div class="doc-layout">
    <aside class="sidebar">
        <a href="/" class="back-link">← Back to Home</a>
        <h2>Business Plan</h2>
        <nav class="chapter-nav">
            {#each chapters as chapter}
                <a href="/docs/business-plan/{chapter.slug}" 
                   class:active={chapter.slug === currentSlug}>
                    <span class="chapter-num">{chapter.number}</span>
                    <span class="chapter-title">{chapter.title}</span>
                </a>
            {/each}
        </nav>
    </aside>

    <main class="content">
        {@render children()}
        
        {#if currentChapter}
        <nav class="chapter-pagination">
            {#if prevChapter}
            <a href="/docs/business-plan/{prevChapter.slug}" class="nav-prev">
                <span class="nav-label">Previous</span>
                <span class="nav-title">{prevChapter.number} // {prevChapter.title}</span>
            </a>
            {:else}
            <div></div>
            {/if}
            
            {#if nextChapter}
            <a href="/docs/business-plan/{nextChapter.slug}" class="nav-next">
                <span class="nav-label">Next</span>
                <span class="nav-title">{nextChapter.number} // {nextChapter.title}</span>
            </a>
            {/if}
        </nav>
        {/if}
    </main>
</div>

<style>
    .doc-layout {
        display: grid;
        grid-template-columns: 280px 1fr;
        min-height: 100vh;
    }

    @media (max-width: 768px) {
        .doc-layout {
            grid-template-columns: 1fr;
        }
        .sidebar {
            position: relative;
            border-right: none;
            border-bottom: 2px solid var(--color-black);
        }
    }

    .sidebar {
        background: white;
        border-right: 2px solid var(--color-black);
        padding: 2rem;
        position: sticky;
        top: 0;
        height: 100vh;
        overflow-y: auto;
    }

    .back-link {
        display: inline-block;
        font-size: 0.9rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
        color: var(--color-primary);
        transition: all 0.2s;
    }
    .back-link:hover {
        padding-left: 0.5rem;
    }

    .sidebar h2 {
        font-size: 1.75rem;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 3px solid var(--color-black);
    }

    .chapter-nav {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .chapter-nav a {
        display: flex;
        align-items: baseline;
        gap: 0.75rem;
        padding: 0.75rem;
        border-radius: 0;
        transition: all 0.15s;
        border-left: 3px solid transparent;
    }

    .chapter-nav a:hover {
        background: var(--color-gray-100);
        border-left-color: var(--color-primary);
    }

    .chapter-nav a.active {
        background: var(--color-black);
        color: white;
        border-left-color: var(--color-primary);
    }

    .chapter-num {
        font-family: var(--font-header);
        font-weight: 700;
        font-size: 0.9rem;
        opacity: 0.6;
    }

    .chapter-title {
        font-size: 0.95rem;
        font-weight: 500;
    }

    .content {
        padding: 3rem 4rem;
        max-width: 900px;
    }

    @media (max-width: 768px) {
        .content {
            padding: 2rem;
        }
    }

    .chapter-pagination {
        display: flex;
        justify-content: space-between;
        margin-top: 4rem;
        padding-top: 2rem;
        border-top: 2px solid var(--color-gray-200);
    }

    .nav-prev, .nav-next {
        display: flex;
        flex-direction: column;
        padding: 1rem 1.5rem;
        border: 2px solid var(--color-black);
        transition: all 0.2s;
    }

    .nav-next {
        text-align: right;
    }

    .nav-prev:hover, .nav-next:hover {
        background: var(--color-black);
        color: white;
    }

    .nav-label {
        font-size: 0.8rem;
        text-transform: uppercase;
        font-weight: 700;
        opacity: 0.6;
        margin-bottom: 0.25rem;
    }

    .nav-title {
        font-family: var(--font-header);
        font-size: 1.1rem;
        font-weight: 600;
    }
</style>
