<script>
	import { page } from '$app/stores';
</script>

<header>
	<div class="container">
		<a href="/" class="logo">
			Cabilao Cliff Diving
		</a>

		<nav>
			<ul>
				<li aria-current={$page.url.pathname === '/' ? 'page' : undefined}>
					<a href="/">Home</a>
				</li>
				<li aria-current={$page.url.pathname === '/packages' ? 'page' : undefined}>
					<a href="/packages">Packages</a>
				</li>
				<li aria-current={$page.url.pathname === '/gallery' ? 'page' : undefined}>
					<a href="/gallery">Gallery</a>
				</li>
				<li aria-current={$page.url.pathname === '/contact' ? 'page' : undefined}>
					<a href="/contact">Contact</a>
				</li>
			</ul>
		</nav>
	</div>
</header>

<style>
	header {
		background: rgba(255, 255, 255, 0.95);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 1000;
		backdrop-filter: blur(10px);
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.logo {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-theme-1);
		text-decoration: none;
		letter-spacing: -0.5px;
	}

	nav {
		display: flex;
		align-items: center;
	}

	ul {
		display: flex;
		gap: 2rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	li {
		position: relative;
	}

	li[aria-current='page']::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: -4px;
		height: 2px;
		background: var(--color-theme-1);
	}

	nav a {
		color: #333;
		text-decoration: none;
		font-weight: 500;
		font-size: 1rem;
		transition: color 0.2s;
	}

	nav a:hover {
		color: var(--color-theme-1);
	}

	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}

		ul {
			gap: 1rem;
		}

		.logo {
			font-size: 1.2rem;
		}
	}
</style>