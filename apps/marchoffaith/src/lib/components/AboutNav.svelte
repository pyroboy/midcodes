<script>
	import { page } from '$app/stores';
</script>

<section class="about-nav">
	<div class="container">
		<nav class="tab-navigation">
			<a 
				href="/about" 
				class="tab-link" 
				class:active={$page.url.pathname === '/about'}
			>
				Overview
			</a>
			<a 
				href="/about/history-purpose" 
				class="tab-link"
				class:active={$page.url.pathname === '/about/history-purpose'}
			>
				History & Purpose
			</a>
			<a 
				href="/about/founding-minister" 
				class="tab-link"
				class:active={$page.url.pathname === '/about/founding-minister'}
			>
				Founding Minister
			</a>
			<a 
				href="/about/presiding-minister" 
				class="tab-link"
				class:active={$page.url.pathname === '/about/presiding-minister'}
			>
				Presiding Minister
			</a>
		</nav>
	</div>
</section>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.about-nav {
		background: white;
		border-bottom: 1px solid #e5e5e5;
		padding: 0;
	}

	.tab-navigation {
		display: flex;
		gap: 0;
		overflow-x: auto;
	}

	.tab-link {
		display: block;
		padding: 1.5rem 2rem;
		text-decoration: none;
		color: #666;
		font-weight: 600;
		border-bottom: 3px solid transparent;
		transition: all 0.3s ease;
		white-space: nowrap;
	}

	.tab-link:hover {
		color: #981B1E;
		background: #f8f9fa;
	}

	.tab-link.active {
		color: #981B1E;
		border-bottom-color: #C1272D;
		background: white;
	}

	@media (max-width: 768px) {
		.tab-link {
			padding: 1rem 1.5rem;
			font-size: 0.9rem;
		}

		.container {
			padding: 0 1rem;
		}
	}
</style>
