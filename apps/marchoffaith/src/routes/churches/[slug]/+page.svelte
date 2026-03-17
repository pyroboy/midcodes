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

	function getGoogleMapsUrl(): string {
		const query = encodeURIComponent(
			`${data.church.name} ${data.church.street} ${data.church.city} ${data.church.province}`
		);
		return `https://www.google.com/maps/search/?api=1&query=${query}`;
	}

	function getInitials(name: string): string {
		return name
			.split(' ')
			.map((w) => w[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	}
</script>

<svelte:head>
	<title>{data.church.name} - March of Faith Incorporated</title>
	<meta
		name="description"
		content="{data.church.name} - A March of Faith Incorporated church in {data.church.city}, {data.church.province}. Join us for worship and fellowship."
	/>
	<meta property="og:title" content="{data.church.name} - March of Faith Incorporated" />
	<meta
		property="og:description"
		content="Visit {data.church.name} in {data.church.city}, {data.church.province}. Part of the March of Faith Incorporated family of churches."
	/>
</svelte:head>

<!-- Hero -->
<section class="hero-section">
	{#if data.church.imageUrl}
		<img src={data.church.imageUrl} alt={data.church.name} class="hero-image" />
		<div class="hero-overlay"></div>
	{/if}
	<div class="hero-content">
		<h1 class="hero-title">{data.church.name}</h1>
		<p class="hero-location">{data.church.street}, {data.church.city}, {data.church.province}</p>
	</div>
</section>

<!-- Back Link -->
<section class="back-section">
	<div class="container">
		<a href="/churches" class="back-link">&larr; Back to Churches</a>
	</div>
</section>

<!-- Main Content -->
<section class="detail-section">
	<div class="container">
		<div class="content-layout">
			<!-- Main Column -->
			<div class="main-content">
				<!-- Service Schedule -->
				{#if data.church.services && data.church.services.length > 0}
					<div class="content-card">
						<h2>Service Schedule</h2>
						<table class="schedule-table">
							<thead>
								<tr>
									<th>Day</th>
									<th>Time</th>
									<th>Service</th>
								</tr>
							</thead>
							<tbody>
								{#each data.church.services as service}
									<tr>
										<td class="schedule-day">{service.day}</td>
										<td class="schedule-time">{service.time}</td>
										<td class="schedule-type">{service.type}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}

				<!-- Upcoming Events -->
				{#if data.events.length > 0}
					<div class="content-card">
						<h2>Upcoming Events</h2>
						<div class="events-list">
							{#each data.events as event}
								<div class="event-item">
									{#if event.imageUrl}
										<img src={event.imageUrl} alt={event.title} class="event-thumb" loading="lazy" />
									{:else}
										<div class="event-thumb-placeholder"></div>
									{/if}
									<div class="event-info">
										<time class="event-date">
											{formatEventDate(event.date)} &middot; {formatEventTime(event.date)}
										</time>
										<h3 class="event-title">{event.title}</h3>
										{#if event.location}
											<p class="event-location">{event.location}</p>
										{/if}
										{#if event.description}
											<p class="event-desc">
												{event.description.length > 120
													? event.description.slice(0, 120).trimEnd() + '...'
													: event.description}
											</p>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Sidebar -->
			<div class="sidebar-content">
				<!-- Quick Facts -->
				<div class="sidebar-card">
					<h3>Quick Facts</h3>
					<div class="facts-list">
						{#if data.church.yearFounded}
							<div class="fact-item">
								<strong>Founded</strong>
								<span>{data.church.yearFounded}</span>
							</div>
						{/if}
						{#if data.church.totalMembers}
							<div class="fact-item">
								<strong>Members</strong>
								<span>{new Intl.NumberFormat('en-US').format(data.church.totalMembers)}</span>
							</div>
						{/if}
					</div>
				</div>

				<!-- Pastors -->
				{#if data.pastors.length > 0}
					<div class="sidebar-card">
						<h3>Pastors</h3>
						<div class="pastors-list">
							{#each data.pastors as pastor}
								<a href="/pastors/{pastor.slug}" class="pastor-item">
									{#if pastor.photoUrl}
										<img src={pastor.photoUrl} alt={pastor.name} class="pastor-photo" />
									{:else}
										<div class="pastor-initials">{getInitials(pastor.name)}</div>
									{/if}
									<div class="pastor-info">
										<span class="pastor-name">{pastor.name}</span>
										<span class="pastor-role">{pastor.role}</span>
									</div>
								</a>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Contact -->
				<div class="sidebar-card">
					<h3>Contact</h3>
					<div class="contact-list">
						{#if data.church.phone}
							<div class="contact-item">
								<strong>Phone</strong>
								<a href="tel:{data.church.phone}">{data.church.phone}</a>
							</div>
						{/if}
						{#if data.church.email}
							<div class="contact-item">
								<strong>Email</strong>
								<a href="mailto:{data.church.email}">{data.church.email}</a>
							</div>
						{/if}
					</div>
				</div>

				<!-- Social Links -->
				{#if data.church.facebookHandle || data.church.instagramHandle || data.church.youtubeHandle}
					<div class="sidebar-card">
						<h3>Follow Us</h3>
						<div class="social-links">
							{#if data.church.facebookHandle}
								<a
									href="https://facebook.com/{data.church.facebookHandle}"
									target="_blank"
									rel="noopener noreferrer"
									class="social-link"
								>
									<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
										<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
									</svg>
									<span>Facebook</span>
								</a>
							{/if}
							{#if data.church.instagramHandle}
								<a
									href="https://instagram.com/{data.church.instagramHandle}"
									target="_blank"
									rel="noopener noreferrer"
									class="social-link"
								>
									<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
										<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
									</svg>
									<span>Instagram</span>
								</a>
							{/if}
							{#if data.church.youtubeHandle}
								<a
									href="https://youtube.com/{data.church.youtubeHandle}"
									target="_blank"
									rel="noopener noreferrer"
									class="social-link"
								>
									<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
										<path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
									</svg>
									<span>YouTube</span>
								</a>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Google Maps -->
				<a href={getGoogleMapsUrl()} target="_blank" rel="noopener noreferrer" class="maps-button">
					Get Directions
				</a>
			</div>
		</div>
	</div>
</section>

<style>
	/* Hero */
	.hero-section {
		position: relative;
		min-height: 350px;
		display: flex;
		align-items: flex-end;
		background: linear-gradient(135deg, #981B1E 0%, #C1272D 50%, #981B1E 100%);
		overflow: hidden;
	}

	.hero-image {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.hero-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.1) 60%);
	}

	.hero-content {
		position: relative;
		z-index: 1;
		max-width: 1200px;
		margin: 0 auto;
		padding: 3rem 2rem;
		width: 100%;
	}

	.hero-title {
		font-family: 'Montserrat', sans-serif;
		font-size: 2.75rem;
		font-weight: 800;
		color: white;
		margin: 0 0 0.5rem;
		line-height: 1.2;
	}

	.hero-location {
		font-family: 'Montserrat', sans-serif;
		font-size: 1.1rem;
		color: rgba(255, 255, 255, 0.9);
		margin: 0;
		font-weight: 400;
	}

	/* Back Link */
	.back-section {
		background: white;
		border-bottom: 1px solid #e5e7eb;
	}

	.back-link {
		display: inline-block;
		padding: 1rem 0;
		font-family: 'Montserrat', sans-serif;
		font-size: 0.9rem;
		color: #C1272D;
		text-decoration: none;
		font-weight: 600;
		transition: color 0.2s ease;
	}

	.back-link:hover {
		color: #981B1E;
	}

	/* Container */
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	/* Detail Section */
	.detail-section {
		padding: 3rem 0 4rem;
		background: #f8f9fa;
	}

	.content-layout {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 3rem;
		align-items: start;
	}

	/* Content Cards */
	.content-card {
		background: white;
		border-radius: 10px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		padding: 2rem;
		margin-bottom: 2rem;
	}

	.content-card h2 {
		font-family: 'Montserrat', sans-serif;
		font-size: 1.5rem;
		color: #981B1E;
		margin: 0 0 1.5rem;
		font-weight: 700;
		border-bottom: 2px solid #C1272D;
		padding-bottom: 0.5rem;
	}

	/* Schedule Table */
	.schedule-table {
		width: 100%;
		border-collapse: collapse;
		font-family: 'Montserrat', sans-serif;
	}

	.schedule-table thead th {
		text-align: left;
		padding: 0.75rem 1rem;
		font-size: 0.85rem;
		font-weight: 700;
		color: #333;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		border-bottom: 2px solid #e5e7eb;
	}

	.schedule-table tbody tr {
		border-bottom: 1px solid #f0f0f0;
	}

	.schedule-table tbody tr:last-child {
		border-bottom: none;
	}

	.schedule-table td {
		padding: 0.875rem 1rem;
		font-size: 0.95rem;
	}

	.schedule-day {
		font-weight: 700;
		color: #333;
	}

	.schedule-time {
		color: #555;
		font-weight: 500;
	}

	.schedule-type {
		color: #981B1E;
		font-weight: 600;
		text-transform: uppercase;
		font-size: 0.85rem;
		letter-spacing: 0.3px;
	}

	/* Events List */
	.events-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.event-item {
		display: flex;
		gap: 1.25rem;
		align-items: flex-start;
	}

	.event-thumb {
		width: 100px;
		height: 75px;
		object-fit: cover;
		border-radius: 8px;
		flex-shrink: 0;
	}

	.event-thumb-placeholder {
		width: 100px;
		height: 75px;
		border-radius: 8px;
		flex-shrink: 0;
		background: linear-gradient(135deg, #981B1E 0%, #C1272D 100%);
	}

	.event-info {
		flex: 1;
		min-width: 0;
	}

	.event-date {
		display: block;
		font-family: 'Montserrat', sans-serif;
		font-size: 0.8rem;
		font-weight: 600;
		color: #C1272D;
		text-transform: uppercase;
		letter-spacing: 0.3px;
		margin-bottom: 0.25rem;
	}

	.event-title {
		font-family: 'Montserrat', sans-serif;
		font-size: 1.05rem;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 0.25rem;
	}

	.event-location {
		font-family: 'Montserrat', sans-serif;
		font-size: 0.85rem;
		color: #6b7280;
		margin: 0 0 0.25rem;
	}

	.event-desc {
		font-family: 'Montserrat', sans-serif;
		font-size: 0.85rem;
		color: #6b7280;
		line-height: 1.5;
		margin: 0;
	}

	/* Sidebar Cards */
	.sidebar-card {
		background: white;
		border-radius: 10px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		padding: 1.75rem;
		margin-bottom: 1.5rem;
	}

	.sidebar-card h3 {
		font-family: 'Montserrat', sans-serif;
		color: #981B1E;
		font-size: 1.1rem;
		margin: 0 0 1rem;
		font-weight: 700;
		border-bottom: 2px solid #C1272D;
		padding-bottom: 0.5rem;
	}

	/* Facts */
	.fact-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 0;
		border-bottom: 1px solid #f0f0f0;
		font-family: 'Montserrat', sans-serif;
	}

	.fact-item:last-child {
		border-bottom: none;
	}

	.fact-item strong {
		color: #333;
		font-weight: 700;
	}

	.fact-item span {
		color: #555;
		font-weight: 500;
	}

	/* Pastors List */
	.pastors-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.pastor-item {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		text-decoration: none;
		padding: 0.5rem;
		border-radius: 8px;
		transition: background-color 0.2s ease;
	}

	.pastor-item:hover {
		background-color: #fef2f2;
	}

	.pastor-photo {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
		border: 2px solid #f0f0f0;
	}

	.pastor-initials {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: linear-gradient(135deg, #981B1E, #C1272D);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: 'Montserrat', sans-serif;
		font-weight: 700;
		font-size: 0.9rem;
		flex-shrink: 0;
	}

	.pastor-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.pastor-name {
		font-family: 'Montserrat', sans-serif;
		font-size: 0.95rem;
		font-weight: 600;
		color: #1f2937;
	}

	.pastor-role {
		font-family: 'Montserrat', sans-serif;
		font-size: 0.8rem;
		color: #6b7280;
	}

	/* Contact List */
	.contact-list {
		display: flex;
		flex-direction: column;
	}

	.contact-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 0;
		border-bottom: 1px solid #f0f0f0;
		font-family: 'Montserrat', sans-serif;
	}

	.contact-item:last-child {
		border-bottom: none;
	}

	.contact-item strong {
		color: #333;
		font-weight: 700;
		font-size: 0.9rem;
	}

	.contact-item a {
		color: #555;
		text-decoration: none;
		font-size: 0.9rem;
		transition: color 0.2s ease;
	}

	.contact-item a:hover {
		color: #C1272D;
	}

	/* Social Links */
	.social-links {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.social-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 1rem;
		border-radius: 8px;
		background: #f8f9fa;
		color: #333;
		text-decoration: none;
		font-family: 'Montserrat', sans-serif;
		font-size: 0.9rem;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.social-link:hover {
		background: #fef2f2;
		color: #981B1E;
	}

	/* Maps Button */
	.maps-button {
		display: block;
		width: 100%;
		padding: 1rem;
		background: linear-gradient(45deg, #C1272D, #981B1E);
		color: white;
		text-align: center;
		text-decoration: none;
		border-radius: 25px;
		font-family: 'Montserrat', sans-serif;
		font-weight: 600;
		font-size: 1rem;
		transition: all 0.2s ease;
		box-shadow: 0 4px 15px rgba(193, 39, 45, 0.3);
	}

	.maps-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(193, 39, 45, 0.4);
		color: white;
		text-decoration: none;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.hero-section {
			min-height: 250px;
		}

		.hero-title {
			font-size: 1.75rem;
		}

		.hero-content {
			padding: 2rem 1.5rem;
		}

		.container {
			padding: 0 1rem;
		}

		.content-layout {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.content-card {
			padding: 1.5rem;
		}

		.schedule-table {
			font-size: 0.85rem;
		}

		.schedule-table td,
		.schedule-table th {
			padding: 0.625rem 0.5rem;
		}

		.event-item {
			flex-direction: column;
			gap: 0.75rem;
		}

		.event-thumb,
		.event-thumb-placeholder {
			width: 100%;
			height: 150px;
		}
	}
</style>
