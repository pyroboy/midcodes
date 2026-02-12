<script lang="ts">
	import propertyData from '$lib/data/property.json';

	const floors = propertyData.floors;
	
	// Get residential floors with rooms
	const residentialFloors = floors.filter(f => f.type === 'residential');
	
	// Build flat list of occupant rows
	interface OccupantRow {
		floor: string;
		room: string;
		occupantNumber: number;
		rate: number;
		roomType: string;
	}
	
	let occupantRows: OccupantRow[] = [];
	
	residentialFloors.forEach(floor => {
		floor.rooms?.forEach(room => {
			for (let i = 1; i <= room.capacity; i++) {
				occupantRows.push({
					floor: floor.name,
					room: room.name,
					occupantNumber: i,
					rate: room.type === 'bedspace' ? room.rate : (room.rate / room.capacity),
					roomType: room.type
				});
			}
		});
	});
	
	// Group by floor for subtotals
	const secondFloorRows = occupantRows.filter(r => r.floor.includes('2nd'));
	const thirdFloorRows = occupantRows.filter(r => r.floor.includes('3rd'));
	
	function printLog() {
		window.print();
	}
</script>

<svelte:head>
	<title>Tenant Payment Log - DA Tirol Dorm</title>
</svelte:head>

<div class="print-controls no-print">
	<button class="print-btn" onclick={printLog}>🖨️ Print (8.5 × 13 Folio)</button>
</div>

<article class="appendix">
	<header class="appendix-header">
		<h1>Monthly Tenant Payment Log</h1>
		<p class="period">Month: __________________</p>
	</header>

	<section class="section">
		<h2>2nd Floor</h2>
		<table class="payment-table">
			<thead>
				<tr>
					<th class="col-room">Room</th>
					<th class="col-tenant">Tenant Name</th>
					<th class="col-rate">Rate</th>
					<th class="col-rent">Rent Paid</th>
					<th class="col-elec">Electricity</th>
				</tr>
			</thead>
			<tbody>
				{#each secondFloorRows as row, i}
				<tr class:alt={i % 2 === 1}>
					<td class="room-cell">
						<div class="room-flex">
							{#if row.occupantNumber === 1}
							<strong>{row.room}</strong>
							{/if}
							<span class="num">{row.occupantNumber}.</span>
						</div>
					</td>
					<td class="input-cell"></td>
					<td class="rate-cell">₱{row.rate.toLocaleString()}</td>
					<td class="input-cell"></td>
					<td class="input-cell"></td>
				</tr>
				{/each}
			</tbody>
			<tfoot>
				<tr>
					<td colspan="2"><strong>2F Subtotal ({secondFloorRows.length} pax)</strong></td>
					<td><strong>₱{secondFloorRows.reduce((sum, r) => sum + r.rate, 0).toLocaleString()}</strong></td>
					<td colspan="2"></td>
				</tr>
			</tfoot>
		</table>
	</section>

	<section class="section">
		<h2>3rd Floor</h2>
		<table class="payment-table">
			<thead>
				<tr>
					<th class="col-room">Room</th>
					<th class="col-tenant">Tenant Name</th>
					<th class="col-rate">Rate</th>
					<th class="col-rent">Rent Paid</th>
					<th class="col-elec">Electricity</th>
				</tr>
			</thead>
			<tbody>
				{#each thirdFloorRows as row, i}
				<tr class:alt={i % 2 === 1} class:working={row.roomType === 'working'}>
					<td class="room-cell">
						<div class="room-flex">
							{#if row.occupantNumber === 1}
							<span class="r-name"><strong>{row.room}</strong>{#if row.roomType === 'working'} <span class="badge">W</span>{/if}</span>
							{/if}
							<span class="num">{row.occupantNumber}.</span>
						</div>
					</td>
					<td class="input-cell"></td>
					<td class="rate-cell">{#if row.roomType === 'working'}₱0{:else}₱{row.rate.toLocaleString()}{/if}</td>
					<td class="input-cell"></td>
					<td class="input-cell"></td>
				</tr>
				{/each}
			</tbody>
			<tfoot>
				<tr>
					<td colspan="2"><strong>3F Subtotal ({thirdFloorRows.length} pax)</strong></td>
					<td><strong>₱{thirdFloorRows.filter(r => r.roomType !== 'working').reduce((sum, r) => sum + r.rate, 0).toLocaleString()}</strong></td>
					<td colspan="2"></td>
				</tr>
			</tfoot>
		</table>
	</section>

	<section class="section totals-section">
		<table class="totals-table">
			<tbody>
				<tr>
					<td>Expected Rent</td>
					<td class="amount">₱{occupantRows.filter(r => r.roomType !== 'working').reduce((sum, r) => sum + r.rate, 0).toLocaleString()}</td>
				</tr>
				<tr>
					<td>Rent Collected</td>
					<td class="amount input-box"></td>
				</tr>
				<tr>
					<td>Electricity Collected</td>
					<td class="amount input-box"></td>
				</tr>
				<tr class="grand-total">
					<td><strong>Grand Total</strong></td>
					<td class="amount input-box"></td>
				</tr>
			</tbody>
		</table>
	</section>

	<section class="section signature-section">
		<div class="sig"><span>Prepared:</span><div class="line"></div></div>
		<div class="sig"><span>Verified:</span><div class="line"></div></div>
		<div class="sig"><span>Date:</span><div class="line"></div></div>
	</section>
</article>

<style>
	/* Print button */
	.print-controls { margin-bottom: 1rem; }
	.print-btn { background: var(--color-primary); color: white; border: none; padding: 0.75rem 1.5rem; font-weight: 600; cursor: pointer; font-size: 1rem; }
	.print-btn:hover { opacity: 0.9; }
	.no-print { }

	.appendix { max-width: 100%; }
	
	.appendix-header { text-align: center; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--color-black); }
	.appendix-header h1 { font-size: 1.4rem; margin: 0 0 0.25rem; }
	.period { font-size: 0.9rem; margin: 0; }

	.section { margin-bottom: 0.75rem; }
	.section h2 { font-size: 0.9rem; margin: 0 0 0.25rem; font-weight: 700; }

	.payment-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
	.payment-table th, .payment-table td { padding: 0.25rem 0.3rem; border: 1px solid #333; line-height: 1.1; }
	.payment-table th { background: #222; color: white; font-weight: 600; text-align: center; font-size: 0.7rem; }
	
	.col-room { width: 15%; }
	.col-tenant { width: 40%; }
	.col-rate { width: 15%; }
	.col-rent { width: 15%; }
	.col-elec { width: 15%; }

	.room-cell { font-size: 0.7rem; }
	.room-flex { display: flex; justify-content: space-between; align-items: baseline; }
	.room-flex .num { font-weight: 600; margin-left: auto; }
	
	.rate-cell { text-align: right; font-family: monospace; font-size: 0.7rem; }
	.input-cell { background: #fafafa; }
	
	.alt { background: #f5f5f5; }
	.alt .input-cell { background: #eee; }
	.working { background: #fef3c7 !important; }
	.working .input-cell { background: #fef3c7 !important; }
	
	.badge { font-size: 0.55rem; background: #f59e0b; color: white; padding: 0 0.2rem; border-radius: 2px; }

	.payment-table tfoot td { background: #ddd; font-weight: 600; font-size: 0.7rem; padding: 0.2rem 0.3rem; }

	.totals-section { margin-top: 0.5rem; }
	.totals-table { width: 45%; margin-left: auto; border-collapse: collapse; font-size: 0.75rem; }
	.totals-table td { padding: 0.2rem 0.4rem; border: 1px solid #333; }
	.totals-table .amount { text-align: right; font-family: monospace; width: 35%; }
	.totals-table .input-box { background: #fafafa; }
	.totals-table .grand-total { background: #222; color: white; }
	.totals-table .grand-total .input-box { background: #444; }

	.signature-section { display: flex; gap: 1rem; margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px dashed #999; }
	.sig { flex: 1; font-size: 0.7rem; }
	.sig span { display: block; margin-bottom: 0.2rem; }
	.line { border-bottom: 1px solid #333; height: 1rem; }

	/* Print styles for 8.5 x 13 folio */
	@media print {
		@page {
			size: 8.5in 13in;
			margin: 0.5in;
		}
		
		.no-print { display: none !important; }
		
		.appendix { font-size: 9pt; }
		.appendix-header h1 { font-size: 14pt; }
		.period { font-size: 10pt; }
		.section h2 { font-size: 10pt; }
		
		.payment-table { font-size: 8pt; }
		.payment-table th, .payment-table td { padding: 4px 4px; }
		.payment-table th { font-size: 7pt; }
		.room-cell, .rate-cell { font-size: 7pt; }
		.payment-table tfoot td { font-size: 7pt; }
		
		.totals-table { font-size: 8pt; }
		.sig { font-size: 7pt; }
	}
</style>
