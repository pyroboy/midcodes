<script>
	import { onMount } from 'svelte';

	let showModal = false;
	let selectedPackage = null;
	let bookingForm = {
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		checkIn: '',
		checkOut: '',
		guests: 1,
		packageId: null,
		addons: {
			airport_transfer: false,
			photography: false,
			equipment_rental: false
		}
	};

	function openBooking(pkg) {
		selectedPackage = pkg;
		bookingForm.packageId = pkg.id;
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		selectedPackage = null;
	}

	function handleSubmit() {
		// Here we'll add the submission logic later
		console.log('Booking submitted:', bookingForm);
		alert('Thank you for your booking! We will contact you shortly.');
		closeModal();
	}

	const packages = [
		{
			id: 1,
			name: 'Weekend Warrior',
			description: 'Perfect for a quick adventure getaway. Experience cliff diving with basic training.',
			price: 299,
			duration: '2 Days, 1 Night',
			includes: [
				'Basic cliff diving training',
				'Safety equipment rental',
				'1 night accommodation',
				'Breakfast and lunch',
				'Island transfer'
			],
			image: 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?auto=format&fit=crop&q=80'
		},
		{
			id: 2,
			name: 'Dive Master Package',
			description: 'Comprehensive cliff diving experience with advanced techniques and multiple dive spots.',
			price: 599,
			duration: '4 Days, 3 Nights',
			includes: [
				'Advanced cliff diving training',
				'Multiple dive spot access',
				'Full gear package',
				'3 nights accommodation',
				'All meals included',
				'Round-trip transfers'
			],
			image: 'https://images.unsplash.com/photo-1437719417032-8595fd9e9dc6?auto=format&fit=crop&q=80'
		},
		{
			id: 3,
			name: 'Family Adventure',
			description: 'Family-friendly package with activities for all skill levels.',
			price: 899,
			duration: '3 Days, 2 Nights',
			includes: [
				'Beginner to intermediate training',
				'Safety equipment for all',
				'2 nights family suite',
				'All meals included',
				'Island hopping tour',
				'Photography package'
			],
			image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80'
		},
		{
			id: 4,
			name: 'Ultimate Explorer',
			description: 'The complete Cabilao Island experience with exclusive access to premium dive spots.',
			price: 1299,
			duration: '7 Days, 6 Nights',
			includes: [
				'Expert-level training',
				'Premium dive locations',
				'Complete gear package',
				'6 nights luxury suite',
				'All-inclusive meals',
				'Private guide',
				'Photo and video package'
			],
			image: 'https://images.unsplash.com/photo-1682686580024-580519d4b2d2?auto=format&fit=crop&q=80'
		}
	];
</script>

<svelte:head>
	<title>Cabilao Cliff Diving Resort</title>
	<meta name="description" content="Experience the thrill of cliff diving in Cabilao Island" />
</svelte:head>

<main class="container">
	<section class="hero">
		<div class="hero-content">
			<h1>Experience the Ultimate Cliff Diving Adventure</h1>
			<p class="subtitle">Discover the pristine waters and breathtaking cliffs of Cabilao Island</p>
			<button class="cta-button" on:click={() => openBooking(packages[0])}>Book Now</button>
		</div>
	</section>

	<section class="packages">
		<h2>Our Packages</h2>
		<div class="package-grid">
			{#each packages as pkg}
				<div class="package-card">
					<img src={pkg.image} alt={pkg.name} class="package-image" />
					<div class="package-content">
						<h3>{pkg.name}</h3>
						<p class="duration">{pkg.duration}</p>
						<p class="description">{pkg.description}</p>
						<div class="includes">
							<h4>Package Includes:</h4>
							<ul>
								{#each pkg.includes as item}
									<li>{item}</li>
								{/each}
							</ul>
						</div>
						<div class="package-footer">
							<p class="price">${pkg.price}</p>
							<button class="book-button" on:click={() => openBooking(pkg)}>Book Now</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</section>

	{#if showModal}
		<div 
			class="modal-overlay" 
			on:click={closeModal}
			on:keydown={(e) => e.key === 'Escape' && closeModal()}
			role="dialog"
			aria-modal="true"
		>
			<div 
				class="modal" 
				on:click|stopPropagation 
				on:keydown|stopPropagation
				tabindex="-1"
			>
				<button class="close-button" on:click={closeModal}>&times;</button>
				<h2>Book Your Adventure</h2>
				{#if selectedPackage}
					<div class="selected-package">
						<h3>{selectedPackage.name}</h3>
						<p class="price">${selectedPackage.price}</p>
					</div>
				{/if}
				<form on:submit|preventDefault={handleSubmit} class="booking-form">
					<div class="form-grid">
						<div class="form-group">
							<label for="firstName">First Name *</label>
							<input
								type="text"
								id="firstName"
								bind:value={bookingForm.firstName}
								required
								placeholder="Enter your first name"
							/>
						</div>
						<div class="form-group">
							<label for="lastName">Last Name *</label>
							<input
								type="text"
								id="lastName"
								bind:value={bookingForm.lastName}
								required
								placeholder="Enter your last name"
							/>
						</div>
						<div class="form-group">
							<label for="email">Email *</label>
							<input
								type="email"
								id="email"
								bind:value={bookingForm.email}
								required
								placeholder="Enter your email"
							/>
						</div>
						<div class="form-group">
							<label for="phone">Phone Number *</label>
							<input
								type="tel"
								id="phone"
								bind:value={bookingForm.phone}
								required
								placeholder="Enter your phone number"
							/>
						</div>
						<div class="form-group">
							<label for="checkIn">Check-in Date *</label>
							<input type="date" id="checkIn" bind:value={bookingForm.checkIn} required />
						</div>
						<div class="form-group">
							<label for="checkOut">Check-out Date *</label>
							<input type="date" id="checkOut" bind:value={bookingForm.checkOut} required />
						</div>
						<div class="form-group">
							<label for="guests">Number of Guests *</label>
							<input
								type="number"
								id="guests"
								bind:value={bookingForm.guests}
								min="1"
								max="10"
								required
							/>
						</div>
					</div>

					<div class="addons">
						<h4>Additional Services</h4>
						<label class="checkbox-label">
							<input
								type="checkbox"
								bind:checked={bookingForm.addons.airport_transfer}
							/>
							Airport Transfer Service (+$50)
						</label>
						<label class="checkbox-label">
							<input
								type="checkbox"
								bind:checked={bookingForm.addons.photography}
							/>
							Professional Photography Package (+$99)
						</label>
						<label class="checkbox-label">
							<input
								type="checkbox"
								bind:checked={bookingForm.addons.equipment_rental}
							/>
							Premium Equipment Rental (+$75)
						</label>
					</div>

					<button type="submit" class="submit-button">Confirm Booking</button>
				</form>
			</div>
		</div>
	{/if}
</main>

<style>
	.container {
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;
		padding: 0;
	}

	.hero {
		height: 80vh;
		background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
			url('https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?auto=format&fit=crop&q=80')
			no-repeat center center;
		background-size: cover;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		color: white;
		margin-bottom: 2rem;
	}

	.hero-content {
		padding: 2rem;
	}

	.hero h1 {
		font-size: 3rem;
		margin-bottom: 1rem;
		color: white;
	}

	.subtitle {
		font-size: 1.5rem;
		margin-bottom: 2rem;
	}

	.cta-button {
		background-color: var(--color-theme-1);
		color: white;
		border: none;
		padding: 1rem 2rem;
		font-size: 1.2rem;
		border-radius: 5px;
		cursor: pointer;
		transition: background-color 0.3s ease;
	}

	.cta-button:hover {
		background-color: #ff5722;
	}

	.packages {
		padding: 2rem;
	}

	.packages h2 {
		text-align: center;
		font-size: 2.5rem;
		margin-bottom: 2rem;
		color: var(--color-theme-1);
	}

	.package-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		padding: 1rem;
	}

	.package-card {
		background: white;
		border-radius: 10px;
		overflow: hidden;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		transition: transform 0.3s ease;
	}

	.package-card:hover {
		transform: translateY(-5px);
	}

	.package-image {
		width: 100%;
		height: 200px;
		object-fit: cover;
	}

	.package-content {
		padding: 1.5rem;
	}

	.package-content h3 {
		font-size: 1.5rem;
		margin-bottom: 0.5rem;
		color: var(--color-theme-1);
	}

	.duration {
		color: #666;
		font-size: 0.9rem;
		margin-bottom: 1rem;
	}

	.description {
		margin-bottom: 1rem;
		line-height: 1.6;
	}

	.includes {
		margin-bottom: 1.5rem;
	}

	.includes h4 {
		font-size: 1rem;
		margin-bottom: 0.5rem;
		color: var(--color-theme-2);
	}

	.includes ul {
		list-style-type: none;
		padding: 0;
	}

	.includes li {
		margin-bottom: 0.5rem;
		padding-left: 1.5rem;
		position: relative;
	}

	.includes li::before {
		content: '✓';
		position: absolute;
		left: 0;
		color: var(--color-theme-1);
	}

	.package-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #eee;
	}

	.price {
		font-size: 1.5rem;
		font-weight: bold;
		color: var(--color-theme-1);
	}

	.book-button {
		background-color: var(--color-theme-1);
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 5px;
		cursor: pointer;
		transition: background-color 0.3s ease;
	}

	.book-button:hover {
		background-color: #ff5722;
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.modal {
		background: white;
		padding: 2rem;
		border-radius: 10px;
		width: 90%;
		max-width: 800px;
		max-height: 90vh;
		overflow-y: auto;
		position: relative;
	}

	.close-button {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #666;
	}

	.selected-package {
		margin-bottom: 1.5rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid #eee;
	}

	.booking-form {
		margin-top: 1rem;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}

	.form-group label {
		margin-bottom: 0.5rem;
		color: #666;
	}

	.form-group input {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
	}

	.addons {
		margin-bottom: 1.5rem;
	}

	.addons h4 {
		margin-bottom: 1rem;
		color: var(--color-theme-2);
	}

	.checkbox-label {
		display: block;
		margin-bottom: 0.5rem;
		color: #666;
	}

	.checkbox-label input {
		margin-right: 0.5rem;
	}

	.submit-button {
		background-color: var(--color-theme-1);
		color: white;
		border: none;
		padding: 1rem 2rem;
		border-radius: 5px;
		cursor: pointer;
		width: 100%;
		font-size: 1.1rem;
		transition: background-color 0.3s ease;
	}

	.submit-button:hover {
		background-color: #ff5722;
	}

	@media (max-width: 768px) {
		.hero h1 {
			font-size: 2rem;
		}

		.subtitle {
			font-size: 1.2rem;
		}

		.package-grid {
			grid-template-columns: 1fr;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.modal {
			padding: 1rem;
			width: 95%;
		}
	}
</style>