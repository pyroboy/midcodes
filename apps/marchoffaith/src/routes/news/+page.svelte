<script>
	import { page } from '$app/stores';
	import Hero from '$lib/components/Hero.svelte';

	const articles = [
		{
			slug: '51st-anniversary-celebration',
			title: 'March of Faith Inc. Honors 51-Year Legacy, Celebrates Unified Mission',
			excerpt: 'March of Faith Inc. marked its 51st Foundation Day with a unified celebration across 12 locations in Bohol and Negros Oriental, honoring the legacy of its founder, the late Dr. Rev. Rudy Trigo.',
			date: 'November 16, 2024',
			image: 'https://res.cloudinary.com/dexcw6vg0/image/upload/v1763355713/ojlomimmfvtgwzxjyptq.webp',
			category: 'Announcements'
		}
		// More articles can be added here
	];
</script>

<svelte:head>
	<title>News - March of Faith Incorporated</title>
	<meta name="description" content="Stay updated with the latest news and events from March of Faith Incorporated" />
</svelte:head>

<Hero subtitle="Stay connected with the latest from our ministry">
	News & Updates
</Hero>

<!-- News Grid -->
<section class="news-grid-section">
	<div class="container">
		<div class="news-grid">
			{#each articles as article}
				<article class="news-card">
					<a href="/news/{article.slug}" class="news-card-link">
						<div class="news-image-container">
							<img 
								src={article.image} 
								alt={article.title}
								class="news-image"
								loading="lazy"
							/>
							<span class="news-category">{article.category}</span>
						</div>
						<div class="news-content">
							<time datetime={new Date(article.date).toISOString().split('T')[0]} class="news-date">
								{article.date}
							</time>
							<h2 class="news-title">{article.title}</h2>
							<p class="news-excerpt">{article.excerpt}</p>
							<span class="read-more">Read More →</span>
						</div>
					</a>
				</article>
			{/each}
		</div>
	</div>
</section>

<style>
	/* News Grid */
	.news-grid-section {
		padding: 4rem 0;
		background: #f8fafc; /* Match About page --bg-light */
	}

	.news-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 2rem;
	}

	.news-card {
		background: white;
		border-radius: 16px; /* Match About page card radius */
		overflow: hidden;
		transition: transform 0.3s ease, box-shadow 0.3s ease;
		border: 1px solid rgba(0,0,0,0.04); /* Match About page border */
		box-shadow: 0 10px 30px rgba(0,0,0,0.04); /* Match About page shadow */
	}

	.news-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 20px 40px rgba(0,0,0,0.08);
	}

	.news-card-link {
		text-decoration: none;
		color: inherit;
		display: block;
		height: 100%;
	}

	.news-image-container {
		position: relative;
		padding-top: 56.25%; /* 16:9 Aspect Ratio */
		overflow: hidden;
	}

	.news-image {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.5s ease;
	}

	.news-card:hover .news-image {
		transform: scale(1.05);
	}

	.news-category {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: var(--primary-color);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.news-content {
		padding: 1.5rem;
	}

	.news-date {
		display: block;
		color: #6b7280;
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
	}

	.news-title {
		font-size: 1.25rem;
		font-weight: 700;
		margin: 0 0 0.75rem;
		line-height: 1.4;
	}

	.news-excerpt {
		color: #4b5563;
		margin-bottom: 1rem;
		line-height: 1.6;
	}

	.read-more {
		color: var(--primary-color);
		font-weight: 600;
		transition: all 0.2s ease;
	}

	.news-card:hover .read-more {
		margin-left: 0.25rem;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.news-hero h1 {
			font-size: 2.25rem;
		}

		.hero-subtitle {
			font-size: 1.1rem;
		}

		.news-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
