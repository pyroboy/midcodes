<script lang="ts">
	import { Plus, Zap, Download, Upload } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';

	let { user } = $props();

	interface Action {
		href: string;
		label: string;
		icon: any;
		variant: 'link' | 'default' | 'destructive' | 'secondary' | 'outline' | 'ghost';
		roles: string[];
	}

	const actions: Action[] = [
		{
			href: '/templates',
			label: 'New Template',
			icon: Plus,
			variant: 'outline',
			roles: ['super_admin', 'org_admin', 'id_gen_admin']
		},
		{
			href: '/templates',
			label: 'Generate ID',
			icon: Zap,
			variant: 'default',
			roles: ['all']
		},
		{
			href: '/all-ids?export=true',
			label: 'Export IDs',
			icon: Download,
			variant: 'ghost',
			roles: ['all']
		}
	];

	function hasPermission(roles: string[], userRole?: string): boolean {
		if (roles.includes('all')) return true;
		if (!userRole) return false;
		return roles.includes(userRole);
	}
</script>

<div class="flex items-center gap-2">
	{#each actions as action}
		{#if hasPermission(action.roles, user?.role)}
			<Button variant={action.variant} size="sm" href={action.href} class="hidden xl:flex">
				<action.icon class="h-4 w-4 mr-2" />
				{action.label}
			</Button>
		{/if}
	{/each}
</div>
