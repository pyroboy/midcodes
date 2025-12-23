<script lang="ts">
	import { ExternalLink } from 'lucide-svelte';
	import type { DigitalCardStatus } from '../../routes/all-ids/data.remote';

	interface Props {
		slug?: string | null;
		status?: DigitalCardStatus | null;
		showLink?: boolean;
		compact?: boolean;
	}

	let { slug, status, showLink = true, compact = false }: Props = $props();

	const statusConfig: Record<DigitalCardStatus, { label: string; class: string }> = {
		unclaimed: { label: 'Unclaimed', class: 'bg-gray-100 text-gray-700 border-gray-300' },
		active: { label: 'Active', class: 'bg-green-100 text-green-700 border-green-300' },
		banned: { label: 'Banned', class: 'bg-red-100 text-red-700 border-red-300' },
		suspended: { label: 'Suspended', class: 'bg-orange-100 text-orange-700 border-orange-300' },
		expired: { label: 'Expired', class: 'bg-yellow-100 text-yellow-700 border-yellow-300' }
	};

	let config = $derived(status ? statusConfig[status] : null);
	let profileUrl = $derived(slug ? `/id/${slug}` : null);
</script>

{#if !slug}
	<span class="text-xs text-muted-foreground italic">No token</span>
{:else}
	<div class="flex items-center gap-1.5">
		{#if showLink && profileUrl}
			<a
				href={profileUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="text-xs text-primary hover:underline flex items-center gap-1"
				onclick={(e) => e.stopPropagation()}
			>
				{#if !compact}
					<span class="font-mono text-[10px]">{slug}</span>
				{/if}
				<ExternalLink class="w-3 h-3" />
			</a>
		{/if}
		{#if config}
			<span
				class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border {config.class}"
			>
				{config.label}
			</span>
		{/if}
	</div>
{/if}
