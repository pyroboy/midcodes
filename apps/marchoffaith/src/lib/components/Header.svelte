<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	
	let isMobileMenuOpen = false;
	
	function toggleMobileMenu() {
		isMobileMenuOpen = !isMobileMenuOpen;
		updateBodyScroll();
	}
	
	function closeMobileMenu() {
		isMobileMenuOpen = false;
		updateBodyScroll();
	}
	
	function updateBodyScroll() {
		if (typeof document !== 'undefined') {
			if (isMobileMenuOpen) {
				document.body.classList.add('menu-open');
			} else {
				document.body.classList.remove('menu-open');
			}
		}
	}
	
	// Close menu when clicking outside
	onMount(() => {
		function handleClickOutside(event) {
			const header = document.querySelector('header');
			if (header && !header.contains(event.target)) {
				isMobileMenuOpen = false;
			}
		}
		
		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	});
</script>

<header>
	<div class="header-brand">
		<a href="/" class="brand-link">
			<img 
				src="https://res.cloudinary.com/dexcw6vg0/image/upload/v1763355713/ojlomimmfvtgwzxjyptq.webp" 
				alt="March of Faith Logo" 
				class="brand-logo"
			/>
			<div class="brand-text">
				<span class="brand-name">March of Faith Inc.</span>
				<span class="brand-subtitle">Every Creature is Reachable</span>
			</div>
		</a>
	</div>

	<!-- Mobile Menu Toggle -->
	<button class="mobile-menu-toggle" on:click={toggleMobileMenu} aria-label="Toggle menu">
		<div class="hamburger" class:open={isMobileMenuOpen}>
			<span></span>
			<span></span>
			<span></span>
		</div>
	</button>

	<!-- Desktop Navigation -->
	<nav class="desktop-nav">
		<ul>
			<li aria-current={$page.url.pathname === '/' ? 'page' : undefined}>
				<a href="/">Home</a>
			</li>
			<li aria-current={$page.url.pathname.startsWith('/about') ? 'page' : undefined}>
				<a href="/about">About</a>
			</li>
			<li aria-current={$page.url.pathname === '/churches' ? 'page' : undefined}>
				<a href="/churches">Churches</a>
			</li>
			<li aria-current={$page.url.pathname === '/pastors' ? 'page' : undefined}>
				<a href="/pastors">Pastors</a>
			</li>
			<li aria-current={$page.url.pathname === '/docs' ? 'page' : undefined}>
				<a href="/docs">Resources</a>
			</li>
			<li aria-current={$page.url.pathname === '/contact' ? 'page' : undefined}>
				<a href="/contact">Contact</a>
			</li>
				<li aria-current={$page.url.pathname === '/news' ? 'page' : undefined}>
				<a href="/news">News</a>
			</li>
		</ul>
	</nav>

	<!-- Desktop Header Actions -->
	<div class="header-actions desktop-only">
		<a href="/contact" class="visit-btn">Visit Us</a>
	</div>

	<!-- Mobile Navigation Menu -->
	<nav class="mobile-nav" class:open={isMobileMenuOpen}>
		<ul>
			<li aria-current={$page.url.pathname === '/' ? 'page' : undefined}>
				<a href="/" on:click={closeMobileMenu}>Home</a>
			</li>
			<li aria-current={$page.url.pathname.startsWith('/about') ? 'page' : undefined}>
				<a href="/about" on:click={closeMobileMenu}>About</a>
			</li>
			<li aria-current={$page.url.pathname === '/churches' ? 'page' : undefined}>
				<a href="/churches" on:click={closeMobileMenu}>Churches</a>
			</li>
			<li aria-current={$page.url.pathname === '/pastors' ? 'page' : undefined}>
				<a href="/pastors" on:click={closeMobileMenu}>Pastors</a>
			</li>
			<li aria-current={$page.url.pathname === '/docs' ? 'page' : undefined}>
				<a href="/docs" on:click={closeMobileMenu}>Resources</a>
			</li>
			<li aria-current={$page.url.pathname === '/contact' ? 'page' : undefined}>
				<a href="/contact" on:click={closeMobileMenu}>Contact</a>
			</li>
			<li class="mobile-cta">
				<a href="/contact" class="visit-btn-mobile" on:click={closeMobileMenu}>Visit Us</a>
			</li>
			<li aria-current={$page.url.pathname === '/news' ? 'page' : undefined}>
				<a href="/news" on:click={closeMobileMenu}>News</a>
			</li>
		</ul>
	</nav>
</header>

<style>
	/* Professional Header Design */
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: white;
		padding: 1rem 2rem;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		position: sticky;
		top: 0;
		z-index: 100;
	}

	/* Brand Section */
	.header-brand {
		flex-shrink: 0;
	}

	.brand-link {
		display: flex;
		align-items: center;
		text-decoration: none;
		gap: 1rem;
	}

	.brand-logo {
		width: 50px;
		height: auto;
	}

	.brand-text {
		display: flex;
		flex-direction: column;
		line-height: 1.2;
	}

	.brand-name {
		font-size: 1.2rem;
		font-weight: 700;
		color: #981B1E;
	}

	.brand-subtitle {
		font-size: 0.9rem;
		color: #666;
		font-weight: 500;
	}

	/* Mobile Menu Toggle */
	.mobile-menu-toggle {
		display: none;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		z-index: 1001;
	}

	.hamburger {
		width: 24px;
		height: 18px;
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.hamburger span {
		display: block;
		width: 100%;
		height: 2px;
		background: #333;
		border-radius: 1px;
		transition: all 0.3s ease;
	}

	.hamburger.open span:nth-child(1) {
		transform: translateY(8px) rotate(45deg);
	}

	.hamburger.open span:nth-child(2) {
		opacity: 0;
	}

	.hamburger.open span:nth-child(3) {
		transform: translateY(-8px) rotate(-45deg);
	}

	/* Desktop Navigation */
	.desktop-nav {
		flex: 1;
		display: flex;
		justify-content: center;
	}

	.desktop-nav ul {
		display: flex;
		list-style: none;
		margin: 0;
		padding: 0;
		gap: 2rem;
		align-items: center;
	}

	.desktop-nav li {
		position: relative;
	}

	.desktop-nav a {
		display: flex;
		align-items: center;
		padding: 0.75rem 1rem;
		text-decoration: none;
		color: #333;
		font-weight: 600;
		font-size: 0.95rem;
		transition: all 0.3s ease;
		border-radius: 5px;
	}

	.desktop-nav a:hover {
		color: #981B1E;
		background: #f8f9fa;
	}

	/* Mobile Navigation */
	.mobile-nav {
		display: none;
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100vh;
		background: rgba(0, 0, 0, 0.95);
		z-index: 1000;
		opacity: 0;
		visibility: hidden;
		transition: all 0.3s ease;
	}

	.mobile-nav.open {
		opacity: 1;
		visibility: visible;
	}

	.mobile-nav ul {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100%;
		list-style: none;
		margin: 0;
		padding: 2rem;
		gap: 1.5rem;
	}

	.mobile-nav a {
		color: white;
		text-decoration: none;
		font-size: 1.5rem;
		font-weight: 600;
		padding: 1rem 2rem;
		border-radius: 8px;
		transition: all 0.3s ease;
		text-align: center;
		min-width: 200px;
	}

	.mobile-nav a:hover {
		background: #981B1E;
		transform: scale(1.05);
	}

	.visit-btn-mobile {
		background: #C1272D !important;
		color: white !important;
		border-radius: 25px !important;
		padding: 1rem 2rem !important;
		margin-top: 1rem !important;
	}

	.visit-btn-mobile:hover {
		background: #981B1E !important;
		transform: scale(1.05) !important;
	}

	/* Active Page Indicator */
	li[aria-current='page'] a {
		color: #981B1E;
		background: #f8f9fa;
	}

	.mobile-nav li[aria-current='page'] a {
		color: #C1272D;
		background: rgba(193, 39, 45, 0.1);
	}


	/* Header Actions */
	.header-actions {
		flex-shrink: 0;
	}

	.visit-btn {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: #C1272D;
		color: white;
		text-decoration: none;
		font-weight: 600;
		border-radius: 25px;
		transition: all 0.3s ease;
		font-size: 0.9rem;
	}

	.visit-btn:hover {
		background: #981B1E;
		transform: translateY(-2px);
		box-shadow: 0 5px 15px rgba(193, 39, 45, 0.3);
	}

	/* Mobile Responsiveness */
	@media (max-width: 1024px) {
		header {
			padding: 1rem 1.5rem;
		}

		.desktop-nav ul {
			gap: 1.5rem;
		}

		.brand-text {
			display: none;
		}
	}

	@media (max-width: 768px) {
		header {
			justify-content: space-between;
			align-items: center;
			padding: 1rem;
		}

		/* Show hamburger menu */
		.mobile-menu-toggle {
			display: block;
		}

		/* Hide desktop navigation */
		.desktop-nav,
		.desktop-only {
			display: none;
		}

		/* Show mobile navigation */
		.mobile-nav {
			display: block;
		}

		/* Adjust brand logo size */
		.brand-logo {
			width: 45px;
		}
	}

	@media (max-width: 480px) {
		header {
			padding: 0.75rem 1rem;
		}

		.brand-logo {
			width: 40px;
		}

		.mobile-nav a {
			font-size: 1.3rem;
			padding: 0.75rem 1.5rem;
			min-width: 180px;
		}

		.mobile-nav ul {
			padding: 1.5rem;
			gap: 1.25rem;
		}
	}

	/* Prevent body scroll when mobile menu is open */
	@media (max-width: 768px) {
		:global(body.menu-open) {
			overflow: hidden;
		}
	}
</style>