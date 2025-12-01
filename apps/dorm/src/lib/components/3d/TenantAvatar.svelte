<script lang="ts">
	import { T } from '@threlte/core';
	import { HTML, useTexture } from '@threlte/extras';
	import { DoubleSide, CircleGeometry, MeshBasicMaterial } from 'three';

	let { imageUrl, position = [0, 0, 0], name } = $props();

	// Use a default avatar generator if no image provided
	const avatarUrl =
		imageUrl ||
		`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;
	const texture = useTexture(avatarUrl);
</script>

<T.Group {position}>
	<!-- 3D Coin/Token -->
	<T.Mesh rotation={[0, 0, 0]} position={[0, 0.5, 0]}>
		<T.CircleGeometry args={[0.3, 32]} />
		{#await texture then value}
			<T.MeshBasicMaterial map={value} side={DoubleSide} />
		{:catch}
			<T.MeshStandardMaterial color="gray" />
		{/await}
	</T.Mesh>

	<!-- Hover Name Tag -->
	<HTML position={[0, 1, 0]} center transform pointerEvents="none">
		<div
			class="px-1.5 py-0.5 bg-black/80 text-white text-[6px] rounded shadow-sm whitespace-nowrap border border-white/20"
		>
			{name.split(' ')[0]}
			<!-- First name only for space -->
		</div>
	</HTML>
</T.Group>
