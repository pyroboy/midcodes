<script lang="ts">
	import { Bell, Lock, Globe, Info } from 'lucide-svelte';
</script>

<div class="p-6 lg:p-8">
	<div class="mb-8">
		<h1 class="text-3xl lg:text-4xl font-display font-bold text-foreground uppercase tracking-wider">Settings</h1>
		<p class="text-muted-foreground mt-1">Configure Tattoo AI preferences</p>
	</div>

	<div class="max-w-2xl space-y-4">
		<!-- Notifications -->
		<div class="bg-card border border-border rounded-xl p-5 lg:p-6">
			<div class="flex items-start gap-4">
				<div class="p-3 bg-amber-500/10 rounded-lg shrink-0">
					<Bell class="w-5 h-5 text-amber-500" />
				</div>
				<div class="flex-1">
					<h3 class="font-display font-semibold text-foreground uppercase tracking-wide text-sm">Notifications</h3>
					<p class="text-xs text-muted-foreground mt-1 mb-4">
						Manage when you receive alerts about new inquiries and bookings
					</p>
					<div class="space-y-3">
						<label class="flex items-center gap-3 cursor-pointer group">
							<input type="checkbox" checked class="w-4 h-4 rounded border-border bg-muted accent-primary" />
							<span class="text-sm text-muted-foreground group-hover:text-foreground transition">New inquiries via Facebook Messenger</span>
						</label>
						<label class="flex items-center gap-3 cursor-pointer group">
							<input type="checkbox" checked class="w-4 h-4 rounded border-border bg-muted accent-primary" />
							<span class="text-sm text-muted-foreground group-hover:text-foreground transition">Booking confirmations</span>
						</label>
						<label class="flex items-center gap-3 cursor-pointer group">
							<input type="checkbox" checked class="w-4 h-4 rounded border-border bg-muted accent-primary" />
							<span class="text-sm text-muted-foreground group-hover:text-foreground transition">Email notifications</span>
						</label>
					</div>
				</div>
			</div>
		</div>

		<!-- Privacy -->
		<div class="bg-card border border-border rounded-xl p-5 lg:p-6">
			<div class="flex items-start gap-4">
				<div class="p-3 bg-blue-500/10 rounded-lg shrink-0">
					<Lock class="w-5 h-5 text-blue-500" />
				</div>
				<div class="flex-1">
					<h3 class="font-display font-semibold text-foreground uppercase tracking-wide text-sm">Privacy & Security</h3>
					<p class="text-xs text-muted-foreground mt-1 mb-4">
						Control data access and security settings
					</p>
					<button class="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted hover:border-primary/30 transition font-medium text-sm">
						Change Password
					</button>
				</div>
			</div>
		</div>

		<!-- Integrations -->
		<div class="bg-card border border-border rounded-xl p-5 lg:p-6">
			<div class="flex items-start gap-4">
				<div class="p-3 bg-emerald-500/10 rounded-lg shrink-0">
					<Globe class="w-5 h-5 text-emerald-500" />
				</div>
				<div class="flex-1">
					<h3 class="font-display font-semibold text-foreground uppercase tracking-wide text-sm">Integrations</h3>
					<p class="text-xs text-muted-foreground mt-1 mb-4">
						Connect external services
					</p>
					<div class="space-y-3">
						<div class="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
							<div>
								<p class="text-sm font-medium text-foreground">Facebook Messenger</p>
								<p class="text-xs text-muted-foreground font-mono">Receive inquiries from Messenger</p>
							</div>
							<span class="text-xs font-mono font-semibold text-emerald-500">Connected</span>
						</div>
						<div class="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
							<div>
								<p class="text-sm font-medium text-foreground">Google Calendar</p>
								<p class="text-xs text-muted-foreground font-mono">Sync booked sessions</p>
							</div>
							<button class="px-3 py-1 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary/30 transition text-xs font-medium">
								Configure
							</button>
						</div>
						<div class="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
							<div>
								<p class="text-sm font-medium text-foreground">Groq AI</p>
								<p class="text-xs text-muted-foreground font-mono">Llama 3.3 70B chat agent</p>
							</div>
							<span class="text-xs font-mono font-semibold text-emerald-500">Active</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- About -->
		<div class="bg-card border border-border rounded-xl p-5 lg:p-6">
			<div class="flex items-start gap-4">
				<div class="p-3 bg-primary/10 rounded-lg shrink-0">
					<Info class="w-5 h-5 text-primary" />
				</div>
				<div class="flex-1">
					<h3 class="font-display font-semibold text-foreground uppercase tracking-wide text-sm">About</h3>
					<p class="text-sm text-muted-foreground mt-2 font-mono">Tattoo AI v0.1.0</p>
					<p class="text-xs text-muted-foreground mt-1">
						AI-powered tattoo booking agent and CRM
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
