<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	
	let isMobileMenuOpen = false;
	let scrollY = 0;
	let isScrolled = false;

	// List of routes that should have a transparent header initially (Hero sections)
	// Sub-routes are NOT automatically included unless specified or logic is adjusted.
	// Currently, we check for exact matches or specific startsWith logic if needed.
	const transparentRoutes = [
		'/',
		'/about',
		'/churches',
		'/pastors',
		'/docs',
		'/news',
		'/contact'
	];

	// Check if current path is in the transparent list
	// We also want to handle sub-routes of /about since they seem to have hero sections too based on file structure,
	// but let's stick to the plan. The user's request implies "smart" behavior.
	// Looking at the file structure, /about/history-purpose etc might have hero sections.
	// Let's check if the pathname STARTS with any of these, but be careful.
	// Actually, the plan said: "Define a list of routes... and any subpages found to have hero sections".
	// I verified /about/history-purpose has a hero.
	// Let's make it robust:
	$: isTransparentPage = transparentRoutes.some(route => 
		$page.url.pathname === route || 
		($page.url.pathname.startsWith('/about/') && route === '/about') 
	);

	// If it's NOT a transparent page, it should be solid immediately.
	// If it IS a transparent page, it becomes solid only after scrolling.
	$: isSolid = !isTransparentPage || isScrolled;

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

	function handleScroll() {
		scrollY = window.scrollY;
		// Trigger transition after 20px of scrolling
		isScrolled = scrollY > 20;
	}
	
	onMount(() => {
		window.addEventListener('scroll', handleScroll);
		
		// Close menu when clicking outside
		function handleClickOutside(event) {
			const header = document.querySelector('header');
			if (header && !header.contains(event.target) && isMobileMenuOpen) {
				closeMobileMenu();
			}
		}
		document.addEventListener('click', handleClickOutside);

		return () => {
			window.removeEventListener('scroll', handleScroll);
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<!-- 
	Header Classes:
	- Default: Transparent background, White Text
	- Scrolled: White background, Red Text
-->
<header class:scrolled={isSolid} class:mobile-open={isMobileMenuOpen}>
	<div class="header-container">
		<div class="header-brand">
			<a href="/" class="brand-link">
				<!-- Logo Image -->
				<img 
					src="https://res.cloudinary.com/dexcw6vg0/image/upload/v1763355713/ojlomimmfvtgwzxjyptq.webp" 
					alt="March of Faith Logo" 
					class="brand-logo"
				/>
				
				<!-- Brand Text: Color transitions via CSS based on .scrolled class -->
				<div class="brand-text">
					<span class="brand-name">March of Faith Inc.</span>
				</div>
			</a>
		</div>

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
				<li aria-current={$page.url.pathname === '/news' ? 'page' : undefined}>
					<a href="/news">News</a>
				</li>
			</ul>
		</nav>

		<!-- Desktop Header Actions -->
		<div class="header-actions desktop-only">
			<a href="/contact" class="visit-btn">Visit Us</a>
		</div>

		<!-- Mobile Menu Toggle -->
		<button class="mobile-menu-toggle" on:click|stopPropagation={toggleMobileMenu} aria-label="Toggle menu">
			<div class="hamburger" class:open={isMobileMenuOpen}>
				<span></span>
				<span></span>
				<span></span>
			</div>
		</button>
	</div>

	<!-- Mobile Navigation Menu Overlay -->
	<nav class="mobile-nav" class:open={isMobileMenuOpen}>
		<div class="mobile-nav-content">
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
				<li aria-current={$page.url.pathname === '/news' ? 'page' : undefined}>
					<a href="/news" on:click={closeMobileMenu}>News</a>
				</li>
				<li class="mobile-cta">
					<a href="/contact" class="visit-btn-mobile" on:click={closeMobileMenu}>Visit Us</a>
				</li>
			</ul>
		</div>
	</nav>
</header>

<style>
	/* --- Layout & Background Transitions --- */
	header {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		z-index: 100;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		background: transparent; /* Initial transparent state */
		padding: 1.5rem 0;
	}

	/* Scrolled State: White Background */
	header.scrolled {
		background: rgba(255, 255, 255, 0.98);
		backdrop-filter: blur(12px);
		padding: 0.75rem 0;
		box-shadow: 0 4px 20px rgba(0,0,0,0.05);
		border-bottom: 1px solid rgba(0,0,0,0.05);
	}

	.header-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	/* --- Brand & Logo --- */
	.brand-link {
		display: flex;
		align-items: center;
		text-decoration: none;
		gap: 1rem;
	}

	.brand-logo {
		width: 55px;
		height: 55px;
		object-fit: contain;
		filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
		transition: all 0.3s ease;
	}

	header.scrolled .brand-logo {
		width: 45px;
		height: 45px;
		filter: none;
	}

	.brand-text {
		display: flex;
		flex-direction: column;
		line-height: 1;
	}

	.brand-name {
		font-family: 'Montserrat', sans-serif;
		font-size: 1.1rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 1px;
		transition: color 0.3s ease, text-shadow 0.3s ease;
		
		/* Default State: White Text */
		color: white;
		text-shadow: 0 2px 4px rgba(0,0,0,0.3);
	}

	/* Scrolled State: Brand Red Text */
	header.scrolled .brand-name {
		color: #981B1E; /* Change to Brand Red */
		text-shadow: none;
	}

	/* --- Navigation Links --- */
	.desktop-nav ul {
		display: flex;
		gap: 2.5rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.desktop-nav a {
		font-family: 'Montserrat', sans-serif;
		font-weight: 600;
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 1px;
		text-decoration: none;
		position: relative;
		padding: 0.5rem 0;
		transition: color 0.3s ease, text-shadow 0.3s ease;
		
		/* Default: White Link */
		color: rgba(255,255,255,0.9);
		text-shadow: 0 1px 2px rgba(0,0,0,0.2);
	}

	/* Scrolled: Dark Gray Link */
	header.scrolled .desktop-nav a {
		color: #444;
		text-shadow: none;
	}

	/* Animated Underline */
	.desktop-nav a::after {
		content: '';
		position: absolute;
		width: 0;
		height: 2px;
		bottom: 0;
		left: 50%;
		background-color: #C1272D;
		transition: all 0.3s ease;
		transform: translateX(-50%);
	}

	.desktop-nav a:hover {
		color: white;
	}
	
	.desktop-nav a:hover::after,
	.desktop-nav li[aria-current='page'] a::after {
		width: 100%;
	}

	/* Scrolled Hover State */
	header.scrolled .desktop-nav a:hover {
		color: #981B1E;
	}

	/* --- Visit Button --- */
	.visit-btn {
		padding: 0.75rem 1.75rem;
		border-radius: 4px;
		text-decoration: none;
		font-weight: 700;
		text-transform: uppercase;
		font-size: 0.85rem;
		letter-spacing: 1px;
		transition: all 0.3s ease;
		
		/* Default: White Button / Red Text */
		background: white;
		color: #981B1E;
		box-shadow: 0 4px 15px rgba(0,0,0,0.2);
		border: 1px solid transparent;
	}

	.visit-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0,0,0,0.3);
		background: #f0f0f0;
	}

	/* Scrolled: Red Button / White Text */
	header.scrolled .visit-btn {
		background: #C1272D;
		color: white;
		box-shadow: 0 4px 10px rgba(193, 39, 45, 0.3);
	}

	header.scrolled .visit-btn:hover {
		background: #981B1E; /* Darker red on hover */
	}

	/* --- Mobile Menu Toggle --- */
	.mobile-menu-toggle {
		display: none;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		z-index: 102;
	}

	.hamburger {
		width: 28px;
		height: 20px;
		position: relative;
	}

	.hamburger span {
		display: block;
		position: absolute;
		height: 2px;
		width: 100%;
		background: white; /* Default: White lines */
		border-radius: 4px;
		left: 0;
		transform: rotate(0deg);
		transition: .25s ease-in-out;
		box-shadow: 0 1px 2px rgba(0,0,0,0.3);
	}

	/* Scrolled: Dark lines */
	header.scrolled .hamburger span {
		background: #333;
		box-shadow: none;
	}

	/* Mobile Open: White lines (against red menu bg) */
	header.mobile-open .hamburger span {
		background: white;
		box-shadow: none;
	}

	.hamburger span:nth-child(1) { top: 0px; }
	.hamburger span:nth-child(2) { top: 9px; }
	.hamburger span:nth-child(3) { top: 18px; }

	.hamburger.open span:nth-child(1) { top: 9px; transform: rotate(135deg); }
	.hamburger.open span:nth-child(2) { opacity: 0; left: -60px; }
	.hamburger.open span:nth-child(3) { top: 9px; transform: rotate(-135deg); }

	/* --- Mobile Nav Overlay --- */
	.mobile-nav {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100vh;
		background: #981B1E;
		z-index: 101;
		opacity: 0;
		visibility: hidden;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.mobile-nav.open {
		opacity: 1;
		visibility: visible;
	}

	.mobile-nav ul {
		list-style: none;
		padding: 0;
		margin: 0;
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.mobile-nav a {
		color: rgba(255,255,255,0.8);
		font-size: 1.5rem;
		text-decoration: none;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 2px;
		display: inline-block;
		transition: all 0.3s ease;
	}

	.mobile-nav a:hover,
	.mobile-nav li[aria-current='page'] a {
		color: white;
		transform: scale(1.05);
	}

	.visit-btn-mobile {
		background: white;
		color: #981B1E !important;
		padding: 1rem 2.5rem;
		border-radius: 50px;
		margin-top: 1.5rem;
		font-size: 1rem !important;
		box-shadow: 0 10px 20px rgba(0,0,0,0.2);
	}

	/* --- Responsive --- */
	@media (max-width: 1024px) {
		.desktop-nav, .desktop-only { display: none; }
		.mobile-menu-toggle { display: block; }
		.header-container { padding: 0 1.5rem; }
		
		/* Ensure text color changes on mobile too if visible */
		header.scrolled .brand-name { color: #981B1E; }
	}

	@media (max-width: 480px) {
		.brand-name { font-size: 0.9rem; letter-spacing: 0.5px; }
		.brand-logo { width: 40px; height: 40px; }
		header.scrolled .brand-logo { width: 35px; height: 35px; }
	}
</style>