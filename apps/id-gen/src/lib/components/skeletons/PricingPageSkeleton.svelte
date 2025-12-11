<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Card, CardContent, CardHeader, CardFooter } from '$lib/components/ui/card';
</script>

<div class="min-h-screen bg-background">
	<!-- Hero Section -->
	<section class="py-16 md:py-24 text-center px-4 max-w-4xl mx-auto space-y-6">
		<Skeleton class="h-16 w-3/4 mx-auto rounded-lg" />
		<Skeleton class="h-6 w-2/3 mx-auto" />
	</section>

	<!-- Pricing Cards Grid -->
	<section class="pb-16 px-4">
		<div class="container max-w-[90rem] mx-auto">
			<div class="text-center mb-12 space-y-4">
				<Skeleton class="h-8 w-32 mx-auto rounded-full" />
				<Skeleton class="h-10 w-64 mx-auto" />
				<Skeleton class="h-4 w-96 mx-auto" />
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
				{#each Array(5) as _, i}
					<Card class="relative flex flex-col h-full {i === 2 ? 'border-primary shadow-lg scale-105 z-10' : ''}">
						<CardHeader class="text-center pb-2">
							<Skeleton class="h-6 w-32 mx-auto mb-4" />
							<Skeleton class="h-12 w-24 mx-auto mb-2" />
							<Skeleton class="h-4 w-40 mx-auto" />
						</CardHeader>
						
						<CardContent class="flex-1 space-y-4 pt-4">
							<div class="h-px bg-border w-full mb-4"></div>
							{#each Array(6) as _}
								<div class="flex items-center gap-3">
									<Skeleton class="h-4 w-4 rounded-full shrink-0" />
									<Skeleton class="h-4 w-full" />
								</div>
							{/each}
						</CardContent>

						<CardFooter>
							<Skeleton class="h-10 w-full rounded-md" />
						</CardFooter>
					</Card>
				{/each}
			</div>
		</div>
	</section>
	
	<!-- FAQ Section Skeleton -->
	<section class="py-16 bg-muted/10 px-4 text-center">
		<Skeleton class="h-8 w-48 mx-auto mb-6" />
		<Skeleton class="h-4 w-96 mx-auto mb-8" />
		<Skeleton class="h-12 w-40 mx-auto rounded-md" />
	</section>
</div>
