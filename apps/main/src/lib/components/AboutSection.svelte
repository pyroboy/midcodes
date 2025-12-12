<script lang="ts">
	import { Code2, Palette, PenTool } from 'lucide-svelte';
	
	const roles = [
		{ icon: Code2, label: 'Software Developer', color: 'from-blue-500 to-indigo-600' },
		{ icon: Palette, label: 'Artist', color: 'from-pink-500 to-rose-600' },
		{ icon: PenTool, label: 'Tattoo Artist', color: 'from-emerald-500 to-teal-600' }
	];
	
	const skills = [
		'Full-Stack Development',
		'UI/UX Design',
		'3D Visualization',
		'Creative Direction',
		'Digital Art',
		'Traditional Art'
	];
</script>

<section id="about" class="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-card/50">
	<div class="mx-auto max-w-6xl">
		<div class="text-center mb-16 animate-fade-in">
			<h2 class="text-4xl md:text-5xl font-bold gradient-text mb-6">About Me</h2>
			<div class="max-w-3xl mx-auto">
				<p class="text-xl text-muted-foreground leading-relaxed">
					A multidisciplinary creative who bridges the gap between code and art.
					<span class="text-foreground font-medium">Software Developer</span> by profession,
					<span class="text-foreground font-medium">Artist</span> by passion,
					<span class="text-foreground font-medium">Tattoo Artist</span> by craft.
				</p>
			</div>
		</div>
		
		<!-- Role Cards -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
			{#each roles as role, i}
				<div 
					class="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 animate-scale-in"
					style="animation-delay: {i * 150}ms"
				>
					<div class="absolute inset-0 bg-gradient-to-br {role.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
					<div class="relative z-10">
						<div class="mb-4 inline-flex rounded-xl bg-gradient-to-br {role.color} p-3">
							<role.icon class="h-8 w-8 text-white" />
						</div>
						<h3 class="text-xl font-semibold text-foreground mb-2">{role.label}</h3>
					</div>
				</div>
			{/each}
		</div>
		
		<!-- Skills -->
		<div class="text-center animate-slide-up" style="animation-delay: 400ms">
			<h3 class="text-2xl font-semibold text-foreground mb-6">Core Expertise</h3>
			<div class="flex flex-wrap justify-center gap-3">
				{#each skills as skill, i}
					<span 
						class="px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 text-foreground font-medium hover:scale-105 transition-transform duration-200"
						style="animation-delay: {500 + i * 100}ms"
					>
						{skill}
					</span>
				{/each}
			</div>
		</div>
	</div>
</section>
