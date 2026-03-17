<script lang="ts">
	import Hero from '$lib/components/Hero.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let submitted = $derived(form?.success === true);
</script>

<svelte:head>
	<title>Prayer Wall - March of Faith Incorporated</title>
	<meta name="description" content="Share your prayer requests and lift each other up in prayer. March of Faith Incorporated, Tagbilaran City, Bohol." />
	<meta property="og:title" content="Prayer Wall - March of Faith Incorporated" />
	<meta property="og:description" content="Share your prayer requests and lift each other up in prayer with March of Faith Incorporated." />
</svelte:head>

<Hero subtitle="Share your prayer requests and lift each other up in prayer.">
	PRAYER WALL
</Hero>

<!-- Submit Prayer Request -->
<section class="submit-section" role="region" aria-labelledby="submit-title">
	<div class="container">
		<div class="form-card">
			<h2 id="submit-title">Share Your Prayer Request</h2>
			<p class="form-intro">We believe in the power of prayer. Share what is on your heart and let our church family pray with you.</p>

			{#if submitted}
				<div class="success-message">
					<h3>Thank you for sharing your prayer request.</h3>
					<p>It will appear on the prayer wall after review. Know that our church family is lifting you up in prayer.</p>
					<a href="/prayers" class="btn btn-primary">Share Another Request</a>
				</div>
			{:else}
				{#if form?.error}
					<div class="error-message">
						<p>{form.error}</p>
					</div>
				{/if}

				<form method="POST" action="?/submit" class="prayer-form">
					<div class="form-row">
						<div class="form-group">
							<label for="name">Your Name *</label>
							<input
								type="text"
								id="name"
								name="name"
								required
								placeholder="Enter your name"
								value={form?.name ?? ''}
							/>
						</div>
						<div class="form-group">
							<label for="email">Email (optional)</label>
							<input
								type="email"
								id="email"
								name="email"
								placeholder="your@email.com"
								value={form?.email ?? ''}
							/>
						</div>
					</div>

					<div class="form-group">
						<label for="request">Prayer Request *</label>
						<textarea
							id="request"
							name="request"
							rows="5"
							required
							placeholder="Share your prayer request with us..."
						>{form?.request ?? ''}</textarea>
					</div>

					<button type="submit" class="btn btn-primary submit-button">
						Submit Prayer Request
					</button>
				</form>
			{/if}
		</div>
	</div>
</section>

<!-- Prayer Wall -->
<section class="wall-section" role="region" aria-labelledby="wall-title">
	<div class="container">
		<h2 id="wall-title">Community Prayers</h2>

		{#if data.requests.length === 0}
			<div class="empty-state">
				<p>Be the first to share a prayer request.</p>
			</div>
		{:else}
			<div class="prayer-grid">
				{#each data.requests as request}
					<div class="prayer-card">
						<p class="prayer-text">{request.request}</p>
						<div class="prayer-meta">
							<span class="prayer-name">{request.name}</span>
							<span class="prayer-date">
								{new Date(request.createdAt).toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'long',
									day: 'numeric'
								})}
							</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
	:root {
		--deep-red: #981B1E;
		--bright-red: #C1272D;
		--white: #FFFFFF;
		--dark-gray: #333333;
		--light-gray: #F8F9FA;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1.5rem;
	}

	/* Submit Section */
	.submit-section {
		padding: 3rem 0 2rem;
		background: var(--light-gray);
	}

	.form-card {
		background: var(--white);
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		max-width: 720px;
		margin: 0 auto;
	}

	.form-card h2 {
		font-family: 'Montserrat', sans-serif;
		font-size: 1.3rem;
		color: var(--deep-red);
		margin-bottom: 0.5rem;
		font-weight: 700;
		border-bottom: 1px solid var(--bright-red);
		padding-bottom: 0.5rem;
	}

	.form-intro {
		font-family: 'Montserrat', sans-serif;
		color: #555;
		font-size: 0.95rem;
		line-height: 1.6;
		margin-bottom: 1.5rem;
	}

	.prayer-form {
		max-width: 100%;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		margin-bottom: 1rem;
	}

	.form-group label {
		font-family: 'Montserrat', sans-serif;
		color: var(--dark-gray);
		font-weight: 600;
		margin-bottom: 0.5rem;
		font-size: 1rem;
	}

	.form-group input,
	.form-group textarea {
		padding: 1rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 1rem;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
		background: white;
		font-family: 'Montserrat', sans-serif;
		color: var(--dark-gray);
	}

	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: var(--bright-red);
		box-shadow: 0 0 0 4px rgba(193, 39, 45, 0.15);
	}

	.form-group textarea {
		resize: vertical;
		min-height: 120px;
	}

	.error-message {
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 6px;
		padding: 0.75rem 1rem;
		margin-bottom: 1rem;
	}

	.error-message p {
		font-family: 'Montserrat', sans-serif;
		color: #991b1b;
		font-size: 0.9rem;
		margin: 0;
	}

	.success-message {
		text-align: center;
		padding: 2rem 1rem;
	}

	.success-message h3 {
		font-family: 'Montserrat', sans-serif;
		color: var(--deep-red);
		font-size: 1.3rem;
		margin-bottom: 0.75rem;
	}

	.success-message p {
		font-family: 'Montserrat', sans-serif;
		color: #555;
		font-size: 1rem;
		line-height: 1.6;
		margin-bottom: 1.5rem;
	}

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
	}

	.btn-primary {
		background: linear-gradient(45deg, var(--bright-red), var(--deep-red));
		color: var(--white);
		box-shadow: 0 4px 15px rgba(193, 39, 45, 0.3);
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(193, 39, 45, 0.4);
	}

	.submit-button {
		padding: 1rem 2rem;
		font-size: 1rem;
		margin-top: 0.5rem;
		width: 100%;
		max-width: 280px;
	}

	/* Wall Section */
	.wall-section {
		padding: 2.5rem 0 4rem;
		background: var(--light-gray);
	}

	.wall-section h2 {
		font-family: 'Montserrat', sans-serif;
		font-size: 1.5rem;
		color: var(--deep-red);
		font-weight: 700;
		text-align: center;
		margin-bottom: 2rem;
	}

	.prayer-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.25rem;
	}

	.prayer-card {
		background: var(--white);
		padding: 1.75rem;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		border-left: 3px solid var(--bright-red);
		transition: box-shadow 0.2s ease;
	}

	.prayer-card:hover {
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
	}

	.prayer-text {
		font-family: 'Montserrat', sans-serif;
		color: var(--dark-gray);
		font-size: 0.95rem;
		line-height: 1.7;
		margin-bottom: 1rem;
		white-space: pre-line;
	}

	.prayer-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 0.75rem;
		border-top: 1px solid #f0f0f0;
	}

	.prayer-name {
		font-family: 'Montserrat', sans-serif;
		color: var(--deep-red);
		font-weight: 600;
		font-size: 0.9rem;
	}

	.prayer-date {
		font-family: 'Montserrat', sans-serif;
		color: #999;
		font-size: 0.8rem;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		background: var(--white);
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	.empty-state p {
		font-family: 'Montserrat', sans-serif;
		color: #999;
		font-size: 1rem;
		font-style: italic;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.submit-section {
			padding: 2rem 0 1.5rem;
		}

		.form-card {
			padding: 1.5rem;
		}

		.form-row {
			grid-template-columns: 1fr;
			gap: 0;
		}

		.wall-section {
			padding: 2rem 0 3rem;
		}

		.prayer-grid {
			grid-template-columns: 1fr;
		}

		.submit-button {
			max-width: 100%;
		}

		.container {
			padding: 0 1rem;
		}
	}
</style>
