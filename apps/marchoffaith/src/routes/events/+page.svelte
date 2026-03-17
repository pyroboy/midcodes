<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function formatEventDate(date: Date | string): string {
		return new Date(date).toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatEventTime(date: Date | string): string {
		return new Date(date).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	function truncate(text: string, maxLength: number): string {
		if (text.length <= maxLength) return text;
		return text.slice(0, maxLength).trimEnd() + '...';
	}
</script>

<svelte:head>
	<title>Upcoming Events - March of Faith Incorporated</title>
	<meta name="description" content="View upcoming events, services, and gatherings at March of Faith Incorporated churches across Bohol and Negros Oriental." />
	<meta property="og:title" content="Upcoming Events - March of Faith Incorporated" />
	<meta property="og:description" content="View upcoming events, services, and gatherings at March of Faith Incorporated." />
</svelte:head>

<section class="events-header">
	<div class="container">
		<h1 class="events-heading">Upcoming Events</h1>
		<p class="events-subheading">Join us in worship, fellowship, and community</p>
	</div>
</section>

<section class="events-section">
	<div class="container">
		{#if data.events.length === 0}
			<div class="empty-state">
				<p class="empty-message">No upcoming events at the moment. Check back soon!</p>
			</div>
		{:else}
			<div class="events-grid">
				{#each data.events as event}
					<article class="event-card">
						<div class="event-image-container">
							{#if event.imageUrl}
								<img
									src={event.imageUrl}
									alt={event.title}
									class="event-image"
									loading="lazy"
								/>
							{:else}
								<div class="event-image-placeholder"></div>
							{/if}
						</div>
						<div class="event-content">
							<time datetime={new Date(event.date).toISOString()} class="event-date">
								{formatEventDate(event.date)} &middot; {formatEventTime(event.date)}
							</time>
							<h2 class="event-title">{event.title}</h2>
							{#if event.location}
								<p class="event-location">{event.location}</p>
							{/if}
							{#if event.churchName}
								<p class="event-church">{event.churchName}</p>
							{/if}
							{#if event.description}
								<p class="event-description">{truncate(event.description, 150)}</p>
							{/if}
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
	.events-header {
		background: #981B1E;
		padding: 4rem 0 3rem;
		text-align: center;
	}

	.events-heading {
		font-family: 'Montserrat', sans-serif;
		font-size: 2.5rem;
		font-weight: 800;
		color: white;
		margin: 0 0 0.5rem;
		letter-spacing: -0.02em;
	}

	.events-subheading {
		font-family: 'Montserrat', sans-serif;
		font-size: 1.1rem;
		color: rgba(255, 255, 255, 0.85);
		margin: 0;
		font-weight: 400;
	}

	.events-section {
		padding: 4rem 0;
		background: #f8fafc;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1.5rem;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: white;
		border-radius: 16px;
		border: 1px solid rgba(0, 0, 0, 0.04);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
	}

	.empty-message {
		font-family: 'Montserrat', sans-serif;
		font-size: 1.1rem;
		color: #6b7280;
		margin: 0;
	}

	.events-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
		gap: 2rem;
	}

	.event-card {
		background: white;
		border-radius: 16px;
		overflow: hidden;
		transition: transform 0.3s ease, box-shadow 0.3s ease;
		border: 1px solid rgba(0, 0, 0, 0.04);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
	}

	.event-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
	}

	.event-image-container {
		position: relative;
		padding-top: 56.25%;
		overflow: hidden;
	}

	.event-image {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.5s ease;
	}

	.event-card:hover .event-image {
		transform: scale(1.05);
	}

	.event-image-placeholder {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #981B1E 0%, #C1272D 50%, #981B1E 100%);
	}

	.event-content {
		padding: 1.5rem;
	}

	.event-date {
		display: block;
		font-family: 'Montserrat', sans-serif;
		font-size: 0.875rem;
		font-weight: 600;
		color: #C1272D;
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.3px;
	}

	.event-title {
		font-family: 'Montserrat', sans-serif;
		font-size: 1.25rem;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 0.5rem;
		line-height: 1.4;
	}

	.event-location {
		font-family: 'Montserrat', sans-serif;
		font-size: 0.9rem;
		color: #4b5563;
		margin: 0 0 0.25rem;
		font-weight: 500;
	}

	.event-church {
		font-family: 'Montserrat', sans-serif;
		font-size: 0.85rem;
		color: #981B1E;
		margin: 0 0 0.75rem;
		font-weight: 600;
	}

	.event-description {
		font-family: 'Montserrat', sans-serif;
		font-size: 0.9rem;
		color: #6b7280;
		line-height: 1.6;
		margin: 0;
	}

	@media (max-width: 768px) {
		.events-heading {
			font-size: 1.75rem;
		}

		.events-grid {
			grid-template-columns: 1fr;
		}

		.events-header {
			padding: 3rem 0 2rem;
		}
	}
</style>
