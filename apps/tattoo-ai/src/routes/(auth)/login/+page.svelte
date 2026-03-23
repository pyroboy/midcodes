<script lang="ts">
	import { Flame } from 'lucide-svelte';

	let email = $state('');
	let loading = $state(false);
</script>

<div class="flex items-center justify-center min-h-screen bg-background px-4">
	<div class="w-full max-w-md">
		<div class="bg-card rounded-2xl shadow-2xl shadow-primary/5 p-8 border border-border">
			<div class="flex items-center gap-3 mb-8">
				<div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
					<Flame class="w-6 h-6 text-primary" />
				</div>
				<div>
					<h1 class="text-2xl font-display font-bold text-foreground uppercase tracking-wider">Tattoo AI</h1>
					<p class="text-xs text-muted-foreground font-mono">Admin Dashboard</p>
				</div>
			</div>

			<form
				action="?/login"
				method="POST"
				class="space-y-4"
			>
				<div>
					<label for="email" class="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
						Email Address
					</label>
					<input
						type="email"
						id="email"
						name="email"
						bind:value={email}
						placeholder="you@example.com"
						required
						class="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition font-mono text-sm"
					/>
				</div>

				<button
					type="submit"
					disabled={loading || !email}
					class="w-full bg-primary text-primary-foreground py-3 rounded-xl font-display font-semibold uppercase tracking-wider hover:bg-primary/90 disabled:opacity-50 transition-all"
				>
					{loading ? 'Sending...' : 'Send Magic Link'}
				</button>
			</form>

			<p class="text-xs text-muted-foreground mt-6 text-center font-mono">
				Magic link will be sent to your email.
			</p>
		</div>
	</div>
</div>
