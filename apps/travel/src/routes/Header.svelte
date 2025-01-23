<script>
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	let isScrolled = false;
  
	if (browser) {
	  window.addEventListener('scroll', () => {
		isScrolled = window.scrollY > 50;
	  });
	}
  </script>
  
  <header class:scrolled={isScrolled}>
	<div class="header-container">
	  <a href="/" class="logo">
		<img src="https://i.ibb.co/9q9XKrt/clipart1133673.png" alt="clipart1133673" >
	  </a>
  
	  <nav>
		<a href="/" class:active={$page.url.pathname === '/'}>HOME</a>
		<a href="/about" class:active={$page.url.pathname === '/about'}>ABOUT</a>
		<!-- <a href="/waves" class:active={$page.url.pathname === '/waves'}>WAVES</a> -->
		<a href="/gallery" class:active={$page.url.pathname === '/gallery'}>GALLERY</a>
	  </nav>
  
	  <div class="cta-buttons">
		<a href="https://wa.me/yourphonenumber" class="whatsapp-btn">
		  WHATSAPP
		</a>
		<!-- <a href="/book" class="book-btn">BOOK NOW</a> -->
	  </div>
	</div>
  </header>
  
  <style>
	header {
	  position: fixed;
	  top: 0;
	  left: 0;
	  right: 0;
	  z-index: 1000;
	  padding: 1rem 2rem;
	  transition: all 0.3s ease;
	  background: transparent;
	}
  
	header.scrolled {
	  background: rgba(255, 255, 255, 0.95);
	  backdrop-filter: blur(10px);
	  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}
  
	.header-container {
	  max-width: 1400px;
	  margin: 0 auto;
	  display: flex;
	  justify-content: space-between;
	  align-items: center;
	}
  
	.logo img {
	  height: 40px;
	}
  
	nav {
	  display: flex;
	  gap: 2.5rem;
	}
  
	nav a {
	  color: white;
	  text-decoration: none;
	  font-weight: 500;
	  letter-spacing: 1px;
	  transition: color 0.3s ease;
	}
  
	.scrolled nav a {
	  color: #333;
	}
  
	nav a:hover, nav a.active {
	  color: var(--color-theme-1);
	}
  
	.cta-buttons {
	  display: flex;
	  gap: 1rem;
	  align-items: center;
	}
  
	.whatsapp-btn, .book-btn {
	  padding: 0.5rem 1rem;
	  text-decoration: none;
	  font-weight: 500;
	  letter-spacing: 1px;
	  border-radius: 4px;
	  transition: all 0.3s ease;
	}
  
	.whatsapp-btn {
	  color: white;
	  display: flex;
	  align-items: center;
	  gap: 0.5rem;
	}
  
	.book-btn {
	  background: #ff4b4b;
	  color: white;
	}
  
	.book-btn:hover {
	  background: #ff3333;
	  transform: translateY(-2px);
	}
  
	.scrolled .whatsapp-btn {
	  color: #333;
	}
  </style>