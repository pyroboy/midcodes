<!-- Footer -->
<footer class="footer">
	<div class="container">
		<div class="footer-content">
			<div class="footer-section">
				<div class="footer-logo">
					<img 
						src="https://res.cloudinary.com/dexcw6vg0/image/upload/v1740474451/MOFI_web_logo_yrzxyh.webp" 
						alt="March of Faith Logo" 
						class="footer-logo-img"
					/>
					<h3>March of Faith Incorporated</h3>
				</div>
				<p>Strengthening faith and building community in Bohol and throughout the Philippines since 1975.</p>
				<div class="footer-social">
					<p class="social-text">Connect with us and stay updated on our ministry</p>
				</div>
			</div>
			<div class="footer-section">
				<h4>About Us</h4>
				<ul>
					<li><a href="/about">Overview</a></li>
					<li><a href="/about/history-purpose">History & Purpose</a></li>
					<li><a href="/about/founding-minister">Founding Minister</a></li>
					<li><a href="/about/presiding-minister">Presiding Minister</a></li>
				</ul>
			</div>
			<div class="footer-section">
				<h4>Ministry</h4>
				<ul>
					<li><a href="/churches">Our Churches</a></li>
					<li><a href="/pastors">Our Pastors</a></li>
					<li><a href="/docs">Resources</a></li>
					<li>Community Outreach</li>
				</ul>
			</div>
			<div class="footer-section">
				<h4>Service Times</h4>
				<ul class="service-times">
					<li>
						<strong>Sunday Morning:</strong>
						<span>8:00 AM</span>
					</li>
					<li>
						<strong>Sunday Evening:</strong>
						<span>10:30 AM</span>
					</li>
					<li>
						<strong>Wednesday Bible Study:</strong>
						<span>7:00 PM</span>
					</li>
					<li>
						<strong>Prayer Meeting:</strong>
						<span>6:00 AM Daily</span>
					</li>
				</ul>
			</div>
			<div class="footer-section">
				<h4>Contact Info</h4>
				<ul class="contact-info">
					<li>
						<strong>Address:</strong>
						<span>San Isidro District<br>Tagbilaran City, Bohol</span>
					</li>
					<li>
						<strong>Phone:</strong>
						<span>+63 99 9953 6700</span>
					</li>
					<li>
						<strong>Email:</strong>
						<span>marchoffaithincorporated@gmail.com</span>
					</li>
				</ul>
				<a href="/contact" class="footer-cta">Visit Us Today</a>
			</div>
		</div>
		<div class="footer-bottom">
			<div class="footer-bottom-content">
				<p>&copy; 2025 March of Faith Incorporated. All rights reserved.</p>
				<p class="footer-subtitle">Headquarters: Tagbilaran, Bohol, Philippines • SEC Registration: 0000058834</p>
			</div>
		</div>
	</div>
</footer>

<style>
	/* Container */
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	/* Footer */
	.footer {
		background: #2c3e50;
		color: white;
		padding: 4rem 0 0;
		margin-top: auto;
	}

	.footer-content {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
		gap: 3rem;
		margin-bottom: 3rem;
	}

	/* Footer Sections */
	.footer-section h3,
	.footer-section h4 {
		color: #C1272D;
		margin-bottom: 1.5rem;
		font-weight: 600;
		font-size: 1.1rem;
	}

	.footer-section h3 {
		font-size: 1.3rem;
		margin-bottom: 1rem;
	}

	.footer-section p {
		color: #bdc3c7;
		line-height: 1.6;
		margin-bottom: 1.5rem;
	}

	.footer-section ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.footer-section li {
		margin-bottom: 0.75rem;
	}

	.footer-section a {
		color: #bdc3c7;
		text-decoration: none;
		transition: color 0.3s ease;
		display: block;
	}

	.footer-section a:hover {
		color: #C1272D;
	}

	/* Footer Logo */
	.footer-logo {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.footer-logo-img {
		width: 60px;
		height: auto;
	}

	.footer-logo h3 {
		margin: 0;
		color: white;
		font-size: 1.3rem;
	}

	/* Service Times & Contact Info */
	.service-times li,
	.contact-info li {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 0.5rem 0;
		border-bottom: 1px solid #34495e;
	}

	.service-times li:last-child,
	.contact-info li:last-child {
		border-bottom: none;
	}

	.service-times strong,
	.contact-info strong {
		color: #ecf0f1;
		font-weight: 600;
		min-width: 120px;
	}

	.service-times span,
	.contact-info span {
		color: #C1272D;
		text-align: right;
		font-weight: 500;
	}

	/* Footer CTA */
	.footer-cta {
		display: inline-block;
		margin-top: 1.5rem;
		padding: 0.75rem 1.5rem;
		background: #C1272D;
		color: white !important;
		text-decoration: none;
		border-radius: 25px;
		font-weight: 600;
		transition: all 0.3s ease;
	}

	.footer-cta:hover {
		background: #981B1E;
		transform: translateY(-2px);
		box-shadow: 0 5px 15px rgba(193, 39, 45, 0.3);
	}

	/* Social Section */
	.footer-social {
		margin-top: 1rem;
	}

	.social-text {
		font-size: 0.9rem;
		color: #95a5a6;
		font-style: italic;
	}

	/* Footer Bottom */
	.footer-bottom {
		background: #34495e;
		padding: 2rem 0;
		border-top: 1px solid #4a6741;
	}

	.footer-bottom-content {
		text-align: center;
	}

	.footer-bottom p {
		margin: 0;
		color: #bdc3c7;
		font-size: 0.9rem;
	}

	.footer-subtitle {
		margin-top: 0.5rem !important;
		font-size: 0.8rem !important;
		color: #95a5a6 !important;
	}

	/* Responsive Design */
	@media (max-width: 1024px) {
		.footer-content {
			grid-template-columns: 2fr 1fr 1fr 1fr;
			gap: 2rem;
		}
	}

	@media (max-width: 768px) {
		.footer {
			padding: 3rem 0 0;
		}

		.footer-content {
			grid-template-columns: 1fr 1fr;
			gap: 2rem;
		}

		.container {
			padding: 0 1rem;
		}
	}

	@media (max-width: 480px) {
		.footer-content {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.footer-logo {
			flex-direction: column;
			text-align: center;
		}

		.service-times li,
		.contact-info li {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}

		.service-times span,
		.contact-info span {
			text-align: left;
		}
	}
</style>