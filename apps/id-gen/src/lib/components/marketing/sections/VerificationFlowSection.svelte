<script>
	// Verification Flow Section
	// Merges Encode, Scan, and Tap sections into a single managed component
</script>

<!-- Encode (Manual Entry vs Automation) -->
<section class="min-h-screen flex items-center justify-center px-6 md:px-8">
	<div
		class="text-center max-w-3xl mx-auto backdrop-blur-sm bg-black/5 dark:bg-black/30 p-8 rounded-3xl border border-black/5 dark:border-white/5"
	>
		<span
			class="inline-block px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-sm font-medium mb-6"
		>
			Encode
		</span>
		<h2 class="text-4xl md:text-6xl font-bold mb-6 leading-tight text-foreground">
			Kill the Spreadsheet.
		</h2>
		<p class="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
			Manual entry is error-prone and slow. Eliminate typos and sync issues by encoding data
			directly into the card.
		</p>
	</div>
</section>

<!-- Scan (Visual Verification) -->
<section class="min-h-screen flex items-center justify-center px-6 md:px-8">
	<div class="text-center max-w-3xl mx-auto pointer-events-none">
		<span
			class="inline-block px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-sm font-medium mb-6 backdrop-blur-md"
		>
			Verification
		</span>
		<h2
			class="text-7xl md:text-9xl font-black mb-6 tracking-tighter mix-blend-overlay text-foreground/20"
		>
			Scan.
		</h2>
		<p
			class="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto backdrop-blur-sm bg-black/5 dark:bg-black/20 p-4 rounded-xl"
		>
			Instant optical verification with any smartphone.
		</p>
	</div>
</section>

<!-- Tap (NFC Verification) -->
<section class="min-h-screen flex items-center justify-center px-6 md:px-8">
	<div class="text-center max-w-3xl mx-auto pointer-events-none">
		<span
			class="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium mb-6 backdrop-blur-md"
		>
			NFC
		</span>
		<h2
			class="text-7xl md:text-9xl font-black mb-6 tracking-tighter mix-blend-overlay text-white/50"
		>
			Tap.
		</h2>
		<p
			class="text-lg md:text-xl text-gray-300 max-w-xl mx-auto backdrop-blur-sm bg-black/20 p-4 rounded-xl"
		>
			Secure cryptographic challenge-response via NFC.
		</p>
	</div>
</section>
