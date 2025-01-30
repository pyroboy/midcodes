<svelte:head>
	<title>Our Pastors - Grace Community Church</title>
	<meta name="description" content="Meet our pastoral team and church leadership" />
</svelte:head>

<div class="text-column">
	<h1>Our Pastoral Team</h1>

	<div class="pastors-grid">
		<div class="pastor-card">
			<div class="pastor-image placeholder"></div>
			<h2>Rev. John Smith</h2>
			<p class="title">Senior Pastor</p>
			<p class="bio">Leading our congregation with 20 years of pastoral experience and a heart for community service.</p>
		</div>

		<div class="pastor-card">
			<div class="pastor-image placeholder"></div>
			<h2>Rev. Sarah Johnson</h2>
			<p class="title">Associate Pastor</p>
			<p class="bio">Focusing on youth ministry and family counseling with a passion for spiritual growth.</p>
		</div>

		<div class="pastor-card">
			<div class="pastor-image placeholder"></div>
			<h2>Rev. Michael Chen</h2>
			<p class="title">Worship Pastor</p>
			<p class="bio">Leading our worship ministry with a focus on contemporary and traditional worship styles.</p>
		</div>
	</div>
</div>

<style>
	.pastors-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 2rem;
		margin-top: 2rem;
	}

	.pastor-card {
		background-color: var(--color-bg-2);
		padding: 1.5rem;
		border-radius: 8px;
		text-align: center;
	}

	.pastor-image.placeholder {
		width: 150px;
		height: 150px;
		background-color: var(--color-bg-1);
		border-radius: 50%;
		margin: 0 auto 1rem;
	}

	.title {
		color: var(--color-theme-1);
		font-weight: bold;
		margin: 0.5rem 0;
	}

	.bio {
		font-size: 0.9rem;
		line-height: 1.5;
	}
</style>