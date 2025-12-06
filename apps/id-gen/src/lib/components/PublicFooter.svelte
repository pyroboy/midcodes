<script lang="ts">
	import { Sparkles, Mail, Phone, MapPin } from 'lucide-svelte';
</script>

<footer class="bg-gray-900">
	<div class="mx-auto max-w-7xl px-6 py-16 lg:px-8">
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-4">
			<!-- Company Info -->
			<div class="lg:col-span-1">
				<div class="flex items-center space-x-2 mb-4">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600"
					>
						<Sparkles class="h-5 w-5 text-white" />
					</div>
					<div>
						<div class="text-lg font-bold text-white">ID-Gen</div>
						<div class="text-xs text-gray-400">Professional ID Cards</div>
					</div>
				</div>
				<p class="text-sm text-gray-300 mb-4">
					Create professional ID cards with our advanced template designer and enterprise-grade
					security.
				</p>
				<div class="flex space-x-4">
					<a
						href="mailto:support@id-gen.com"
						class="text-gray-400 hover:text-white transition-colors"
					>
						<Mail class="h-5 w-5" />
					</a>
					<a href="tel:+63-xxx-xxx-xxxx" class="text-gray-400 hover:text-white transition-colors">
						<Phone class="h-5 w-5" />
					</a>
					<a href="/contact" class="text-gray-400 hover:text-white transition-colors">
						<MapPin class="h-5 w-5" />
					</a>
				</div>
			</div>

			<!-- Product Links -->
			<div>
				<h3 class="text-sm font-semibold text-white mb-4">Product</h3>
				<ul class="space-y-2">
					<li>
						<a href="/features" class="text-sm text-gray-300 hover:text-white transition-colors"
							>Features</a
						>
					</li>
					<li>
						<a href="/templates" class="text-sm text-gray-300 hover:text-white transition-colors"
							>Templates</a
						>
					</li>
					<li>
						<a href="/pricing" class="text-sm text-gray-300 hover:text-white transition-colors"
							>Pricing</a
						>
					</li>
					<li>
						<a href="/api" class="text-sm text-gray-300 hover:text-white transition-colors">API</a>
					</li>
				</ul>
			</div>

			<!-- Company Links -->
			<div>
				<h3 class="text-sm font-semibold text-white mb-4">Company</h3>
				<ul class="space-y-2">
					<li>
						<a href="/about" class="text-sm text-gray-300 hover:text-white transition-colors"
							>About Us</a
						>
					</li>
					<li>
						<a href="/blog" class="text-sm text-gray-300 hover:text-white transition-colors">Blog</a
						>
					</li>
					<li>
						<a href="/careers" class="text-sm text-gray-300 hover:text-white transition-colors"
							>Careers</a
						>
					</li>
					<li>
						<a href="/contact" class="text-sm text-gray-300 hover:text-white transition-colors"
							>Contact</a
						>
					</li>
				</ul>
			</div>

			<!-- Support Links -->
			<div>
				<h3 class="text-sm font-semibold text-white mb-4">Support</h3>
				<ul class="space-y-2">
					<li>
						<a href="/help" class="text-sm text-gray-300 hover:text-white transition-colors"
							>Help Center</a
						>
					</li>
					<li>
						<a href="/docs" class="text-sm text-gray-300 hover:text-white transition-colors"
							>Documentation</a
						>
					</li>
					<li>
						<a href="/support" class="text-sm text-gray-300 hover:text-white transition-colors"
							>Support</a
						>
					</li>
					<li>
						<a href="/status" class="text-sm text-gray-300 hover:text-white transition-colors"
							>System Status</a
						>
					</li>
				</ul>
			</div>
		</div>

		<div class="mt-12 border-t border-gray-800 pt-8">
			<div class="flex flex-col items-center justify-between lg:flex-row">
				<div class="flex space-x-6 text-sm text-gray-400">
					<a href="/privacy" class="hover:text-white transition-colors">Privacy Policy</a>
					<a href="/terms" class="hover:text-white transition-colors">Terms of Service</a>
					<a href="/security" class="hover:text-white transition-colors">Security</a>
				</div>
				<p class="mt-4 text-sm text-gray-400 lg:mt-0">© 2024 ID-Gen. All rights reserved.</p>
			</div>
		</div>
	</div>
</footer>
