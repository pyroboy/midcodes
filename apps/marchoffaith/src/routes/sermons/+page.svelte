<script lang="ts">
	import type { PageData } from './$types';
	import Hero from '$lib/components/Hero.svelte';

	let { data }: { data: PageData } = $props();

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr + 'T00:00:00');
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function truncate(text: string | null, maxLength: number): string {
		if (!text) return '';
		if (text.length <= maxLength) return text;
		return text.slice(0, maxLength).trimEnd() + '...';
	}
</script>

<svelte:head>
	<title>Sermons & Devotions - March of Faith Incorporated</title>
	<meta name="description" content="Watch and listen to sermons and devotions from March of Faith Incorporated. Grow in faith through the Word of God." />
	<meta property="og:title" content="Sermons & Devotions - March of Faith Incorporated" />
	<meta property="og:description" content="Watch and listen to sermons and devotions from March of Faith Incorporated." />
	<meta name="twitter:title" content="Sermons & Devotions - March of Faith Incorporated" />
	<meta name="twitter:description" content="Watch and listen to sermons from March of Faith Incorporated." />
</svelte:head>

<Hero subtitle="Grow in faith through the Word of God">
	Sermons & Devotions
</Hero>

<section class="sermons-section">
	<div class="container">
		{#if data.sermons.length === 0}
			<div class="empty-state">
				<div class="empty-icon">
					<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
						<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
					</svg>
				</div>
				<h2 class="empty-title">Sermons coming soon. Stay tuned!</h2>
				<p class="empty-text">We are preparing our sermon archive. Check back soon for messages from our pastors.</p>
			</div>
		{:else}
			<div class="sermons-grid">
				{#each data.sermons as sermon}
					{@const hasVideo = !!sermon.videoUrl}
					{@const linkUrl = sermon.videoUrl || sermon.audioUrl}
					<article class="sermon-card">
						{#if linkUrl}
							<a href={linkUrl} target="_blank" rel="noopener noreferrer" class="sermon-card-link">
								<div class="sermon-image-container">
									{#if sermon.thumbnailUrl}
										<img
											src={sermon.thumbnailUrl}
											alt={sermon.title}
											class="sermon-image"
											loading="lazy"
										/>
									{:else}
										<div class="sermon-placeholder">
											<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
												<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
												<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
											</svg>
										</div>
									{/if}
									{#if hasVideo}
										<div class="play-overlay">
											<svg width="48" height="48" viewBox="0 0 24 24" fill="white">
												<path d="M8 5v14l11-7z" />
											</svg>
										</div>
									{/if}
								</div>
								<div class="sermon-content">
									<time datetime={sermon.date} class="sermon-date">
										{formatDate(sermon.date)}
									</time>
									<h2 class="sermon-title">{sermon.title}</h2>
									<p class="sermon-speaker">{sermon.speaker}</p>
									{#if sermon.description}
										<p class="sermon-description">{truncate(sermon.description, 150)}</p>
									{/if}
									<span class="watch-link">
										{#if hasVideo}
											Watch Sermon
										{:else}
											Listen Now
										{/if}
										<span class="arrow">&rarr;</span>
									</span>
								</div>
							</a>
						{:else}
							<div class="sermon-card-link">
								<div class="sermon-image-container">
									{#if sermon.thumbnailUrl}
										<img
											src={sermon.thumbnailUrl}
											alt={sermon.title}
											class="sermon-image"
											loading="lazy"
										/>
									{:else}
										<div class="sermon-placeholder">
											<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
												<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
												<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
											</svg>
										</div>
									{/if}
								</div>
								<div class="sermon-content">
									<time datetime={sermon.date} class="sermon-date">
										{formatDate(sermon.date)}
									</time>
									<h2 class="sermon-title">{sermon.title}</h2>
									<p class="sermon-speaker">{sermon.speaker}</p>
									{#if sermon.description}
										<p class="sermon-description">{truncate(sermon.description, 150)}</p>
									{/if}
								</div>
							</div>
						{/if}
					</article>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
	:root {
		--primary-color: #981B1E;
		--accent-color: #C1272D;
	}

	.sermons-section {
		padding: 4rem 0;
		background: #f8fafc;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		color: #6b7280;
	}

	.empty-icon {
		margin-bottom: 1.5rem;
		color: #d1d5db;
	}

	.empty-title {
		font-family: 'Montserrat', sans-serif;
		font-size: 1.5rem;
		font-weight: 700;
		color: #374151;
		margin: 0 0 0.75rem;
	}

	.empty-text {
		font-size: 1rem;
		line-height: 1.6;
		max-width: 400px;
		margin: 0 auto;
	}

	/* Sermons Grid */
	.sermons-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 2rem;
	}

	.sermon-card {
		background: white;
		border-radius: 16px;
		overflow: hidden;
		transition: transform 0.3s ease, box-shadow 0.3s ease;
		border: 1px solid rgba(0, 0, 0, 0.04);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
	}

	.sermon-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
	}

	.sermon-card-link {
		text-decoration: none;
		color: inherit;
		display: block;
		height: 100%;
	}

	/* Image Container */
	.sermon-image-container {
		position: relative;
		padding-top: 56.25%;
		overflow: hidden;
		background: #f3f4f6;
	}

	.sermon-image {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.5s ease;
	}

	.sermon-card:hover .sermon-image {
		transform: scale(1.05);
	}

	.sermon-placeholder {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
		color: #9ca3af;
	}

	/* Play Overlay */
	.play-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.3);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.play-overlay svg {
		filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
		transition: transform 0.3s ease;
	}

	.sermon-card:hover .play-overlay {
		opacity: 1;
	}

	.sermon-card:hover .play-overlay svg {
		transform: scale(1.1);
	}

	/* Content */
	.sermon-content {
		padding: 1.5rem;
	}

	.sermon-date {
		display: block;
		color: #6b7280;
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
	}

	.sermon-title {
		font-family: 'Montserrat', sans-serif;
		font-size: 1.25rem;
		font-weight: 700;
		margin: 0 0 0.5rem;
		line-height: 1.4;
		color: #111827;
	}

	.sermon-speaker {
		color: var(--primary-color);
		font-weight: 600;
		font-size: 0.9rem;
		margin: 0 0 0.75rem;
	}

	.sermon-description {
		color: #4b5563;
		line-height: 1.6;
		font-size: 0.95rem;
		margin: 0 0 1rem;
	}

	.watch-link {
		color: var(--accent-color);
		font-weight: 600;
		font-size: 0.9rem;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		transition: all 0.2s ease;
	}

	.sermon-card:hover .watch-link .arrow {
		transform: translateX(4px);
	}

	.arrow {
		display: inline-block;
		transition: transform 0.2s ease;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.sermons-grid {
			grid-template-columns: 1fr;
		}

		.sermons-section {
			padding: 2rem 0;
		}
	}
</style>
