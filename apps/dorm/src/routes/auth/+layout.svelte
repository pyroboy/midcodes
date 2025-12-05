<script lang="ts">
	import { Building2 } from 'lucide-svelte';
	let { children } = $props();
</script>

<div
	class="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0"
>
	<!-- Left Side: Branding & Visuals -->
	<div class="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
		<!-- Background Image -->
		<div class="absolute inset-0">
			<img
				src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2535&auto=format&fit=crop"
				alt="Modern Apartment Building"
				class="h-full w-full object-cover"
			/>
			<!-- Gradient Overlay for text readability -->
			<div class="absolute inset-0 bg-zinc-900/70 mix-blend-multiply"></div>
		</div>

		<!-- Logo Area -->
		<div class="relative z-20 flex items-center text-lg font-bold tracking-tight">
			<Building2 class="mr-2 h-6 w-6" />
			<span>DormAdmin Suite</span>
		</div>

		<!-- Testimonial / Branding Footer -->
		<div class="relative z-20 mt-auto">
			<blockquote class="space-y-2">
				<p class="text-lg font-medium leading-relaxed">
					&ldquo;This platform has completely streamlined our property operations, from tenant
					onboarding to automated billing cycles. It's the standard for modern dormitory
					management.&rdquo;
				</p>
				<footer class="text-sm text-zinc-300">Sofia Davis, Senior Property Manager</footer>
			</blockquote>
		</div>
	</div>

	<!-- Right Side: Form Content -->
	<div class="lg:p-8 bg-background h-full flex items-center">
		<div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
			{@render children()}

			<p class="px-8 text-center text-sm text-muted-foreground">
				By clicking continue, you agree to our
				<a href="/terms" class="underline underline-offset-4 hover:text-primary">
					Terms of Service
				</a>
				and
				<a href="/privacy" class="underline underline-offset-4 hover:text-primary">
					Privacy Policy
				</a>
				.
			</p>
		</div>
	</div>
</div>
