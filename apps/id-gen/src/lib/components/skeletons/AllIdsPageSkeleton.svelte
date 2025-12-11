<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton';
	import IDCardSkeleton from '$lib/components/IDCardSkeleton.svelte';
</script>

<div class="container mx-auto px-4 py-6 max-w-7xl h-full flex flex-col">
	<!-- Header & Actions -->
	<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
		<div class="space-y-2">
			<Skeleton class="h-10 w-48 rounded-md" />
			<Skeleton class="h-5 w-64 rounded-md" />
		</div>
		<div class="flex gap-2 w-full md:w-auto">
			<Skeleton class="h-10 w-full md:w-32 rounded-md" />
			<Skeleton class="h-10 w-full md:w-32 rounded-md" />
		</div>
	</div>

	<!-- Filters Bar -->
	<div class="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-muted/30 rounded-lg border border-border/50">
		<Skeleton class="h-10 flex-1 rounded-md" />
		<div class="flex gap-2">
			<Skeleton class="h-10 w-24 rounded-md" />
			<Skeleton class="h-10 w-24 rounded-md" />
		</div>
	</div>

	<!-- Content Grid -->
	<div class="flex-1">
		<IDCardSkeleton count={12} minWidth={280} />
	</div>

	<!-- Pagination -->
	<div class="flex justify-center items-center gap-2 mt-8 py-4 border-t border-border">
		<Skeleton class="h-10 w-10 rounded-md" />
		<Skeleton class="h-10 w-10 rounded-md" />
		<Skeleton class="h-10 w-32 rounded-md" />
		<Skeleton class="h-10 w-10 rounded-md" />
		<Skeleton class="h-10 w-10 rounded-md" />
	</div>
</div>
