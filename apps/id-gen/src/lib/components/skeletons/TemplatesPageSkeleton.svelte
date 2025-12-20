<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton';
</script>

<div class="flex h-[calc(100vh-4rem)] overflow-hidden">
	<!-- Sidebar Skeleton -->
	<div class="w-80 border-r border-border bg-muted/10 hidden lg:flex flex-col">
		<div class="p-4 border-b border-border space-y-4">
			<div class="flex justify-between items-center">
				<Skeleton class="h-6 w-24" />
				<Skeleton class="h-8 w-8 rounded-full" />
			</div>
			<Skeleton class="h-10 w-full rounded-md" />
		</div>

		<div class="flex-1 p-4 space-y-3 overflow-y-auto">
			{#each Array(6) as _}
				<div class="flex items-center gap-3 p-3 rounded-lg border border-transparent bg-card/50">
					<Skeleton class="h-12 w-16 rounded pixelated" />
					<div class="flex-1 space-y-2">
						<Skeleton class="h-4 w-3/4" />
						<Skeleton class="h-3 w-1/2" />
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Main Content Skeleton -->
	<div class="flex-1 flex flex-col bg-background relative">
		<!-- Toolbar -->
		<div class="h-14 border-b border-border flex items-center justify-between px-4">
			<div class="flex items-center gap-4">
				<Skeleton class="h-8 w-8 rounded-md lg:hidden" />
				<!-- Mobile menu toggle -->
				<Skeleton class="h-6 w-48 rounded" />
			</div>
			<div class="flex items-center gap-2">
				<Skeleton class="h-9 w-24 rounded-md" />
				<Skeleton class="h-9 w-24 rounded-md" />
			</div>
		</div>

		<!-- Editor Area -->
		<div class="flex-1 p-8 overflow-y-auto flex items-start justify-center">
			<div class="w-full max-w-5xl space-y-8">
				<!-- Front Side -->
				<div class="space-y-4">
					<div class="flex justify-between items-center">
						<Skeleton class="h-6 w-32" />
						<Skeleton class="h-8 w-8 rounded-full" />
					</div>
					<div
						class="relative w-full aspect-[1.586/1] bg-muted/20 rounded-lg border-2 border-dashed border-border flex items-center justify-center"
					>
						<div class="text-center space-y-4 opacity-50">
							<Skeleton class="h-16 w-16 rounded-full mx-auto" />
							<Skeleton class="h-4 w-40 mx-auto" />
						</div>
					</div>
				</div>

				<!-- Back Side -->
				<div class="space-y-4">
					<div class="flex justify-between items-center">
						<Skeleton class="h-6 w-32" />
						<Skeleton class="h-8 w-8 rounded-full" />
					</div>
					<div
						class="relative w-full aspect-[1.586/1] bg-muted/20 rounded-lg border-2 border-dashed border-border flex items-center justify-center"
					>
						<div class="text-center space-y-4 opacity-50">
							<Skeleton class="h-16 w-16 rounded-full mx-auto" />
							<Skeleton class="h-4 w-40 mx-auto" />
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Properties Panel Skeleton (Right) -->
	<div class="w-72 border-l border-border bg-muted/10 hidden xl:flex flex-col p-4 space-y-6">
		<Skeleton class="h-6 w-1/2" />

		<div class="space-y-4">
			<Skeleton class="h-10 w-full rounded-md" />
			<Skeleton class="h-24 w-full rounded-md" />
		</div>

		<div class="space-y-4 pt-4 border-t border-border">
			<Skeleton class="h-5 w-1/3" />
			<div class="grid grid-cols-2 gap-2">
				<Skeleton class="h-8 w-full rounded" />
				<Skeleton class="h-8 w-full rounded" />
				<Skeleton class="h-8 w-full rounded" />
				<Skeleton class="h-8 w-full rounded" />
			</div>
		</div>
	</div>
</div>
