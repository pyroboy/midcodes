<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton';
	import IDCardSkeleton from '$lib/components/IDCardSkeleton.svelte';
</script>

<div class="h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
	<div
		class="flex-1 container mx-auto px-4 py-8 relative w-full h-full flex flex-col lg:flex-row gap-8 items-center lg:justify-center overflow-y-auto lg:overflow-visible"
	>
		<!-- Left Side: Controls & Info -->
		<div class="w-full lg:w-1/3 flex flex-col gap-8 z-10 shrink-0 mb-40 lg:mb-0">
			<!-- Hero Text -->
			<div class="space-y-2">
				<Skeleton class="h-16 w-3/4 rounded-lg" />
				<Skeleton class="h-6 w-full rounded-md" />
				<Skeleton class="h-6 w-2/3 rounded-md" />
			</div>

			<!-- Template Selector -->
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<Skeleton class="h-8 w-40 rounded-md" />
					<Skeleton class="h-8 w-24 rounded-full" />
				</div>

				<div class="grid grid-cols-2 lg:grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto pr-2">
					{#each Array(4) as _}
						<div class="relative bg-card rounded-lg overflow-hidden border border-border">
							<Skeleton class="aspect-[1.586/1] w-full" />
							<div class="p-3 space-y-2">
								<Skeleton class="h-4 w-3/4" />
								<Skeleton class="h-3 w-1/2" />
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="flex gap-4">
				<Skeleton class="h-12 flex-1 rounded-md" />
				<Skeleton class="h-12 flex-1 rounded-md" />
			</div>
		</div>

		<!-- Right Side: 3D Preview Placeholder -->
		<div
			class="hidden lg:flex w-full lg:w-2/3 h-[50vh] lg:h-full items-center justify-center relative"
		>
			<div class="absolute inset-0 flex items-center justify-center opacity-30">
				<div
					class="relative w-[300px] h-[450px] rounded-[15px] border-4 border-dashed border-primary/50 animate-pulse flex items-center justify-center"
				>
					<div class="text-primary/50 font-bold text-xl">Loading 3D Scene...</div>
				</div>
			</div>

			<!-- Floating Elements -->
			<Skeleton class="absolute top-1/4 right-1/4 w-16 h-16 rounded-full opacity-20" />
			<Skeleton class="absolute bottom-1/4 left-1/4 w-24 h-24 rounded-full opacity-20" />
		</div>
	</div>

	<!-- Bottom Section: Recent IDs -->
	<div class="border-t border-border bg-card/30 backdrop-blur-sm p-6 shrink-0 z-20">
		<div class="container mx-auto max-w-7xl">
			<div class="flex items-center justify-between mb-4">
				<Skeleton class="h-8 w-48 rounded-md" />
				<div class="flex gap-2">
					<Skeleton class="h-9 w-24 rounded-md" />
					<Skeleton class="h-9 w-24 rounded-md" />
				</div>
			</div>

			<!-- Use existing IDCardSkeleton but in horizontal scroll mode -->
			<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
				{#each Array(6) as _}
					<div class="bg-card border border-border rounded-xl overflow-hidden p-2 space-y-2">
						<Skeleton class="aspect-[1.586/1] w-full rounded-md" />
						<Skeleton class="h-3 w-2/3" />
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
