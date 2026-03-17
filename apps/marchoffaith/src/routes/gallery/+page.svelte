<script lang="ts">
	import type { PageData } from './$types';
	import Hero from '$lib/components/Hero.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Photo Gallery - March of Faith Incorporated</title>
	<meta name="description" content="Browse photo galleries from March of Faith Incorporated events, services, and community gatherings in Bohol." />
	<meta property="og:title" content="Photo Gallery - March of Faith Incorporated" />
	<meta property="og:description" content="Browse photo galleries from March of Faith Incorporated events, services, and community gatherings in Bohol." />
	<meta name="twitter:title" content="Photo Gallery - March of Faith Incorporated" />
	<meta name="twitter:description" content="Browse photo galleries from March of Faith Incorporated." />
</svelte:head>

<Hero subtitle="Moments of faith, fellowship, and community">
	Photo Gallery
</Hero>

<section class="gallery-section">
	<div class="container">
		{#if data.galleries.length === 0}
			<div class="empty-state">
				<p>No galleries available yet. Check back soon!</p>
			</div>
		{:else}
			<div class="gallery-grid">
				{#each data.galleries as gallery}
					<a href="/gallery/{gallery.slug}" class="gallery-card">
						<div class="gallery-image-container">
							{#if gallery.coverImageUrl}
								<img
									src={gallery.coverImageUrl}
									alt={gallery.title}
									class="gallery-image"
									loading="lazy"
								/>
							{:else}
								<div class="gallery-placeholder">
									<span>No Cover Image</span>
								</div>
							{/if}
							<div class="gallery-overlay">
								<span class="image-count">{gallery.imageCount} photo{gallery.imageCount === 1 ? '' : 's'}</span>
							</div>
						</div>
						<div class="gallery-info">
							{#if gallery.date}
								<time class="gallery-date">{gallery.date}</time>
							{/if}
							<h2 class="gallery-title">{gallery.title}</h2>
							{#if gallery.description}
								<p class="gallery-description">{gallery.description}</p>
							{/if}
							<span class="view-gallery">View Gallery &rarr;</span>
						</div>
					</a>
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

	.gallery-section {
		padding: 4rem 0;
		background: #f8fafc;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		color: #6b7280;
		font-family: 'Montserrat', sans-serif;
	}

	.gallery-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 2rem;
	}

	.gallery-card {
		background: white;
		border-radius: 16px;
		overflow: hidden;
		transition: transform 0.3s ease, box-shadow 0.3s ease;
		border: 1px solid rgba(0, 0, 0, 0.04);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
		text-decoration: none;
		color: inherit;
		display: block;
	}

	.gallery-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
	}

	.gallery-image-container {
		position: relative;
		padding-top: 66.67%; /* 3:2 ratio */
		overflow: hidden;
	}

	.gallery-image {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.5s ease;
	}

	.gallery-card:hover .gallery-image {
		transform: scale(1.05);
	}

	.gallery-placeholder {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: #e5e7eb;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #9ca3af;
		font-family: 'Montserrat', sans-serif;
		font-size: 0.875rem;
	}

	.gallery-overlay {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
		padding: 2rem 1rem 1rem;
		display: flex;
		justify-content: flex-end;
	}

	.image-count {
		background: rgba(255, 255, 255, 0.9);
		color: #333;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.75rem;
		font-weight: 600;
		font-family: 'Montserrat', sans-serif;
	}

	.gallery-info {
		padding: 1.5rem;
	}

	.gallery-date {
		display: block;
		color: #6b7280;
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
		font-family: 'Montserrat', sans-serif;
	}

	.gallery-title {
		font-size: 1.25rem;
		font-weight: 700;
		margin: 0 0 0.5rem;
		line-height: 1.4;
		font-family: 'Montserrat', sans-serif;
		color: #1f2937;
	}

	.gallery-description {
		color: #4b5563;
		margin-bottom: 1rem;
		line-height: 1.6;
		font-family: 'Montserrat', sans-serif;
		font-size: 0.9rem;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.view-gallery {
		color: var(--accent-color);
		font-weight: 600;
		font-family: 'Montserrat', sans-serif;
		transition: margin-left 0.2s ease;
	}

	.gallery-card:hover .view-gallery {
		margin-left: 0.25rem;
	}

	@media (max-width: 768px) {
		.gallery-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
