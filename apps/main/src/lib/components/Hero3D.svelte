<script lang="ts">
	import { T, Canvas } from '@threlte/core';
	import { Float, OrbitControls } from '@threlte/extras';
	import { onMount } from 'svelte';
	
	let time = $state(0);
	let mounted = $state(false);
	
	onMount(() => {
		mounted = true;
		let animationFrame: number;
		const animate = () => {
			time += 0.01;
			animationFrame = requestAnimationFrame(animate);
		};
		animate();
		return () => cancelAnimationFrame(animationFrame);
	});
</script>

{#if mounted}
<div class="hero-canvas">
	<Canvas>
		<!-- Ambient lighting -->
		<T.AmbientLight intensity={0.4} />
		<T.DirectionalLight position={[10, 10, 5]} intensity={1} />
		<T.PointLight position={[-10, -10, -5]} intensity={0.5} color="#6366f1" />
		
		<!-- Camera -->
		<T.PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50}>
			<OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
		</T.PerspectiveCamera>
		
		<!-- Floating Torus -->
		<Float floatIntensity={2} rotationIntensity={1} speed={2}>
			<T.Mesh position={[-3, 1, 0]} rotation.x={time * 0.5} rotation.y={time * 0.3}>
				<T.TorusGeometry args={[1, 0.4, 16, 32]} />
				<T.MeshStandardMaterial 
					color="#6366f1" 
					metalness={0.8} 
					roughness={0.2}
					emissive="#6366f1"
					emissiveIntensity={0.2}
				/>
			</T.Mesh>
		</Float>
		
		<!-- Floating Icosahedron -->
		<Float floatIntensity={1.5} rotationIntensity={0.8} speed={1.5}>
			<T.Mesh position={[3, -0.5, -1]} rotation.x={time * 0.4} rotation.z={time * 0.2}>
				<T.IcosahedronGeometry args={[1.2, 0]} />
				<T.MeshStandardMaterial 
					color="#ec4899" 
					metalness={0.7} 
					roughness={0.3}
					emissive="#ec4899"
					emissiveIntensity={0.15}
				/>
			</T.Mesh>
		</Float>
		
		<!-- Floating Octahedron -->
		<Float floatIntensity={1.8} rotationIntensity={1.2} speed={1.8}>
			<T.Mesh position={[0, 2, 1]} rotation.y={time * 0.6} rotation.z={time * 0.4}>
				<T.OctahedronGeometry args={[0.8, 0]} />
				<T.MeshStandardMaterial 
					color="#06b6d4" 
					metalness={0.9} 
					roughness={0.1}
					emissive="#06b6d4"
					emissiveIntensity={0.25}
				/>
			</T.Mesh>
		</Float>
		
		<!-- Small decorative spheres -->
		<Float floatIntensity={3} speed={2.5}>
			<T.Mesh position={[-2, -1.5, 2]}>
				<T.SphereGeometry args={[0.3, 16, 16]} />
				<T.MeshStandardMaterial color="#f59e0b" metalness={0.6} roughness={0.4} />
			</T.Mesh>
		</Float>
		
		<Float floatIntensity={2.5} speed={3}>
			<T.Mesh position={[2.5, 2, -2]}>
				<T.SphereGeometry args={[0.25, 16, 16]} />
				<T.MeshStandardMaterial color="#10b981" metalness={0.7} roughness={0.3} />
			</T.Mesh>
		</Float>
		
		<Float floatIntensity={2} speed={2.2}>
			<T.Mesh position={[-1, 2.5, -1]}>
				<T.SphereGeometry args={[0.2, 16, 16]} />
				<T.MeshStandardMaterial color="#f43f5e" metalness={0.5} roughness={0.5} />
			</T.Mesh>
		</Float>
	</Canvas>
</div>
{/if}

<style>
	.hero-canvas {
		position: absolute;
		inset: 0;
		z-index: 0;
		opacity: 0.9;
	}
	
	.hero-canvas :global(canvas) {
		width: 100% !important;
		height: 100% !important;
	}
</style>
