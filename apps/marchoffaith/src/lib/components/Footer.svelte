
<!-- Footer -->
<footer class="footer">
	<div class="container">
		<div class="footer-content">
			<!-- Brand Section -->
			<div class="footer-brand">
				<div class="footer-logo">
					<img 
						src="https://res.cloudinary.com/dexcw6vg0/image/upload/v1740474451/MOFI_web_logo_yrzxyh.webp" 
						alt="March of Faith Logo" 
						class="footer-logo-img"
					/>
					<div>
						<h3>March of Faith Inc.</h3>
						<p class="tagline">Every Creature is Reachable</p>
					</div>
				</div>
				<p class="brand-description">Strengthening faith and building community in Bohol and throughout the Philippines.</p>
			</div>

			<!-- Links Grid -->
			<div class="footer-links-grid">
				<!-- Quick Links -->
				<div class="footer-column">
					<h4>About</h4>
					<ul>
						<li><a href="/about">Overview</a></li>
						<li><a href="/about/history-purpose">History & Purpose</a></li>
						<li><a href="/about/founding-minister">Founding Minister</a></li>
						<li><a href="/about/presiding-minister">Presiding Minister</a></li>
					</ul>
				</div>

				<!-- Ministry -->
				<div class="footer-column">
					<h4>Ministry</h4>
					<ul>
						<li><a href="/churches">Our Churches</a></li>
						<li><a href="/pastors">Our Pastors</a></li>
						<li><a href="/docs">Resources</a></li>
						<li><a href="/outreach">Community Outreach</a></li>
					</ul>
				</div>

				<!-- Service Times -->
				<div class="footer-column">
					<h4>Service Times</h4>
					<ul class="service-list">
						<li>
							<div class="service-label">Sunday Morning</div>
							<div class="service-time">9:00 - 11:00 AM</div>
						</li>
						<li>
							<div class="service-label">Sunday Evening</div>
							<div class="service-time">4:00 - 6:00 PM</div>
						</li>
						<li>
							<div class="service-label">Prayer Meeting</div>
							<div class="service-time">6:00 AM Daily</div>
						</li>
					</ul>
				</div>

				<!-- Contact -->
				<div class="footer-column">
					<h4>Contact Us</h4>
					<ul class="contact-list">
						<li>
							<div class="contact-label">Address</div>
							<div class="contact-detail">San Isidro District<br>Tagbilaran City, Bohol</div>
						</li>
						<li>
							<div class="contact-label">Phone</div>
							<div class="contact-detail">+63 99 9953 6700</div>
						</li>
						<li>
							<div class="contact-label">Email</div>
							<div class="contact-detail">marchoffaithincorporated@gmail.com</div>
						</li>
					</ul>
					<a href="/contact" class="footer-cta">Visit Us</a>
				</div>
			</div>
		</div>

		<!-- Footer Bottom -->
		<div class="footer-bottom">
			<p>&copy; 2025 March of Faith Incorporated. All rights reserved.</p>
			<p class="footer-meta">SEC Registration: 0000058834 • Tagbilaran, Bohol, Philippines</p>
		</div>
	</div>
</footer>

<style>
	* {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}


	/* Container */
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	/* Footer */
	.footer {
		background: #2c3e50;
		color: #ffffff;
		padding: 4rem 0 0;
		margin-top: auto;
	}

	.footer-content {
		display: grid;
		grid-template-columns: 1.5fr 2fr;
		gap: 4rem;
		padding-bottom: 3rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	/* Brand Section */
	.footer-brand {
		max-width: 400px;
	}

	.footer-logo {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.footer-logo-img {
		width: 70px;
		height: 70px;
		object-fit: contain;
		flex-shrink: 0;
	}

	.footer-logo h3 {
		font-size: 1.375rem;
		font-weight: 800;
		color: #ffffff;
		line-height: 1.2;
		margin-bottom: 0.375rem;
		letter-spacing: -0.02em;
	}

	.tagline {
		font-size: 0.8125rem;
		color: #C1272D;
		font-weight: 600;
		letter-spacing: 0.02em;
	}

	.brand-description {
		color: #bdc3c7;
		line-height: 1.65;
		font-size: 0.9375rem;
		font-weight: 400;
		letter-spacing: -0.01em;
	}

	/* Links Grid */
	.footer-links-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 2.5rem;
	}

	.footer-column h4 {
		font-size: 0.8125rem;
		font-weight: 800;
		color: #ffffff;
		text-transform: uppercase;
		letter-spacing: 1.2px;
		margin-bottom: 1.5rem;
	}

	.footer-column ul {
		list-style: none;
	}

	.footer-column li {
		margin-bottom: 0.75rem;
	}

	.footer-column a {
		color: #bdc3c7;
		text-decoration: none;
		font-size: 0.9375rem;
		font-weight: 450;
		transition: color 0.2s ease;
		letter-spacing: -0.01em;
		line-height: 1.5;
	}

	.footer-column a:hover {
		color: #C1272D;
	}

	/* Service List */
	.service-list li {
		margin-bottom: 1.125rem;
		padding-bottom: 1.125rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.service-list li:last-child {
		border-bottom: none;
		margin-bottom: 0;
		padding-bottom: 0;
	}

	.service-label {
		font-size: 0.8125rem;
		color: #bdc3c7;
		margin-bottom: 0.375rem;
		font-weight: 500;
		letter-spacing: 0.01em;
	}

	.service-time {
		font-size: 1rem;
		color: #C1272D;
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	/* Contact List */
	.contact-list li {
		margin-bottom: 1rem;
	}

	.contact-label {
		font-size: 0.8125rem;
		color: #bdc3c7;
		margin-bottom: 0.375rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.contact-detail {
		font-size: 0.9375rem;
		color: #ecf0f1;
		line-height: 1.6;
		font-weight: 450;
		letter-spacing: -0.01em;
	}

	/* Footer CTA */
	.footer-cta {
		display: inline-block;
		margin-top: 1.75rem;
		padding: 0.875rem 2.25rem;
		background: #C1272D;
		color: white !important;
		text-decoration: none;
		border-radius: 6px;
		font-weight: 700;
		font-size: 0.9375rem;
		transition: all 0.3s ease;
		text-align: center;
		letter-spacing: 0.02em;
	}

	.footer-cta:hover {
		background: #981B1E;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(193, 39, 45, 0.4);
	}

	/* Footer Bottom */
	.footer-bottom {
		background: #34495e;
		padding: 2rem 0;
		text-align: center;
		border-top: 1px solid #4a6741;
	}

	.footer-bottom p {
		color: #bdc3c7;
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
		font-weight: 500;
		letter-spacing: -0.01em;
	}

	.footer-meta {
		font-size: 0.8125rem !important;
		color: #95a5a6 !important;
		font-weight: 450 !important;
	}

	/* Responsive Design */
	@media (max-width: 1024px) {
		.footer-links-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 2rem;
		}
	}

	@media (max-width: 768px) {
		.footer {
			padding: 3rem 0 0;
		}

		.footer-content {
			grid-template-columns: 1fr;
			gap: 3rem;
		}

		.footer-brand {
			max-width: 100%;
		}

		.footer-links-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 2rem;
		}

		.container {
			padding: 0 1.5rem;
		}
	}

	@media (max-width: 480px) {
		.footer-content {
			gap: 2.5rem;
		}

		.footer-links-grid {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.footer-logo {
			flex-direction: row;
			align-items: center;
		}

		.footer-logo-img {
			width: 60px;
			height: 60px;
		}

		.footer-logo h3 {
			font-size: 1.1rem;
		}

		.footer-cta {
			display: block;
			text-align: center;
		}
	}
</style>
