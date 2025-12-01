<script lang="ts">
	import { T } from '@threlte/core';
	import { Edges, HTML } from '@threlte/extras';
	import TenantAvatar from './TenantAvatar.svelte';

	let { unit, position = [0, 0, 0], size = [3, 1.5, 3] } = $props();

	// Flatten active tenants from the processed API data
	let activeTenants = $derived(
		unit.active_leases?.flatMap((l: any) =>
			l.lease_tenants.map((lt: any) => lt.tenant).filter((t: any) => t && !t.deleted_at)
		) || []
	);

	// Visual state based on occupancy
	let opacity = $derived(unit.rental_unit_status === 'OCCUPIED' ? 0.8 : 0.3);
	let color = $derived(unit.rental_unit_status === 'OCCUPIED' ? '#10b981' : '#cbd5e1'); // Green vs Slate
</script>

<T.Group {position}>
	<!-- Room Label Floating Above -->
	<HTML position={[0, size[1] + 0.5, 0]} center transform pointerEvents="none">
		<div
			class="font-bold text-[8px] bg-white/90 px-1.5 py-0.5 rounded-full border border-gray-200 shadow-sm text-gray-800"
		>
			{unit.number}
		</div>
	</HTML>

	<!-- Room Structure -->
	<T.Mesh>
		<T.BoxGeometry args={size} />
		<T.MeshStandardMaterial {color} transparent {opacity} roughness={0.2} metalness={0.1} />
		<Edges color="#1e293b" threshold={15} />
	</T.Mesh>

	<!-- Tenants inside the room -->
	{#each activeTenants as tenant, i}
		<!-- Distribute tenants in a small row inside the box -->
		<TenantAvatar
			name={tenant.name}
			imageUrl={tenant.profile_picture_url}
			position={[i * 0.7 - (activeTenants.length - 1) * 0.35, -0.2, 0.8]}
		/>
	{/each}
</T.Group>
