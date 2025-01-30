<script>
</script>

<svelte:head>
	<meta name="description" content="Welcome to Grace Community Church" />
</svelte:head>

<section class="hero">
	<div class="hero-content">
		<h1>Welcome to Grace Community Church</h1>
		<p class="subtitle">Where Faith Meets Community</p>
		<div class="cta-buttons">
			<a href="/contact" class="button primary">Join Us Sunday</a>
			<a href="/about" class="button secondary">Learn More</a>
		</div>
	</div>
</section>

<section class="welcome-section">
	<div class="text-column">
		<h2>Join Us in Worship</h2>
		<p>
			We are a welcoming community dedicated to spreading God's love and message. Join us for
			worship services, community outreach, and spiritual growth.
		</p>
		<div class="service-times">
			<h3>Service Times</h3>
			<p>Sunday Worship: 9:00 AM & 11:00 AM</p>
			<p>Wednesday Bible Study: 7:00 PM</p>
		</div>
	</div>
</section>

<style>
	.hero {
		background-color: var(--color-bg-2);
		padding: 4rem 1rem;
		text-align: center;
		margin-bottom: 2rem;
	}

	.hero-content {
		max-width: var(--column-width);
		margin: 0 auto;
	}

	.hero h1 {
		font-size: 2.8rem;
		margin-bottom: 1rem;
		color: var(--color-theme-1);
	}

	.subtitle {
		font-size: 1.5rem;
		margin-bottom: 2rem;
		color: var(--color-text);
	}

	.cta-buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-top: 2rem;
	}

	.button {
		padding: 0.8rem 1.5rem;
		border-radius: 4px;
		text-decoration: none;
		font-weight: bold;
		transition: all 0.2s ease;
	}

	.button.primary {
		background-color: var(--color-theme-1);
		color: white;
	}

	.button.secondary {
		background-color: var(--color-theme-2);
		color: white;
	}

	.button:hover {
		opacity: 0.9;
		transform: translateY(-2px);
	}

	.welcome-section {
		padding: 2rem 1rem;
	}

	.service-times {
		margin-top: 2rem;
		padding: 1rem;
		background-color: var(--color-bg-1);
		border-radius: 8px;
	}

	.service-times h3 {
		color: var(--color-theme-1);
		margin-bottom: 1rem;
	}

	@media (max-width: 480px) {
		.hero h1 {
			font-size: 2rem;
		}

		.subtitle {
			font-size: 1.2rem;
		}

		.cta-buttons {
			flex-direction: column;
		}
	}
</style>