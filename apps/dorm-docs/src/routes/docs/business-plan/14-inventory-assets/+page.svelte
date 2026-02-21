<script lang="ts">
	import propertyData from '$lib/data/property.json';

	const floors = propertyData.floors;
	const summary = propertyData.summary;

	// Get residential floors with rooms
	const residentialFloors = floors.filter(f => f.type === 'residential');

	// Calculate totals from property data
	let totalDoubleDeck = 0;
	let totalSingleDeck = 0;
	let totalCabinets = 0;
	let totalAircon = 0;
	let totalMattresses = 0;

	residentialFloors.forEach(floor => {
		floor.rooms?.forEach(room => {
			totalDoubleDeck += room.double_decks || 0;
			totalSingleDeck += room.single_decks || 0;
			totalCabinets += room.cabinets || 0;
			if (room.aircon) totalAircon++;
			// Each double deck = 2 mattresses, each single = 1
			totalMattresses += ((room.double_decks || 0) * 2) + (room.single_decks || 0);
		});
	});
</script>

<svelte:head>
	<title>14 Inventory & Assets - DA Tirol Dorm</title>
</svelte:head>

<article class="chapter">
	<header class="chapter-header">
		<span class="chapter-number">14</span>
		<h1>Inventory & Assets</h1>
	</header>

	<section class="section">
		<h2>Building Inventory Summary</h2>
		<p class="section-desc">Assets across all {summary.total_rooms} rooms based on property data.</p>
		<div class="metrics-grid">
			<div class="metric">
				<span class="metric-label">Double Decks</span>
				<span class="metric-value">{totalDoubleDeck}</span>
			</div>
			<div class="metric">
				<span class="metric-label">Single Decks</span>
				<span class="metric-value">{totalSingleDeck}</span>
			</div>
			<div class="metric">
				<span class="metric-label">Mattresses</span>
				<span class="metric-value">{totalMattresses}</span>
			</div>
			<div class="metric">
				<span class="metric-label">Cabinets</span>
				<span class="metric-value">{totalCabinets}</span>
			</div>
			<div class="metric highlight">
				<span class="metric-label">Aircon Units</span>
				<span class="metric-value">{totalAircon}</span>
			</div>
		</div>
	</section>

	<section class="section">
		<h2>Room-by-Room Inventory</h2>
		
		{#each residentialFloors as floor}
		<div class="inventory-card">
			<h3>{floor.name}</h3>
			<table class="inventory-table">
				<thead>
					<tr>
						<th>Room</th>
						<th>Capacity</th>
						<th>Double Decks</th>
						<th>Single Decks</th>
						<th>Cabinets</th>
						<th>Aircon</th>
					</tr>
				</thead>
				<tbody>
					{#each floor.rooms || [] as room}
					<tr>
						<td><strong>{room.name}</strong></td>
						<td>{room.capacity} pax</td>
						<td>{room.double_decks || 0}</td>
						<td>{room.single_decks || 0}</td>
						<td>{room.cabinets || 0}</td>
						<td>{room.aircon ? '✓' : '—'}</td>
					</tr>
					{/each}
				</tbody>
			</table>
		</div>
		{/each}
	</section>

	<section class="section">
		<h2>Maintenance Items & Tools</h2>
		<table class="inventory-table">
			<thead>
				<tr>
					<th>Category</th>
					<th>Item</th>
					<th>Purpose</th>
					<th>Location</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Cleaning</td>
					<td>Industrial Mop & Bucket</td>
					<td>Hallway cleaning</td>
					<td class="placeholder">Utility Closet</td>
				</tr>
				<tr>
					<td>Cleaning</td>
					<td>Broom & Dustpan</td>
					<td>Daily sweeping</td>
					<td class="placeholder">Per Floor</td>
				</tr>
				<tr>
					<td>Repair</td>
					<td>Basic Toolset</td>
					<td>Hammer, screwdrivers, pliers</td>
					<td class="placeholder">Admin Office</td>
				</tr>
				<tr class="project-row">
					<td>Repair</td>
					<td>Ladder <span class="badge">🚧 Project</span></td>
					<td>Changing bulbs, high reach</td>
					<td>Storage Room <em>(Planned)</em></td>
				</tr>
				<tr class="project-row">
					<td>Safety</td>
					<td>Fire Extinguisher <span class="badge">🚧 Project</span></td>
					<td>10lbs Dry Chemical</td>
					<td>Every 15 meters <em>(Planned)</em></td>
				</tr>
				<tr>
					<td>Safety</td>
					<td>Emergency Lights</td>
					<td>Power outage illumination</td>
					<td class="placeholder">Hallways/Stairs</td>
				</tr>
			</tbody>
		</table>
	</section>

	<section class="section">
		<h2>Appliances & Common Area Assets</h2>
		<div class="asset-list">
			<div class="asset-item">
				<span class="qty placeholder">1</span>
				<span class="name">Refrigerator</span>
				<span class="desc placeholder">Inverter, 10 cu.ft, for common use</span>
			</div>
			<div class="asset-item project">
				<span class="qty">🚧</span>
				<span class="name">Microwave Oven <span class="badge">Project</span></span>
				<span class="desc">Basic model for reheating <em>(Planned)</em></span>
			</div>
			<div class="asset-item">
				<span class="qty placeholder">1</span>
				<span class="name">Water Dispenser</span>
				<span class="desc placeholder">Hot & Cold (Gallon type)</span>
			</div>
			<div class="asset-item">
				<span class="qty placeholder">2</span>
				<span class="name">WiFi Routers</span>
				<span class="desc placeholder">Mesh system or high-gain antennas</span>
			</div>
			<div class="asset-item">
				<span class="qty placeholder">4</span>
				<span class="name">CCTV Cameras</span>
				<span class="desc placeholder">IP Cameras + NVR system</span>
			</div>
		</div>
	</section>

	<section class="section">
		<h2>Consumables Restocking</h2>
		<p class="section-desc">Items to be replenished regularly.</p>
		<ul class="consumables">
			<li class="placeholder">Cleaning agents (Bleach, Detergent, Multi-purpose cleaner)</li>
			<li class="placeholder">Trash bags (Large black, Small transparent)</li>
			<li class="placeholder">Light bulbs (LED 9W/12W spares)</li>
			<li class="placeholder">Bathroom supplies for common CR (Hand soap, Tissue)</li>
			<li class="placeholder">Logbook refills and pens</li>
		</ul>
	</section>
</article>

<style>
	.chapter { max-width: 900px; }
	.chapter-header { margin-bottom: 3rem; }
	.chapter-number { font-family: var(--font-header); font-size: 4rem; font-weight: 700; color: var(--color-primary); opacity: 0.3; line-height: 1; }
	.chapter-header h1 { font-size: 3rem; margin-top: 0.5rem; line-height: 1.1; }
	.section { margin-bottom: 3rem; }
	.section h2 { font-size: 1.5rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--color-gray-200); }
	.section-desc { color: #71717a; margin-bottom: 1.5rem; font-style: italic; }

	/* Metrics Grid */
	.metrics-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; }
	@media (max-width: 700px) { .metrics-grid { grid-template-columns: repeat(2, 1fr); } }
	.metric { background: white; border: 2px solid var(--color-black); padding: 1.25rem; text-align: center; }
	.metric.highlight { background: var(--color-black); color: white; }
	.metric-label { display: block; font-size: 0.75rem; text-transform: uppercase; font-weight: 600; margin-bottom: 0.5rem; opacity: 0.7; }
	.metric-value { font-family: var(--font-header); font-size: 1.5rem; font-weight: 700; }

	.inventory-card { background: var(--color-gray-100); padding: 1.5rem; margin-bottom: 2rem; border-left: 4px solid var(--color-primary); }
	.inventory-card h3 { margin-bottom: 1rem; }

	.inventory-table { width: 100%; border-collapse: collapse; background: white; }
	.inventory-table th, .inventory-table td { padding: 0.75rem; border: 1px solid var(--color-gray-200); text-align: left; font-size: 0.95rem; }
	.inventory-table th { background: var(--color-black); color: white; font-weight: 600; }
	.inventory-table tr.project-row { background: #fffbeb; }
	
	.placeholder { background: #fef3c7; }
	.badge { font-size: 0.7rem; background: #f59e0b; color: white; padding: 0.2rem 0.5rem; border-radius: 4px; margin-left: 0.5rem; vertical-align: middle; }

	.asset-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
	@media (max-width: 600px) { .asset-list { grid-template-columns: 1fr; } }
	
	.asset-item { display: flex; align-items: center; gap: 1rem; background: white; border: 2px solid var(--color-black); padding: 1rem; }
	.asset-item.project { border-color: #f59e0b; background: #fffbeb; }
	.asset-item .qty { background: var(--color-primary); color: white; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 4px; }
	.asset-item.project .qty { background: #f59e0b; }
	.asset-item .name { font-weight: 600; font-family: var(--font-header); font-size: 1.1rem; }
	.asset-item .desc { font-size: 0.85rem; color: #71717a; margin-left: auto; }

	.consumables { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
	.consumables li { background: #e0f2fe; padding: 0.75rem; border-left: 3px solid #0ea5e9; }
</style>
