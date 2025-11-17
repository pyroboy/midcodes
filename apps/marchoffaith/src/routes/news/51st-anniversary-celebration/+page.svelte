<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	// Carousel state
	let currentSlide = $state(0);
	let touchStartX = $state(0);
	let touchEndX = $state(0);

	// --- TYPE DEFINITIONS ---
	interface ArticleImage {
		url: string;
		alt: string;
		caption: string;
	}

	interface ParagraphBlock {
		type: 'paragraph';
		text: string;
	}
	interface HeadingBlock {
		type: 'heading';
		text: string;
	}
	interface QuoteBlock {
		type: 'quote';
		text: string;
	}
	interface ImageBlock {
		type: 'image';
		src: string;
		alt: string;
		caption: string;
	}
	interface ListBlock {
		type: 'list';
		items: string[];
	}
	interface CarouselBlock {
		type: 'imageCarousel';
	}

	type ContentBlock =
		| ParagraphBlock
		| HeadingBlock
		| QuoteBlock
		| ImageBlock
		| ListBlock
		| CarouselBlock;

	// --- CAROUSEL FUNCTIONS ---
	const nextSlide = () => {
		currentSlide = (currentSlide + 1) % article.images.length;
	};

	const prevSlide = () => {
		currentSlide = (currentSlide - 1 + article.images.length) % article.images.length;
	};

	const goToSlide = (index: number) => {
		currentSlide = index;
	};

	const handleTouchStart = (e: TouchEvent) => {
		touchStartX = e.touches[0].clientX;
	};

	const handleTouchMove = (e: TouchEvent) => {
		touchEndX = e.touches[0].clientX;
	};

	const handleTouchEnd = () => {
		const diff = touchStartX - touchEndX;
		if (diff > 50) {
			nextSlide();
		} else if (diff < -50) {
			prevSlide();
		}
	};

	// --- ARTICLE DATA ---
	const article: {
		title: string;
		date: string;
		category: string;
		images: ArticleImage[];
		content: ContentBlock[];
	} = {
		title: "Endure and Proclaim: March of Faith's 51st Anniversary Celebration",
		date: 'November 16, 2024',
		category: 'Events',
		images: [
			{
				url: 'https://res.cloudinary.com/dexcw6vg0/image/upload/v1763359983/tp0rs7obrolyxzzx88ww.jpg',
				alt: '51st Anniversary Celebration',
				caption: 'March of Faith 51st Anniversary Celebration Service'
			},
			{
				url: 'https://res.cloudinary.com/dexcw6vg0/image/upload/v1763359983/yfitomjie5maevvj2mp5.jpg',
				alt: 'Worship team leading the congregation',
				caption: 'Worship team leading the congregation in praise and worship'
			},
			{
				url: 'https://res.cloudinary.com/dexcw6vg0/image/upload/v1763359983/i8u8getdupgaxdgyqqpl.jpg',
				alt: 'Pastor delivering the message',
				caption: 'Pastor delivering the anniversary message to the congregation'
			},
			{
				url: 'https://res.cloudinary.com/dexcw6vg0/image/upload/v1763359984/sfewc9c6qvtprbvt0m7y.jpg',
				alt: 'Congregational worship',
				caption: 'Members of the congregation participating in worship'
			},
			{
				url: 'https://res.cloudinary.com/dexcw6vg0/image/upload/v1763359983/ks4dfsafoxgrp8wdk3jr.jpg',
				alt: 'Youth group performance',
				caption: 'Youth group special performance during the celebration'
			},
			{
				url: 'https://res.cloudinary.com/dexcw6vg0/image/upload/v1763359983/o9gbuact3klwl6ia4ppd.jpg',
				alt: 'Church leaders in prayer',
				caption: 'Church leaders joining in prayer during the service'
			},
			{
				url: 'https://res.cloudinary.com/dexcw6vg0/image/upload/v1763359983/wa2cepmyildowei3erwu.jpg',
				alt: 'Closing worship',
				caption: 'Closing worship and benediction of the 51st Anniversary Celebration'
			}
		],
		content: [
			{
				type: 'imageCarousel'
			},
			{
				type: 'paragraph',
				text: 'TAGBILARAN CITY — March of Faith Inc. marked its 51st Foundation Day on November 16, 2025, with a unified celebration that spanned 12 different locations across Bohol and Negros Oriental.'
			},
			{
				type: 'paragraph',
				text: "This anniversary honors the ministry's origins and the enduring legacy of its founder, the late <strong>Dr. Rev. Rudy Trigo</strong>. It was 51 years ago that he first felt the call of the Lord to start a movement in Bohol. Today, that mission is carried forward by his son and successor, <strong>Ralph Steven Dinsay Trigo</strong>, who now leads the March of Faith Inc."
			},
			{
				type: 'heading',
				text: 'Enduring Faith, Advancing the Gospel'
			},
			{
				type: 'paragraph',
				text: 'This year\'s event centered on the theme "Endure and proclaim, advancing the gospel until the end," drawn from Matthew 24:13-14. This theme served as a direct and urgent call to action for the ministry:'
			},
			{
				type: 'quote',
				text: 'This event calls every believer to persevere in faith and remain steadfast amid trials, keeping their hearts anchored in Christ. It renews our commitment to proclaim the Good News of the Kingdom to all nations — reminding us that our mission is not complete until every soul has heard of Jesus. Together, we endure. Together, we proclaim. Until He comes.'
			},
			{
				type: 'paragraph',
				text: 'The power of the 51st anniversary was in its unity of spirit. Though separated geographically, all 12 congregations were connected by this single, focused message. Pastors at each location delivered sermons on the "Endure and proclaim" theme, creating a simultaneous wave of worship and rededication.'
			},
			{
				type: 'heading',
				text: 'Celebrations Across 12 Locations'
			},
			{
				type: 'paragraph',
				text: 'The simultaneous celebrations took place in the following locations:'
			},
			{
				type: 'list',
				items: [
					'Tagbilaran City, Bohol',
					'Triple Union, Catigbian, Bohol',
					'Caningag, Alicia, Bohol',
					'Libertad, Tubigon, Bohol',
					'Ajong, Sibulan, Negros Oriental',
					'Poblacion, Sibulan, Negros Oriental',
					'Magatas, Sibulan, Negros Oriental',
					'Pinucawan, Tayasan, Negros Oriental',
					'Cambaye, Tayasan, Negros Oriental',
					'Linao, Tayasan, Negros Oriental',
					'Dumaguete City, Negros Oriental',
					'Bolisong, Manjuyod, Negros Oriental'
				]
			},
			{
				type: 'paragraph',
				text: 'The anniversary celebrations were marked by special worship services, baptisms, and community outreach programs. Each location also held fellowship meals, bringing together church members and visitors in a spirit of unity and celebration.'
			},
			{
				type: 'paragraph',
				text: "As March of Faith Inc. looks to the future, the 51st anniversary serves as both a celebration of God's faithfulness and a renewed commitment to the Great Commission. The ministry continues to expand its reach, with plans for new church plants and community development initiatives in the coming year."
			}
		]
	};

	const firstTextBlock = article.content.find(
		(block) => (block as ParagraphBlock | HeadingBlock | QuoteBlock).text !== undefined
	);
	const metaDescription =
		firstTextBlock && 'text' in firstTextBlock
			? firstTextBlock.text
			: 'Read the latest news from March of Faith Inc.';

	onMount(() => {
		// Add any client-side JavaScript here
	});
</script>

<svelte:head>
	<title>{article.title} - March of Faith News</title>
	<meta name="description" content={metaDescription} />
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&display=swap" rel="stylesheet">
</svelte:head>

<div class="page-wrapper">
	<!-- Breadcrumb -->
	<nav class="breadcrumb">
		<div class="breadcrumb-container">
			<a href="/">Home</a>
			<span class="separator">/</span>
			<a href="/news">News</a>
			<span class="separator">/</span>
			<span class="current">Article</span>
		</div>
	</nav>

	<!-- Article Header -->
	<header class="article-header">
		<div class="header-container">
			<div class="article-meta">
				<span class="article-category">{article.category}</span>
				<span class="meta-separator">·</span>
				<time datetime={new Date(article.date).toISOString().split('T')[0]} class="article-date">
					{article.date}
				</time>
			</div>
			<h1 class="article-title">{article.title}</h1>
		</div>
	</header>

	<!-- Article Content -->
	<article class="article-content">
		<div class="content-container">
			{#each article.content as block}
				{#if block.type === 'imageCarousel'}
					<div class="carousel-wrapper">
						<div class="carousel-container">
							<div
								class="carousel-track"
								style:transform="translateX(-{currentSlide * 100}%)"
								ontouchstart={handleTouchStart}
								ontouchmove={handleTouchMove}
								ontouchend={handleTouchEnd}
							>
								{#each article.images as image}
									<figure class="carousel-slide">
										<img
											src={image.url}
											alt={image.alt}
											class="carousel-image"
											loading="lazy"
										/>
										<figcaption class="carousel-caption">{image.caption}</figcaption>
									</figure>
								{/each}
							</div>

							<button class="carousel-btn prev-btn" onclick={prevSlide} aria-label="Previous image">
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M15 18l-6-6 6-6" />
								</svg>
							</button>
							<button class="carousel-btn next-btn" onclick={nextSlide} aria-label="Next image">
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M9 18l6-6-6-6" />
								</svg>
							</button>

							<div class="carousel-indicators">
								{#each article.images as _, k}
									<button
										class="indicator {k === currentSlide ? 'active' : ''}"
										onclick={() => goToSlide(k)}
										aria-label={`Go to slide ${k + 1}`}
									></button>
								{/each}
							</div>
						</div>
					</div>
				{:else if block.type === 'paragraph'}
					<p class="paragraph">{@html block.text}</p>
				{:else if block.type === 'heading'}
					<h2 class="heading">{block.text}</h2>
				{:else if block.type === 'quote'}
					<blockquote class="quote">
						<p>{block.text}</p>
					</blockquote>
				{:else if block.type === 'image'}
					<figure class="image-figure">
						<img src={block.src} alt={block.alt} class="content-image" loading="lazy" />
						<figcaption class="image-caption">{block.caption}</figcaption>
					</figure>
				{:else if block.type === 'list'}
					<ul class="list">
						{#each block.items as item}
							<li class="list-item">{item}</li>
						{/each}
					</ul>
				{/if}
			{/each}
		</div>
	</article>

	<!-- Related Articles -->
	<aside class="related-section">
		<div class="related-container">
			<h3 class="related-title">More from March of Faith</h3>
			<div class="related-grid">
				<a href="/news" class="related-card">
					<div class="related-image-wrapper">
						<img
							src="https://res.cloudinary.com/dexcw6vg0/image/upload/v1763355713/ojlomimmfvtgwzxjyptq.webp"
							alt="Related Article"
							class="related-image"
							loading="lazy"
						/>
					</div>
					<h4 class="related-card-title">View All News & Updates</h4>
					<p class="related-card-text">Stay updated with the latest from March of Faith Inc.</p>
				</a>
			</div>
		</div>
	</aside>

	<!-- Back to Top -->
	<button
		class="back-to-top"
		onclick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
		aria-label="Back to top"
	>
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M18 15l-6-6-6 6" />
		</svg>
	</button>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		background: #fff;
		color: #242424;
	}

	.page-wrapper {
		min-height: 100vh;
		background: #fff;
	}

	/* Breadcrumb */
	.breadcrumb {
		border-bottom: 1px solid #f2f2f2;
		background: #fff;
		padding: 16px 0;
	}

	.breadcrumb-container {
		max-width: 680px;
		margin: 0 auto;
		padding: 0 24px;
		font-size: 14px;
		color: #6B6B6B;
	}

	.breadcrumb a {
		color: #6B6B6B;
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.breadcrumb a:hover {
		color: #242424;
	}

	.separator {
		margin: 0 8px;
		color: #E6E6E6;
	}

	.current {
		color: #242424;
	}

	/* Article Header */
	.article-header {
		padding: 56px 0 40px;
		background: #fff;
	}

	.header-container {
		max-width: 680px;
		margin: 0 auto;
		padding: 0 24px;
	}

	.article-meta {
		display: flex;
		align-items: center;
		margin-bottom: 16px;
		font-size: 14px;
		color: #6B6B6B;
	}

	.article-category {
		color: #1A8917;
		font-weight: 500;
		font-size: 13px;
		letter-spacing: 0.2px;
	}

	.meta-separator {
		margin: 0 8px;
		color: #E6E6E6;
	}

	.article-date {
		color: #6B6B6B;
	}

	.article-title {
		font-family: 'Source Serif 4', 'Georgia', 'Cambria', 'Times New Roman', serif;
		font-size: 42px;
		font-weight: 700;
		line-height: 1.18;
		letter-spacing: -0.022em;
		margin: 0;
		color: #242424;
	}

	/* Article Content */
	.article-content {
		padding: 0 0 80px;
		background: #fff;
	}

	.content-container {
		max-width: 680px;
		margin: 0 auto;
		padding: 0 24px;
	}

	/* Carousel - Constrained Width */
	.carousel-wrapper {
		margin: 0 0 48px;
	}

	.carousel-container {
		position: relative;
		width: 100%;
		max-width: 100%;
		margin: 0 auto;
		overflow: hidden;
		background: #fff;
		border-radius: 4px;
	}

	.carousel-track {
		display: flex;
		transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		width: 100%;
	}

	.carousel-slide {
		min-width: 100%;
		position: relative;
		height: 0;
		padding-bottom: 66%; /* Slightly taller than 16:9 for Medium-like proportions */
		overflow: hidden;
		margin: 0;
		background: #f9f9f9;
	}

	.carousel-image {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.carousel-btn {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		background: rgba(255, 255, 255, 0.95);
		border: none;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		z-index: 10;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		color: #242424;
	}

	.carousel-btn:hover {
		background: #fff;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.prev-btn {
		left: 24px;
	}

	.next-btn {
		right: 24px;
	}

	.carousel-indicators {
		position: absolute;
		bottom: 24px;
		left: 0;
		right: 0;
		display: flex;
		justify-content: center;
		gap: 8px;
		z-index: 5;
	}

	.indicator {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.4);
		border: none;
		padding: 0;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.indicator.active {
		background: rgba(255, 255, 255, 0.95);
		transform: scale(1.25);
	}

	.indicator:hover:not(.active) {
		background: rgba(255, 255, 255, 0.7);
	}

	/* Typography */
	.paragraph {
		font-family: 'Source Serif 4', 'Georgia', 'Cambria', serif;
		font-size: 20px;
		line-height: 1.8;
		letter-spacing: -0.003em;
		color: #242424;
		margin: 0 0 32px;
		word-wrap: break-word;
	}

	.paragraph:first-of-type {
		font-size: 21px;
	}

	.heading {
		font-family: 'Source Serif 4', 'Georgia', 'Cambria', serif;
		font-size: 32px;
		font-weight: 700;
		line-height: 1.25;
		letter-spacing: -0.016em;
		margin: 56px 0 16px;
		color: #242424;
	}

	.quote {
		border-left: 3px solid #242424;
		padding: 0 0 0 23px;
		margin: 32px 0;
		font-family: 'Source Serif 4', 'Georgia', 'Cambria', serif;
		font-size: 21px;
		font-style: italic;
		line-height: 1.7;
		letter-spacing: -0.003em;
		color: #242424;
	}

	.quote p {
		margin: 0;
	}

	.image-figure {
		margin: 48px 0;
		text-align: center;
	}

	.content-image {
		width: 100%;
		height: auto;
		border-radius: 4px;
	}

	.image-caption {
		text-align: center;
		font-size: 14px;
		color: #6B6B6B;
		margin-top: 12px;
		font-style: normal;
		line-height: 1.4;
	}

	.list {
		margin: 32px 0;
		padding-left: 28px;
		font-family: 'Source Serif 4', 'Georgia', 'Cambria', serif;
		font-size: 20px;
		line-height: 1.8;
		letter-spacing: -0.003em;
	}

	.list-item {
		margin-bottom: 12px;
		color: #242424;
		padding-left: 4px;
	}

	/* Related Section */
	.related-section {
		margin-top: 80px;
		padding: 80px 0;
		background: #F9F9F9;
		border-top: 1px solid #F2F2F2;
	}

	.related-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 24px;
	}

	.related-title {
		font-size: 24px;
		font-weight: 600;
		margin: 0 0 32px;
		color: #242424;
		letter-spacing: -0.011em;
	}

	.related-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 32px;
	}

	.related-card {
		text-decoration: none;
		color: inherit;
		display: block;
		transition: transform 0.2s ease;
		background: #fff;
		border-radius: 4px;
		overflow: hidden;
		border: 1px solid #F2F2F2;
	}

	.related-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
	}

	.related-image-wrapper {
		position: relative;
		padding-top: 56.25%;
		overflow: hidden;
		background: #f2f2f2;
	}

	.related-image {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
	}

	.related-card:hover .related-image {
		transform: scale(1.05);
	}

	.related-card-title {
		font-size: 18px;
		font-weight: 600;
		margin: 0;
		padding: 20px 20px 8px;
		color: #242424;
		line-height: 1.4;
	}

	.related-card-text {
		color: #6B6B6B;
		margin: 0;
		padding: 0 20px 20px;
		font-size: 15px;
		line-height: 1.5;
	}

	/* Back to Top */
	.back-to-top {
		position: fixed;
		bottom: 32px;
		right: 32px;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: #242424;
		color: #fff;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		transition: all 0.2s ease;
		z-index: 100;
	}

	.back-to-top:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
		background: #1a1a1a;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.article-title {
			font-size: 32px;
			line-height: 1.2;
		}

		.heading {
			font-size: 26px;
			margin: 40px 0 12px;
		}

		.paragraph,
		.list {
			font-size: 18px;
			line-height: 1.7;
		}

		.quote {
			font-size: 19px;
			padding-left: 20px;
		}

		.article-header {
			padding: 40px 0 32px;
		}

		.header-container,
		.content-container,
		.breadcrumb-container {
			padding: 0 20px;
		}

		.carousel-slide {
			padding-bottom: 75%; /* Taller on mobile */
		}

		.carousel-btn {
			width: 40px;
			height: 40px;
		}

		.carousel-btn svg {
			width: 20px;
			height: 20px;
		}

		.prev-btn {
			left: 16px;
		}

		.next-btn {
			right: 16px;
		}

		.carousel-caption {
			font-size: 13px;
			padding: 40px 16px 12px;
		}

		.back-to-top {
			width: 44px;
			height: 44px;
			bottom: 20px;
			right: 20px;
		}

		.related-section {
			padding: 60px 0;
		}

		.related-container {
			padding: 0 20px;
		}

		.related-grid {
			grid-template-columns: 1fr;
			gap: 24px;
		}
	}

	@media (max-width: 480px) {
		.article-title {
			font-size: 28px;
		}

		.heading {
			font-size: 24px;
		}

		.paragraph,
		.list {
			font-size: 17px;
		}

		.quote {
			font-size: 18px;
		}

		.carousel-btn {
			width: 36px;
			height: 36px;
		}

		.carousel-btn svg {
			width: 18px;
			height: 18px;
		}
	}
</style>