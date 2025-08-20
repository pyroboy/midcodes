<script lang="ts">
	import { T } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import * as THREE from 'three';

	let { frontTexture, backTexture, flip } = $props<{
		frontTexture: THREE.Texture | null;
		backTexture: THREE.Texture | null;
		flip: number;
	}>();

	// --- State for Animation ---
	let rotationY = $state(0);
	let targetRotationY = $state(0);
	let autoRotate = $state(true);

	// --- One-time Geometry Creation ---
	// Create geometry once on component initialization
	let frontGeom: THREE.BufferGeometry = $state()!;
	let backGeom: THREE.BufferGeometry = $state()!;
	let edgeGeom: THREE.BufferGeometry = $state()!;

	// Initialize geometry in onMount or use a simpler approach
	$effect(() => {
		const result = createRoundedRectCard();
		frontGeom = result.frontGeom;
		backGeom = result.backGeom;
		edgeGeom = result.edgeGeom;
	});

	/**
	 * Creates the geometry for a rounded card, splitting it into front, back, and edge faces.
	 * This allows applying different materials to each part.
	 */
	function createRoundedRectCard(
		width = 2,
		height = 1.25,
		depth = 0.007,
		radius = 0.08,
		segments = 32
	) {
		const shape = new THREE.Shape();
		const x = -width / 2;
		const y = -height / 2;

		// Use built-in THREE.Shape methods for cleaner geometry creation
		shape.moveTo(x, y + radius);
		shape.lineTo(x, y + height - radius);
		shape.absarc(x + radius, y + height - radius, radius, Math.PI, Math.PI / 2, true);
		shape.lineTo(x + width - radius, y + height);
		shape.absarc(x + width - radius, y + height - radius, radius, Math.PI / 2, 0, true);
		shape.lineTo(x + width, y + radius);
		shape.absarc(x + width - radius, y + radius, radius, 0, -Math.PI / 2, true);
		shape.lineTo(x + radius, y);
		shape.absarc(x + radius, y + radius, radius, -Math.PI / 2, -Math.PI, true);

		const extrudeSettings = {
			depth,
			bevelEnabled: false,
			curveSegments: segments
		};
		const mainGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
		mainGeometry.center(); // Center the geometry for easier rotation

		// Separate geometry by face normal
		const geometries = {
			front: new THREE.BufferGeometry(),
			back: new THREE.BufferGeometry(),
			edge: new THREE.BufferGeometry()
		};

		mainGeometry.toNonIndexed(); // Important for splitting geometry
		const pos = mainGeometry.getAttribute('position');
		const norm = mainGeometry.getAttribute('normal');
		const uv = mainGeometry.getAttribute('uv');

		const groupData: Record<
			keyof typeof geometries,
			{ pos: number[]; norm: number[]; uv: number[] }
		> = {
			front: { pos: [], norm: [], uv: [] },
			back: { pos: [], norm: [], uv: [] },
			edge: { pos: [], norm: [], uv: [] }
		};

		for (let i = 0; i < pos.count; i += 3) {
			// Get the normal of the face (since it's non-indexed, all 3 vertices have the same normal)
			const nz = norm.getZ(i);

			let targetGroup: keyof typeof geometries = 'edge';
			if (nz > 0.5) targetGroup = 'front';
			else if (nz < -0.5) targetGroup = 'back';

			// Add all 3 vertices of the face to the target group
			for (let j = 0; j < 3; j++) {
				const index = i + j;
				groupData[targetGroup].pos.push(pos.getX(index), pos.getY(index), pos.getZ(index));
				groupData[targetGroup].norm.push(norm.getX(index), norm.getY(index), norm.getZ(index));
				groupData[targetGroup].uv.push(uv.getX(index), uv.getY(index));
			}
		}

		for (const key of Object.keys(geometries) as (keyof typeof geometries)[]) {
			geometries[key].setAttribute(
				'position',
				new THREE.Float32BufferAttribute(groupData[key].pos, 3)
			);
			geometries[key].setAttribute(
				'normal',
				new THREE.Float32BufferAttribute(groupData[key].norm, 3)
			);
			geometries[key].setAttribute('uv', new THREE.Float32BufferAttribute(groupData[key].uv, 2));
		}

		return { frontGeom: geometries.front, backGeom: geometries.back, edgeGeom: geometries.edge };
	}

	// --- Animation Loop ---
	// For now, let's use a simpler approach without useFrame
	// We'll implement this with requestAnimationFrame or find the correct import
	let animationId: number | null = null;

	function animate() {
		// Auto-rotate logic
		if (autoRotate) {
			targetRotationY += 0.016 * 0.3; // Assuming 60fps
		}
		// Smoothly interpolate the actual rotation towards the target rotation
		rotationY = THREE.MathUtils.lerp(rotationY, targetRotationY, 0.05);

		animationId = requestAnimationFrame(animate);
	}

	// Start animation
	$effect(() => {
		animate();
		return () => {
			if (animationId) {
				cancelAnimationFrame(animationId);
			}
		};
	});

	// --- Reactive Effect for Flipping ---
	// This effect runs whenever the 'flip' prop changes.
	$effect(() => {
		// The initial value is 0, so we ignore the first run.
		if (flip > 0) {
			autoRotate = false; // Stop auto-rotation on manual flip
			// Round to the nearest half-turn, then add a full half-turn (PI)
			targetRotationY = Math.round(targetRotationY / Math.PI) * Math.PI + Math.PI;
		}
	});

	// Ensure textures don't have a default Y-flip
	$effect(() => {
		if (frontTexture) frontTexture.flipY = false;
		if (backTexture) backTexture.flipY = false;
	});
</script>

<T.PerspectiveCamera makeDefault position={[0, 0, 4]} fov={35}>
	<OrbitControls enableDamping />
</T.PerspectiveCamera>
<T.AmbientLight intensity={0.8} />
<T.DirectionalLight position={[5, 5, 5]} intensity={1.5} />
<T.DirectionalLight position={[-5, -5, -5]} intensity={0.5} color="#b1e1ff" />

<T.Group rotation.y={rotationY}>
	{#if frontTexture}
		<T.Mesh geometry={frontGeom}>
			<T.MeshStandardMaterial map={frontTexture} roughness={0.2} metalness={0.1} />
		</T.Mesh>
	{/if}

	{#if backTexture}
		<T.Mesh geometry={backGeom}>
			<T.MeshStandardMaterial map={backTexture} roughness={0.2} metalness={0.1} />
		</T.Mesh>
	{/if}

	<T.Mesh geometry={edgeGeom}>
		<T.MeshStandardMaterial color="#e5e7eb" roughness={0.4} metalness={0} />
	</T.Mesh>
</T.Group>
