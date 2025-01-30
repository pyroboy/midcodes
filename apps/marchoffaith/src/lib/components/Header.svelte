<script>
	import { page } from '$app/stores';
	// import logo from '$lib/images/svelte-logo.svg';
</script>

<header>
	<div class="corner">
		<a href="/">
			<!-- <img src={logo} alt="Church Logo" /> -->
		</a>
	</div>

	<nav>
		<ul>
			<li aria-current={$page.url.pathname === '/' ? 'page' : undefined}>
				<a href="/">Home</a>
			</li>
			<li aria-current={$page.url.pathname === '/about' ? 'page' : undefined}>
				<a href="/about">About</a>
			</li>
			<li aria-current={$page.url.pathname === '/docs' ? 'page' : undefined}>
				<a href="/docs">Docs</a>
			</li>
			<li aria-current={$page.url.pathname === '/churches' ? 'page' : undefined}>
				<a href="/churches">Churches</a>
			</li>
			<li aria-current={$page.url.pathname === '/pastors' ? 'page' : undefined}>
				<a href="/pastors">Pastors</a>
			</li>
			<li aria-current={$page.url.pathname === '/map' ? 'page' : undefined}>
				<a href="/map">Map</a>
			</li>
			<li aria-current={$page.url.pathname === '/contact' ? 'page' : undefined}>
				<a href="/contact">Contact</a>
			</li>
		</ul>
	</nav>

	<div class="corner">
		<!-- Placeholder for potential search or additional navigation -->
	</div>
</header>

<style>
	header {
		display: flex;
		justify-content: space-between;
		background-color: var(--color-bg-2);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.corner {
		width: 3em;
		height: 3em;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.corner a {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	/* .corner img {
		width: 2em;
		height: 2em;
		object-fit: contain;
	} */

	nav {
		display: flex;
		justify-content: center;
		--background: rgba(255, 255, 255, 0.7);
	}

	ul {
		position: relative;
		padding: 0;
		margin: 0;
		height: 3em;
		display: flex;
		justify-content: center;
		align-items: center;
		list-style: none;
		background: var(--background);
		background-size: contain;
	}

	li {
		position: relative;
		height: 100%;
	}

	li[aria-current='page']::before {
		--size: 6px;
		content: '';
		width: 0;
		height: 0;
		position: absolute;
		top: 0;
		left: calc(50% - var(--size));
		border: var(--size) solid transparent;
		border-top: var(--size) solid var(--color-theme-1);
	}

	nav a {
		display: flex;
		height: 100%;
		align-items: center;
		padding: 0 1rem;
		color: var(--color-text);
		font-weight: 700;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		text-decoration: none;
		transition: color 0.2s linear;
	}

	a:hover {
		color: var(--color-theme-1);
	}

	@media (max-width: 768px) {
		nav ul {
			flex-wrap: wrap;
			height: auto;
			padding: 0.5rem;
		}

		nav li {
			height: 2.5em;
		}
	}
</style>