<script>
</script>

<svelte:head>
	<meta name="description" content="Welcome to March of Faith Incorporated, Tagbilaran, Bohol" />
</svelte:head>

<section class="simple-welcome">
	<h1>Welcome to March of Faith Incorporated</h1>
	<p class="subtitle">Tagbilaran, Bohol</p>
	<p class="welcome-message">We are glad to have you here. May your faith be strengthened as you join us in worship and fellowship.</p>
</section>

<style>
.simple-welcome {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 80vh;
	text-align: center;
}

.simple-welcome h1 {
	font-size: 2.5rem;
	color: var(--color-theme-1, #2c3e50);
	margin-bottom: 1rem;
}

.subtitle {
	font-size: 1.2rem;
	color: var(--color-theme-2, #34495e);
	margin-bottom: 1.5rem;
}

.welcome-message {
	font-size: 1.1rem;
	color: var(--color-text, #555);
}
</style>