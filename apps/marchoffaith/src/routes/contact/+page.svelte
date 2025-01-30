<svelte:head>
	<title>Contact Us - Grace Community Church</title>
	<meta name="description" content="Get in touch with Grace Community Church" />
</svelte:head>

<div class="max-w-6xl mx-auto px-4 py-8">
	<h1 class="text-4xl font-bold text-gray-900 mb-8">Contact Us</h1>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
		<div class="bg-gray-50 p-6 rounded-lg">
			<h2 class="text-2xl font-semibold text-gray-800 mb-6">Get in Touch</h2>
			<div class="space-y-6">
				<div>
					<h3 class="text-lg font-semibold text-purple-600 mb-2">Address</h3>
					<p class="text-gray-600">123 Main Street<br />Cityville, State 12345</p>
				</div>
				<div>
					<h3 class="text-lg font-semibold text-purple-600 mb-2">Phone</h3>
					<p class="text-gray-600">(555) 123-4567</p>
				</div>
				<div>
					<h3 class="text-lg font-semibold text-purple-600 mb-2">Email</h3>
					<p class="text-gray-600">info@gracechurch.example</p>
				</div>
				<div>
					<h3 class="text-lg font-semibold text-purple-600 mb-2">Office Hours</h3>
					<p class="text-gray-600">Monday - Friday: 9:00 AM - 5:00 PM</p>
				</div>
			</div>
		</div>

		<div class="bg-gray-50 p-6 rounded-lg">
			<h2 class="text-2xl font-semibold text-gray-800 mb-6">Send us a Message</h2>
			<form class="space-y-4">
				<div>
					<label for="name" class="block text-sm font-medium text-purple-600 mb-2">Name</label>
					<input 
						type="text" 
						id="name" 
						required 
						class="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
					/>
				</div>
				<div>
					<label for="email" class="block text-sm font-medium text-purple-600 mb-2">Email</label>
					<input 
						type="email" 
						id="email" 
						required 
						class="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
					/>
				</div>
				<div>
					<label for="message" class="block text-sm font-medium text-purple-600 mb-2">Message</label>
					<textarea 
						id="message" 
						rows="5" 
						required 
						class="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
					></textarea>
				</div>
				<button 
					type="submit" 
					class="w-full bg-purple-600 text-white py-3 px-6 rounded-md hover:bg-purple-700 transition-colors duration-200"
				>
					Send Message
				</button>
			</form>
		</div>
	</div>
</div>