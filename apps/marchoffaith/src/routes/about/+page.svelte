<script>
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>About - March of Faith Incorporated</title>
	<meta name="description" content="Learn about March of Faith Incorporated's rich history, mission, and values that have guided us since 1975" />
</svelte:head>

<!-- Hero Section -->
<section class="about-hero">
	<div class="container">
		<div class="hero-content">
			<h1>About March of Faith</h1>
			<p class="hero-subtitle">Every Creature is Reachable</p>
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

<!-- Main Content -->
<section class="about-content">
	<div class="container">
		<div class="content-layout">
			<div class="main-content">
				<!-- Welcome Section -->
				<div class="welcome-card">
					<div class="card-header">
						<h2>Welcome to Our Church Family</h2>
						<p class="lead-text">For nearly five decades, March of Faith Incorporated has been a cornerstone of faith in Bohol, Philippines, serving as our headquarters church and spiritual home to countless believers.</p>
					</div>
					
					<div class="founder-section">
						<div class="founder-image">
							<img 
								src="https://res.cloudinary.com/dexcw6vg0/image/upload/v1754821750/rcpqj7mzayco2ndwioqp.png" 
								alt="Rev. Rudy Salomon Trigo, D.D. - Our Founding Minister" 
								class="founder-photo"
							/>
						</div>
						<div class="founder-info">
							<h3>Our Founding Minister</h3>
							<p>Rev. Rudy Salomon Trigo, D.D. (1938-2011) established March of Faith Incorporated in 1975 with a vision to create a spiritual home where believers could grow in faith and experience genuine fellowship.</p>
							<a href="/about/founding-minister" class="founder-link">Learn More About Our Founder</a>
						</div>
					</div>
					
					<div class="welcome-stats">
						<div class="stat-card">
							<div class="stat-number">1975</div>
							<div class="stat-label">Founded</div>
						</div>
						<div class="stat-card">
							<div class="stat-number">50+</div>
							<div class="stat-label">Years of Ministry</div>
						</div>
						<div class="stat-card">
							<div class="stat-number">∞</div>
							<div class="stat-label">Lives Touched</div>
						</div>
					</div>
				</div>

				<!-- Mission Section -->
				<div class="mission-vision-grid">
					<div class="mission-card">
						<div class="card-icon">🎯</div>
						<h3>Our Mission</h3>
						<p>To be a Christ-centered community that strengthens faith, builds meaningful relationships, and spreads God's love throughout the Philippines and beyond through worship, discipleship, and service.</p>
					</div>

					<div class="vision-card">
						<div class="card-icon">🌟</div>
						<h3>Our Vision</h3>
						<p>To see transformed lives and thriving communities as we make disciples of Jesus Christ, equipped for service in God's kingdom and empowered to be salt and light in our world.</p>
					</div>
				</div>

				<!-- Core Values -->
				<div class="values-section">
					<h2>Our Core Values</h2>
					<div class="values-grid">
						<div class="value-card">
							<div class="value-icon">📖</div>
							<h4>Biblical Foundation</h4>
							<p>We believe in the authority and sufficiency of Scripture as our guide for faith, life, and ministry practice.</p>
						</div>
						<div class="value-card">
							<div class="value-icon">❤️</div>
							<h4>Christ-Centered Love</h4>
							<p>We demonstrate God's love through genuine care, compassion, and service to one another and our community.</p>
						</div>
						<div class="value-card">
							<div class="value-icon">🤝</div>
							<h4>Community Fellowship</h4>
							<p>We foster authentic relationships and create welcoming spaces where everyone can belong and grow.</p>
						</div>
						<div class="value-card">
							<div class="value-icon">🌱</div>
							<h4>Spiritual Growth</h4>
							<p>We are committed to lifelong learning, discipleship, and spiritual maturation in Christ.</p>
						</div>
						<div class="value-card">
							<div class="value-icon">✋</div>
							<h4>Faithful Service</h4>
							<p>We serve with excellence, using our God-given gifts to build His kingdom and bless others.</p>
						</div>
						<div class="value-card">
							<div class="value-icon">🌍</div>
							<h4>Global Perspective</h4>
							<p>We embrace our calling to reach beyond our local community with the Gospel message.</p>
						</div>
					</div>
				</div>
			</div>

			<div class="sidebar-content">
				<!-- Quick Info -->
				<div class="info-card">
					<h3>Quick Information</h3>
					<div class="info-list">
						<div class="info-item">
							<strong>Founded:</strong>
							<span>November 19, 1975</span>
						</div>
						<div class="info-item">
							<strong>Location:</strong>
							<span>Tagbilaran City, Bohol</span>
						</div>
						<div class="info-item">
							<strong>Registration:</strong>
							<span>SEC No. 0000058834</span>
						</div>
						<div class="info-item">
							<strong>Status:</strong>
							<span>Headquarters Church</span>
						</div>
					</div>
				</div>

				<!-- Scripture Card -->
				<div class="scripture-card">
					<h3>Our Foundation</h3>
					<blockquote>
						"And he gave the apostles, the prophets, the evangelists, the shepherds and teachers, to equip the saints for the work of ministry, for building up the body of Christ."
						<cite>- Ephesians 4:11-12</cite>
					</blockquote>
				</div>

				<!-- Contact Card -->
				<div class="contact-card">
					<h3>Connect With Us</h3>
					<div class="contact-info">
						<div class="contact-item">
							<strong>Phone:</strong>
							<span>+63 99 9953 6700</span>
						</div>
						<div class="contact-item">
							<strong>Email:</strong>
							<span>marchoffaithincorporated@gmail.com</span>
						</div>
						<div class="contact-item">
							<strong>Address:</strong>
							<span>San Isidro District<br>Tagbilaran City, Bohol</span>
						</div>
					</div>
					<a href="/contact" class="contact-button">Visit Our Church</a>
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

	/* Main Content */
	.about-content {
		padding: 4rem 0;
		background: #f8f9fa;
	}

	.content-layout {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 4rem;
		align-items: start;
	}

	/* Welcome Card */
	.welcome-card {
		background: white;
		padding: 3rem;
		border-radius: 15px;
		box-shadow: 0 5px 25px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	/* Founder Section */
	.founder-section {
		display: flex;
		gap: 2rem;
		align-items: center;
		margin: 2rem 0;
		padding: 2rem;
		background: #f8f9fa;
		border-radius: 10px;
		border-left: 4px solid #C1272D;
	}

	.founder-image {
		flex-shrink: 0;
	}

	.founder-photo {
		width: 150px;
		height: 200px;
		object-fit: cover;
		border-radius: 10px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
	}

	.founder-info h3 {
		color: #981B1E;
		font-size: 1.5rem;
		margin-bottom: 1rem;
		font-weight: 600;
	}

	.founder-info p {
		color: #666;
		line-height: 1.6;
		margin-bottom: 1.5rem;
	}

	.founder-link {
		display: inline-block;
		color: #C1272D;
		text-decoration: none;
		font-weight: 600;
		border-bottom: 2px solid #C1272D;
		transition: all 0.3s ease;
	}

	.founder-link:hover {
		color: #981B1E;
		border-bottom-color: #981B1E;
	}

	.card-header h2 {
		font-size: 2.5rem;
		color: #981B1E;
		margin-bottom: 1.5rem;
		font-weight: 700;
	}

	.lead-text {
		font-size: 1.2rem;
		line-height: 1.8;
		color: #555;
		margin-bottom: 2rem;
	}

	.welcome-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 2rem;
		margin-top: 3rem;
	}

	.stat-card {
		text-align: center;
		padding: 2rem 1rem;
		background: #f8f9fa;
		border-radius: 10px;
		border-top: 4px solid #C1272D;
	}

	.stat-number {
		font-size: 2.5rem;
		font-weight: 700;
		color: #981B1E;
		margin-bottom: 0.5rem;
	}

	.stat-label {
		color: #666;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-size: 0.9rem;
	}

	/* Mission Vision Grid */
	.mission-vision-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-bottom: 3rem;
	}

	.mission-card,
	.vision-card {
		background: white;
		padding: 2.5rem;
		border-radius: 15px;
		box-shadow: 0 5px 25px rgba(0, 0, 0, 0.1);
		text-align: center;
		transition: transform 0.3s ease;
	}

	.mission-card:hover,
	.vision-card:hover {
		transform: translateY(-5px);
	}

	.card-icon {
		font-size: 3rem;
		margin-bottom: 1.5rem;
	}

	.mission-card h3,
	.vision-card h3 {
		font-size: 1.8rem;
		color: #981B1E;
		margin-bottom: 1.5rem;
		font-weight: 600;
	}

	.mission-card p,
	.vision-card p {
		color: #666;
		line-height: 1.7;
		font-size: 1rem;
	}

	/* Values Section */
	.values-section {
		background: white;
		padding: 3rem;
		border-radius: 15px;
		box-shadow: 0 5px 25px rgba(0, 0, 0, 0.1);
	}

	.values-section h2 {
		font-size: 2.2rem;
		color: #981B1E;
		text-align: center;
		margin-bottom: 3rem;
		font-weight: 700;
	}

	.values-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 2rem;
	}

	.value-card {
		padding: 2rem;
		background: #f8f9fa;
		border-radius: 10px;
		border-left: 4px solid #C1272D;
		transition: all 0.3s ease;
	}

	.value-card:hover {
		background: white;
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
		transform: translateX(10px);
	}

	.value-icon {
		font-size: 2rem;
		margin-bottom: 1rem;
	}

	.value-card h4 {
		color: #981B1E;
		font-size: 1.2rem;
		margin-bottom: 1rem;
		font-weight: 600;
	}

	.value-card p {
		color: #666;
		line-height: 1.6;
		margin: 0;
	}

	/* Sidebar */
	.info-card,
	.scripture-card,
	.contact-card {
		background: white;
		padding: 2rem;
		border-radius: 10px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.info-card h3,
	.scripture-card h3,
	.contact-card h3 {
		color: #981B1E;
		font-size: 1.3rem;
		margin-bottom: 1.5rem;
		font-weight: 600;
		border-bottom: 2px solid #C1272D;
		padding-bottom: 0.5rem;
	}

	.info-item,
	.contact-item {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 0.75rem 0;
		border-bottom: 1px solid #f0f0f0;
	}

	.info-item:last-child,
	.contact-item:last-child {
		border-bottom: none;
	}

	.info-item strong,
	.contact-item strong {
		color: #333;
		font-weight: 600;
		min-width: 80px;
	}

	.info-item span,
	.contact-item span {
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

	.contact-button {
		display: block;
		width: 100%;
		padding: 1rem;
		background: #C1272D;
		color: white;
		text-align: center;
		text-decoration: none;
		border-radius: 5px;
		font-weight: 600;
		margin-top: 1.5rem;
		transition: background 0.3s ease;
	}

	.contact-button:hover {
		background: #981B1E;
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

		.welcome-card,
		.values-section {
			padding: 2rem;
		}

		.founder-section {
			flex-direction: column;
			text-align: center;
			padding: 1.5rem;
		}

		.founder-photo {
			width: 120px;
			height: 160px;
		}

		.welcome-stats {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.mission-vision-grid {
			grid-template-columns: 1fr;
		}

		.values-grid {
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