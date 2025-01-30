<svelte:head>
	<title>Contact Us - Grace Community Church</title>
	<meta name="description" content="Get in touch with Grace Community Church" />
</svelte:head>

<div class="text-column">
	<h1>Contact Us</h1>

	<div class="contact-grid">
		<div class="contact-info">
			<h2>Get in Touch</h2>
			<div class="info-item">
				<h3>Address</h3>
				<p>123 Main Street<br />Cityville, State 12345</p>
			</div>
			<div class="info-item">
				<h3>Phone</h3>
				<p>(555) 123-4567</p>
			</div>
			<div class="info-item">
				<h3>Email</h3>
				<p>info@gracechurch.example</p>
			</div>
			<div class="info-item">
				<h3>Office Hours</h3>
				<p>Monday - Friday: 9:00 AM - 5:00 PM</p>
			</div>
		</div>

		<div class="contact-form">
			<h2>Send us a Message</h2>
			<form>
				<div class="form-group">
					<label for="name">Name</label>
					<input type="text" id="name" required />
				</div>
				<div class="form-group">
					<label for="email">Email</label>
					<input type="email" id="email" required />
				</div>
				<div class="form-group">
					<label for="message">Message</label>
					<textarea id="message" rows="5" required></textarea>
				</div>
				<button type="submit" class="submit-button">Send Message</button>
			</form>
		</div>
	</div>
</div>

<style>
	.contact-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		margin-top: 2rem;
	}

	.contact-info {
		background-color: var(--color-bg-2);
		padding: 1.5rem;
		border-radius: 8px;
	}

	.info-item {
		margin: 1.5rem 0;
	}

	.info-item h3 {
		color: var(--color-theme-1);
		margin-bottom: 0.5rem;
	}

	.contact-form {
		background-color: var(--color-bg-2);
		padding: 1.5rem;
		border-radius: 8px;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		color: var(--color-theme-1);
	}

	input,
	textarea {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid var(--color-bg-1);
		border-radius: 4px;
		background-color: white;
	}

	.submit-button {
		background-color: var(--color-theme-1);
		color: white;
		padding: 0.8rem 1.5rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: opacity 0.2s ease;
	}

	.submit-button:hover {
		opacity: 0.9;
	}

	@media (max-width: 768px) {
		.contact-grid {
			grid-template-columns: 1fr;
		}
	}
</style>