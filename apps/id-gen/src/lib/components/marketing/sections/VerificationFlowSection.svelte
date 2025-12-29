<script>
	// Verification Flow Section
	// Merges Encode, Scan, and Tap sections into a single managed component
</script>

<!-- Encode (Manual Entry vs Automation) -->
<section
	class="min-h-[300vh] relative flex flex-col px-6 md:px-8"
	data-section-id="encode"
>
	<!-- Sticky Section Header -->
	<div
		class="sticky top-0 pt-8 pb-4 z-10 bg-gradient-to-b from-background via-background to-transparent"
	>
		<div class="text-center">
			<span
				class="inline-block px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-sm font-medium mb-4"
			>
				Encode
			</span>
			<h2 class="text-4xl md:text-6xl font-bold leading-tight text-foreground">
				Kill the Spreadsheet.
			</h2>
		</div>
	</div>

	<!-- Content -->
	<div class="flex-1 flex items-center justify-center">
		<div
			class="text-center max-w-3xl mx-auto backdrop-blur-sm bg-black/5 dark:bg-black/30 p-8 rounded-3xl border border-black/5 dark:border-white/5"
		>
			<p class="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
				Manual entry is error-prone and slow. Eliminate typos and sync issues by encoding data
				directly into the card.
			</p>
		</div>
	</div>
</section>

<!-- Scan (Visual Verification) -->
<section class="min-h-[260vh] relative flex flex-col px-6 md:px-8" data-section-id="scan">
	<!-- Sticky Section Header -->
	<div
		class="sticky top-0 pt-8 pb-4 z-10 bg-gradient-to-b from-background via-background to-transparent"
	>
		<div class="text-center">
			<span
				class="inline-block px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-sm font-medium mb-4 backdrop-blur-md"
			>
				Verification
			</span>
			<h2
				class="text-7xl md:text-9xl font-black tracking-tighter text-foreground"
			>
				Scan.
			</h2>
		</div>
	</div>

	<!-- Content -->
	<div class="flex-1 flex items-center justify-center pointer-events-none">
		<div class="text-center max-w-3xl mx-auto">
			<p
				class="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto backdrop-blur-sm bg-black/5 dark:bg-black/20 p-4 rounded-xl"
			>
				Instant optical verification with any smartphone.
			</p>
		</div>
	</div>
</section>

<!-- Tap Approach (Card Enters) -->
<section
	class="min-h-[40vh] relative flex flex-col px-6 md:px-8"
	data-section-id="tap-approach"
>
	<!-- Sticky Section Header -->
	<div
		class="sticky top-0 pt-8 pb-4 z-10 bg-gradient-to-b from-background via-background to-transparent"
	>
		<div class="text-center pointer-events-none">
			<span
				class="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium mb-4 backdrop-blur-md"
			>
				NFC
			</span>
			<h2
				class="text-7xl md:text-9xl font-black tracking-tighter text-foreground"
			>
				Tap.
			</h2>
		</div>
	</div>
</section>

<!-- Tap Bump (Contact) -->
<section
	class="min-h-[150vh] flex items-center justify-center px-6 md:px-8"
	data-section-id="tap-bump"
>
    <!-- Spacer for animation focus -->
</section>

<!-- Tap Linger (Reading) -->
<section
	class="min-h-[180vh] flex items-center justify-center px-6 md:px-8"
	data-section-id="tap-linger"
>
    <!-- Spacer for animation focus -->
</section>

<!-- Tap Success (Verified) -->
<section
	class="min-h-screen flex items-center justify-center px-6 md:px-8"
	data-section-id="tap-success"
>
	<div class="text-center max-w-3xl mx-auto pointer-events-none">
		<p
			class="text-lg md:text-xl text-gray-300 max-w-xl mx-auto backdrop-blur-sm bg-black/20 p-4 rounded-xl"
		>
			Secure cryptographic challenge-response via NFC.
		</p>
	</div>
</section>
