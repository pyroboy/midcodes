<svelte:head>
	<title>Church Locations Map - March of Faith Incorporated</title>
	<meta name="description" content="Find March of Faith church locations across Bohol and Negros Oriental. Get directions to our headquarters in Tagbilaran City and satellite churches." />
</svelte:head>

<div class="text-column">
	<h1>Find Us</h1>

	<div class="map-container">
		<div class="map-placeholder">
			<p>Interactive Map Coming Soon</p>
			<p class="map-note">We're located at: 123 Main Street, Cityville</p>
		</div>
	</div>

	<div class="directions">
		<h2>Getting Here</h2>
		<div class="direction-methods">
			<div class="method">
				<h3>By Car</h3>
				<p>Parking available in our main lot and street parking</p>
			</div>
			<div class="method">
				<h3>Public Transit</h3>
				<p>Bus routes 10 and 15 stop directly in front of the church</p>
			</div>
			<div class="method">
				<h3>Accessibility</h3>
				<p>Wheelchair accessible entrance and facilities available</p>
			</div>
		</div>
	</div>
</div>

<style>
	.map-container {
		margin: 2rem 0;
	}

	.map-placeholder {
		background-color: var(--color-bg-2);
		height: 400px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		border-radius: 8px;
	}

	.map-note {
		margin-top: 1rem;
		font-style: italic;
	}

	.direction-methods {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
		margin-top: 1.5rem;
	}

	.method {
		background-color: var(--color-bg-2);
		padding: 1rem;
		border-radius: 4px;
	}

	.method h3 {
		color: var(--color-theme-1);
		margin-bottom: 0.5rem;
	}
</style>