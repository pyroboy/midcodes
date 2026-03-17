<script lang="ts">
</script>

<svelte:head>
	<title>Live Service - March of Faith Incorporated</title>
	<meta name="description" content="Watch March of Faith Incorporated live worship services online. Sundays 9:00 AM & 4:00 PM, Wednesdays 7:00 PM." />
	<meta property="og:title" content="Live Service - March of Faith Incorporated" />
	<meta property="og:description" content="Join our live worship services online. Stream from anywhere." />
</svelte:head>

<!-- Hero -->
<section class="hero-section">
	<div class="hero-content">
		<h1 class="hero-title">Watch Live</h1>
		<p class="hero-subtitle">Join our worship services from anywhere</p>
	</div>
</section>

<!-- Service Times -->
<section class="times-section">
	<div class="container">
		<h2 class="section-heading">Service Schedule</h2>
		<div class="times-grid">
			<div class="time-card">
				<span class="time-day">Sundays</span>
				<span class="time-value">9:00 AM & 4:00 PM</span>
			</div>
			<div class="time-card">
				<span class="time-day">Wednesdays</span>
				<span class="time-value">7:00 PM</span>
			</div>
		</div>
	</div>
</section>

<!-- Watch CTA -->
<section class="watch-section">
	<div class="container">
		<div class="watch-card">
			<div class="watch-icon">
				<svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
					<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
				</svg>
			</div>
			<h2 class="watch-heading">Watch on Facebook Live</h2>
			<p class="watch-desc">
				Our live services are streamed on our official Facebook page. Click below to join the stream during scheduled service times.
			</p>
			<a
				href="https://www.facebook.com/marchoffaithinc/live"
				target="_blank"
				rel="noopener noreferrer"
				class="watch-button"
			>
				Watch on Facebook Live
			</a>
		</div>
	</div>
</section>

<!-- Additional Info -->
<section class="info-section">
	<div class="container">
		<div class="info-grid">
			<div class="info-card">
				<h3>Missed the Stream?</h3>
				<p>
					Can't watch live? Check out our sermon archive for past messages and teachings.
				</p>
				<a href="/sermons" class="info-link">Browse Sermon Archive</a>
			</div>
			<div class="info-card">
				<h3>Livestream Availability</h3>
				<p>
					Livestream is available during scheduled service times. If the stream is not yet live, please check back during service hours.
				</p>
				<p class="info-note">Sundays 9:00 AM & 4:00 PM, Wednesdays 7:00 PM</p>
			</div>
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

	/* Service Times */
	.times-section {
		padding: 3rem 0;
		background: white;
	}

	.section-heading {
		font-family: 'Montserrat', sans-serif;
		font-size: 1.5rem;
		font-weight: 700;
		color: #981B1E;
		text-align: center;
		margin: 0 0 2rem;
	}

	.times-grid {
		display: flex;
		justify-content: center;
		gap: 2rem;
		flex-wrap: wrap;
	}

	.time-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1.5rem 2.5rem;
		background: #f8f9fa;
		border-radius: 10px;
		border-left: 3px solid #C1272D;
	}

	.time-day {
		font-family: 'Montserrat', sans-serif;
		font-size: 1.1rem;
		font-weight: 700;
		color: #333;
	}

	.time-value {
		font-family: 'Montserrat', sans-serif;
		font-size: 1rem;
		color: #981B1E;
		font-weight: 600;
	}

	/* Watch Section */
	.watch-section {
		padding: 4rem 0;
		background: #f8f9fa;
	}

	.watch-card {
		max-width: 600px;
		margin: 0 auto;
		text-align: center;
		background: white;
		border-radius: 10px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		padding: 3rem 2.5rem;
	}

	.watch-icon {
		color: #C1272D;
		margin-bottom: 1.5rem;
	}

	.watch-heading {
		font-family: 'Montserrat', sans-serif;
		font-size: 1.75rem;
		font-weight: 700;
		color: #981B1E;
		margin: 0 0 1rem;
	}

	.watch-desc {
		font-family: 'Montserrat', sans-serif;
		font-size: 1rem;
		color: #555;
		line-height: 1.7;
		margin: 0 0 2rem;
	}

	.watch-button {
		display: inline-block;
		padding: 1rem 2.5rem;
		background: linear-gradient(45deg, #C1272D, #981B1E);
		color: white;
		text-decoration: none;
		border-radius: 25px;
		font-family: 'Montserrat', sans-serif;
		font-weight: 600;
		font-size: 1.1rem;
		transition: all 0.2s ease;
		box-shadow: 0 4px 15px rgba(193, 39, 45, 0.3);
	}

	.watch-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(193, 39, 45, 0.4);
		color: white;
		text-decoration: none;
	}

	/* Info Section */
	.info-section {
		padding: 4rem 0;
		background: white;
	}

	.info-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		max-width: 900px;
		margin: 0 auto;
	}

	.info-card {
		background: #f8f9fa;
		border-radius: 10px;
		padding: 2rem;
		border-top: 3px solid #C1272D;
	}

	.info-card h3 {
		font-family: 'Montserrat', sans-serif;
		font-size: 1.15rem;
		color: #981B1E;
		margin: 0 0 0.75rem;
		font-weight: 700;
	}

	.info-card p {
		font-family: 'Montserrat', sans-serif;
		font-size: 0.95rem;
		color: #555;
		line-height: 1.6;
		margin: 0 0 1rem;
	}

	.info-link {
		font-family: 'Montserrat', sans-serif;
		color: #C1272D;
		text-decoration: none;
		font-weight: 600;
		font-size: 0.95rem;
		transition: color 0.2s ease;
	}

	.info-link:hover {
		color: #981B1E;
		text-decoration: underline;
	}

	.info-note {
		font-family: 'Montserrat', sans-serif;
		font-size: 0.85rem;
		color: #981B1E;
		font-weight: 600;
		margin: 0;
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

		.times-grid {
			flex-direction: column;
			align-items: center;
		}

		.time-card {
			width: 100%;
			max-width: 300px;
		}

		.watch-card {
			padding: 2rem 1.5rem;
		}

		.info-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
