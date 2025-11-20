<script>
	import Hero from '$lib/components/Hero.svelte';
</script>

<svelte:head>
	<title>Contact Us - March of Faith Incorporated</title>
	<meta name="description" content="Connect with March of Faith Incorporated in Tagbilaran City, Bohol. Phone: +63 99 9953 6700. Strengthening faith, building community since 1975." />
</svelte:head>

<Hero subtitle="We'd love to hear from you and welcome you to our church family in Tagbilaran, Bohol">
	CONNECT WITH US
</Hero>

<!-- Contact Content -->
<section class="contact-content" role="main" aria-labelledby="contact-main">
	<div class="container">
		<div class="content-layout">
			<div class="main-content">


				<!-- Contact Form -->
				<div class="contact-form-section" role="region" aria-labelledby="contact-form-title">
					<h2 id="contact-form-title">Send Us a Message</h2>
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
								<label for="subject">How Can We Help?</label>
								<select id="subject" name="subject">
									<option value="">Select your reason for reaching out...</option>
									<option value="visit">I'd like to plan a visit</option>
									<option value="prayer">Prayer request</option>
									<option value="pastoral">Speak with pastoral staff</option>
									<option value="ministry">Learn about ministry opportunities</option>
									<option value="faith">I have questions about faith</option>
									<option value="baptism">Baptism or membership</option>
									<option value="events">Upcoming events or programs</option>
									<option value="other">Something else</option>
								</select>
							</div>
						</div>

						<div class="form-group">
							<label for="message">Your Message *</label>
							<textarea id="message" name="message" rows="6" required placeholder="Share your heart with us. Whether it's a question, prayer request, or just to say hello - we'd love to hear from you."></textarea>
						</div>

						<button type="submit" class="btn btn-primary submit-button">Send My Message</button>
					</form>
				</div>
			</div>

			<div class="sidebar-content">
				<!-- Service Times -->
				<div class="service-times-card">
					<h3>Join Us for Worship</h3>
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
					<p class="service-note">Come as you are - all are welcome in God's house</p>
				</div>

				<!-- Emergency Contact -->
				<div class="emergency-card">
					<h3>Pastoral Care & Prayer</h3>
					<p><strong>Emergency pastoral care:</strong> Hospital visits, crisis counseling, or urgent spiritual support</p>
					<p><strong>24/7 prayer line:</strong> Leave a message and we'll pray with you and respond promptly</p>
					<a href="tel:+639999536700" class="emergency-button">Pastoral Care: +63 99 9953 6700</a>
				</div>

				<!-- Getting Here -->
				<div class="directions-card">
					<h3>Plan Your Visit</h3>
					<div class="location-info">
						<div class="location-item">
							<strong>Address:</strong>
							<span>San Isidro District<br>Tagbilaran City, Bohol</span>
						</div>
						<div class="location-item">
							<strong>Parking:</strong>
							<span>Free parking available</span>
						</div>
						<div class="location-item">
							<strong>Accessibility:</strong>
							<span>Fully accessible facility</span>
						</div>
					</div>
					<p class="directions-note"><strong>New here?</strong> Arrive a few minutes early and look for our welcome team - they'll help you feel right at home!</p>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	/* CSS Custom Properties - Brand Colors */
	:root {
		--deep-red: #981B1E;
		--bright-red: #C1272D;
		--white: #FFFFFF;
		--dark-gray: #333333;
		--light-gray: #F8F9FA;
	}

	/* Global Styles */
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1.5rem;
	}

	/* Main Content */
	.contact-content {
		padding: 2.5rem 0;
		background: var(--light-gray);
	}

	.content-layout {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 2rem;
		align-items: start;
	}

	/* Contact Form Section */
	.contact-form-section {
		background: var(--white);
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	.contact-form-section h2 {
		font-family: 'Montserrat', sans-serif;
		font-size: 1.3rem;
		color: var(--deep-red);
		margin-bottom: 0.75rem;
		font-weight: 700;
		border-bottom: 1px solid var(--bright-red);
		padding-bottom: 0.5rem;
	}

	.contact-form {
		max-width: 100%;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}

	.form-group label {
		font-family: 'Montserrat', sans-serif;
		color: var(--dark-gray);
		font-weight: 600;
		margin-bottom: 0.5rem;
		font-size: 1rem;
	}

	.form-group input,
	.form-group textarea,
	.form-group select {
		padding: 1rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 1rem;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
		background: white;
		font-family: 'Montserrat', sans-serif;
		color: var(--dark-gray);
	}

	.form-group input:focus,
	.form-group textarea:focus,
	.form-group select:focus {
		outline: none;
		border-color: var(--bright-red);
		box-shadow: 0 0 0 4px rgba(193, 39, 45, 0.15);
	}

	.form-group textarea {
		resize: vertical;
		min-height: 120px;
	}

	/* Brand Button Styles */
	.btn {
		padding: 0.5rem 1rem;
		border-radius: 25px;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.2s ease;
		display: inline-block;
		font-family: 'Montserrat', sans-serif;
		cursor: pointer;
		border: none;
	}

	.btn-primary {
		background: linear-gradient(45deg, var(--bright-red), var(--deep-red));
		color: var(--white);
		box-shadow: 0 4px 15px rgba(193, 39, 45, 0.3);
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(193, 39, 45, 0.4);
	}

	.submit-button {
		padding: 1rem 2rem;
		font-size: 1rem;
		margin-top: 1rem;
		width: 100%;
		max-width: 250px;
	}

	/* Sidebar */
	.service-times-card,
	.emergency-card,
	.directions-card {
		background: var(--white);
		padding: 1.75rem;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		margin-bottom: 1rem;
	}

	.service-times-card h3,
	.emergency-card h3,
	.directions-card h3 {
		font-family: 'Montserrat', sans-serif;
		color: var(--deep-red);
		font-size: 1.1rem;
		margin-bottom: 0.75rem;
		font-weight: 700;
		border-bottom: 1px solid var(--bright-red);
		padding-bottom: 0.5rem;
	}

	.service-item {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 0.75rem 0;
		border-bottom: 1px solid #f0f0f0;
	}

	.service-item:last-child {
		border-bottom: none;
	}

	.service-day {
		font-family: 'Montserrat', sans-serif;
		color: var(--dark-gray);
		font-weight: 700;
		min-width: 80px;
		font-size: 1rem;
	}

	.service-details {
		text-align: right;
		flex: 1;
	}

	.service-time {
		font-family: 'Montserrat', sans-serif;
		color: #555555;
		font-size: 0.95rem;
		margin-bottom: 0.2rem;
		font-weight: 500;
		line-height: 1.4;
	}

	.service-time:last-child {
		margin-bottom: 0;
	}

	.service-note {
		font-family: 'Montserrat', sans-serif;
		color: #555555;
		font-style: italic;
		text-align: center;
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid #f0f0f0;
		font-size: 0.9rem;
		line-height: 1.4;
	}

	.emergency-card p {
		font-family: 'Montserrat', sans-serif;
		color: #555555;
		line-height: 1.5;
		margin-bottom: 0.75rem;
		font-size: 0.95rem;
	}

	.emergency-button {
		display: block;
		width: 100%;
		padding: 1rem;
		background: linear-gradient(45deg, var(--bright-red), var(--deep-red));
		color: var(--white);
		text-align: center;
		text-decoration: none;
		border-radius: 25px;
		font-family: 'Montserrat', sans-serif;
		font-weight: 600;
		transition: all 0.2s ease;
		box-shadow: 0 2px 8px rgba(193, 39, 45, 0.2);
		font-size: 1rem;
	}

	.emergency-button:hover {
		background: linear-gradient(45deg, var(--deep-red), var(--bright-red));
		text-decoration: none;
		color: var(--white);
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(152, 27, 30, 0.4);
	}

	.location-item {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 0.75rem 0;
		border-bottom: 1px solid #f0f0f0;
		font-family: 'Montserrat', sans-serif;
	}

	.location-item:last-child {
		border-bottom: none;
	}

	.location-item strong {
		color: var(--dark-gray);
		font-weight: 700;
		min-width: 90px;
	}

	.location-item span {
		color: #555555;
		text-align: right;
		font-size: 0.95rem;
		line-height: 1.4;
	}

	.directions-note {
		font-family: 'Montserrat', sans-serif;
		color: #555555;
		font-style: italic;
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid #f0f0f0;
		font-size: 0.9rem;
		line-height: 1.5;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.hero-section {
			padding: 2rem 0;
		}

		.hero-content h1 {
			font-size: 2rem;
			margin-bottom: 0.75rem;
		}

		.hero-subtitle {
			font-size: 1.1rem;
		}

		.contact-content {
			padding: 2rem 0;
		}

		.content-layout {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.contact-form-section {
			padding: 1.5rem;
			margin-bottom: 1.25rem;
		}

		.form-row {
			grid-template-columns: 1fr;
			gap: 0.75rem;
			margin-bottom: 0.75rem;
		}

		.form-group input,
		.form-group textarea,
		.form-group select {
			padding: 0.875rem;
		}

		.service-times-card,
		.emergency-card,
		.directions-card {
			padding: 1.5rem;
			margin-bottom: 1rem;
		}

		.service-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
			padding: 0.75rem 0;
		}

		.service-details {
			text-align: left;
		}

		.container {
			padding: 0 1rem;
		}

		.submit-button {
			max-width: 100%;
			padding: 1rem 1.5rem;
		}

		.emergency-button {
			padding: 0.875rem;
			font-size: 0.95rem;
		}
	}
</style>