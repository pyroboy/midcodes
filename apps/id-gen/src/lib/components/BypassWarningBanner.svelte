<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	interface Props {
		requiredRole: string;
		originalRole?: string;
	}

	let { requiredRole, originalRole }: Props = $props();

	function formatRoleName(role: string) {
		return role
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	function removeBypass() {
		const url = new URL($page.url);
		url.searchParams.delete('superadmin_bypass');
		goto(url.toString());
	}
</script>

<div
	class="bg-amber-900/80 border-b border-amber-700 text-amber-100 px-4 py-3 flex flex-wrap items-center justify-between gap-2"
>
	<div class="flex items-center gap-3">
		<div class="flex items-center justify-center h-8 w-8 rounded-full bg-amber-800">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5 text-amber-300"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
				/>
			</svg>
		</div>
		<div>
			<p class="font-semibold text-sm">Super Admin Bypass Active</p>
			<p class="text-xs text-amber-200/70">
				This page normally requires <span class="font-medium text-amber-300"
					>{formatRoleName(requiredRole)}</span
				>
				{#if originalRole}
					&bull; Accessing as <span class="font-medium text-green-300"
						>{formatRoleName(originalRole)}</span
					>
				{/if}
			</p>
		</div>
	</div>
	<button
		onclick={removeBypass}
		class="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-amber-800 hover:bg-amber-700 rounded transition-colors"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-4 w-4"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M6 18L18 6M6 6l12 12"
			/>
		</svg>
		Remove Bypass
	</button>
</div>
