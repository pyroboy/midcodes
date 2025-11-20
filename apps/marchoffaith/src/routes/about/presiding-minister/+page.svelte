<script>
	import { page } from '$app/stores';
	import Hero from '$lib/components/Hero.svelte';
	import AboutNav from '$lib/components/AboutNav.svelte';
</script>

<svelte:head>
	<title>Presiding Minister - March of Faith Incorporated</title>
	<meta name="description" content="Meet our current presiding minister who continues the legacy of spiritual leadership at March of Faith Incorporated" />
</svelte:head>

<Hero subtitle="Continuing the legacy of faithful ministry and spiritual leadership">
	Our Presiding Minister
</Hero>

<!-- Navigation Tabs -->
<AboutNav />

<!-- Minister Content -->
<section class="minister-content">
	<div class="container">
		<div class="content-layout">
			<div class="main-content">
				<div class="leadership-intro">
					<div class="leadership-content">
						<div class="leadership-text">
							<h2>Spiritual Leadership Today</h2>
							<p class="lead-text">
								March of Faith Incorporated continues to thrive under dedicated spiritual leadership that honors our founding vision while embracing the needs of our contemporary community. Our presiding minister carries forward the legacy of Rev. Rudy Salomon Trigo, D.D., with the same commitment to biblical truth, pastoral care, and community service.
							</p>
						</div>
						<div class="founder-legacy">
							<img 
								src="https://res.cloudinary.com/dexcw6vg0/image/upload/v1754821750/rcpqj7mzayco2ndwioqp.png" 
								alt="Rev. Rudy Salomon Trigo, D.D. - Our Founding Minister" 
								class="founder-legacy-photo"
							/>
							<p class="founder-legacy-caption">Rev. Rudy Salomon Trigo, D.D.<br><span>Our Founding Minister (1938-2011)</span></p>
						</div>
					</div>
				</div>

				<div class="ministry-approach">
					<h3>Our Leadership Approach</h3>
					<div class="approach-grid">
						<div class="approach-card">
							<h4>Biblical Foundation</h4>
							<p>Grounding all ministry activities in Scripture and sound theological principles, ensuring that our church remains true to God's Word.</p>
						</div>
						<div class="approach-card">
							<h4>Pastoral Care</h4>
							<p>Providing compassionate spiritual guidance and support to congregation members through life's joys and challenges.</p>
						</div>
						<div class="approach-card">
							<h4>Community Engagement</h4>
							<p>Actively participating in and serving the broader Tagbilaran community through outreach and service initiatives.</p>
						</div>
						<div class="approach-card">
							<h4>Discipleship Focus</h4>
							<p>Equipping believers for spiritual growth and service, developing leaders who can carry the ministry forward.</p>
						</div>
					</div>
				</div>

				<div class="ministry-vision">
					<h3>Vision for the Future</h3>
					<div class="vision-content">
						<p>
							Under current leadership, March of Faith Incorporated continues to build upon its strong foundation while adapting to serve the evolving needs of our community. Our vision encompasses:
						</p>
						
						<div class="vision-points">
							<div class="vision-point">
								<h4>Strengthened Fellowship</h4>
								<p>Deepening the bonds of Christian community through enhanced worship experiences, small group ministries, and fellowship opportunities that bring believers together in meaningful ways.</p>
							</div>
							
							<div class="vision-point">
								<h4>Expanded Outreach</h4>
								<p>Reaching more people in Bohol and beyond with the Gospel message, utilizing both traditional and contemporary methods of evangelism and community service.</p>
							</div>
							
							<div class="vision-point">
								<h4>Leadership Development</h4>
								<p>Nurturing the next generation of Christian leaders through mentorship, training programs, and practical ministry opportunities.</p>
							</div>
							
							<div class="vision-point">
								<h4>Community Impact</h4>
								<p>Making a positive difference in our local community through service projects, social initiatives, and partnerships with other organizations.</p>
							</div>
						</div>
					</div>
				</div>

				<div class="pastoral-priorities">
					<h3>Current Ministry Priorities</h3>
					<div class="priorities-list">
						<div class="priority-item">
							<div class="priority-icon">📖</div>
							<div class="priority-content">
								<h4>Biblical Teaching</h4>
								<p>Providing clear, practical exposition of Scripture that helps believers understand and apply God's Word in their daily lives.</p>
							</div>
						</div>
						
						<div class="priority-item">
							<div class="priority-icon">🤝</div>
							<div class="priority-content">
								<h4>Community Building</h4>
								<p>Fostering genuine relationships within our church family and creating welcoming spaces for newcomers.</p>
							</div>
						</div>
						
						<div class="priority-item">
							<div class="priority-icon">💒</div>
							<div class="priority-content">
								<h4>Worship Excellence</h4>
								<p>Leading meaningful worship experiences that honor God and inspire spiritual growth among all participants.</p>
							</div>
						</div>
						
						<div class="priority-item">
							<div class="priority-icon">❤️</div>
							<div class="priority-content">
								<h4>Compassionate Care</h4>
								<p>Providing pastoral support during times of joy, sorrow, and everything in between with Christ-like compassion.</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="sidebar-content">
				<div class="contact-card">
					<h3>Connect with Leadership</h3>
					<div class="contact-info">
						<div class="contact-item">
							<strong>Church Office:</strong>
							<span>+63 99 9953 6700</span>
						</div>
						<div class="contact-item">
							<strong>Email:</strong>
							<span>marchoffaithincorporated@gmail.com</span>
						</div>
						<div class="contact-item">
							<strong>Location:</strong>
							<span>San Isidro District<br>Tagbilaran City, Bohol</span>
						</div>
						<div class="contact-item">
							<strong>Office Hours:</strong>
							<span>Monday - Friday<br>9:00 AM - 4:00 PM</span>
						</div>
					</div>
					<a href="/contact" class="contact-button">Visit Us</a>
				</div>

				<div class="scripture-card">
					<h3>Leadership Verse</h3>
					<blockquote>
						"Be shepherds of God's flock that is under your care, watching over them—not because you must, but because you are willing, as God wants you to be; not pursuing dishonest gain, but eager to serve."
						<cite>- 1 Peter 5:2</cite>
					</blockquote>
				</div>

				<div class="ministry-stats-card">
					<h3>Our Ministry</h3>
					<div class="stats-list">
						<div class="stat-item">
							<strong>50+ Years</strong>
							<span>of faithful service</span>
						</div>
						<div class="stat-item">
							<strong>Weekly Services</strong>
							<span>Multiple worship times</span>
						</div>
						<div class="stat-item">
							<strong>Bible Studies</strong>
							<span>Wednesday evenings</span>
						</div>
						<div class="stat-item">
							<strong>Community</strong>
							<span>Outreach programs</span>
						</div>
					</div>
				</div>

				<div class="prayer-card">
					<h3>Prayer Request</h3>
					<p>We believe in the power of prayer and would be honored to pray for you. Please don't hesitate to share your prayer requests with our pastoral team.</p>
					<a href="/contact" class="prayer-button">Submit Prayer Request</a>
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

	/* Leadership Intro */
	.leadership-intro {
		background: white;
		padding: 2rem;
		border-radius: 10px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.leadership-intro h2 {
		font-size: 2.5rem;
		color: #981B1E;
		margin-bottom: 1.5rem;
		font-weight: 700;
	}

	.lead-text {
		font-size: 1.1rem;
		line-height: 1.8;
		color: #555;
		margin: 0;
	}

	/* Leadership Content */
	.leadership-content {
		display: flex;
		gap: 2rem;
		align-items: flex-start;
	}

	.leadership-text {
		flex: 1;
	}

	.founder-legacy {
		flex-shrink: 0;
		text-align: center;
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 10px;
		border-top: 4px solid #C1272D;
	}

	.founder-legacy-photo {
		width: 120px;
		height: 160px;
		object-fit: cover;
		border-radius: 10px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
		margin-bottom: 1rem;
	}

	.founder-legacy-caption {
		font-size: 0.9rem;
		color: #981B1E;
		font-weight: 600;
		margin: 0;
		line-height: 1.3;
	}

	.founder-legacy-caption span {
		font-size: 0.8rem;
		color: #666;
		font-weight: 400;
	}

	/* Ministry Approach */
	.ministry-approach {
		background: white;
		padding: 2rem;
		border-radius: 10px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.ministry-approach h3 {
		font-size: 2rem;
		color: #981B1E;
		margin-bottom: 1.5rem;
		font-weight: 600;
	}

	.approach-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}

	.approach-card {
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 8px;
		border-left: 4px solid #C1272D;
	}

	.approach-card h4 {
		color: #981B1E;
		font-size: 1.1rem;
		margin-bottom: 0.5rem;
		font-weight: 600;
	}

	.approach-card p {
		color: #666;
		line-height: 1.5;
		margin: 0;
		font-size: 0.9rem;
	}

	/* Ministry Vision */
	.ministry-vision {
		background: white;
		padding: 2rem;
		border-radius: 10px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.ministry-vision h3 {
		font-size: 2rem;
		color: #981B1E;
		margin-bottom: 1.5rem;
		font-weight: 600;
	}

	.vision-content p {
		color: #666;
		line-height: 1.6;
		margin-bottom: 2rem;
	}

	.vision-point {
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: #f8f9fa;
		border-radius: 8px;
	}

	.vision-point h4 {
		color: #C1272D;
		font-size: 1.2rem;
		margin-bottom: 0.5rem;
		font-weight: 600;
	}

	.vision-point p {
		color: #666;
		line-height: 1.5;
		margin: 0;
	}

	/* Pastoral Priorities */
	.pastoral-priorities {
		background: white;
		padding: 2rem;
		border-radius: 10px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	.pastoral-priorities h3 {
		font-size: 2rem;
		color: #981B1E;
		margin-bottom: 1.5rem;
		font-weight: 600;
	}

	.priority-item {
		display: flex;
		align-items: flex-start;
		gap: 1.5rem;
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: #f8f9fa;
		border-radius: 8px;
	}

	.priority-item:last-child {
		margin-bottom: 0;
	}

	.priority-icon {
		font-size: 2rem;
		flex-shrink: 0;
		margin-top: 0.5rem;
	}

	.priority-content h4 {
		color: #981B1E;
		font-size: 1.2rem;
		margin-bottom: 0.5rem;
		font-weight: 600;
	}

	.priority-content p {
		color: #666;
		line-height: 1.5;
		margin: 0;
	}

	/* Sidebar */
	.contact-card,
	.scripture-card,
	.ministry-stats-card,
	.prayer-card {
		background: white;
		padding: 2rem;
		border-radius: 10px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.contact-card h3,
	.scripture-card h3,
	.ministry-stats-card h3,
	.prayer-card h3 {
		color: #981B1E;
		font-size: 1.3rem;
		margin-bottom: 1.5rem;
		font-weight: 600;
		border-bottom: 2px solid #C1272D;
		padding-bottom: 0.5rem;
	}

	.contact-item,
	.stat-item {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 0.75rem 0;
		border-bottom: 1px solid #f0f0f0;
	}

	.contact-item:last-child,
	.stat-item:last-child {
		border-bottom: none;
	}

	.contact-item strong,
	.stat-item strong {
		color: #333;
		font-weight: 600;
		min-width: 100px;
	}

	.contact-item span,
	.stat-item span {
		color: #666;
		text-align: right;
	}

	.contact-button,
	.prayer-button {
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

	.contact-button:hover,
	.prayer-button:hover {
		background: #981B1E;
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

	.prayer-card p {
		color: #666;
		line-height: 1.6;
		margin-bottom: 1rem;
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

		.approach-grid {
			grid-template-columns: 1fr;
		}

		.priority-item {
			flex-direction: column;
			gap: 1rem;
		}

		.tab-link {
			padding: 1rem 1.5rem;
			font-size: 0.9rem;
		}

		.container {
			padding: 0 1rem;
		}

		.leadership-content {
			flex-direction: column;
			text-align: center;
			gap: 1.5rem;
		}

		.founder-legacy {
			padding: 1rem;
		}

		.founder-legacy-photo {
			width: 100px;
			height: 130px;
		}
	}
</style>