<svelte:head>
	<title>Contact Us - March of Faith Incorporated</title>
	<meta name="description" content="Connect with March of Faith Incorporated - our doors are always open to welcome you" />
</svelte:head>

<!-- Hero Section -->
<section class="contact-hero">
	<div class="container">
		<div class="hero-content">
			<h1>Connect With Us</h1>
			<p class="hero-subtitle">We'd love to hear from you and welcome you to our church family</p>
		</div>
	</div>
</section>

<!-- Contact Content -->
<section class="contact-content">
	<div class="container">
		<div class="content-layout">
			<div class="main-content">
				<!-- Welcome Message -->
				<div class="welcome-message">
					<h2>We're Here for You</h2>
					<p class="lead-text">
						Whether you're seeking spiritual guidance, have questions about our faith, or simply want to connect with our church community, we're here to support and serve you. Our doors and hearts are always open.
					</p>
				</div>

				<!-- Contact Methods -->
				<div class="contact-methods">
					<h2>How to Reach Us</h2>
					<div class="methods-grid">
						<div class="method-card">
							<div class="method-icon">📞</div>
							<h3>Call Us</h3>
							<p class="method-info">+63 99 9953 6700</p>
							<p class="method-desc">Available during office hours for questions, prayer requests, or scheduling appointments</p>
						</div>

						<div class="method-card">
							<div class="method-icon">✉️</div>
							<h3>Email Us</h3>
							<p class="method-info">marchoffaithincorporated@gmail.com</p>
							<p class="method-desc">Send us your questions, prayer requests, or ministry inquiries</p>
						</div>

						<div class="method-card">
							<div class="method-icon">📍</div>
							<h3>Visit Us</h3>
							<p class="method-info">San Isidro District<br>Tagbilaran City, Bohol</p>
							<p class="method-desc">Join us for worship services and church activities</p>
						</div>

						<div class="method-card">
							<div class="method-icon">⏰</div>
							<h3>Office Hours</h3>
							<p class="method-info">Monday - Friday<br>9:00 AM - 4:00 PM</p>
							<p class="method-desc">Our staff is available to assist with your needs</p>
						</div>
					</div>
				</div>

				<!-- Contact Form -->
				<div class="contact-form-section">
					<h2>Send Us a Message</h2>
					<form class="contact-form">
						<div class="form-row">
							<div class="form-group">
								<label for="name">Full Name *</label>
								<input type="text" id="name" name="name" required />
							</div>
							<div class="form-group">
								<label for="email">Email Address *</label>
								<input type="email" id="email" name="email" required />
							</div>
						</div>

						<div class="form-row">
							<div class="form-group">
								<label for="phone">Phone Number</label>
								<input type="tel" id="phone" name="phone" />
							</div>
							<div class="form-group">
								<label for="subject">Subject</label>
								<select id="subject" name="subject">
									<option value="">Select a topic...</option>
									<option value="prayer">Prayer Request</option>
									<option value="pastoral">Pastoral Care</option>
									<option value="ministry">Ministry Inquiry</option>
									<option value="visit">First-time Visit</option>
									<option value="general">General Question</option>
									<option value="other">Other</option>
								</select>
							</div>
						</div>

						<div class="form-group">
							<label for="message">Message *</label>
							<textarea id="message" name="message" rows="6" required placeholder="Please share your message, questions, or prayer requests..."></textarea>
						</div>

						<button type="submit" class="submit-button">Send Message</button>
					</form>
				</div>
			</div>

			<div class="sidebar-content">
				<!-- Service Times -->
				<div class="service-times-card">
					<h3>Service Times</h3>
					<div class="service-schedule">
						<div class="service-item">
							<div class="service-day">Sunday</div>
							<div class="service-details">
								<div class="service-time">Morning Worship: 9:00 AM</div>
								<div class="service-time">Evening Service: 6:00 PM</div>
							</div>
						</div>
						<div class="service-item">
							<div class="service-day">Wednesday</div>
							<div class="service-details">
								<div class="service-time">Bible Study: 7:00 PM</div>
							</div>
						</div>
						<div class="service-item">
							<div class="service-day">Friday</div>
							<div class="service-details">
								<div class="service-time">Prayer Meeting: 7:00 PM</div>
							</div>
						</div>
					</div>
					<p class="service-note">All are welcome to join us in worship and fellowship</p>
				</div>

				<!-- Emergency Contact -->
				<div class="emergency-card">
					<h3>Need Immediate Help?</h3>
					<p>For pastoral emergencies, hospital visits, or urgent prayer needs, please call our church office. If no one is available, leave a voicemail and we will respond as soon as possible.</p>
					<a href="tel:+639999536700" class="emergency-button">Call Now: +63 99 9953 6700</a>
				</div>

				<!-- Getting Here -->
				<div class="directions-card">
					<h3>Getting Here</h3>
					<div class="location-info">
						<div class="location-item">
							<strong>Address:</strong>
							<span>San Isidro District<br>Tagbilaran City, Bohol<br>Philippines</span>
						</div>
						<div class="location-item">
							<strong>Parking:</strong>
							<span>Available on church grounds</span>
						</div>
						<div class="location-item">
							<strong>Access:</strong>
							<span>Wheelchair accessible entrance</span>
						</div>
					</div>
					<p class="directions-note">First-time visitors are encouraged to arrive 15 minutes early for a warm welcome and assistance finding your way.</p>
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

	/* Hero Section */
	.contact-hero {
		background: #981B1E;
		color: white;
		padding: 4rem 0;
		text-align: center;
	}

	.hero-content h1 {
		font-size: 3rem;
		font-weight: 700;
		margin-bottom: 1rem;
		color: white;
	}

	.hero-subtitle {
		font-size: 1.3rem;
		font-weight: 300;
		opacity: 0.9;
		max-width: 600px;
		margin: 0 auto;
	}

	/* Main Content */
	.contact-content {
		padding: 4rem 0;
		background: #f8f9fa;
	}

	.content-layout {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 4rem;
		align-items: start;
	}

	/* Welcome Message */
	.welcome-message {
		background: white;
		padding: 3rem;
		border-radius: 15px;
		box-shadow: 0 5px 25px rgba(0, 0, 0, 0.1);
		margin-bottom: 3rem;
	}

	.welcome-message h2 {
		font-size: 2.5rem;
		color: #981B1E;
		margin-bottom: 1.5rem;
		font-weight: 700;
	}

	.lead-text {
		font-size: 1.2rem;
		line-height: 1.8;
		color: #555;
		margin: 0;
	}

	/* Contact Methods */
	.contact-methods {
		background: white;
		padding: 3rem;
		border-radius: 15px;
		box-shadow: 0 5px 25px rgba(0, 0, 0, 0.1);
		margin-bottom: 3rem;
	}

	.contact-methods h2 {
		font-size: 2.2rem;
		color: #981B1E;
		margin-bottom: 2rem;
		font-weight: 600;
		border-bottom: 3px solid #C1272D;
		padding-bottom: 0.5rem;
	}

	.methods-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 2rem;
	}

	.method-card {
		padding: 2rem;
		background: #f8f9fa;
		border-radius: 10px;
		text-align: center;
		border-left: 4px solid #C1272D;
		transition: all 0.3s ease;
	}

	.method-card:hover {
		background: white;
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
		transform: translateY(-5px);
	}

	.method-icon {
		font-size: 2.5rem;
		margin-bottom: 1rem;
	}

	.method-card h3 {
		color: #981B1E;
		font-size: 1.3rem;
		margin-bottom: 1rem;
		font-weight: 600;
	}

	.method-info {
		color: #333;
		font-weight: 600;
		margin-bottom: 1rem;
		font-size: 1rem;
	}

	.method-desc {
		color: #666;
		font-size: 0.9rem;
		line-height: 1.5;
		margin: 0;
	}

	/* Contact Form Section */
	.contact-form-section {
		background: white;
		padding: 3rem;
		border-radius: 15px;
		box-shadow: 0 5px 25px rgba(0, 0, 0, 0.1);
	}

	.contact-form-section h2 {
		font-size: 2.2rem;
		color: #981B1E;
		margin-bottom: 2rem;
		font-weight: 600;
		border-bottom: 3px solid #C1272D;
		padding-bottom: 0.5rem;
	}

	.contact-form {
		max-width: 100%;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}

	.form-group label {
		color: #333;
		font-weight: 600;
		margin-bottom: 0.5rem;
		font-size: 0.95rem;
	}

	.form-group input,
	.form-group textarea,
	.form-group select {
		padding: 1rem;
		border: 2px solid #e5e5e5;
		border-radius: 8px;
		font-size: 1rem;
		transition: border-color 0.3s ease, box-shadow 0.3s ease;
		background: white;
	}

	.form-group input:focus,
	.form-group textarea:focus,
	.form-group select:focus {
		outline: none;
		border-color: #C1272D;
		box-shadow: 0 0 0 3px rgba(193, 39, 45, 0.1);
	}

	.form-group textarea {
		resize: vertical;
		min-height: 120px;
	}

	.submit-button {
		background: #C1272D;
		color: white;
		padding: 1.2rem 2.5rem;
		border: none;
		border-radius: 8px;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		margin-top: 1rem;
	}

	.submit-button:hover {
		background: #981B1E;
		transform: translateY(-2px);
		box-shadow: 0 5px 15px rgba(193, 39, 45, 0.3);
	}

	/* Sidebar */
	.service-times-card,
	.emergency-card,
	.directions-card {
		background: white;
		padding: 2rem;
		border-radius: 10px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.service-times-card h3,
	.emergency-card h3,
	.directions-card h3 {
		color: #981B1E;
		font-size: 1.3rem;
		margin-bottom: 1.5rem;
		font-weight: 600;
		border-bottom: 2px solid #C1272D;
		padding-bottom: 0.5rem;
	}

	.service-item {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 1rem 0;
		border-bottom: 1px solid #f0f0f0;
	}

	.service-item:last-child {
		border-bottom: none;
	}

	.service-day {
		color: #333;
		font-weight: 600;
		min-width: 80px;
	}

	.service-details {
		text-align: right;
		flex: 1;
	}

	.service-time {
		color: #666;
		font-size: 0.9rem;
		margin-bottom: 0.25rem;
	}

	.service-time:last-child {
		margin-bottom: 0;
	}

	.service-note {
		color: #666;
		font-style: italic;
		text-align: center;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #f0f0f0;
		font-size: 0.9rem;
	}

	.emergency-card p {
		color: #666;
		line-height: 1.6;
		margin-bottom: 1.5rem;
	}

	.emergency-button {
		display: block;
		width: 100%;
		padding: 1rem;
		background: #C1272D;
		color: white;
		text-align: center;
		text-decoration: none;
		border-radius: 8px;
		font-weight: 600;
		transition: background 0.3s ease;
	}

	.emergency-button:hover {
		background: #981B1E;
		text-decoration: none;
		color: white;
	}

	.location-item {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 0.75rem 0;
		border-bottom: 1px solid #f0f0f0;
	}

	.location-item:last-child {
		border-bottom: none;
	}

	.location-item strong {
		color: #333;
		font-weight: 600;
		min-width: 70px;
	}

	.location-item span {
		color: #666;
		text-align: right;
		font-size: 0.9rem;
	}

	.directions-note {
		color: #666;
		font-style: italic;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #f0f0f0;
		font-size: 0.9rem;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.hero-content h1 {
			font-size: 2rem;
		}

		.hero-subtitle {
			font-size: 1.1rem;
		}

		.content-layout {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.welcome-message,
		.contact-methods,
		.contact-form-section {
			padding: 2rem;
		}

		.methods-grid {
			grid-template-columns: 1fr;
		}

		.form-row {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.service-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.service-details {
			text-align: left;
		}

		.container {
			padding: 0 1rem;
		}
	}
</style>