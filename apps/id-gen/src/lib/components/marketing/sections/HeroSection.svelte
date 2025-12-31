<script lang="ts">
	import { onMount } from 'svelte';

	// Use cases to cycle through
	const useCases = [
		'Student IDs',
		'Business Cards',
		'Event Badges',
		'Employee Access',
		'Gym Memberships',
		'Medical IDs',
		'Pet Tags',
		'Product Authentication'
	];

	let currentIndex = $state(0);
	let displayText = $state('');
	let isDeleting = $state(false);
	let showCaret = $state(true);

	onMount(() => {
		// Caret blink (3x faster: 530ms → ~175ms)
		const caretInterval = setInterval(() => {
			showCaret = !showCaret;
		}, 175);

		// Typing animation
		let timeout: ReturnType<typeof setTimeout>;

		function type() {
			const currentWord = useCases[currentIndex];

			if (!isDeleting) {
				// Typing
				displayText = currentWord.slice(0, displayText.length + 1);

				if (displayText === currentWord) {
					// Pause at end of word (3x faster: 2000ms → ~667ms)
					timeout = setTimeout(() => {
						isDeleting = true;
						type();
					}, 667);
					return;
				}
			} else {
				// Deleting
				displayText = currentWord.slice(0, displayText.length - 1);

				if (displayText === '') {
					isDeleting = false;
					currentIndex = (currentIndex + 1) % useCases.length;
				}
			}

			// Speed: 3x faster (100ms → 33ms, 50ms → 17ms)
			const speed = isDeleting ? 17 : 33;
			timeout = setTimeout(type, speed);
		}

		// Start typing
		type();

		return () => {
			clearInterval(caretInterval);
			clearTimeout(timeout);
		};
	});
</script>

<section class="min-h-screen flex flex-col px-4 pt-4 pb-12 relative" data-section-id="hero">
	<!-- Top Content - Title + Typing Animation -->
	<div class="text-center max-w-4xl mx-auto">
		<h1 class="text-4xl md:text-6xl font-black tracking-tight text-foreground">
			Digital Card for Everything
		</h1>

		<!-- Typing Animation -->
		<div class="text-2xl md:text-4xl font-bold text-foreground mt-4 h-12 flex items-center justify-center">
			<span class="text-muted-foreground mr-2">for</span>
			<span class="text-blue-500">
				{displayText}
			</span>
			<span
				class="w-[3px] h-8 md:h-10 bg-blue-500 ml-1 {showCaret ? 'opacity-100' : 'opacity-0'}"
			></span>
		</div>
	</div>

	<!-- Spacer for 3D Card -->
	<div class="flex-1 min-h-[40vh]"></div>

	<!-- Bottom Content - CTA buttons -->
	<div class="text-center max-w-4xl mx-auto pb-24">
		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			<a
				href="/auth"
				class="px-8 py-4 bg-foreground text-background font-semibold rounded-lg hover:bg-foreground/90 transition-colors"
			>
				Get Started
			</a>
			<a
				href="/auth"
				class="px-8 py-4 border border-input text-muted-foreground font-semibold rounded-lg hover:border-foreground hover:text-foreground transition-colors"
			>
				Personal Card
			</a>
		</div>
	</div>

	<!-- Scroll indicator -->
	<div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
		<svg
			class="w-6 h-6 text-muted-foreground"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M19 14l-7 7m0 0l-7-7m7 7V3"
			/>
		</svg>
	</div>
</section>
