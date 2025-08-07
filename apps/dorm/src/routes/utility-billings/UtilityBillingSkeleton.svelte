<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton';
</script>

<div class="space-y-6">
	<!-- Table Header Skeleton -->
	<div class="border border-slate-200 rounded-lg">
		<div class="px-6 py-4 border-b border-slate-200">
			<div class="flex items-center justify-between">
				<Skeleton class="h-6 w-48" />
				<div class="flex items-center gap-2">
					<Skeleton class="h-8 w-20" />
					<Skeleton class="h-8 w-24" />
				</div>
			</div>
		</div>

		<!-- Table Content Skeleton -->
		<div class="divide-y divide-slate-200">
			{#each Array(8) as _, i (i)}
				<div class="px-6 py-4">
					<div class="grid grid-cols-7 gap-4 items-center">
						<!-- Property -->
						<div class="space-y-2">
							<Skeleton class="h-4 w-24" />
							<Skeleton class="h-3 w-16" />
						</div>

						<!-- Meter -->
						<div class="space-y-2">
							<Skeleton class="h-4 w-20" />
							<Skeleton class="h-3 w-14" />
						</div>

						<!-- Reading -->
						<div class="space-y-2">
							<Skeleton class="h-4 w-16" />
							<Skeleton class="h-3 w-12" />
						</div>

						<!-- Period -->
						<div class="space-y-2">
							<Skeleton class="h-4 w-20" />
							<Skeleton class="h-3 w-16" />
						</div>

						<!-- Consumption -->
						<div class="space-y-2">
							<Skeleton class="h-4 w-18" />
							<Skeleton class="h-3 w-14" />
						</div>

						<!-- Cost -->
						<div class="space-y-2">
							<Skeleton class="h-4 w-16" />
							<Skeleton class="h-3 w-12" />
						</div>

						<!-- Actions -->
						<div class="flex justify-end gap-2">
							<Skeleton class="h-8 w-20" />
							<Skeleton class="h-8 w-16" />
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Statistics Cards Skeleton -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		{#each Array(3) as _, i (i)}
			<div class="border border-slate-200 rounded-lg p-6">
				<div class="flex items-center justify-between mb-4">
					<Skeleton class="h-6 w-32" />
					<Skeleton class="h-8 w-8 rounded-full" />
				</div>
				<div class="space-y-2">
					<Skeleton class="h-8 w-24" />
					<Skeleton class="h-4 w-40" />
				</div>
			</div>
		{/each}
	</div>
</div>
