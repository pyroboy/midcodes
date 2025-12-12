<script lang="ts">
	import { Mail, Github, Linkedin, Twitter, Send } from 'lucide-svelte';
	
	let name = $state('');
	let email = $state('');
	let message = $state('');
	let isSubmitting = $state(false);
	let submitted = $state(false);
	
	const socials = [
		{ icon: Github, label: 'GitHub', href: 'https://github.com/arjomagno' },
		{ icon: Linkedin, label: 'LinkedIn', href: 'https://linkedin.com/in/arjomagno' },
		{ icon: Twitter, label: 'Twitter', href: 'https://twitter.com/arjomagno' }
	];
	
	async function handleSubmit(e: Event) {
		e.preventDefault();
		isSubmitting = true;
		// Simulate form submission
		await new Promise(resolve => setTimeout(resolve, 1000));
		submitted = true;
		isSubmitting = false;
	}
</script>

<section id="contact" class="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-t from-card/80 to-transparent">
	<div class="mx-auto max-w-4xl">
		<div class="text-center mb-16 animate-fade-in">
			<h2 class="text-4xl md:text-5xl font-bold gradient-text mb-6">Get In Touch</h2>
			<p class="text-xl text-muted-foreground">
				Have a project in mind? Let's create something amazing together.
			</p>
		</div>
		
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
			<!-- Contact Form -->
			<div class="animate-slide-up">
				{#if submitted}
					<div class="rounded-2xl border border-green-500/30 bg-green-500/10 p-8 text-center">
						<div class="inline-flex rounded-full bg-green-500/20 p-3 mb-4">
							<Send class="h-8 w-8 text-green-500" />
						</div>
						<h3 class="text-xl font-semibold text-foreground mb-2">Message Sent!</h3>
						<p class="text-muted-foreground">Thanks for reaching out. I'll get back to you soon.</p>
					</div>
				{:else}
					<form onsubmit={handleSubmit} class="space-y-6">
						<div>
							<label for="name" class="block text-sm font-medium text-foreground mb-2">Name</label>
							<input
								id="name"
								type="text"
								bind:value={name}
								required
								class="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
								placeholder="Your name"
							/>
						</div>
						<div>
							<label for="email" class="block text-sm font-medium text-foreground mb-2">Email</label>
							<input
								id="email"
								type="email"
								bind:value={email}
								required
								class="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
								placeholder="your@email.com"
							/>
						</div>
						<div>
							<label for="message" class="block text-sm font-medium text-foreground mb-2">Message</label>
							<textarea
								id="message"
								bind:value={message}
								required
								rows={5}
								class="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none"
								placeholder="Tell me about your project..."
							></textarea>
						</div>
						<button
							type="submit"
							disabled={isSubmitting}
							class="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{#if isSubmitting}
								<div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
								Sending...
							{:else}
								<Send class="h-5 w-5" />
								Send Message
							{/if}
						</button>
					</form>
				{/if}
			</div>
			
			<!-- Contact Info -->
			<div class="animate-slide-up" style="animation-delay: 200ms">
				<div class="rounded-2xl border border-border bg-card/50 backdrop-blur p-8">
					<h3 class="text-2xl font-semibold text-foreground mb-6">Connect With Me</h3>
					
					<div class="space-y-4 mb-8">
						<a 
							href="mailto:hello@arjomagno.com" 
							class="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition-all duration-200 group"
						>
							<div class="rounded-lg bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
								<Mail class="h-6 w-6 text-primary" />
							</div>
							<div>
								<p class="text-sm text-muted-foreground">Email</p>
								<p class="text-foreground font-medium">hello@arjomagno.com</p>
							</div>
						</a>
					</div>
					
					<h4 class="text-lg font-medium text-foreground mb-4">Social Links</h4>
					<div class="flex gap-4">
						{#each socials as social}
							<a 
								href={social.href}
								target="_blank"
								rel="noopener noreferrer"
								class="flex items-center justify-center w-12 h-12 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-primary/10 transition-all duration-200 group"
								aria-label={social.label}
							>
								<social.icon class="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
							</a>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
