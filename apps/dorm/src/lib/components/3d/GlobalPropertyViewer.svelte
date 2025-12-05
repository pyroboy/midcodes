<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as THREE from 'three';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
	import { propertyStore } from '$lib/stores/property';

	let container: HTMLDivElement;

	let renderer: THREE.WebGLRenderer;
	let scene: THREE.Scene;
	let camera: THREE.PerspectiveCamera;
	let controls: OrbitControls;
	let frameId: number;
	let resizeObserver: ResizeObserver;

	// Derived data for the title
	let propertyName = $derived($propertyStore.selectedProperty?.name || 'Property View');

	function initThree() {
		if (!container) return;

		// 1. Setup Scene
		scene = new THREE.Scene();
		scene.background = new THREE.Color(0xffffff); // White background
		// Add subtle fog for depth
		scene.fog = new THREE.Fog(0xffffff, 10, 50);

		// 2. Setup Camera
		const width = container.clientWidth;
		const height = container.clientHeight;
		camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
		camera.position.set(20, 20, 20); // Adjusted slightly for better ISO view

		// 3. Setup Renderer
		renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		renderer.setSize(width, height);
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		container.appendChild(renderer.domElement);

		// 4. Controls
		controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.05;
		controls.autoRotate = true;
		controls.autoRotateSpeed = 1.0;
		controls.minDistance = 5;
		controls.maxDistance = 100;

		// 5. Lighting
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);

		const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
		dirLight.position.set(10, 20, 10);
		dirLight.castShadow = true;
		dirLight.shadow.mapSize.width = 2048;
		dirLight.shadow.mapSize.height = 2048;
		// Optimize shadow camera for typical building size
		dirLight.shadow.camera.near = 0.5;
		dirLight.shadow.camera.far = 500;
		dirLight.shadow.camera.left = -20;
		dirLight.shadow.camera.right = 20;
		dirLight.shadow.camera.top = 20;
		dirLight.shadow.camera.bottom = -20;
		scene.add(dirLight);

		// 6. Add Mock 3D Models (Building Blocks)
		createMockBuilding();

		// 7. Animation Loop
		animate();
	}

	function createMockBuilding() {
		// Create a ground plane
		const planeGeometry = new THREE.PlaneGeometry(60, 60);
		const planeMaterial = new THREE.MeshStandardMaterial({ 
			color: 0xf5f5f5,
			roughness: 0.8,
			metalness: 0.1
		});
		const plane = new THREE.Mesh(planeGeometry, planeMaterial);
		plane.rotation.x = -Math.PI / 2;
		plane.receiveShadow = true;
		scene.add(plane);

		// Create Mock Rooms/Floors
		const floorHeight = 3;
		const roomSize = 4;
		const gap = 0.2;
		const floors = 4;
		const roomsPerFloor = 3;

		const geometry = new THREE.BoxGeometry(roomSize, floorHeight, roomSize);
		
		// Colors matching the app theme
		const materials = [
			new THREE.MeshStandardMaterial({ color: 0x3b82f6 }), // Blue
			new THREE.MeshStandardMaterial({ color: 0x10b981 }), // Green
			new THREE.MeshStandardMaterial({ color: 0xf59e0b }), // Amber
			new THREE.MeshStandardMaterial({ color: 0x6366f1 }), // Indigo
			new THREE.MeshStandardMaterial({ color: 0xec4899 }), // Pink
		];

		const group = new THREE.Group();

		// Generate a building structure
		for (let f = 0; f < floors; f++) {
			for (let r = 0; r < roomsPerFloor; r++) {
				for (let c = 0; c < roomsPerFloor; c++) {
					// Skip center to make it look like a courtyard or just variety
					if (f > 0 && r === 1 && c === 1) continue;

					// Randomly select material, maybe consistently per floor or random
					const material = materials[(f + r + c) % materials.length];
					const room = new THREE.Mesh(geometry, material);
					
					// Position logic
					const x = (r * (roomSize + gap)) - ((roomsPerFloor * roomSize) / 2) + (roomSize/2);
					const y = (f * floorHeight) + (floorHeight / 2);
					const z = (c * (roomSize + gap)) - ((roomsPerFloor * roomSize) / 2) + (roomSize/2);

					room.position.set(x, y, z);
					room.castShadow = true;
					room.receiveShadow = true;

					// Add wireframe for better visibility (architectural look)
					const edges = new THREE.EdgesGeometry(geometry);
					const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }));
					room.add(line);

					group.add(room);
				}
			}
		}
		scene.add(group);
	}

	function animate() {
		frameId = requestAnimationFrame(animate);
		if (controls) controls.update();
		if (renderer && scene && camera) renderer.render(scene, camera);
	}

	function handleResize() {
		if (!container || !camera || !renderer) return;
		
		const width = container.clientWidth;
		const height = container.clientHeight;
		
		// Only resize if dimensions are valid
		if (width === 0 || height === 0) return;

		camera.aspect = width / height;
		camera.updateProjectionMatrix();
		renderer.setSize(width, height);
	}

	onMount(() => {
		initThree();

		// Use ResizeObserver to handle container resizing (animation slide-in)
		resizeObserver = new ResizeObserver(() => {
			handleResize();
		});
		
		if (container) {
			resizeObserver.observe(container);
		}
	});

	onDestroy(() => {
		if (frameId) cancelAnimationFrame(frameId);
		
		if (resizeObserver) {
			resizeObserver.disconnect();
		}

		if (renderer) {
			renderer.dispose();
			// Clean up DOM
			if (container && container.contains(renderer.domElement)) {
				container.removeChild(renderer.domElement);
			}
		}

		// Clean up scene
		if (scene) {
			scene.traverse((object) => {
				if (object instanceof THREE.Mesh) {
					object.geometry.dispose();
					if (object.material instanceof THREE.Material) {
						object.material.dispose();
					}
				}
			});
		}
	});
</script>

<div class="flex flex-col h-full bg-white border-l border-gray-200 shadow-xl">
	<div class="p-4 border-b flex justify-between items-center bg-white shrink-0">
		<div>
			<h3 class="font-semibold text-gray-800">Property Visualizer</h3>
			<p class="text-xs text-gray-500">{propertyName} (Mock View)</p>
		</div>
	</div>
	
	<!-- This container needs to be flex-1 to fill available vertical space -->
	<div class="flex-1 relative bg-gray-50 overflow-hidden" bind:this={container}>
		<!-- Canvas injected here -->
	</div>

	<div class="p-4 border-t bg-gray-50 text-xs text-gray-500 shrink-0">
		<p class="font-medium mb-1">Visualization Legend:</p>
		<div class="grid grid-cols-2 gap-2">
			<div class="flex items-center gap-2">
				<span class="w-2 h-2 bg-blue-500 rounded-full"></span>
				<span>Occupied</span>
			</div>
			<div class="flex items-center gap-2">
				<span class="w-2 h-2 bg-green-500 rounded-full"></span>
				<span>Vacant</span>
			</div>
			<div class="flex items-center gap-2">
				<span class="w-2 h-2 bg-amber-500 rounded-full"></span>
				<span>Maintenance</span>
			</div>
		</div>
	</div>
</div>
