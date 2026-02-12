<script lang="ts">
	import propertyData from '$lib/data/property.json';

	const property = propertyData.property;
	const floors = propertyData.floors;
	const summary = propertyData.summary;

	// Get residential floors with rooms
	const residentialFloors = floors.filter(f => f.type === 'residential');

	// Helper function to get room type label
	function getRoomTypeLabel(type: string): string {
		switch(type) {
			case 'bedspace': return '🛏️ Bedspace';
			case 'private': return '🚪 Private';
			case 'working': return '🧹 Working';
			default: return type;
		}
	}
</script>

<svelte:head>
	<title>03 Property Overview - DA Tirol Dorm</title>
</svelte:head>

<article class="chapter">
	<header class="chapter-header">
		<span class="chapter-number">03</span>
		<h1>Property Overview</h1>
	</header>

	<section class="section">
		<h2>Building Specifications</h2>
		<table class="info-table">
			<tbody>
				<tr>
					<th>Property Address</th>
					<td>{property.address}</td>
				</tr>
				<tr>
					<th>Building Type</th>
					<td>{property.building_type}</td>
				</tr>
				<tr>
					<th>Number of Floors</th>
					<td>{property.floors} Floors (Rooftop Deck pending)</td>
				</tr>
				<tr>
					<th>Renovation Status</th>
					<td>{property.renovation_status}</td>
				</tr>
			</tbody>
		</table>
	</section>

	<section class="section">
		<h2>Capacity Summary</h2>
		<div class="metrics-grid">
			<div class="metric">
				<span class="metric-label">Total Rooms</span>
				<span class="metric-value">{summary.total_rooms}</span>
			</div>
			<div class="metric">
				<span class="metric-label">Bedspace Capacity</span>
				<span class="metric-value">{summary.bedspace_capacity} pax</span>
			</div>
			<div class="metric">
				<span class="metric-label">Private Capacity</span>
				<span class="metric-value">{summary.private_capacity} pax</span>
			</div>
			<div class="metric highlight">
				<span class="metric-label">Total Capacity</span>
				<span class="metric-value">{summary.total_capacity} pax</span>
			</div>
		</div>
		<p class="note">📌 {summary.working_capacity} persons are Working Tenants (free rent in exchange for tasks). Paying capacity: {summary.paying_capacity} pax.</p>
	</section>

	<section class="section">
		<h2>Unit Types & Rates</h2>
		<table class="pricing-table">
			<thead>
				<tr>
					<th>Unit Type</th>
					<th>Rooms</th>
					<th>Capacity</th>
					<th>Monthly Rate</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><strong>Bedspace (Aircon)</strong></td>
					<td>3</td>
					<td>22 pax</td>
					<td>₱2,000/head</td>
				</tr>
				<tr>
					<td><strong>Bedspace (Non-Aircon)</strong></td>
					<td>3</td>
					<td>13 pax</td>
					<td>₱2,000/head</td>
				</tr>
				<tr>
					<td><strong>Private Room (Solo)</strong></td>
					<td>2</td>
					<td>2 pax</td>
					<td>₱5,000/room</td>
				</tr>
				<tr>
					<td><strong>Private Room (Duo)</strong></td>
					<td>1</td>
					<td>2 pax</td>
					<td>₱5,500/room</td>
				</tr>
				<tr class="highlight-row">
					<td><strong>Working Room</strong></td>
					<td>1</td>
					<td>2 pax</td>
					<td><em>Free (rent discount)</em></td>
				</tr>
			</tbody>
		</table>
	</section>

	<section class="section">
		<h2>Room Inventory</h2>
		
		{#each residentialFloors as floor}
		<h3>{floor.name} — {floor.rooms?.length || 0} Rooms, {floor.floor_number === 2 ? summary.second_floor_capacity : summary.third_floor_capacity} pax capacity</h3>
		<div class="room-grid">
			{#each floor.rooms || [] as room}
			<div class="room-card {room.type}">
				<div class="room-header">
					<span class="room-name">{room.name}</span>
					<span class="room-type">{getRoomTypeLabel(room.type)}</span>
				</div>
				<div class="room-capacity">{room.capacity} {room.capacity === 1 ? 'person' : 'persons'}</div>
				<ul class="room-features">
					{#if room.double_decks > 0}
					<li>{room.double_decks} double deck{room.double_decks > 1 ? 's' : ''}</li>
					{/if}
					{#if room.single_decks > 0}
					<li>{room.single_decks} single deck</li>
					{/if}
					{#if room.cabinets > 0}
					<li>{room.cabinets} cabinets</li>
					{/if}
					{#if room.aircon}
					<li>❄️ Aircon</li>
					{/if}
					<li>{room.cr_type === 'private' ? '🚿 Private CR/Bath' : '🚿 Shared CR'}</li>
				</ul>
				{#if room.rate > 0}
				{#if room.type === 'bedspace'}
				<div class="room-rate">₱{(room.rate * room.capacity).toLocaleString()}</div>
				{:else}
				<div class="room-rate">₱{room.rate.toLocaleString()}</div>
				{/if}
				{:else}
				<div class="room-rate free">Free (Working)</div>
				{/if}
			</div>
			{/each}
		</div>
		{/each}
	</section>

	<section class="section">
		<h2>Floor Plan Summary</h2>
		<div class="floor-list">
			{#each floors as floor}
			<div class="floor-item">
				<h3>{floor.name}</h3>
				{#if floor.type === 'commercial'}
				<ul>
					{#each floor.areas || [] as area}
					<li><strong>{area.name}:</strong> {area.description}</li>
					{/each}
				</ul>
				{:else}
				<ul>
					{#each floor.features || [] as feature}
					<li>{feature}</li>
					{/each}
				</ul>
				{/if}
			</div>
			{/each}
		</div>
	</section>

	<section class="section">
		<h2>Building Features</h2>
		<ul class="feature-list">
			<li><strong>Safety:</strong> CCTV Surveillance (Gate & Hallways), Fire Extinguishers.</li>
			<li><strong>Connectivity:</strong> High-speed Fiber WiFi (Voucher System planned).</li>
			<li><strong>Utilities:</strong> Reliable Water Supply (Cistern w/ Pump), Backup Generator ready.</li>
			<li><strong>Convenience:</strong> In-house Canteen/Food Hub, Laundry Area.</li>
		</ul>
	</section>
</article>

<style>
	.chapter { max-width: 900px; }
	.chapter-header { margin-bottom: 3rem; }
	.chapter-number { font-family: var(--font-header); font-size: 4rem; font-weight: 700; color: var(--color-primary); opacity: 0.3; line-height: 1; }
	.chapter-header h1 { font-size: 3rem; margin-top: 0.5rem; line-height: 1.1; }
	
	.section { margin-bottom: 3rem; }
	.section h2 { font-size: 1.5rem; margin-bottom: 1.5rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--color-gray-200); }
	.section h3 { font-size: 1.1rem; margin: 1.5rem 0 1rem; text-transform: none; }
	
	.note { font-size: 0.9rem; color: #71717a; font-style: italic; margin-top: 1rem; }

	/* Tables */
	.info-table, .pricing-table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
	.info-table th, .info-table td, .pricing-table th, .pricing-table td { padding: 0.75rem 1rem; border: 1px solid var(--color-gray-200); text-align: left; }
	.info-table th { background: var(--color-gray-100); font-weight: 600; width: 35%; }
	.pricing-table th { background: var(--color-black); color: white; font-weight: 600; }
	.pricing-table tbody tr:nth-child(even) { background: var(--color-gray-100); }
	.highlight-row { background: #fef3c7 !important; }

	/* Metrics */
	.metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
	@media (max-width: 700px) { .metrics-grid { grid-template-columns: repeat(2, 1fr); } }
	.metric { background: white; border: 2px solid var(--color-black); padding: 1.25rem; text-align: center; }
	.metric.highlight { background: var(--color-black); color: white; }
	.metric-label { display: block; font-size: 0.75rem; text-transform: uppercase; font-weight: 600; margin-bottom: 0.5rem; opacity: 0.7; }
	.metric-value { font-family: var(--font-header); font-size: 1.5rem; font-weight: 700; }

	/* Room Grid */
	.room-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
	.room-card { background: white; border: 2px solid var(--color-gray-200); padding: 1rem; }
	.room-card.bedspace { border-left: 4px solid var(--color-primary); }
	.room-card.private { border-left: 4px solid #10b981; }
	.room-card.working { border-left: 4px solid #f59e0b; }
	.room-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
	.room-name { font-weight: 700; }
	.room-type { font-size: 0.75rem; opacity: 0.7; }
	.room-capacity { font-family: var(--font-header); font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; }
	.room-features { font-size: 0.85rem; margin: 0; padding-left: 1.25rem; color: #71717a; }
	.room-features li { margin-bottom: 0.25rem; }
	.room-rate { font-weight: 600; margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px solid var(--color-gray-200); }
	.room-rate.free { color: #f59e0b; }

	/* Floor List */
	.floor-list { display: grid; gap: 1rem; }
	.floor-item { background: var(--color-gray-100); padding: 1.5rem; border-left: 4px solid var(--color-primary); }
	.floor-item h3 { margin: 0 0 0.75rem; }
	.floor-item ul { margin: 0; padding-left: 1.5rem; }
	.floor-item li { margin-bottom: 0.5rem; }

	/* Feature List */
	.feature-list { list-style: none; padding: 0; }
	.feature-list li { position: relative; padding-left: 2rem; margin-bottom: 1rem; font-size: 1.1rem; }
	.feature-list li::before { content: '✓'; position: absolute; left: 0; font-weight: 700; color: var(--color-accent, #10b981); }
</style>
