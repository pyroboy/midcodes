<script lang="ts">
    import { page } from '$app/stores';
    import type { Snippet } from 'svelte';

    interface Props {
        children: Snippet;
    }

    let { children }: Props = $props();

    const reportLinks = [
        { slug: 'electricity', icon: '⚡', title: 'Electricity' },
        { slug: 'water', icon: '💧', title: 'Water' },
        { slug: 'population', icon: '👥', title: 'Population' },
        { slug: 'contracts', icon: '📄', title: 'Contracts' },
        { slug: 'revenue', icon: '💰', title: 'Revenue' },
        { slug: 'rents', icon: '🏠', title: 'Rents' },
        { slug: 'monthly', icon: '📅', title: 'Monthly' },
        { slug: 'projects', icon: '🔧', title: 'Projects' }
    ];

    let currentSlug = $derived($page.url.pathname.split('/').pop() || '');
</script>

<div class="report-layout">
    <aside class="sidebar">
        <a href="/" class="back-link">← Back to Home</a>
        <h2>Reports</h2>
        <nav class="report-nav">
            {#each reportLinks as report}
                <a href="/docs/reports/{report.slug}" 
                   class:active={report.slug === currentSlug}>
                    <span class="report-icon">{report.icon}</span>
                    <span class="report-title">{report.title}</span>
                </a>
            {/each}
        </nav>
    </aside>

    <main class="content">
        {@render children()}
    </main>
</div>

<style>
    .report-layout {
        display: grid;
        grid-template-columns: 260px 1fr;
        min-height: 100vh;
    }

    @media (max-width: 768px) {
        .report-layout {
            grid-template-columns: 1fr;
        }
        .sidebar {
            position: relative;
            border-right: none;
            border-bottom: 2px solid var(--color-primary);
        }
    }

    .sidebar {
        background: white;
        border-right: 2px solid var(--color-primary);
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
        border-bottom: 3px solid var(--color-primary);
        color: var(--color-primary);
    }

    .report-nav {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .report-nav a {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-radius: 0;
        transition: all 0.15s;
        border-left: 3px solid transparent;
    }

    .report-nav a:hover {
        background: var(--color-gray-100);
        border-left-color: var(--color-primary);
    }

    .report-nav a.active {
        background: var(--color-primary);
        color: white;
        border-left-color: var(--color-black);
    }

    .report-icon {
        font-size: 1.25rem;
    }

    .report-title {
        font-size: 1rem;
        font-weight: 600;
    }

    .content {
        padding: 3rem 4rem;
        max-width: 1100px;
        overflow-x: auto;
    }

    @media (max-width: 768px) {
        .content {
            padding: 2rem;
        }
    }
</style>
