<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Card, CardContent, CardHeader } from '$lib/components/ui/card';
</script>

<div class="container mx-auto px-4 py-8 max-w-6xl">
	<!-- Account Overview -->
	<div class="mb-8 space-y-2">
		<Skeleton class="h-10 w-48 rounded-md" />
		<Skeleton class="h-5 w-96 rounded-md" />
	</div>

	

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
		{#each Array(3) as _}
			<Card>
				<CardContent class="p-6">
					<div class="flex items-center justify-between mb-4">
						<Skeleton class="h-10 w-10 rounded-lg" /> <!-- Icon -->
						<Skeleton class="h-5 w-20 rounded-full" /> <!-- Badge -->
					</div>
					<div class="space-y-2">
						<Skeleton class="h-8 w-1/2" />
						<Skeleton class="h-4 w-3/4" />
					</div>
				</CardContent>
			</Card>
		{/each}
	</div>

	<!-- Premium Features & Actions -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
		<Card>
			<CardHeader>
				<Skeleton class="h-7 w-48 mb-2" />
			</CardHeader>
			<CardContent class="space-y-4">
				{#each Array(3) as _}
					<div class="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
						<div class="flex items-center gap-3">
							<Skeleton class="h-8 w-8 rounded-full" />
							<div class="space-y-1">
								<Skeleton class="h-4 w-32" />
								<Skeleton class="h-3 w-48" />
							</div>
						</div>
						<Skeleton class="h-6 w-16 rounded" />
					</div>
				{/each}
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<Skeleton class="h-7 w-32 mb-2" />
			</CardHeader>
			<CardContent class="grid grid-cols-2 gap-4">
				{#each Array(4) as _}
					<div class="p-4 border rounded-lg flex flex-col items-center justify-center gap-3 bg-muted/10 h-32">
						<Skeleton class="h-10 w-10 rounded-full" />
						<Skeleton class="h-4 w-24" />
					</div>
				{/each}
			</CardContent>
		</Card>
	</div>

	<!-- Transaction History -->
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<Skeleton class="h-8 w-48" />
			<Skeleton class="h-9 w-32 rounded-md" />
		</div>

		<div class="border rounded-lg overflow-hidden bg-card">
			<div class="p-4 border-b bg-muted/30 grid grid-cols-4 gap-4">
				<Skeleton class="h-4 w-full" />
				<Skeleton class="h-4 w-full" />
				<Skeleton class="h-4 w-full" />
				<Skeleton class="h-4 w-full" />
			</div>
			{#each Array(5) as _}
				<div class="p-4 border-b last:border-0 grid grid-cols-4 gap-4 items-center">
					<div class="flex items-center gap-3">
						<Skeleton class="h-8 w-8 rounded-full shrink-0" />
						<div class="space-y-1 w-full">
							<Skeleton class="h-4 w-3/4" />
							<Skeleton class="h-3 w-1/2" />
						</div>
					</div>
					<Skeleton class="h-4 w-2/3" />
					<Skeleton class="h-5 w-20 rounded-full" />
					<Skeleton class="h-4 w-1/2 justify-self-end" />
				</div>
			{/each}
		</div>
	</div>
</div>
