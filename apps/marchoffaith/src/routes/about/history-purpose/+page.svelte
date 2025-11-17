<script>
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>History & Purpose - March of Faith Incorporated</title>
	<meta name="description" content="Learn about the rich history and divine purpose of March of Faith Incorporated since 1975" />
</svelte:head>

<!-- Hero Section -->
<section class="about-hero">
	<div class="container">
		<div class="hero-content">
			<h1>Our History & Purpose</h1>
			<p class="hero-subtitle">Five decades of faith, service, and spiritual growth in Bohol</p>
		</div>
	</div>
</section>

<!-- Navigation Tabs -->
<section class="about-nav">
	<div class="container">
		<nav class="tab-navigation">
			<a 
				href="/about" 
				class="tab-link" 
				class:active={$page.url.pathname === '/about'}
			>
				Overview
			</a>
			<a 
				href="/about/history-purpose" 
				class="tab-link"
				class:active={$page.url.pathname === '/about/history-purpose'}
			>
				History & Purpose
			</a>
			<a 
				href="/about/founding-minister" 
				class="tab-link"
				class:active={$page.url.pathname === '/about/founding-minister'}
			>
				Founding Minister
			</a>
			<a 
				href="/about/presiding-minister" 
				class="tab-link"
				class:active={$page.url.pathname === '/about/presiding-minister'}
			>
				Presiding Minister
			</a>
		</nav>
	</div>
</section>

<!-- History Content -->
<section class="history-content">
	<div class="container">
		<div class="content-layout">
			<div class="main-content">
				<div class="history-timeline">
					<h2>Our Journey of Faith</h2>
					
					<div class="timeline">
						<div class="timeline-item">
							<div class="timeline-marker">
								<div class="timeline-year">1975</div>
							</div>
							<div class="timeline-content">
								<div class="foundation-content">
									<div class="foundation-text">
										<h3>Foundation and Incorporation</h3>
										<p>March of Faith Incorporated was officially established on November 19, 1975, with SEC Registration No. 0000058834. Under the divine guidance and leadership of Rev. Rudy Salomon Trigo, D.D., the church began its mission to serve the spiritual needs of the Bohol community.</p>
									</div>
									<div class="founder-image">
										<img 
											src="https://res.cloudinary.com/dexcw6vg0/image/upload/v1754821750/rcpqj7mzayco2ndwioqp.png" 
											alt="Rev. Rudy Salomon Trigo, D.D. - Our Founding Minister" 
											class="founder-photo"
										/>
										<p class="founder-caption">Rev. Rudy Salomon Trigo, D.D.</p>
									</div>
								</div>
							</div>
						</div>

						<div class="timeline-item">
							<div class="timeline-marker">
								<div class="timeline-year">1980s</div>
							</div>
							<div class="timeline-content">
								<h3>Growth and Community Building</h3>
								<p>The church experienced significant growth throughout the 1980s, establishing deep roots in the San Isidro District of Tagbilaran City. Fellowship programs, Bible study groups, and community outreach initiatives became cornerstones of our ministry.</p>
							</div>
						</div>

						<div class="timeline-item">
							<div class="timeline-marker">
								<div class="timeline-year">1990s</div>
							</div>
							<div class="timeline-content">
								<h3>Expanding Ministry</h3>
								<p>The 1990s marked a period of expanded ministry reach, with the establishment of additional fellowship groups and the strengthening of our youth programs. The church became a recognized spiritual center in the region.</p>
							</div>
						</div>

						<div class="timeline-item">
							<div class="timeline-marker">
								<div class="timeline-year">2000s</div>
							</div>
							<div class="timeline-content">
								<h3>Modern Era Development</h3>
								<p>Entering the new millennium, March of Faith Incorporated embraced modern communication methods while maintaining traditional Christian values. Community service projects and disaster relief efforts became integral parts of our mission.</p>
							</div>
						</div>

						<div class="timeline-item">
							<div class="timeline-marker">
								<div class="timeline-year">2020s</div>
							</div>
							<div class="timeline-content">
								<h3>Digital Age Ministry</h3>
								<p>The church adapted to the digital age, expanding our reach through modern communication platforms while maintaining our commitment to personal fellowship and spiritual growth. Today, we continue our mission with renewed vigor and purpose.</p>
							</div>
						</div>
					</div>
				</div>

				<div class="purpose-section">
					<h2>Our Divine Purpose</h2>
					<div class="purpose-grid">
						<div class="purpose-card">
							<h3>Spiritual Formation</h3>
							<p>To guide believers in their spiritual journey, providing opportunities for worship, prayer, and biblical study that deepens their relationship with God.</p>
						</div>
						<div class="purpose-card">
							<h3>Community Fellowship</h3>
							<p>To create a welcoming environment where believers can form meaningful relationships, support one another, and grow together in faith.</p>
						</div>
						<div class="purpose-card">
							<h3>Kingdom Service</h3>
							<p>To equip and mobilize members for service in God's kingdom, both within the church and in the broader community of Bohol.</p>
						</div>
						<div class="purpose-card">
							<h3>Gospel Proclamation</h3>
							<p>To proclaim the Gospel of Jesus Christ through word and deed, reaching out to those who have not yet experienced God's love and grace.</p>
						</div>
					</div>
				</div>
			</div>

			<div class="sidebar-content">
				<div class="milestone-card">
					<h3>Key Milestones</h3>
					<div class="milestone-list">
						<div class="milestone-item">
							<strong>50+ Years</strong>
							<span>of faithful ministry</span>
						</div>
						<div class="milestone-item">
							<strong>1975</strong>
							<span>Official incorporation</span>
						</div>
						<div class="milestone-item">
							<strong>Tagbilaran</strong>
							<span>Headquarters location</span>
						</div>
						<div class="milestone-item">
							<strong>Generations</strong>
							<span>of families served</span>
						</div>
					</div>
				</div>

				<div class="scripture-card">
					<h3>Our Foundation</h3>
					<blockquote>
						"Therefore, since we are surrounded by such a great cloud of witnesses, let us throw off everything that hinders and the sin that so easily entangles. And let us run with perseverance the race marked out for us."
						<cite>- Hebrews 12:1</cite>
					</blockquote>
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

	/* Hero Section */
	.about-hero {
		background: #981B1E;
		color: white;
		padding: 4rem 0;
		text-align: center;
	}

	.hero-content h1 {
		font-size: 3rem;
		font-weight: 700;
		margin-bottom: 1rem;
		color: white;
	}

	.hero-subtitle {
		font-size: 1.3rem;
		font-weight: 300;
		opacity: 0.9;
		max-width: 600px;
		margin: 0 auto;
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

	/* History Content */
	.history-content {
		padding: 4rem 0;
		background: #f8f9fa;
	}

	.content-layout {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 4rem;
		align-items: start;
	}

	.main-content h2 {
		font-size: 2.5rem;
		color: #981B1E;
		margin-bottom: 2rem;
		font-weight: 700;
	}

	/* Timeline */
	.timeline {
		position: relative;
		padding-left: 2rem;
		margin-bottom: 4rem;
	}

	.timeline::before {
		content: '';
		position: absolute;
		left: 15px;
		top: 0;
		bottom: 0;
		width: 2px;
		background: #C1272D;
	}

	.timeline-item {
		position: relative;
		margin-bottom: 3rem;
		padding-left: 4rem;
	}

	.timeline-marker {
		position: absolute;
		left: -2rem;
		top: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.timeline-year {
		background: #C1272D;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-weight: 600;
		font-size: 0.9rem;
		white-space: nowrap;
	}

	.timeline-content h3 {
		color: #981B1E;
		font-size: 1.4rem;
		margin-bottom: 0.5rem;
		font-weight: 600;
	}

	.timeline-content p {
		color: #666;
		line-height: 1.6;
		margin: 0;
	}

	/* Foundation Content */
	.foundation-content {
		display: flex;
		gap: 2rem;
		align-items: flex-start;
	}

	.foundation-text {
		flex: 1;
	}

	.founder-image {
		flex-shrink: 0;
		text-align: center;
	}

	.founder-photo {
		width: 120px;
		height: 160px;
		object-fit: cover;
		border-radius: 10px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
		margin-bottom: 0.5rem;
	}

	.founder-caption {
		font-size: 0.8rem;
		color: #981B1E;
		font-weight: 600;
		margin: 0;
	}

	/* Purpose Section */
	.purpose-section {
		margin-top: 3rem;
	}

	.purpose-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-top: 2rem;
	}

	.purpose-card {
		background: white;
		padding: 2rem;
		border-radius: 10px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		border-top: 4px solid #C1272D;
	}

	.purpose-card h3 {
		color: #981B1E;
		font-size: 1.3rem;
		margin-bottom: 1rem;
		font-weight: 600;
	}

	.purpose-card p {
		color: #666;
		line-height: 1.6;
		margin: 0;
	}

	/* Sidebar */
	.milestone-card,
	.scripture-card {
		background: white;
		padding: 2rem;
		border-radius: 10px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.milestone-card h3,
	.scripture-card h3 {
		color: #981B1E;
		font-size: 1.3rem;
		margin-bottom: 1.5rem;
		font-weight: 600;
		border-bottom: 2px solid #C1272D;
		padding-bottom: 0.5rem;
	}

	.milestone-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 0;
		border-bottom: 1px solid #f0f0f0;
	}

	.milestone-item:last-child {
		border-bottom: none;
	}

	.milestone-item strong {
		color: #C1272D;
		font-weight: 600;
	}

	.milestone-item span {
		color: #666;
		text-align: right;
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

		.purpose-grid {
			grid-template-columns: 1fr;
		}

		.timeline {
			padding-left: 1rem;
		}

		.timeline-item {
			padding-left: 3rem;
		}

		.foundation-content {
			flex-direction: column;
			text-align: center;
			gap: 1rem;
		}

		.founder-photo {
			width: 100px;
			height: 130px;
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