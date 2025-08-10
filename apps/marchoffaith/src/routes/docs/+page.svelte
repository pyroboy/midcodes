<svelte:head>
	<title>Resources & Documents - March of Faith Incorporated</title>
	<meta name="description" content="Important documents and resources for our church community across the Philippines" />
</svelte:head>

<!-- Hero Section -->
<section class="resources-hero">
	<div class="container">
		<div class="hero-content">
			<h1>Resources & Documents</h1>
			<p class="hero-subtitle">Access important church documents and ministry resources</p>
		</div>
	</div>
</section>

<!-- Resources Content -->
<section class="resources-content">
	<div class="container">
		<div class="content-layout">
			<div class="main-content">
				<!-- Church Documents Section -->
				<div class="documents-section">
					<h2>Official Church Documents</h2>
					<div class="documents-grid">
						<a href="/" class="doc-card">
							<div class="doc-icon">📋</div>
							<div class="doc-info">
								<h3>Church Constitution</h3>
								<p>Governing documents and foundational principles of March of Faith Incorporated</p>
								<span class="doc-meta">PDF • Updated 2025</span>
							</div>
						</a>

						<a href="/" class="doc-card">
							<div class="doc-icon">✝️</div>
							<div class="doc-info">
								<h3>Statement of Faith</h3>
								<p>Our core beliefs and doctrinal positions based on biblical principles</p>
								<span class="doc-meta">PDF • Current</span>
							</div>
						</a>

						<a href="/" class="doc-card">
							<div class="doc-icon">📖</div>
							<div class="doc-info">
								<h3>Bylaws & Policies</h3>
								<p>Church governance, membership, and operational guidelines</p>
								<span class="doc-meta">PDF • Rev. 2024</span>
							</div>
						</a>

						<a href="/" class="doc-card">
							<div class="doc-icon">🏛️</div>
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
					<h2>Ministry Resources</h2>
					<div class="documents-grid">
						<a href="/" class="doc-card">
							<div class="doc-icon">📰</div>
							<div class="doc-info">
								<h3>Weekly Bulletin</h3>
								<p>Current week's announcements, events, and prayer requests</p>
								<span class="doc-meta">Updated Weekly</span>
							</div>
						</a>

						<a href="/" class="doc-card">
							<div class="doc-icon">🤝</div>
							<div class="doc-info">
								<h3>Ministry Guidelines</h3>
								<p>Resources and information for ministry volunteers and leaders</p>
								<span class="doc-meta">PDF • 2024</span>
							</div>
						</a>

						<a href="/" class="doc-card">
							<div class="doc-icon">👥</div>
							<div class="doc-info">
								<h3>Leadership Manual</h3>
								<p>Training materials and guidelines for church leadership</p>
								<span class="doc-meta">PDF • Internal</span>
							</div>
						</a>

						<a href="/" class="doc-card">
							<div class="doc-icon">📅</div>
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
							<span class="link-icon">📞</span>
							<span>Contact Church Office</span>
						</a>
						<a href="/about" class="quick-link">
							<span class="link-icon">ℹ️</span>
							<span>About Our Church</span>
						</a>
						<a href="/churches" class="quick-link">
							<span class="link-icon">🏛️</span>
							<span>Find a Location</span>
						</a>
						<a href="/pastors" class="quick-link">
							<span class="link-icon">👨‍💼</span>
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
							<span>+63 99 9953 6700</span>
						</div>
						<div class="help-item">
							<strong>Email:</strong>
							<span>marchoffaithincorporated@gmail.com</span>
						</div>
					</div>
					<a href="/contact" class="help-button">Get Help</a>
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
	.resources-hero {
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

	/* Main Content */
	.resources-content {
		padding: 4rem 0;
		background: #f8f9fa;
	}

	.content-layout {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 4rem;
		align-items: start;
	}

	.documents-section,
	.ministry-section {
		margin-bottom: 3rem;
	}

	.documents-section h2,
	.ministry-section h2 {
		font-size: 2rem;
		color: #981B1E;
		margin-bottom: 2rem;
		font-weight: 600;
		border-bottom: 3px solid #C1272D;
		padding-bottom: 0.5rem;
	}

	/* Document Grid */
	.documents-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.doc-card {
		display: flex;
		align-items: flex-start;
		gap: 1.5rem;
		padding: 2rem;
		background: white;
		border-radius: 10px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		text-decoration: none;
		color: inherit;
		transition: all 0.3s ease;
		border-left: 4px solid transparent;
	}

	.doc-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
		border-left-color: #C1272D;
		text-decoration: none;
	}

	.doc-icon {
		font-size: 2.5rem;
		flex-shrink: 0;
		width: 60px;
		height: 60px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f8f9fa;
		border-radius: 8px;
	}

	.doc-info h3 {
		font-size: 1.3rem;
		color: #981B1E;
		margin-bottom: 0.5rem;
		font-weight: 600;
	}

	.doc-info p {
		color: #666;
		line-height: 1.6;
		margin-bottom: 1rem;
		font-size: 0.95rem;
	}

	.doc-meta {
		font-size: 0.8rem;
		color: #999;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	/* Sidebar */
	.quick-access-card,
	.help-card {
		background: white;
		padding: 2rem;
		border-radius: 10px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.quick-access-card h3,
	.help-card h3 {
		color: #981B1E;
		font-size: 1.3rem;
		margin-bottom: 1.5rem;
		font-weight: 600;
		border-bottom: 2px solid #C1272D;
		padding-bottom: 0.5rem;
	}

	.quick-links {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.quick-link {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 8px;
		text-decoration: none;
		color: #333;
		transition: all 0.3s ease;
		border-left: 3px solid transparent;
	}

	.quick-link:hover {
		background: white;
		border-left-color: #C1272D;
		transform: translateX(5px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		text-decoration: none;
		color: #981B1E;
	}

	.link-icon {
		font-size: 1.2rem;
		flex-shrink: 0;
	}

	.help-card p {
		color: #666;
		line-height: 1.6;
		margin-bottom: 1.5rem;
	}

	.help-info {
		margin-bottom: 1.5rem;
	}

	.help-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 0;
		border-bottom: 1px solid #f0f0f0;
	}

	.help-item:last-child {
		border-bottom: none;
	}

	.help-item strong {
		color: #333;
		font-weight: 600;
		min-width: 60px;
	}

	.help-item span {
		color: #666;
		text-align: right;
		font-size: 0.9rem;
	}

	.help-button {
		display: block;
		width: 100%;
		padding: 1rem;
		background: #C1272D;
		color: white;
		text-align: center;
		text-decoration: none;
		border-radius: 5px;
		font-weight: 600;
		transition: background 0.3s ease;
	}

	.help-button:hover {
		background: #981B1E;
		text-decoration: none;
		color: white;
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

		.documents-grid {
			grid-template-columns: 1fr;
		}

		.doc-card {
			flex-direction: column;
			text-align: center;
		}

		.container {
			padding: 0 1rem;
		}
	}
</style>