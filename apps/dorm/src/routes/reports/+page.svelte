<script lang="ts">
	import ReportsDashboard from './ReportsDashboard.svelte';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();
</script>

<ReportsDashboard
	reportData={data.reportData}
	year={data.year}
	month={data.month}
	propertyId={data.propertyId}
	properties={data.properties || []}
/>
