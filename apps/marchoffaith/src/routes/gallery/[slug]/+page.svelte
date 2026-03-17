<script lang="ts">
	import type { PageData } from './$types';
	import Hero from '$lib/components/Hero.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.gallery.title} - Photo Gallery - March of Faith Incorporated</title>
	<meta name="description" content={data.gallery.description ?? `Photo gallery: ${data.gallery.title} from March of Faith Incorporated.`} />
	<meta property="og:title" content="{data.gallery.title} - March of Faith Incorporated" />
	<meta property="og:description" content={data.gallery.description ?? `Photo gallery: ${data.gallery.title}`} />
	{#if data.gallery.coverImageUrl}
		<meta property="og:image" content={data.gallery.coverImageUrl} />
	{/if}
</svelte:head>

<Hero subtitle={data.gallery.date ?? 'March of Faith Incorporated'}>
	{data.gallery.title}
</Hero>

<section class="gallery-detail-section">
	<div class="container">
		<div class="gallery-header">
			<a href="/gallery" class="back-link">&larr; Back to Gallery</a>
			{#if data.gallery.description}
				<p class="gallery-description">{data.gallery.description}</p>
			{/if}
		</div>

		{#if data.images.length === 0}
			<div class="empty-state">
				<p>No photos in this gallery yet.</p>
			</div>
		{:else}
			<div class="masonry-grid">
				{#each data.images as image}
					<div class="masonry-item">
						<img
							src={image.imageUrl}
							alt={image.caption ?? 'Gallery photo'}
							loading="lazy"
						/>
						{#if image.caption}
							<div class="caption-overlay">
								<p>{image.caption}</p>
							</div>
						{/if}
					</div>
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

	.gallery-detail-section {
		padding: 4rem 0;
		background: #f8fafc;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.gallery-header {
		margin-bottom: 2rem;
	}

	.back-link {
		display: inline-block;
		color: var(--accent-color);
		font-weight: 600;
		font-family: 'Montserrat', sans-serif;
		text-decoration: none;
		margin-bottom: 1rem;
		transition: color 0.2s ease;
	}

	.back-link:hover {
		color: var(--primary-color);
	}

	.gallery-description {
		color: #4b5563;
		line-height: 1.7;
		font-family: 'Montserrat', sans-serif;
		font-size: 1.05rem;
		max-width: 700px;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		color: #6b7280;
		font-family: 'Montserrat', sans-serif;
	}

	.masonry-grid {
		columns: 3;
		column-gap: 1rem;
	}

	.masonry-item {
		break-inside: avoid;
		margin-bottom: 1rem;
		border-radius: 12px;
		overflow: hidden;
		position: relative;
		background: white;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
	}

	.masonry-item img {
		display: block;
		width: 100%;
		height: auto;
	}

	.caption-overlay {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
		padding: 2rem 1rem 1rem;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.masonry-item:hover .caption-overlay {
		opacity: 1;
	}

	.caption-overlay p {
		color: white;
		font-family: 'Montserrat', sans-serif;
		font-size: 0.875rem;
		line-height: 1.4;
		margin: 0;
	}

	@media (max-width: 900px) {
		.masonry-grid {
			columns: 2;
		}
	}

	@media (max-width: 600px) {
		.masonry-grid {
			columns: 1;
		}
	}
</style>
