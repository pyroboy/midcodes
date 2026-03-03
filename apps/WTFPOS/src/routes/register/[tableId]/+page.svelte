<script lang="ts">
	import { goto } from '$app/navigation';
	// Register view is now embedded in /floor — redirect
	$effect(() => { goto('/floor'); });
</script>
