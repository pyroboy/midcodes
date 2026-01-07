<svelte:head>
	<title>14 Inventory & Assets - DA Tirol Dorm</title>
</svelte:head>

<article class="chapter">
	<header class="chapter-header">
		<span class="chapter-number">14</span>
		<h1>Inventory & Assets</h1>
	</header>

	<section class="section">
		<h2>Room Furnishings</h2>
		<p class="section-desc">Standard inventory assigned per room type.</p>
		
		<div class="inventory-card">
			<h3>Standard Bedspace Room</h3>
			<table class="inventory-table">
				<thead>
					<tr>
						<th>Item</th>
						<th>Specs/Description</th>
						<th>Qty per Room</th>
						<th>Est. Cost</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Bunk Bed</td>
						<td class="placeholder">Steel deck, double decker, 36x75</td>
						<td class="placeholder">2 (for 4 pax)</td>
						<td class="placeholder">₱[X]</td>
					</tr>
					<tr>
						<td>Mattress</td>
						<td class="placeholder">Uratex foam, 4 inches thick</td>
						<td class="placeholder">4</td>
						<td class="placeholder">₱[X]</td>
					</tr>
					<tr>
						<td>Locker Cabinet</td>
						<td class="placeholder">Metal/Wood locker with hasp</td>
						<td class="placeholder">4 compartments</td>
						<td class="placeholder">₱[X]</td>
					</tr>
					<tr>
						<td>Ceiling/Wall Fan</td>
						<td class="placeholder">Orbit fan 16"</td>
						<td class="placeholder">1</td>
						<td class="placeholder">₱[X]</td>
					</tr>
					<tr>
						<td>Curtains</td>
						<td class="placeholder">Blocking curtains (set)</td>
						<td class="placeholder">2 sets</td>
						<td class="placeholder">₱[X]</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div class="inventory-card">
			<h3>Private Room</h3>
			<table class="inventory-table">
				<thead>
					<tr>
						<th>Item</th>
						<th>Specs/Description</th>
						<th>Qty per Room</th>
						<th>Est. Cost</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Bed Frame</td>
						<td class="placeholder">Single/Double frame, wood/metal</td>
						<td class="placeholder">1</td>
						<td class="placeholder">₱[X]</td>
					</tr>
					<tr>
						<td>Study Table & Chair</td>
						<td class="placeholder">Basic desk set</td>
						<td class="placeholder">1</td>
						<td class="placeholder">₱[X]</td>
					</tr>
					<tr>
						<td>Aircon Unit</td>
						<td class="placeholder">Window type, 0.5HP-1HP</td>
						<td class="placeholder">1</td>
						<td class="placeholder">₱[X]</td>
					</tr>
					<tr>
						<td>Wardrobe</td>
						<td class="placeholder">Standalone cabinet</td>
						<td class="placeholder">1</td>
						<td class="placeholder">₱[X]</td>
					</tr>
				</tbody>
			</table>
		</div>
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
				<tr>
					<td>Repair</td>
					<td>Ladder</td>
					<td>Changing bulbs, high reach</td>
					<td class="placeholder">Storage Room</td>
				</tr>
				<tr>
					<td>Safety</td>
					<td>Fire Extinguisher</td>
					<td>10lbs Dry Chemical</td>
					<td class="placeholder">Every 15 meters</td>
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
			<div class="asset-item">
				<span class="qty placeholder">1</span>
				<span class="name">Microwave Oven</span>
				<span class="desc placeholder">Basic model for reheating</span>
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
	.chapter { max-width: 800px; }
	.chapter-header { margin-bottom: 3rem; }
	.chapter-number { font-family: var(--font-header); font-size: 4rem; font-weight: 700; color: var(--color-primary); opacity: 0.3; line-height: 1; }
	.chapter-header h1 { font-size: 3rem; margin-top: 0.5rem; line-height: 1.1; }
	.section { margin-bottom: 3rem; }
	.section h2 { font-size: 1.5rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--color-gray-200); }
	.section-desc { color: #71717a; margin-bottom: 1.5rem; font-style: italic; }

	.inventory-card { background: var(--color-gray-100); padding: 1.5rem; margin-bottom: 2rem; border-left: 4px solid var(--color-primary); }
	.inventory-card h3 { margin-bottom: 1rem; }

	.inventory-table { width: 100%; border-collapse: collapse; background: white; }
	.inventory-table th, .inventory-table td { padding: 0.75rem; border: 1px solid var(--color-gray-200); text-align: left; font-size: 0.95rem; }
	.inventory-table th { background: var(--color-black); color: white; font-weight: 600; }
	
	.placeholder { background: #fef3c7; }

	.asset-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
	@media (max-width: 600px) { .asset-list { grid-template-columns: 1fr; } }
	
	.asset-item { display: flex; align-items: center; gap: 1rem; background: white; border: 2px solid var(--color-black); padding: 1rem; }
	.asset-item .qty { background: var(--color-primary); color: white; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 4px; }
	.asset-item .name { font-weight: 600; font-family: var(--font-header); font-size: 1.1rem; }
	.asset-item .desc { font-size: 0.85rem; color: #71717a; margin-left: auto; }

	.consumables { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
	.consumables li { background: #e0f2fe; padding: 0.75rem; border-left: 3px solid #0ea5e9; }
</style>
