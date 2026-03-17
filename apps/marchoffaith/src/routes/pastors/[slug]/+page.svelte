<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

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
	<title>{data.pastor.name} - March of Faith Incorporated</title>
	<meta
		name="description"
		content="{data.pastor.title} {data.pastor.name} - {data.pastor.role || 'Pastor'} at March of Faith Incorporated. {data.pastor.ministryFocus ? 'Ministry focus: ' + data.pastor.ministryFocus + '.' : ''}"
	/>
	<meta property="og:title" content="{data.pastor.name} - March of Faith Incorporated" />
	<meta
		property="og:description"
		content="{data.pastor.title} {data.pastor.name} serving at March of Faith Incorporated."
	/>
</svelte:head>

<!-- Hero -->
<section class="hero-section">
	<div class="hero-content">
		<div class="hero-photo-wrapper">
			{#if data.pastor.photoUrl}
				<img src={data.pastor.photoUrl} alt={data.pastor.name} class="hero-photo" />
			{:else}
				<div class="hero-photo-fallback">{getInitials(data.pastor.name)}</div>
			{/if}
		</div>
		<h1 class="hero-name">{data.pastor.name}</h1>
		<p class="hero-title-text">{data.pastor.title}</p>
		{#if data.pastor.role}
			<p class="hero-role">{data.pastor.role}</p>
		{/if}
	</div>
</section>

<!-- Back Link -->
<section class="back-section">
	<div class="container">
		<a href="/pastors" class="back-link">&larr; Back to Pastors</a>
	</div>
</section>

<!-- Main Content -->
<section class="detail-section">
	<div class="container">
		<div class="content-layout">
			<!-- Main Column -->
			<div class="main-content">
				<!-- Bio -->
				{#if data.pastor.bio}
					<div class="content-card">
						<h2>About</h2>
						<p class="bio-text">{data.pastor.bio}</p>
					</div>
				{/if}

				<!-- Ministry Focus -->
				{#if data.pastor.ministryFocus}
					<div class="content-card">
						<h2>Ministry Focus</h2>
						<p class="ministry-text">{data.pastor.ministryFocus}</p>
					</div>
				{/if}
			</div>

			<!-- Sidebar -->
			<div class="sidebar-content">
				<!-- Contact -->
				{#if data.pastor.phone || data.pastor.email}
					<div class="sidebar-card">
						<h3>Contact</h3>
						<div class="contact-list">
							{#if data.pastor.phone}
								<div class="contact-item">
									<strong>Phone</strong>
									<a href="tel:{data.pastor.phone}">{data.pastor.phone}</a>
								</div>
							{/if}
							{#if data.pastor.email}
								<div class="contact-item">
									<strong>Email</strong>
									<a href="mailto:{data.pastor.email}">{data.pastor.email}</a>
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Church Assignments -->
				{#if data.churches.length > 0}
					<div class="sidebar-card">
						<h3>Church Assignments</h3>
						<div class="assignments-list">
							{#each data.churches as church}
								<a href="/churches/{church.slug}" class="assignment-card">
									<div class="assignment-header">
										<span class="assignment-name">{church.name}</span>
										{#if church.isPrimary}
											<span class="primary-badge">Primary</span>
										{/if}
									</div>
									<span class="assignment-role">{church.role}</span>
									<span class="assignment-location">{church.city}, {church.province}</span>
									{#if church.since}
										<span class="assignment-since">Since {church.since}</span>
									{/if}
								</a>
							{/each}
						</div>
					</div>
				{/if}
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
		max-width: 600px;
		margin: 0 auto;
	}

	.hero-photo-wrapper {
		margin-bottom: 1.5rem;
	}

	.hero-photo {
		width: 180px;
		height: 180px;
		border-radius: 50%;
		object-fit: cover;
		border: 4px solid rgba(255, 255, 255, 0.3);
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
	}

	.hero-photo-fallback {
		width: 180px;
		height: 180px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.15);
		border: 4px solid rgba(255, 255, 255, 0.3);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-family: 'Montserrat', sans-serif;
		font-size: 3.5rem;
		font-weight: 800;
		color: white;
	}

	.hero-name {
		font-family: 'Montserrat', sans-serif;
		font-size: 2.5rem;
		font-weight: 800;
		color: white;
		margin: 0 0 0.5rem;
		line-height: 1.2;
	}

	.hero-title-text {
		font-family: 'Montserrat', sans-serif;
		font-size: 1.15rem;
		color: rgba(255, 255, 255, 0.9);
		margin: 0 0 0.25rem;
		font-weight: 500;
	}

	.hero-role {
		font-family: 'Montserrat', sans-serif;
		font-size: 0.95rem;
		color: rgba(255, 255, 255, 0.7);
		margin: 0;
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.5px;
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

	.bio-text,
	.ministry-text {
		font-family: 'Montserrat', sans-serif;
		font-size: 1.05rem;
		color: #555;
		line-height: 1.8;
		margin: 0;
		white-space: pre-line;
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

	/* Contact */
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

	/* Assignments */
	.assignments-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.assignment-card {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 1rem;
		border-radius: 8px;
		background: #f8f9fa;
		border-left: 3px solid #C1272D;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.assignment-card:hover {
		background: #fef2f2;
		transform: translateX(2px);
	}

	.assignment-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.assignment-name {
		font-family: 'Montserrat', sans-serif;
		font-size: 1rem;
		font-weight: 700;
		color: #1f2937;
	}

	.primary-badge {
		font-family: 'Montserrat', sans-serif;
		font-size: 0.7rem;
		font-weight: 700;
		color: white;
		background: #C1272D;
		padding: 0.15rem 0.5rem;
		border-radius: 10px;
		text-transform: uppercase;
		letter-spacing: 0.3px;
	}

	.assignment-role {
		font-family: 'Montserrat', sans-serif;
		font-size: 0.85rem;
		color: #981B1E;
		font-weight: 600;
	}

	.assignment-location {
		font-family: 'Montserrat', sans-serif;
		font-size: 0.8rem;
		color: #6b7280;
	}

	.assignment-since {
		font-family: 'Montserrat', sans-serif;
		font-size: 0.8rem;
		color: #9ca3af;
		font-style: italic;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.hero-section {
			padding: 3rem 1.5rem 2.5rem;
		}

		.hero-photo,
		.hero-photo-fallback {
			width: 140px;
			height: 140px;
		}

		.hero-photo-fallback {
			font-size: 2.5rem;
		}

		.hero-name {
			font-size: 1.75rem;
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
	}
</style>
