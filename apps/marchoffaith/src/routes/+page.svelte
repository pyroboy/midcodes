<script>
	import { onMount } from 'svelte';

	let scrollY = 0;
	let innerHeight = 0;

	onMount(() => {
		const updateScroll = () => scrollY = window.scrollY;
		window.addEventListener('scroll', updateScroll);
		return () => window.removeEventListener('scroll', updateScroll);
	});
</script>

<svelte:head>
	<title>March of Faith Incorporated - Headquarters Church in Tagbilaran, Bohol</title>
	<meta name="description" content="Welcome to March of Faith Incorporated, the headquarters church in Tagbilaran, Bohol. Join us in worship, fellowship, and spiritual growth." />
	<meta name="keywords" content="March of Faith, church, Bohol, Tagbilaran, Philippines, Christian, worship, fellowship" />
</svelte:head>

<svelte:window bind:scrollY bind:innerHeight />

<!-- Hero Section -->
<section class="hero">
	<div class="hero-background">
		<!-- Geometric Design Elements -->
		<div class="geometric-shapes">
			<div class="shape shape-1"></div>
			<div class="shape shape-2"></div>
			<div class="shape shape-3"></div>
			<div class="shape shape-4"></div>
		</div>
		<div class="hero-overlay"></div>
		<img 
			src="https://res.cloudinary.com/dexcw6vg0/image/upload/v1763355713/ojlomimmfvtgwzxjyptq.webp" 
			alt="March of Faith Logo" 
			class="hero-logo"
			style="transform: translateY({scrollY * 0.5}px)"
		/>
	</div>
	<div class="hero-content">
		<h1 class="hero-title">March of Faith Inc.</h1>
		<p class="hero-subtitle">Every Creature is Reachable</p>
		<p class="hero-description">Reach the unreached. Preach Jesus. Make disciples</p>
		<div class="hero-buttons">
			<a href="/about" class="btn btn-primary">Learn More</a>
			<a href="/contact" class="btn btn-secondary">Visit Us</a>
		</div>
	</div>
</section>

<!-- Welcome Section -->
<section class="welcome">
	<div class="container">
		<div class="welcome-content">
			<h2>Reaching the Unreached With the Love of Christ</h2>
			<p>We believe that the love of Christ knows no limits and no boundaries. With a global vision of reaching every creature, we are committed to creating a community of believers who impact nations with the gospel.</p>
			<!-- <p>As our headquarters church in the beautiful province of Bohol, we serve as a beacon of hope and spiritual guidance for believers across the Philippines.</p> -->
			<div class="welcome-stats">
				<div class="stat">
					<h3>Founded</h3>
					<p>Established in Bohol Nov 19, 1974</p>
					<p>by Rev. Rudy Salomon Trigo, D.D.</p>
				</div>
				<div class="stat">
					<h3>Mission</h3>
					<p>Reach the unreached. Preach Jesus. Make disciples</p>
				</div>
				<div class="stat">
					<h3>Community</h3>
					<p>Growing Together</p>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Services Section -->
<section class="services">
	<div class="container">
		<h2>Our Ministry</h2>
<div class="services-grid">
	
<div class="service-card">
	<div class="service-icon">⛪</div>
	<h3>Children</h3>
	<p>Following the wisdom of Proverbs 22:6, our ministry lovingly guides children, setting a joyful foundation for a lifelong walk with Christ where they are equipped to love God, to understand the Bible, and to be kind to others.</p>
</div>

	<div class="service-card">
		<div class="service-icon">👥</div>
		<h3>Youth</h3>
		<p>A ministry dedicated to guiding young people toward Christ through fellowship, discipleship, and purposeful activities that help them grow in faith and character.</p>
	</div>


	<div class="service-card">
		<div class="service-icon">🎓</div>
		<h3>Minister's Training</h3>
		<p>We are dedicated to equipping and training ministers to be true shepherds who lovingly guide, biblically feed, and faithfully protect God's flock, following the example of Christ.</p>
	</div>


			<div class="service-card">
		<div class="service-icon">🌱</div>
		<h3>Church Planting</h3>
		<p>Our commitment to expanding God’s kingdom by establishing new churches, training leaders, and reaching communities across the world with the gospel.</p>
	</div>


	<div class="service-card">
		<div class="service-icon">🎵</div>
		<h3>Music</h3>
		<p>A place where worship, creativity, and talent grow—training young and aspiring musicians to lead others into God’s presence.</p>
	</div>

	<div class="service-card">
		<div class="service-icon">🤲</div>
		<h3>Outreach</h3>
		<p>Focused on sharing the love of Jesus through acts of compassion, evangelism, and service—reaching the unreached and bringing hope where it’s needed most.</p>
	</div>

	<div class="service-card">
		<div class="service-icon">📻</div>
		<h3>Radio Ministry</h3>
		<p>Bringing the Good News to listeners far and wide, sharing sermons, worship, and biblical teaching over the radio.</p>
	</div>

</div>
	</div>
</section>

<section class="location">
    <div class="section-shapes location-shapes">
        <div class="angular-shape angular-1"></div>
        <div class="angular-shape angular-2"></div>
        <div class="white-accent white-1"></div>
    </div>
    <div class="container">
        <div class="location-content">
            <div class="location-text">
            <h2>Worship With Us</h2>
                
        <p>Our headquarters in Tagbilaran City, Bohol serves a growing network of March of Faith churches around the nation. We warmly invite you to join us at our Tagbilaran location or at any of our congregations across the nation.</p>
                <div class="location-details">
                    <div class="detail">
                        <strong>Sunday Services:</strong>
                        <span>9:00 - 11:00 AM</span>
                        <span>4:00 - 6:00 PM</span>
                    </div>
                    <div class="detail">
                        <strong>Wednesday Bible Study:</strong>
                        <span>7:00 PM</span>
                    </div>
                    <div class="detail">
                        <strong>Location:</strong>
                        <span>Tagbilaran City, Bohol</span>
                    </div>
                </div>

                <div class="location-buttons">
                    <a href="/contact" class="btn btn-primary">Get Directions</a>
                    <a href="/churches" class="btn btn-secondary">See All Our Churches</a>
                </div>
            </div>
            <div class="location-image">
                <div class="image-stack">
                    <img 
                        src="https://res.cloudinary.com/dexcw6vg0/image/upload/c_fill,w_600,h_400,g_center/v1/sample" 
                        alt="Church Building" 
                        class="location-img main-img"
                    />
                    <div class="founder-overlay">
                        <img 
                            src="https://res.cloudinary.com/dexcw6vg0/image/upload/v1754821750/rcpqj7mzayco2ndwioqp.png" 
                            alt="Rev. Rudy Salomon Trigo, D.D." 
                            class="founder-overlay-img"
                        />
                        <div class="founder-overlay-text">
                            <p>Founded by Rev. Rudy Salomon Trigo, D.D.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<style>
	/* Global Styles */
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.btn {
		display: inline-block;
		padding: 1rem 2rem;
		text-decoration: none;
		border-radius: 50px;
		font-weight: 600;
		transition: all 0.3s ease;
		text-align: center;
		border: 2px solid transparent;
	}

	.btn-primary {
		background: #C1272D;
		color: white;
		box-shadow: 0 4px 15px rgba(193, 39, 45, 0.3);
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(193, 39, 45, 0.4);
	}

	.btn-secondary {
		background: transparent;
		color: #C1272D;
		border: 2px solid #C1272D;
	}

	.btn-secondary:hover {
		background: #C1272D;
		color: white;
		transform: translateY(-2px);
	}

	/* Geometric Design Elements */
	.geometric-shapes {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
		z-index: 1;
		overflow: hidden;
	}

	.shape {
		position: absolute;
		background: rgba(255, 255, 255, 0.1);
	}

	/* Enhanced Marquee Animations with Rotation */
	@keyframes marqueeLeftRotate {
		0% {
			transform: translateX(20vw) rotate(var(--rotation));
		}
		100% {
			transform: translateX(-20vw) rotate(calc(var(--rotation) + 15deg));
		}
	}

	@keyframes marqueeRightRotate {
		0% {
			transform: translateX(-20vw) rotate(var(--rotation));
		}
		100% {
			transform: translateX(20vw) rotate(calc(var(--rotation) - 12deg));
		}
	}

	/* Hero Section - Enhanced Fat Rectangles with Smooth Animation */
	/* Top Rectangles */
	.shape-1 {
		width: 8500px;
		height: 350px;
		top: -12%;
		left: -2200px;
		--rotation: -15deg;
		background: #C1272D;
		opacity: 0.35;
		z-index: 1;
		animation: marqueeLeftRotate 120s linear infinite;
	}

	.shape-2 {
		width: 7800px;
		height: 180px;
		top: -2%;
		right: -2000px;
		--rotation: 18deg;
		background: #981B1E;
		opacity: 0.28;
		z-index: 2;
		animation: marqueeRightRotate 85s linear infinite;
	}

	/* Bottom Rectangles */
	.shape-3 {
		width: 9200px;
		height: 420px;
		bottom: -15%;
		left: -2500px;
		--rotation: 12deg;
		background: #981B1E;
		opacity: 0.32;
		z-index: 1;
		animation: marqueeRightRotate 150s linear infinite;
	}

	.shape-4 {
		width: 6900px;
		height: 240px;
		bottom: -3%;
		right: -1800px;
		--rotation: -20deg;
		background: #C1272D;
		opacity: 0.30;
		z-index: 3;
		animation: marqueeLeftRotate 95s linear infinite;
	}

	.section-shapes {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
		overflow: hidden;
		pointer-events: none;
	}



	/* Location Section Shapes */
	.angular-shape {
		position: absolute;
		background: #C1272D;
		opacity: 0.15;
	}

	/* Location Section - Fat Rectangles */
	.angular-1 {
		width: 6500px;
		height: 195px;
		top: 15%;
		left: -1800px;
		transform: rotate(-8deg);
		opacity: 0.18;
	}

	.angular-2 {
		width: 5800px;
		height: 120px;
		bottom: 25%;
		right: -1500px;
		transform: rotate(13deg);
		opacity: 0.15;
	}

	.white-accent {
		position: absolute;
		background: rgba(255, 255, 255, 0.1);
	}

	.white-1 {
		width: 4800px;
		height: 90px;
		top: 55%;
		right: -1200px;
		transform: rotate(-5deg);
		opacity: 0.08;
	}

	/* Hero Section */
	.hero {
		position: relative;
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.hero-background {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: #981B1E;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.hero-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.2);
	}

	.hero-logo {
		width: 400px;
		height: auto;
		opacity: 0.1;
		position: absolute;
		z-index: 1;
	}

	.hero-content {
		position: relative;
		z-index: 2;
		text-align: center;
		color: white;
		max-width: 800px;
		padding: 2rem;
	}

	.hero-title {
		font-size: 4rem;
		font-weight: 700;
		margin-bottom: 1rem;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
		line-height: 1.1;
	}

	.hero-subtitle {
		font-size: 1.5rem;
		margin-bottom: 1.5rem;
		color: #f8f9fa;
		font-weight: 300;
	}

	.hero-description {
		font-size: 1.2rem;
		margin-bottom: 2.5rem;
		line-height: 1.6;
		color: #e9ecef;
	}

	.hero-buttons {
		display: flex;
		gap: 1.5rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	/* Welcome Section */
	.welcome {
		position: relative;
		padding: 6rem 0;
		background: #F8F9FA;
		overflow: hidden;
	}

	.welcome-content {
		text-align: center;
		max-width: 800px;
		margin: 0 auto;
	}

	.welcome h2 {
		font-size: 2.5rem;
		color: #981B1E;
		margin-bottom: 2rem;
		font-weight: 700;
	}

	.welcome p {
		font-size: 1.2rem;
		line-height: 1.8;
		color: #555;
		margin-bottom: 3rem;
	}

	.welcome-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 2rem;
		margin-top: 3rem;
	}

	.stat {
		text-align: center;
		padding: 2rem;
		background: white;
		border-radius: 10px;
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
		transition: transform 0.3s ease;
	}

	.stat:hover {
		transform: translateY(-5px);
	}

	.stat h3 {
		font-size: 1.5rem;
		color: #C1272D;
		margin-bottom: 0.5rem;
	}

	.stat p {
		color: #666;
		margin: 0;
		font-size: 1rem;
	}

	/* Services Section */
	.services {
		position: relative;
		padding: 6rem 0;
		background: white;
		overflow: hidden;
	}

	.services h2 {
		font-size: 2.5rem;
		text-align: center;
		color: #981B1E;
		margin-bottom: 3rem;
		font-weight: 700;
	}

	.services-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 2rem;
	}

	.service-card {
		text-align: center;
		padding: 3rem 2rem;
		border-radius: 15px;
		background: #f8f9fa;
		transition: all 0.3s ease;
		border: 2px solid transparent;
	}

	.service-card:hover {
		transform: translateY(-10px);
		background: white;
		border-color: #C1272D;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
	}

	.service-icon {
		font-size: 3rem;
		margin-bottom: 1.5rem;
	}

	.service-card h3 {
		font-size: 1.5rem;
		color: #981B1E;
		margin-bottom: 1rem;
		font-weight: 600;
	}

	.service-card p {
		color: #666;
		line-height: 1.6;
	}

	/* Location Section */
	.location {
		position: relative;
		padding: 6rem 0;
		background: #981B1E;
		color: white;
		overflow: hidden;
	}

	.location-content {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4rem;
		align-items: center;
	}

	.location h2 {
		font-size: 2.5rem;
		margin-bottom: 1.5rem;
		font-weight: 700;
	}

	.location p {
		font-size: 1.1rem;
		line-height: 1.7;
		margin-bottom: 2rem;
		opacity: 0.9;
	}

	.location-details {
		margin: 2rem 0;
	}

	.detail {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
	}

	.detail strong {
		font-weight: 600;
	}

	.location-image {
		text-align: center;
	}

	.location-img {
		width: 100%;
		height: 400px;
		object-fit: cover;
		border-radius: 15px;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
	}

	/* Image Stack and Founder Overlay */
	.image-stack {
		position: relative;
		display: inline-block;
	}

	.main-img {
		position: relative;
		z-index: 1;
	}

	.founder-overlay {
		position: absolute;
		bottom: -20px;
		right: -20px;
		z-index: 2;
		background: white;
		border-radius: 10px;
		padding: 0.5rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
		text-align: center;
		max-width: 120px;
	}

	.founder-overlay-img {
		width: 80px;
		height: 100px;
		object-fit: cover;
		border-radius: 8px;
		margin-bottom: 0.5rem;
	}

	.founder-overlay-text p {
		font-size: 0.7rem;
		color: #981B1E;
		font-weight: 600;
		margin: 0;
		line-height: 1.2;
	}


	/* Responsive Design */
	@media (max-width: 768px) {
		.hero-title {
			font-size: 2.5rem;
		}

		.hero-subtitle {
			font-size: 1.2rem;
		}

		.hero-description {
			font-size: 1rem;
		}

		.hero-buttons {
			flex-direction: column;
			align-items: center;
		}

		.btn {
			width: 200px;
		}

		.location-content {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.founder-overlay {
			bottom: -15px;
			right: -15px;
			max-width: 100px;
		}

		.founder-overlay-img {
			width: 60px;
			height: 80px;
		}

		.founder-overlay-text p {
			font-size: 0.6rem;
		}

		.detail {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.container {
			padding: 0 1rem;
		}
	}

	@media (max-width: 480px) {
		.hero {
			height: 80vh;
		}

		.hero-title {
			font-size: 2rem;
		}

		.welcome, .services, .location {
			padding: 3rem 0;
		}

		.welcome h2, .services h2, .location h2 {
			font-size: 2rem;
		}
	}
</style>