<script lang="ts">
</script>

<svelte:head>
	<title>Give - March of Faith Incorporated</title>
	<meta name="description" content="Support the ministry of March of Faith Incorporated through tithes, offerings, and donations. Give via GCash, bank transfer, or in person." />
	<meta property="og:title" content="Give - March of Faith Incorporated" />
	<meta property="og:description" content="Support the ministry of March of Faith Incorporated. Your generous giving helps us serve our communities across Bohol." />
</svelte:head>

<!-- Hero -->
<section class="hero-section">
	<div class="hero-content">
		<h1 class="hero-title">Support Our Ministry</h1>
		<p class="hero-subtitle">Your generosity changes lives and builds God's kingdom</p>
	</div>
</section>

<!-- Intro -->
<section class="intro-section">
	<div class="container">
		<p class="intro-text">
			Your generous giving supports the mission of March of Faith Incorporated as we serve our communities across Bohol and beyond. Every gift helps us spread the Gospel, care for families in need, equip future leaders, and maintain places of worship where lives are transformed.
		</p>
	</div>
</section>

<!-- Payment Methods -->
<section class="methods-section">
	<div class="container">
		<h2 class="section-heading">Ways to Give</h2>
		<div class="methods-grid">
			<!-- GCash -->
			<div class="method-card">
				<div class="method-badge">Digital</div>
				<h3>GCash</h3>
				<p class="method-info">Send to: 0999-953-6700</p>
				<p class="method-desc">
					Send your tithe or offering via GCash. Please use the reference <strong>"MOFI Tithe/Offering"</strong> so we can properly record your gift.
				</p>
			</div>

			<!-- Bank Transfer -->
			<div class="method-card">
				<div class="method-badge">Bank</div>
				<h3>Bank Transfer</h3>
				<p class="method-info">Contact us for bank details</p>
				<p class="method-desc">
					We accept bank transfers via BDO and BPI. Please reach out to our church office for the current account details and instructions.
				</p>
				<a href="mailto:marchoffaithincorporated@gmail.com" class="method-link">Email for Details</a>
			</div>

			<!-- In Person -->
			<div class="method-card">
				<div class="method-badge">In Person</div>
				<h3>Visit Us During Service</h3>
				<p class="method-info">Give during any worship service</p>
				<p class="method-desc">
					Join us for worship and give your tithes and offerings in person. Our ushers will be happy to assist you during the offering time.
				</p>
			</div>
		</div>
	</div>
</section>

<!-- Scripture -->
<section class="scripture-section">
	<div class="container">
		<blockquote class="scripture-quote">
			<p>"Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver."</p>
			<cite>2 Corinthians 9:7</cite>
		</blockquote>
	</div>
</section>

<!-- Contact -->
<section class="contact-section">
	<div class="container">
		<div class="contact-card">
			<h2>Questions About Giving?</h2>
			<p>
				For questions about tithes, offerings, or any other giving inquiries, please don't hesitate to contact us. We're here to help.
			</p>
			<a href="mailto:marchoffaithincorporated@gmail.com" class="contact-button">
				marchoffaithincorporated@gmail.com
			</a>
		</div>
	</div>
</section>

<style>
	/* Hero */
	.hero-section {
		background: #981B1E;
		padding: 4rem 2rem 3rem;
		text-align: center;
	}

	.hero-content {
		max-width: 700px;
		margin: 0 auto;
	}

	.hero-title {
		font-family: 'Montserrat', sans-serif;
		font-size: 2.75rem;
		font-weight: 800;
		color: white;
		margin: 0 0 0.75rem;
		line-height: 1.2;
	}

	.hero-subtitle {
		font-family: 'Montserrat', sans-serif;
		font-size: 1.15rem;
		color: rgba(255, 255, 255, 0.85);
		margin: 0;
		font-weight: 400;
	}

	/* Container */
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	/* Intro */
	.intro-section {
		padding: 3.5rem 0 1rem;
		background: white;
	}

	.intro-text {
		font-family: 'Montserrat', sans-serif;
		font-size: 1.1rem;
		color: #555;
		line-height: 1.8;
		text-align: center;
		max-width: 800px;
		margin: 0 auto;
	}

	/* Methods */
	.methods-section {
		padding: 3rem 0 4rem;
		background: white;
	}

	.section-heading {
		font-family: 'Montserrat', sans-serif;
		font-size: 2rem;
		font-weight: 700;
		color: #981B1E;
		text-align: center;
		margin: 0 0 2.5rem;
	}

	.methods-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 2rem;
	}

	.method-card {
		background: white;
		border-radius: 10px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		padding: 2rem;
		position: relative;
		transition: transform 0.3s ease, box-shadow 0.3s ease;
	}

	.method-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
	}

	.method-badge {
		font-family: 'Montserrat', sans-serif;
		font-size: 0.7rem;
		font-weight: 700;
		color: #C1272D;
		text-transform: uppercase;
		letter-spacing: 1px;
		margin-bottom: 0.75rem;
	}

	.method-card h3 {
		font-family: 'Montserrat', sans-serif;
		font-size: 1.25rem;
		color: #981B1E;
		margin: 0 0 0.75rem;
		font-weight: 700;
	}

	.method-info {
		font-family: 'Montserrat', sans-serif;
		color: #333;
		font-weight: 700;
		font-size: 1rem;
		margin: 0 0 0.75rem;
		line-height: 1.4;
	}

	.method-desc {
		font-family: 'Montserrat', sans-serif;
		color: #555;
		font-size: 0.95rem;
		line-height: 1.6;
		margin: 0 0 1rem;
	}

	.method-link {
		font-family: 'Montserrat', sans-serif;
		color: #C1272D;
		text-decoration: none;
		font-weight: 600;
		font-size: 0.9rem;
		transition: color 0.2s ease;
	}

	.method-link:hover {
		color: #981B1E;
		text-decoration: underline;
	}

	/* Scripture */
	.scripture-section {
		padding: 4rem 0;
		background: #f8f9fa;
	}

	.scripture-quote {
		max-width: 750px;
		margin: 0 auto;
		text-align: center;
		padding: 0;
		border: none;
	}

	.scripture-quote p {
		font-family: 'Montserrat', sans-serif;
		font-size: 1.3rem;
		color: #333;
		line-height: 1.8;
		font-style: italic;
		margin: 0 0 1rem;
		font-weight: 500;
	}

	.scripture-quote cite {
		font-family: 'Montserrat', sans-serif;
		font-size: 1rem;
		color: #981B1E;
		font-weight: 700;
		font-style: normal;
	}

	/* Contact */
	.contact-section {
		padding: 4rem 0;
		background: white;
	}

	.contact-card {
		max-width: 600px;
		margin: 0 auto;
		text-align: center;
	}

	.contact-card h2 {
		font-family: 'Montserrat', sans-serif;
		font-size: 1.5rem;
		color: #981B1E;
		margin: 0 0 1rem;
		font-weight: 700;
	}

	.contact-card p {
		font-family: 'Montserrat', sans-serif;
		font-size: 1rem;
		color: #555;
		line-height: 1.6;
		margin: 0 0 1.5rem;
	}

	.contact-button {
		display: inline-block;
		padding: 1rem 2rem;
		background: linear-gradient(45deg, #C1272D, #981B1E);
		color: white;
		text-decoration: none;
		border-radius: 25px;
		font-family: 'Montserrat', sans-serif;
		font-weight: 600;
		font-size: 1rem;
		transition: all 0.2s ease;
		box-shadow: 0 4px 15px rgba(193, 39, 45, 0.3);
	}

	.contact-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(193, 39, 45, 0.4);
		color: white;
		text-decoration: none;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.hero-title {
			font-size: 1.75rem;
		}

		.hero-section {
			padding: 3rem 1.5rem 2.5rem;
		}

		.container {
			padding: 0 1rem;
		}

		.methods-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.scripture-quote p {
			font-size: 1.1rem;
		}
	}
</style>
