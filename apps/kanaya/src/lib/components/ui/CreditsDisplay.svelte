<script lang="ts">
	import { Coins } from 'lucide-svelte';

	interface Props {
		user?: {
			credits_balance?: number;
			credits?: number;
		};
		class?: string;
	}

	let { user, class: className = '' }: Props = $props();

	// Get credits from either credits_balance (from profile) or credits property
	const credits = $derived(user?.credits_balance ?? user?.credits ?? 0);
</script>

<a
	href="/credits"
	class="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-full border border-primary/20 transition-colors {className}"
>
	<Coins class="h-4 w-4 text-primary" />
	<span class="text-sm font-medium text-foreground">
		{credits.toLocaleString()}
	</span>
	<span class="text-xs text-muted-foreground hidden sm:inline"> credits </span>
</a>
