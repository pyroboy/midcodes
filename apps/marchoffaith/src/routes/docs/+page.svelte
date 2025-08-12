<svelte:head>
	<title>Resources & Documents - March of Faith Incorporated</title>
	<meta name="description" content="Access official church documents, ministry resources, and important information for March of Faith Incorporated in Tagbilaran, Bohol." />
</svelte:head>

<!-- Hero Section -->
<section class="hero-section" role="banner" aria-labelledby="hero-title">
	<div class="container">
		<div class="hero-content">
			<h1 id="hero-title">RESOURCES & DOCUMENTS</h1>
			<p class="hero-subtitle">Official church documents, ministry resources, and important information for our community</p>
		</div>
	</div>
</section>

<!-- Resources Content -->
<section class="resources-content" role="main">
	<div class="container">
		<div class="content-layout">
			<div class="main-content">
				<!-- Church Documents Section -->
				<div class="documents-section">
					<h2 id="church-docs-title">Official Church Documents</h2>
					<div class="card-container">
						<a href="/" class="card doc-card">
							<div class="doc-info">
								<h3>Church Constitution</h3>
								<p>Governing documents and foundational principles of March of Faith Incorporated</p>
								<span class="doc-meta">PDF • Updated 2025</span>
							</div>
						</a>

						<a href="/" class="card doc-card">
							<div class="doc-info">
								<h3>Statement of Faith</h3>
								<p>Our core beliefs and doctrinal positions based on biblical principles</p>
								<span class="doc-meta">PDF • Current</span>
							</div>
						</a>

						<a href="/" class="card doc-card">
							<div class="doc-info">
								<h3>Bylaws & Policies</h3>
								<p>Church governance, membership, and operational guidelines</p>
								<span class="doc-meta">PDF • Rev. 2024</span>
							</div>
						</a>

						<a href="/" class="card doc-card">
							<div class="doc-info">
								<h3>SEC Registration</h3>
								<p>Official incorporation documents (Registration No. 0000058834)</p>
								<span class="doc-meta">PDF • 1975</span>
							</div>
						</a>
					</div>
				</div>

				<!-- Ministry Resources Section -->
				<div class="ministry-section">
					<h2 id="ministry-resources-title">Ministry Resources</h2>
					<div class="card-container">
						<a href="/" class="card doc-card">
							<div class="doc-info">
								<h3>Weekly Bulletin</h3>
								<p>Current week's announcements, events, and prayer requests</p>
								<span class="doc-meta">Updated Weekly</span>
							</div>
						</a>

						<a href="/" class="card doc-card">
							<div class="doc-info">
								<h3>Ministry Guidelines</h3>
								<p>Resources and information for ministry volunteers and leaders</p>
								<span class="doc-meta">PDF • 2024</span>
							</div>
						</a>

						<a href="/" class="card doc-card">
							<div class="doc-info">
								<h3>Leadership Manual</h3>
								<p>Training materials and guidelines for church leadership</p>
								<span class="doc-meta">PDF • Internal</span>
							</div>
						</a>

						<a href="/" class="card doc-card">
							<div class="doc-info">
								<h3>Event Guidelines</h3>
								<p>Planning guides and policies for church events and activities</p>
								<span class="doc-meta">PDF • 2024</span>
							</div>
						</a>
					</div>
				</div>
			</div>

			<div class="sidebar-content">
				<!-- Quick Access -->
				<div class="quick-access-card">
					<h3>Quick Access</h3>
					<div class="quick-links">
						<a href="/contact" class="quick-link">
							<span>Contact Church Office</span>
						</a>
						<a href="/about" class="quick-link">
							<span>About Our Church</span>
						</a>
						<a href="/churches" class="quick-link">
							<span>Find a Location</span>
						</a>
						<a href="/pastors" class="quick-link">
							<span>Our Leadership</span>
						</a>
					</div>
				</div>

				<!-- Help Section -->
				<div class="help-card">
					<h3>Need Help?</h3>
					<p>If you can't find a specific document or need assistance accessing resources, please contact our church office.</p>
					<div class="help-info">
						<div class="help-item">
							<strong>Phone:</strong>
							<span><a href="tel:+639999536700">+63 99 9953 6700</a></span>
						</div>
						<div class="help-item">
							<strong>Email:</strong>
							<span><a href="mailto:marchoffaithincorporated@gmail.com">marchoffaithincorporated@gmail.com</a></span>
						</div>
					</div>
					<a href="/contact" class="btn btn-primary help-button">Get Help</a>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	/* CSS Custom Properties - Brand Colors */
	:root {
		--deep-red: #981B1E;
		--bright-red: #C1272D;
		--white: #FFFFFF;
		--dark-gray: #333333;
		--light-gray: #F8F9FA;
	}

	/* Global Styles */
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1.5rem;
	}

	/* Hero Section */
	.hero-section {
		background: var(--deep-red);
		color: var(--white);
		padding: 3rem 0;
		text-align: center;
	}

	.hero-content h1 {
		font-family: 'Montserrat', sans-serif;
		font-size: 2.5rem;
		font-weight: 800;
		margin-bottom: 1rem;
		color: var(--white);
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.hero-subtitle {
		font-family: 'Montserrat', sans-serif;
		font-size: 1.2rem;
		font-weight: 400;
		opacity: 0.95;
		max-width: 700px;
		margin: 0 auto;
		line-height: 1.5;
	}

	/* Main Content */
	.resources-content {
		padding: 2.5rem 0;
		background: var(--light-gray);
	}

	.content-layout {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 2rem;
		align-items: start;
	}

	.documents-section,
	.ministry-section {
		margin-bottom: 2rem;
	}

	.documents-section h2,
	.ministry-section h2 {
		font-family: 'Montserrat', sans-serif;
		font-size: 1.5rem;
		color: var(--deep-red);
		margin-bottom: 1rem;
		font-weight: 700;
		border-bottom: 1px solid var(--bright-red);
		padding-bottom: 0.5rem;
	}

	/* Card Container with Zero Gaps */
	.card-container {
		display: grid;
		gap: 0;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	}

	.card {
		background: var(--white);
		border: 1px solid #e2e8f0;
		margin: 0;
		padding: 1.75rem;
		transition: all 0.2s ease;
	}

	.card:hover {
		border-color: var(--bright-red);
		box-shadow: 0 2px 8px rgba(193, 39, 45, 0.1);
	}

	.doc-card {
		text-decoration: none;
		color: inherit;
		display: block;
	}

	.doc-card:hover {
		text-decoration: none;
		color: inherit;
	}

	.doc-info h3 {
		font-family: 'Montserrat', sans-serif;
		font-size: 1.2rem;
		color: var(--deep-red);
		margin-bottom: 0.75rem;
		font-weight: 600;
	}

	.doc-info p {
		font-family: 'Montserrat', sans-serif;
		color: #555555;
		line-height: 1.5;
		margin-bottom: 0.75rem;
		font-size: 0.95rem;
	}

	.doc-meta {
		font-family: 'Montserrat', sans-serif;
		font-size: 0.8rem;
		color: var(--bright-red);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	/* Sidebar */
	.quick-access-card,
	.help-card {
		background: var(--white);
		padding: 1.75rem;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		margin-bottom: 1rem;
	}

	.quick-access-card h3,
	.help-card h3 {
		font-family: 'Montserrat', sans-serif;
		color: var(--deep-red);
		font-size: 1.1rem;
		margin-bottom: 0.75rem;
		font-weight: 700;
		border-bottom: 1px solid var(--bright-red);
		padding-bottom: 0.5rem;
	}

	.quick-links {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.quick-link {
		display: block;
		padding: 0.75rem;
		background: var(--light-gray);
		border-radius: 6px;
		text-decoration: none;
		color: var(--dark-gray);
		transition: all 0.2s ease;
		font-family: 'Montserrat', sans-serif;
		font-size: 0.9rem;
	}

	.quick-link:hover {
		background: var(--white);
		color: var(--bright-red);
		box-shadow: 0 2px 8px rgba(193, 39, 45, 0.1);
		text-decoration: none;
	}

	.help-card p {
		font-family: 'Montserrat', sans-serif;
		color: #555555;
		line-height: 1.5;
		margin-bottom: 1rem;
		font-size: 0.95rem;
	}

	.help-info {
		margin-bottom: 1rem;
	}

	.help-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
		border-bottom: 1px solid #f0f0f0;
		font-family: 'Montserrat', sans-serif;
	}

	.help-item:last-child {
		border-bottom: none;
	}

	.help-item strong {
		color: var(--dark-gray);
		font-weight: 700;
		font-size: 0.9rem;
	}

	.help-item span {
		color: #555555;
		text-align: right;
		font-size: 0.85rem;
	}

	.help-item a {
		color: var(--bright-red);
		text-decoration: none;
	}

	.help-item a:hover {
		color: var(--deep-red);
	}

	/* Brand Button Styles */
	.btn {
		padding: 0.5rem 1rem;
		border-radius: 25px;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.2s ease;
		display: inline-block;
		font-family: 'Montserrat', sans-serif;
		cursor: pointer;
		border: none;
		font-size: 0.9rem;
	}

	.btn-primary {
		background: linear-gradient(45deg, var(--bright-red), var(--deep-red));
		color: var(--white);
		box-shadow: 0 4px 15px rgba(193, 39, 45, 0.3);
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(193, 39, 45, 0.4);
		text-decoration: none;
		color: var(--white);
	}

	.help-button {
		display: block;
		width: 100%;
		text-align: center;
		padding: 0.75rem;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.hero-section {
			padding: 2rem 0;
		}

		.hero-content h1 {
			font-size: 2rem;
			margin-bottom: 0.75rem;
		}

		.hero-subtitle {
			font-size: 1.1rem;
		}

		.resources-content {
			padding: 2rem 0;
		}

		.content-layout {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.card-container {
			grid-template-columns: 1fr;
		}

		.card {
			padding: 1.5rem;
		}

		.quick-access-card,
		.help-card {
			padding: 1.5rem;
		}

		.container {
			padding: 0 1rem;
		}
	}
</style>