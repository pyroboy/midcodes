<script lang="ts">
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { Card, CardContent, CardHeader } from '$lib/components/ui/card';

  // Props to control skeleton appearance
  let { rows = 5, showStats = true } = $props<{
    rows?: number;
    showStats?: boolean;
  }>();
</script>

<!-- Stats Skeletons -->
{#if showStats}
  <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
    {#each Array(3) as _, i (i)}
      <Card>
        <CardHeader class="pb-2">
          <Skeleton class="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <div class="flex items-baseline space-x-2">
            <Skeleton class="h-8 w-20" />
            <Skeleton class="h-4 w-16" />
          </div>
          <Skeleton class="h-3 w-32 mt-1" />
        </CardContent>
      </Card>
    {/each}
  </div>
{/if}

<!-- Table Skeleton -->
<Card class="overflow-hidden">
  <CardHeader>
    <div class="flex justify-between items-center">
      <div class="space-y-2">
        <Skeleton class="h-6 w-32" />
        <Skeleton class="h-4 w-48" />
      </div>
      <Skeleton class="h-6 w-20" />
    </div>
  </CardHeader>
  <CardContent class="p-0">
    <div class="overflow-x-auto">
      <!-- Table Header -->
      <div class="grid grid-cols-7 gap-4 p-4 bg-muted/50 border-b">
        <Skeleton class="h-4 w-16" />
        <Skeleton class="h-4 w-20" />
        <Skeleton class="h-4 w-16" />
        <Skeleton class="h-4 w-16" />
        <Skeleton class="h-4 w-20" />
        <Skeleton class="h-4 w-16" />
        <Skeleton class="h-4 w-16" />
      </div>
      
      <!-- Table Rows -->
      {#each Array(rows) as _, i (i)}
        <div class="grid grid-cols-7 gap-4 p-4 border-b last:border-b-0 hover:bg-muted/25 transition-colors">
          <div class="space-y-1">
            <Skeleton class="h-4 w-24" />
            <Skeleton class="h-3 w-16" />
          </div>
          <div class="space-y-1">
            <Skeleton class="h-4 w-20" />
            <Skeleton class="h-3 w-14" />
          </div>
          <Skeleton class="h-4 w-16" />
          <Skeleton class="h-4 w-16" />
          <div class="space-y-1">
            <Skeleton class="h-4 w-20" />
            <Skeleton class="h-3 w-12" />
          </div>
          <Skeleton class="h-6 w-16 rounded-full" />
          <div class="flex justify-end">
            <Skeleton class="h-8 w-16" />
          </div>
        </div>
      {/each}
    </div>
  </CardContent>
</Card>