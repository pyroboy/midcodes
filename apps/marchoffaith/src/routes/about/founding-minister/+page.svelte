<script>
	import { page } from '$app/stores';
	import Hero from '$lib/components/Hero.svelte';
	import AboutNav from '$lib/components/AboutNav.svelte';
</script>

<svelte:head>
	<title>Founding Minister - March of Faith Incorporated</title>
	<meta name="description" content="Life and legacy of Rev. Rudy Salomon Trigo, D.D., founding minister of March of Faith Incorporated" />
</svelte:head>

<Hero subtitle="The visionary leader who established March of Faith Incorporated">
	Our Founding Minister
</Hero>

<!-- Navigation Tabs -->
<AboutNav />

<!-- Founder Content -->
<section class="founder-content">
	<div class="container">
		<div class="content-layout">
			<div class="main-content">
				<div class="biography-card">
					<div class="bio-header">
						<div class="bio-image-wrapper">
							<img 
								src="https://res.cloudinary.com/dexcw6vg0/image/upload/v1754821750/rcpqj7mzayco2ndwioqp.png" 
								alt="Rev. Rudy Salomon Trigo, D.D." 
								class="bio-image"
							/>
							<div class="image-decoration"></div>
						</div>
						<div class="bio-intro">
							<span class="bio-label">The Visionary</span>
							<h2>Rev. Rudy Salomon Trigo, D.D.</h2>
					<h3>Ministry Highlights</h3>
					<div class="highlights-grid">
						<div class="highlight-card">
							<h4>Church Planter</h4>
							<p>Established March of Faith Incorporated as a beacon of hope and spiritual growth in Bohol.</p>
						</div>
						<div class="highlight-card">
							<h4>Bible Teacher</h4>
							<p>Known for his clear, practical exposition of Scripture that transformed lives.</p>
						</div>
						<div class="highlight-card">
							<h4>Community Leader</h4>
							<p>Actively involved in community service and social development initiatives.</p>
						</div>
						<div class="highlight-card">
							<h4>Mentor</h4>
							<p>Trained and equipped numerous leaders who continue his ministry legacy.</p>
						</div>
					</div>
				</div>

				<div class="tribute-section">
					<h3>A Lasting Legacy</h3>
					<blockquote class="tribute-quote">
						"Rev. Trigo's life was a testament to the power of faith in action. His unwavering commitment to God's Word and his genuine love for people established a foundation that continues to bear fruit today. Though he has joined the great cloud of witnesses, his spiritual legacy lives on in every life touched by March of Faith Incorporated."
					</blockquote>
				</div>
			</div>

			<div class="sidebar-content">
				<div class="memorial-card">
					<h3>In Memoriam</h3>
					<div class="memorial-info">
						<div class="memorial-item">
							<strong>Born:</strong>
							<span>July 15, 1938</span>
						</div>
						<div class="memorial-item">
							<strong>Called Home:</strong>
							<span>April 7, 2011</span>
						</div>
						<div class="memorial-item">
							<strong>Years of Ministry:</strong>
							<span>50+ years</span>
						</div>
						<div class="memorial-item">
							<strong>Church Founded:</strong>
							<span>1975</span>
						</div>
					</div>
				</div>

				<div class="scripture-card">
					<h3>His Favorite Scripture</h3>
					<blockquote>
						"I have fought the good fight, I have finished the race, I have kept the faith. Now there is in store for me the crown of righteousness, which the Lord, the righteous Judge, will award to me on that day—and not only to me, but also to all who have longed for his appearing."
						<cite>- 2 Timothy 4:7-8</cite>
					</blockquote>
				</div>

				<div class="values-card">
					<h3>His Core Values</h3>
					<ul class="values-list">
						<li>Unwavering faith in God</li>
						<li>Commitment to biblical truth</li>
						<li>Love for all people</li>
						<li>Dedication to prayer</li>
						<li>Heart for evangelism</li>
						<li>Servant leadership</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	/* Global Styles */
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	/* Navigation Tabs */
	.about-nav {
		background: white;
		border-bottom: 1px solid #e5e5e5;
		padding: 0;
	}

	.tab-navigation {
		display: flex;
		gap: 0;
		overflow-x: auto;
	}

	.tab-link {
		display: block;
		padding: 1.5rem 2rem;
		text-decoration: none;
		color: #666;
		font-weight: 600;
		border-bottom: 3px solid transparent;
		transition: all 0.3s ease;
		white-space: nowrap;
	}

	.tab-link:hover {
		color: #981B1E;
		background: #f8f9fa;
	}

	.tab-link.active {
		color: #981B1E;
		border-bottom-color: #C1272D;
		background: white;
	}

	/* Minister Content */
	.minister-content {
		padding: 4rem 0;
		background: #f8f9fa;
	}

	.content-layout {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 4rem;
		align-items: start;
	}

	/* Profile Section */
	.profile-header {
		display: flex;
		gap: 2rem;
		margin-bottom: 3rem;
		background: white;
		padding: 2rem;
		border-radius: 15px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
	}

	.profile-image {
		flex-shrink: 0;
	}

	.minister-photo {
		width: 200px;
		height: 250px;
		object-fit: cover;
		border-radius: 10px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
	}

	.profile-info h2 {
		font-size: 2.2rem;
		color: #981B1E;
		margin-bottom: 0.5rem;
		font-weight: 700;
	}

	.profile-info .title {
		font-size: 1.2rem;
		color: #C1272D;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.profile-info .dates {
		font-size: 1rem;
		color: #666;
		margin-bottom: 1rem;
		font-style: italic;
	}

	.profile-info .memorial {
		color: #555;
		line-height: 1.6;
		font-size: 1rem;
	}

	/* Biography Section */
	.biography-section {
		background: white;
		padding: 2rem;
		border-radius: 10px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.biography-section h3 {
		font-size: 2rem;
		color: #981B1E;
		margin-bottom: 1.5rem;
		font-weight: 600;
	}

	.biography-section h4 {
		font-size: 1.3rem;
		color: #C1272D;
		margin: 1.5rem 0 1rem 0;
		font-weight: 600;
	}

	.lead-paragraph {
		font-size: 1.1rem;
		line-height: 1.8;
		color: #444;
		margin-bottom: 2rem;
		font-weight: 300;
	}

	.bio-content p {
		color: #666;
		line-height: 1.7;
		margin-bottom: 1rem;
	}

	/* Ministry Highlights */
	.ministry-highlights {
		background: white;
		padding: 2rem;
		border-radius: 10px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.ministry-highlights h3 {
		font-size: 2rem;
		color: #981B1E;
		margin-bottom: 1.5rem;
		font-weight: 600;
	}

	.highlights-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}

	.highlight-card {
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 8px;
		border-left: 4px solid #C1272D;
	}

	.highlight-card h4 {
		color: #981B1E;
		font-size: 1.1rem;
		margin-bottom: 0.5rem;
		font-weight: 600;
	}

	.highlight-card p {
		color: #666;
		line-height: 1.5;
		margin: 0;
		font-size: 0.9rem;
	}

	/* Tribute Section */
	.tribute-section {
		background: white;
		padding: 2rem;
		border-radius: 10px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	.tribute-section h3 {
		font-size: 2rem;
		color: #981B1E;
		margin-bottom: 1.5rem;
		font-weight: 600;
	}

	.tribute-quote {
		font-size: 1.1rem;
		font-style: italic;
		color: #555;
		line-height: 1.7;
		margin: 0;
		padding: 1.5rem;
		background: #f8f9fa;
		border-left: 4px solid #C1272D;
		border-radius: 8px;
	}

	/* Sidebar */
	.memorial-card,
	.scripture-card,
	.values-card {
		background: white;
		padding: 2rem;
		border-radius: 10px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.memorial-card h3,
	.scripture-card h3,
	.values-card h3 {
		color: #981B1E;
		font-size: 1.3rem;
		margin-bottom: 1.5rem;
		font-weight: 600;
		border-bottom: 2px solid #C1272D;
		padding-bottom: 0.5rem;
	}

	.memorial-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 0;
		border-bottom: 1px solid #f0f0f0;
	}

	.memorial-item:last-child {
		border-bottom: none;
	}

	.memorial-item strong {
		color: #333;
		font-weight: 600;
	}

	.memorial-item span {
		color: #666;
	}

	.scripture-card blockquote {
		font-style: italic;
		color: #555;
		line-height: 1.6;
		margin: 0;
		border-left: 4px solid #C1272D;
		padding-left: 1rem;
	}

	.scripture-card cite {
		display: block;
		color: #981B1E;
		font-weight: 600;
		margin-top: 1rem;
		font-size: 0.9rem;
	}

	.values-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.values-list li {
		color: #666;
		padding: 0.5rem 0;
		border-bottom: 1px solid #f0f0f0;
		position: relative;
		padding-left: 1.5rem;
	}

	.values-list li:before {
		content: "✓";
		color: #C1272D;
		font-weight: bold;
		position: absolute;
		left: 0;
	}

	.values-list li:last-child {
		border-bottom: none;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.hero-content h1 {
			font-size: 2rem;
		}

		.hero-subtitle {
			font-size: 1.1rem;
		}

		.content-layout {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.profile-header {
			flex-direction: column;
			text-align: center;
		}

		.minister-photo {
			width: 150px;
			height: 200px;
		}

		.highlights-grid {
			grid-template-columns: 1fr;
		}

		.tab-link {
			padding: 1rem 1.5rem;
			font-size: 0.9rem;
		}

		.container {
			padding: 0 1rem;
		}
	}
</style>