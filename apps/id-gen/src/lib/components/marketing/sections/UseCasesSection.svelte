<script>
	// Use Cases Section
	// Three main categories: Networking & Marketing (NFC), Identification & Information, Attendance & Management
	// Each section is 250vh tall with card texture changes

	const useCaseCategories = [
		{
			id: 'networking',
			tag: 'Networking & Marketing',
			tagColor: 'cyan',
			title: 'Make Every Tap Count.',
			description: 'Transform physical interactions into digital connections. NFC-powered cards that share, collect, and track.',
			applications: [
				{ icon: '💼', name: 'Digital Business Cards', desc: 'Share contact info with a tap' },
				{ icon: '⭐', name: 'Review Cards', desc: 'Collect customer feedback instantly' },
				{ icon: '📶', name: 'WiFi Access Cards', desc: 'One tap wireless network access' }
			]
		},
		{
			id: 'identification',
			tag: 'Identification & Information',
			tagColor: 'amber',
			title: 'Critical Info When It Matters.',
			description: 'Life-saving details accessible instantly. From emergency contacts to product authenticity verification.',
			applications: [
				{ icon: '🏥', name: 'Medical Emergency Cards', desc: 'Allergies, conditions, emergency contacts' },
				{ icon: '🐕', name: 'Pet ID Tags', desc: 'Owner info and medical history' },
				{ icon: '✓', name: 'Product Authentication', desc: 'Verify authenticity, track provenance' }
			]
		},
		{
			id: 'attendance',
			tag: 'Attendance & Management',
			tagColor: 'emerald',
			title: 'Track. Manage. Secure.',
			description: 'Streamline operations with smart access control and real-time attendance tracking across any venue.',
			applications: [
				{ icon: '⏰', name: 'Employee Time & Attendance', desc: 'Accurate clock-in, real-time reports' },
				{ icon: '🎓', name: 'School Monitoring', desc: 'Student attendance and campus access' },
				{ icon: '🎫', name: 'Event Ticketing', desc: 'VIP zones, session tracking' },
				{ icon: '💪', name: 'Gym Membership', desc: 'Access control and usage analytics' }
			]
		}
	];

	const tagColorClasses = {
		cyan: {
			bg: 'bg-cyan-500/10',
			border: 'border-cyan-500/20',
			text: 'text-cyan-400'
		},
		amber: {
			bg: 'bg-amber-500/10',
			border: 'border-amber-500/20',
			text: 'text-amber-400'
		},
		emerald: {
			bg: 'bg-emerald-500/10',
			border: 'border-emerald-500/20',
			text: 'text-emerald-400'
		}
	};
</script>

{#each useCaseCategories as category, idx}
	{@const colors = tagColorClasses[category.tagColor]}
	<section
		class="h-[250vh] relative flex items-center justify-center px-6 md:px-8"
		data-section-id="useCases-{category.id}"
	>
		<!-- Sticky Container that stays in viewport -->
		<div class="sticky top-0 h-screen w-full flex items-center justify-center">
			<div class="text-center max-w-4xl mx-auto">
				<!-- Tag Badge -->
				<span
					class="inline-block px-4 py-1.5 {colors.bg} border {colors.border} rounded-full {colors.text} text-sm font-medium mb-6"
				>
					{category.tag}
				</span>
				
				<!-- Title -->
				<h2 class="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 leading-tight">
					{category.title}
				</h2>
				
				<!-- Description -->
				<p class="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
					{category.description}
				</p>
				
				<!-- Application Cards -->
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-{category.applications.length === 4 ? 4 : 3} gap-4 text-left">
					{#each category.applications as app}
						<div
							class="p-5 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 backdrop-blur-sm hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300"
						>
							<div class="text-2xl mb-3">{app.icon}</div>
							<h3 class="font-semibold mb-1 text-sm md:text-base">{app.name}</h3>
							<p class="text-xs md:text-sm text-muted-foreground">{app.desc}</p>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>
{/each}

<!-- Impact / Scale -->
<section class="min-h-[300vh] relative px-6 md:px-8 flex flex-col" data-section-id="systemScale">
	<!-- Sticky Title at Top -->
	<div
		class="sticky top-0 pt-8 pb-4 z-10 bg-gradient-to-b from-background via-background to-transparent"
	>
		<div class="text-center">
			<span
				class="inline-block px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-sm font-medium mb-4"
			>
				Impact
			</span>
			<h2 class="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight">System Scale.</h2>
		</div>
	</div>

	<!-- Spacer to push content to bottom -->
	<div class="flex-1"></div>

	<!-- Sticky Content at Bottom -->
	<div
		class="sticky bottom-0 pb-12 pt-4 z-10 bg-gradient-to-t from-background via-background to-transparent"
	>
		<div class="text-center max-w-3xl mx-auto">
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
					Upgrade your networking. One card to share your entire professional portfolio.
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
