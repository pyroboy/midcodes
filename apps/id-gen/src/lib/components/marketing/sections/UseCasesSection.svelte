<script>
	// Use Cases Section
	// Merges Applications, Impact, and Segmentation into a single managed component
</script>

<!-- Applications -->
<section
	class="min-h-[150vh] flex items-center justify-center px-6 md:px-8"
	data-section-id="useCases"
>
	<div class="text-center max-w-3xl mx-auto">
		<span
			class="inline-block px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm font-medium mb-6"
		>
			Applications
		</span>
		<h2 class="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 leading-tight">
			One Platform, Many Use Cases.
		</h2>
		<p class="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
			Schools, Dorms, Events - all unified under one flexible system.
		</p>
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
			<div
				class="p-6 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10"
			>
				<div class="text-2xl mb-3">🎓</div>
				<h3 class="font-semibold mb-2">Student IDs</h3>
				<p class="text-sm text-muted-foreground">Library access, cafeteria, attendance tracking</p>
			</div>
			<div class="p-6 bg-white/5 rounded-xl border border-white/10">
				<div class="text-2xl mb-3">🏠</div>
				<h3 class="font-semibold mb-2">Dormitory Keys</h3>
				<p class="text-sm text-muted-foreground">Room access, curfew logging, visitor management</p>
			</div>
			<div class="p-6 bg-white/5 rounded-xl border border-white/10">
				<div class="text-2xl mb-3">🎪</div>
				<h3 class="font-semibold mb-2">Event Passes</h3>
				<p class="text-sm text-muted-foreground">VIP zones, session tracking, networking</p>
			</div>
		</div>
	</div>

	<!-- Impact / Scale (nested or split? Plan calls for single useCases. Let's keep it under the same ID effectively or merge logic, but DOM structure here separates them. Let's make Impact part of the same visual flow, or assume the parent section covers it. 
	Wait, the plan said "Tag: useCases". The previous map had one 'useCases' sections. 
	Let's wrap multiple sections? Or just tag the first one?
	Actually, UseCases and Impact are separate sections in the file.
	Let's tag the second one as part of useCases if possible, or just ignore for now if scroll state covers range.
	But dynamic calculation relies on bounding box. 
	If 'useCases' ID is only on the first section, the calculation will only cover that height.
	I should probably tag the second one 'useCases-impact' or similar and merge, OR just wrap them.
	Wrapping is better.
	But they are top level elements. 
	I will tag the first one 'useCases'. The second one 'impact' but map it to 'useCases' in logic?
	Or just tag the second one 'impact' and add it to valid sections in logic.
	Let's check ScrollState logic. It expects specific keys.
	'useCases' key covers 0.70-0.85 approx.
	Let's tag the first one `useCases` and the second one... let's merge them into a div wrapper?
	-->
</section>

<!-- Impact / Scale -->
<section
	class="min-h-screen flex items-center justify-center px-6 md:px-8"
	data-section-id="systemScale"
>
	<div class="text-center max-w-3xl mx-auto">
		<span
			class="inline-block px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-sm font-medium mb-6"
		>
			Impact
		</span>
		<h2 class="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 leading-tight">System Scale.</h2>
		<div class="grid grid-cols-2 gap-8 mb-8">
			<div>
				<div class="text-4xl md:text-5xl font-black text-foreground mb-2">1.2M+</div>
				<p class="text-muted-foreground">Verifications Logged</p>
			</div>
			<div>
				<div class="text-4xl md:text-5xl font-black text-foreground mb-2">24</div>
				<p class="text-muted-foreground">Active Partners</p>
			</div>
		</div>
		<p class="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
			Trusted by schools, government offices, and event organizers across the Philippines.
		</p>
	</div>
</section>

<!-- Segmentation (Call to Action) -->
<section class="min-h-screen flex items-center justify-center px-0" data-section-id="segmentation">
	<div class="flex flex-col md:flex-row w-full min-h-screen">
		<!-- Organization Side -->
		<div
			class="flex-1 flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r border-black/5 dark:border-white/5 bg-gradient-to-br from-blue-900/10 to-transparent hover:from-blue-900/20 transition-all duration-500 group"
		>
			<div
				class="max-w-md text-center md:text-right md:pr-12 md:mr-auto w-full transition-transform duration-500 group-hover:-translate-x-2"
			>
				<h3 class="text-3xl font-bold mb-4">For Organizations</h3>
				<p class="text-muted-foreground mb-8 text-lg">
					Secure your campus or company. Unified attendance and access control.
				</p>
				<a
					href="/enterprise"
					class="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-500 dark:hover:text-blue-300 flex items-center gap-2 justify-center md:justify-end"
				>
					Explore Enterprise Solutions
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 8l4 4m0 0l-4 4m4-4H3"
						/></svg
					>
				</a>
			</div>
		</div>

		<!-- Individual Side -->
		<div
			class="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-bl from-purple-900/10 to-transparent hover:from-purple-900/20 transition-all duration-500 group"
		>
			<div
				class="max-w-md text-center md:text-left md:pl-12 md:ml-auto w-full transition-transform duration-500 group-hover:translate-x-2"
			>
				<h3 class="text-3xl font-bold mb-4">For Individuals</h3>
				<p class="text-muted-foreground mb-8 text-lg">
					Upgrade your networking. One card to share your entire professionally portfolio.
				</p>
				<a
					href="/personal"
					class="text-purple-600 dark:text-purple-400 font-semibold hover:text-purple-500 dark:hover:text-purple-300 flex items-center gap-2 justify-center md:justify-start"
				>
					Get Your Personal Card
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 8l4 4m0 0l-4 4m4-4H3"
						/></svg
					>
				</a>
			</div>
		</div>
	</div>
</section>
