<script lang="ts">
	// Verification Flow Section - Encode with live input that drives 3D card
	import { cardDataStore, defaultCardData, JOB_TITLES, COMPANY_NAME, isUserEditingStore, type CardData } from '$lib/stores/encodeInput';

	// Local state initialized from defaults
	let cardData = $state<CardData>({ ...defaultCardData });
	let showTitlePopover = $state(false);

	// Sync to store so 3D card can read it
	$effect(() => {
		cardDataStore.set(cardData);
	});

	function selectTitle(title: string) {
		// Reassign entire object to ensure reactivity triggers
		cardData = { ...cardData, title };
		// Explicitly update store (don't rely solely on effect)
		cardDataStore.set(cardData);
		showTitlePopover = false;
		// Signal that user just edited - show full text immediately
		isUserEditingStore.set(true);
	}

	// When user types, bypass the scroll animation and update store
	function onNameInput() {
		cardDataStore.set(cardData);
		isUserEditingStore.set(true);
	}
</script>

<!-- Encode Section with Live Input -->
<section
	class="min-h-[300vh] relative flex flex-col px-6 md:px-8"
	data-section-id="encode"
>
	<!-- Sticky content that follows through the section -->
	<div class="sticky top-16 pt-6 pb-4 z-10">
		<div class="text-center mb-8">
			<h2 class="text-4xl md:text-6xl font-bold leading-tight text-foreground">
				Direct Card Inputs
			</h2>
			<p class="text-lg md:text-xl text-muted-foreground mt-4 max-w-2xl mx-auto leading-relaxed">
				Manual entry is error-prone and slow. Type once, see it everywhere.
			</p>
		</div>
	</div>

	<!-- Spacer for 3D card visibility -->
	<div class="flex-1 min-h-[50vh]"></div>

	<!-- Sticky Input at bottom -->
	<div class="sticky bottom-8 z-20 max-w-md mx-auto w-full px-4 space-y-3">
		<!-- Name Input -->
		<input
			type="text"
			bind:value={cardData.name}
			oninput={onNameInput}
			placeholder="Enter your name..."
			class="w-full px-6 py-4 text-xl border-2 border-input rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500 transition-colors shadow-lg"
		/>

		<!-- Job Title Selection with Popover -->
		<div class="relative">
			<button
				type="button"
				onclick={() => showTitlePopover = !showTitlePopover}
				class="w-full px-5 py-3 text-base text-left border border-input rounded-xl bg-background text-foreground hover:border-foreground transition-colors shadow-lg flex items-center justify-between"
			>
				<span>{cardData.title || 'Select job title...'}</span>
				<svg class="w-5 h-5 text-muted-foreground transition-transform {showTitlePopover ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			<!-- Popover -->
			{#if showTitlePopover}
				<div class="absolute bottom-full left-0 right-0 mb-2 bg-background border border-border rounded-xl shadow-xl overflow-hidden z-50">
					{#each JOB_TITLES as title}
						<button
							type="button"
							onclick={() => selectTitle(title)}
							class="w-full px-5 py-3 text-left hover:bg-muted transition-colors {cardData.title === title ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground'}"
						>
							{title}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Company (fixed, not editable) -->
		<div class="px-5 py-3 text-base border border-border rounded-xl bg-muted/50 text-muted-foreground">
			{COMPANY_NAME}
		</div>
	</div>
</section>

<!-- Scan (Visual Verification) -->
<section class="min-h-[260vh] relative flex flex-col px-6 md:px-8" data-section-id="scan">
	<!-- Sticky Section Header -->
	<div class="sticky top-16 pt-6 pb-4 z-10">
		<div class="text-center">
			<h2 class="text-7xl md:text-9xl font-black tracking-tighter text-foreground">
				Scan.
			</h2>
		</div>
	</div>

	<!-- Content -->
	<div class="flex-1 flex items-center justify-center pointer-events-none">
		<div class="text-center max-w-3xl mx-auto">
			<p class="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
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
	<div class="sticky top-16 pt-6 pb-4 z-10">
		<div class="text-center pointer-events-none">
			<h2 class="text-7xl md:text-9xl font-black tracking-tighter text-foreground">
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
		<p class="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
			Secure cryptographic challenge-response via NFC.
		</p>
	</div>
</section>
