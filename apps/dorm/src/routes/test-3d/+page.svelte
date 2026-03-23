<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
	import {
		floorLayoutItemsStore,
		floorsStore,
		rentalUnitsStore,
		propertiesStore
	} from '$lib/stores/collections.svelte';
	import { propertyStore } from '$lib/stores/property';

	let status = $state('Loading...');
	let logs = $state<string[]>([]);
	let canvasRef = $state<HTMLCanvasElement | null>(null);
	let renderer: any = null;
	let animId: number;

	// Floor selection
	let selectedProperty = $derived($propertyStore.selectedProperty);
	let propertyFloors = $derived(
		floorsStore.value
			.filter((f: any) => selectedProperty && f.property_id === String(selectedProperty.id))
			.sort((a: any, b: any) => a.floor_number - b.floor_number)
	);
	let selectedFloorId = $state<string | null>(null);

	$effect(() => {
		if (propertyFloors.length > 0 && !selectedFloorId) {
			selectedFloorId = propertyFloors[0].id;
		}
	});

	let floorItems = $derived(
		floorLayoutItemsStore.value.filter((i: any) => i.floor_id === selectedFloorId)
	);

	let floorUnits = $derived(
		rentalUnitsStore.value.filter((u: any) => selectedProperty && u.property_id === String(selectedProperty.id))
	);

	// Color map for room types
	const ROOM_COLORS: Record<string, number> = {
		RENTAL_UNIT: 0x93c5fd,
		CORRIDOR: 0xd1d5db,
		BATHROOM: 0x67e8f9,
		KITCHEN: 0xfdba74,
		COMMON_ROOM: 0xc4b5fd,
		STAIRWELL: 0xfde047,
		ELEVATOR: 0xfde047,
		STORAGE: 0xd6d3d1,
		OFFICE: 0x86efac,
		CUSTOM: 0xcbd5e1,
		WALL: 0x475569,
		DOOR: 0xfbbf24,
		WINDOW: 0x7dd3fc
	};

	// Status-based colors for rental units
	const STATUS_COLORS: Record<string, number> = {
		OCCUPIED: 0x3b82f6, // blue
		VACANT: 0x22c55e,   // green
		RESERVED: 0xf59e0b  // amber
	};

	// Create text sprite for room labels
	function createTextSprite(text: string, subtext: string, color: string) {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d')!;
		canvas.width = 256;
		canvas.height = 128;

		// Background
		ctx.fillStyle = 'rgba(255,255,255,0.9)';
		ctx.beginPath();
		ctx.roundRect(8, 8, 240, 112, 12);
		ctx.fill();
		ctx.strokeStyle = color;
		ctx.lineWidth = 3;
		ctx.stroke();

		// Main text
		ctx.fillStyle = '#1e293b';
		ctx.font = 'bold 28px sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText(text, 128, 52, 220);

		// Subtext (status)
		ctx.fillStyle = color;
		ctx.font = 'bold 22px sans-serif';
		ctx.fillText(subtext, 128, 88, 220);

		return canvas;
	}

	let orbitControls: any = null;

	function log(msg: string) {
		logs = [...logs, `${new Date().toLocaleTimeString()}: ${msg}`];
	}

	let threeModule: any = null;

	// Re-render when floor changes
	$effect(() => {
		if (selectedFloorId && threeModule && canvasRef) {
			renderScene();
		}
	});

	// Fallback: fetch items directly from API if RxDB has none
	let apiFallbackItems = $state<any[]>([]);

	async function fetchItemsFromAPI() {
		if (!selectedFloorId) return;
		log('RxDB empty — fetching from API...');
		try {
			let allDocs: any[] = [];
			let checkpoint: any = null;
			// Paginate through all items
			for (let i = 0; i < 10; i++) {
				let url = '/api/rxdb/pull/floor_layout_items?limit=500';
				if (checkpoint) {
					url += `&updatedAt=${encodeURIComponent(checkpoint.updated_at)}&id=${checkpoint.id}`;
				}
				const res = await fetch(url);
				const data = await res.json();
				allDocs.push(...(data.documents || []));
				checkpoint = data.checkpoint;
				if (!data.documents?.length || data.documents.length < 500) break;
			}
			const active = allDocs.filter((d: any) => !d.deleted_at && d.floor_id === selectedFloorId);
			log(`API returned ${allDocs.length} total, ${active.length} active for floor ${selectedFloorId}`);
			apiFallbackItems = active;
		} catch (e: any) {
			log(`API fetch failed: ${e.message}`);
		}
	}

	function getActiveItems() {
		const rxdbItems = floorItems.filter((i: any) => !i.deleted_at);
		if (rxdbItems.length > 0) return rxdbItems;
		return apiFallbackItems;
	}

	function renderScene() {
		if (!threeModule || !canvasRef) return;

		const {
			Scene, PerspectiveCamera, WebGLRenderer, BoxGeometry,
			MeshStandardMaterial, Mesh, AmbientLight, DirectionalLight,
			PlaneGeometry, Color, MeshBasicMaterial, Group,
			SpriteMaterial, Sprite, CanvasTexture
		} = threeModule;

		const items = getActiveItems();
		log(`Rendering floor with ${items.length} items`);

		if (items.length === 0) {
			// Try API fallback
			fetchItemsFromAPI().then(() => {
				const fallbackItems = getActiveItems();
				if (fallbackItems.length > 0) {
					renderScene(); // retry with API data
				} else {
					status = 'No items on this floor';
				}
			});
			return;
		}

		// Find grid bounds
		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
		for (const item of items) {
			minX = Math.min(minX, item.grid_x);
			minY = Math.min(minY, item.grid_y);
			maxX = Math.max(maxX, item.grid_x + (item.grid_w || 1));
			maxY = Math.max(maxY, item.grid_y + (item.grid_h || 1));
		}

		const gridW = maxX - minX;
		const gridH = maxY - minY;
		const centerX = (minX + maxX) / 2;
		const centerY = (minY + maxY) / 2;
		const CELL = 1; // 1 unit per grid cell

		log(`Grid: ${gridW}x${gridH}, center: ${centerX},${centerY}`);

		const rect = canvasRef.getBoundingClientRect();

		// Dispose previous renderer
		if (renderer) {
			renderer.dispose();
			cancelAnimationFrame(animId);
		}

		const scene = new Scene();
		scene.background = new Color(0xf0f9ff); // sky-50

		const camera = new PerspectiveCamera(50, rect.width / rect.height, 0.1, 1000);
		camera.position.set(centerX * CELL, Math.max(gridW, gridH) * 1.2, centerY * CELL + Math.max(gridW, gridH) * 0.8);
		camera.lookAt(centerX * CELL, 0, centerY * CELL);

		renderer = new WebGLRenderer({
			canvas: canvasRef,
			antialias: true,
			powerPreference: 'low-power'
		});
		renderer.setSize(rect.width, rect.height);
		renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
		renderer.shadowMap.enabled = true;

		// Lights
		const ambient = new AmbientLight(0xffffff, 0.6);
		scene.add(ambient);
		const dirLight = new DirectionalLight(0xffffff, 0.8);
		dirLight.position.set(centerX + 10, 15, centerY + 10);
		dirLight.castShadow = true;
		scene.add(dirLight);

		// Floor plane
		const floorGeo = new PlaneGeometry(gridW * CELL + 4, gridH * CELL + 4);
		const floorMat = new MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 });
		const floorMesh = new Mesh(floorGeo, floorMat);
		floorMesh.rotation.x = -Math.PI / 2;
		floorMesh.position.set(centerX * CELL, -0.01, centerY * CELL);
		floorMesh.receiveShadow = true;
		scene.add(floorMesh);

		// Render each item
		const walls: any[] = [];
		const rooms: any[] = [];

		for (const item of items) {
			const type = item.item_type || 'CUSTOM';
			const color = ROOM_COLORS[type] || 0xcbd5e1;

			if (type === 'WALL') {
				// Walls are tall thin boxes
				const wallH = 2.5;
				const wallThick = 0.15;
				const w = (item.grid_w || 1) * CELL;
				const h = (item.grid_h || 1) * CELL;

				const geo = new BoxGeometry(
					Math.max(w, wallThick),
					wallH,
					Math.max(h, wallThick)
				);
				const mat = new MeshStandardMaterial({ color, roughness: 0.7 });
				const mesh = new Mesh(geo, mat);
				mesh.position.set(
					(item.grid_x + w / 2) * CELL,
					wallH / 2,
					(item.grid_y + h / 2) * CELL
				);
				mesh.castShadow = true;
				mesh.receiveShadow = true;
				scene.add(mesh);
				walls.push(mesh);
			} else if (type === 'DOOR') {
				// Doors are short + different color
				const doorH = 0.3;
				const w = (item.grid_w || 1) * CELL;
				const h = (item.grid_h || 1) * CELL;
				const geo = new BoxGeometry(w, doorH, h);
				const mat = new MeshStandardMaterial({ color, roughness: 0.5 });
				const mesh = new Mesh(geo, mat);
				mesh.position.set(
					(item.grid_x + w / 2) * CELL,
					doorH / 2,
					(item.grid_y + h / 2) * CELL
				);
				scene.add(mesh);
			} else if (type === 'WINDOW') {
				// Windows are transparent-ish
				const winH = 1.5;
				const w = (item.grid_w || 1) * CELL;
				const h = (item.grid_h || 1) * CELL;
				const geo = new BoxGeometry(
					Math.max(w, 0.1),
					winH,
					Math.max(h, 0.1)
				);
				const mat = new MeshStandardMaterial({ color, transparent: true, opacity: 0.4, roughness: 0.2 });
				const mesh = new Mesh(geo, mat);
				mesh.position.set(
					(item.grid_x + w / 2) * CELL,
					1.0 + winH / 2,
					(item.grid_y + h / 2) * CELL
				);
				scene.add(mesh);
			} else {
				// Rooms — color by unit status if rental unit
				let roomColor = color;
				let unitData: any = null;

				if (type === 'RENTAL_UNIT' && item.rental_unit_id) {
					unitData = floorUnits.find((u: any) => u.id === item.rental_unit_id || String(u.id) === String(item.rental_unit_id));
					if (unitData) {
						roomColor = STATUS_COLORS[unitData.rental_unit_status] || color;
					}
				}

				const roomH = 0.12;
				const w = (item.grid_w || 1) * CELL;
				const h = (item.grid_h || 1) * CELL;
				const geo = new BoxGeometry(w - 0.05, roomH, h - 0.05);
				const mat = new MeshStandardMaterial({ color: roomColor, roughness: 0.5 });
				const mesh = new Mesh(geo, mat);
				mesh.position.set(
					(item.grid_x + w / 2) * CELL,
					roomH / 2,
					(item.grid_y + h / 2) * CELL
				);
				mesh.receiveShadow = true;
				scene.add(mesh);
				rooms.push({ mesh, item, unit: unitData });

				// Floating label for rooms with labels or rental units
				const labelText = item.label || unitData?.name || '';
				if (labelText && w >= 2 && h >= 2) {
					const statusText = unitData?.rental_unit_status || type.replace('_', ' ');
					const statusColor = unitData?.rental_unit_status === 'OCCUPIED' ? '#3b82f6'
						: unitData?.rental_unit_status === 'VACANT' ? '#22c55e'
						: unitData?.rental_unit_status === 'RESERVED' ? '#f59e0b'
						: '#64748b';

					const labelCanvas = createTextSprite(labelText, statusText, statusColor);
					const texture = new CanvasTexture(labelCanvas);
					const spriteMat = new SpriteMaterial({ map: texture, transparent: true });
					const sprite = new Sprite(spriteMat);
					sprite.position.set(
						(item.grid_x + w / 2) * CELL,
						3.2,
						(item.grid_y + h / 2) * CELL
					);
					sprite.scale.set(2.5, 1.25, 1);
					scene.add(sprite);
				}
			}
		}

		log(`Rendered: ${walls.length} walls, ${rooms.length} rooms`);

		// Touch-based OrbitControls
		if (orbitControls) {
			orbitControls.dispose();
			orbitControls = null;
		}

		import('three/examples/jsm/controls/OrbitControls.js').then(({ OrbitControls }) => {
			orbitControls = new OrbitControls(camera, renderer.domElement);
			orbitControls.target.set(centerX * CELL, 0, centerY * CELL);
			orbitControls.enableDamping = true;
			orbitControls.dampingFactor = 0.1;
			orbitControls.maxPolarAngle = Math.PI / 2.2; // prevent going below floor
			orbitControls.minDistance = 3;
			orbitControls.maxDistance = Math.max(gridW, gridH) * 3;
			orbitControls.autoRotate = true;
			orbitControls.autoRotateSpeed = 1.0;
			orbitControls.update();
			log('OrbitControls loaded — swipe to rotate, pinch to zoom');
		}).catch(() => {
			log('OrbitControls not available — using auto-rotate fallback');
		});

		function animate() {
			animId = requestAnimationFrame(animate);
			if (orbitControls) orbitControls.update();
			renderer.render(scene, camera);
		}

		renderer.render(scene, camera);
		animate();
		status = `PASS - ${walls.length} walls, ${rooms.length} rooms`;
	}

	onMount(() => {
		if (!browser || !canvasRef) return;

		log(`Device: ${navigator.userAgent.slice(0, 60)}`);
		log(`Viewport: ${window.innerWidth}x${window.innerHeight}`);

		import('three').then((mod) => {
			threeModule = mod;
			log('Three.js loaded');

			// Wait for RxDB data
			const checkData = () => {
				if (floorLayoutItemsStore.initialized) {
					log(`RxDB ready: ${floorLayoutItemsStore.value.length} layout items`);
					renderScene();
				} else {
					log('Waiting for RxDB...');
					setTimeout(checkData, 500);
				}
			};
			checkData();
		}).catch((e: any) => {
			log(`Three.js failed: ${e.message}`);
			status = 'FAIL';
		});
	});

	onDestroy(() => {
		if (orbitControls) { orbitControls.dispose(); orbitControls = null; }
		if (renderer) {
			renderer.dispose();
			const ext = renderer.getContext()?.getExtension?.('WEBGL_lose_context');
			if (ext) ext.loseContext();
		}
		cancelAnimationFrame(animId);
	});
</script>

<div class="p-3 space-y-3">
	<div class="flex items-center justify-between">
		<h1 class="text-lg font-bold">3D Floor Viewer</h1>
		<div class="p-2 rounded border text-sm font-mono {status.startsWith('PASS') ? 'bg-green-50 border-green-300 text-green-800' : status.startsWith('FAIL') ? 'bg-red-50 border-red-300 text-red-800' : 'bg-yellow-50 border-yellow-300 text-yellow-800'}">
			{status}
		</div>
	</div>

	<!-- Floor selector -->
	{#if propertyFloors.length > 0}
		<div class="flex gap-1 overflow-x-auto pb-1">
			{#each propertyFloors as floor (floor.id)}
				<button
					class="px-3 py-2 rounded text-sm font-medium transition-colors flex-shrink-0 min-h-[44px]
						{selectedFloorId === floor.id
						? 'bg-primary text-primary-foreground'
						: 'bg-secondary hover:bg-secondary/80'}"
					onclick={() => { selectedFloorId = floor.id; }}
				>
					Floor {floor.floor_number}
					{#if floor.wing}<span class="opacity-70"> · {floor.wing}</span>{/if}
				</button>
			{/each}
		</div>
	{:else}
		<p class="text-sm text-muted-foreground">Select a property from the top bar to view floors.</p>
	{/if}

	<!-- 3D Canvas -->
	<div class="border rounded-lg overflow-hidden relative bg-gradient-to-b from-sky-50 to-sky-100" style="height: calc(100dvh - 220px); min-height: 300px;">
		<canvas
			bind:this={canvasRef}
			style="width: 100%; height: 100%; display: block; touch-action: none;"
		></canvas>
	</div>

	<!-- Debug log -->
	<details class="text-xs">
		<summary class="cursor-pointer text-muted-foreground">Debug Log ({logs.length} entries)</summary>
		<div class="bg-gray-900 text-green-400 p-2 rounded-lg font-mono space-y-0.5 max-h-[150px] overflow-y-auto mt-1">
			{#each logs as line}
				<p>{line}</p>
			{/each}
		</div>
	</details>
</div>
