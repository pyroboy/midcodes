<script lang="ts">
	import type { PopulationReportData } from '$lib/types/reports';
	import populationData from '$lib/data/population.json';

	const data = populationData as PopulationReportData;
</script>

<svelte:head>
	<title>Population Report - DA Tirol Dorm</title>
</svelte:head>

<article class="report">
	<header class="report-header">
		<div class="header-icon">👥</div>
		<div class="header-info">
			<h1>Population Report</h1>
			<p class="period">As of {data.report_date}</p>
		</div>
	</header>

	<section class="summary-section">
		<h2>Summary</h2>
		<div class="summary-grid">
			<div class="summary-card">
				<span class="label">Total Tenants</span>
				<span class="value">38</span>
			</div>
			<div class="summary-card highlight">
				<span class="label">Active Tenants</span>
				<span class="value">38</span>
			</div>
			<div class="summary-card">
				<span class="label">Total Capacity</span>
				<span class="value">40</span>
			</div>
			<div class="summary-card">
				<span class="label">Occupancy Rate</span>
				<span class="value">95%</span>
			</div>
		</div>
	</section>

	<section class="data-section">
		<h2>Movement Trends</h2>
		<div class="trend-cards">
			<div class="trend-card positive">
				<span class="trend-icon">📥</span>
				<span class="trend-value">{data.trends.move_ins_this_month}</span>
				<span class="trend-label">Move-ins this month</span>
			</div>
			<div class="trend-card negative">
				<span class="trend-icon">📤</span>
				<span class="trend-value">{data.trends.move_outs_this_month}</span>
				<span class="trend-label">Move-outs this month</span>
			</div>
			<div class="trend-card" class:positive={data.trends.net_change > 0} class:negative={data.trends.net_change < 0}>
				<span class="trend-icon">{data.trends.net_change >= 0 ? '📈' : '📉'}</span>
				<span class="trend-value">{data.trends.net_change >= 0 ? '+' : ''}{data.trends.net_change}</span>
				<span class="trend-label">Net change</span>
			</div>
		</div>
	</section>

	<section class="data-section">
		<h2>Population by Status</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Status</th>
						<th>Count</th>
						<th>Percentage</th>
					</tr>
				</thead>
				<tbody>
					{#each data.population_by_status as status}
					<tr>
						<td><span class="status-badge {status.status.toLowerCase()}">{status.status}</span></td>
						<td><strong>{status.count}</strong></td>
						<td>{status.percentage}%</td>
					</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section class="data-section">
		<h2>Occupancy by Floor</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Floor</th>
						<th>Capacity</th>
						<th>Occupied</th>
						<th>Vacant</th>
						<th>Occupancy Rate</th>
					</tr>
				</thead>
				<tbody>
					{#each data.occupancy_by_floor as floor}
					<tr>
						<td><strong>Floor {floor.floor_number}</strong></td>
						<td>{floor.total_capacity}</td>
						<td>{floor.occupied}</td>
						<td>{floor.total_capacity - floor.occupied}</td>
						<td>
							<div class="progress-bar">
								<div class="progress-fill" style="width: {floor.occupancy_rate}%"></div>
								<span class="progress-label">{floor.occupancy_rate}%</span>
							</div>
						</td>
					</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section class="data-section">
		<h2>Boarders Record (Room Assignments)</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Room</th>
						<th>Boarders</th>
						<th>Count</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>ROOM 1</strong></td>
						<td>
							<ul class="boarder-list">
								<li>Jessel Saraga</li>
								<li>Ashlee Martinez</li>
								<li>Nicole Refugio</li>
								<li>Cetchiern</li>
								<li>Angel Mae Cañete</li>
								<li>Hannah Fiona</li>
								<li>Eda Mae Madera</li>
								<li>Pacatang</li>
							</ul>
						</td>
						<td>8</td>
					</tr>
					<tr>
						<td><strong>ROOM 2</strong></td>
						<td>
							<ul class="boarder-list">
								<li>Riz Amely L. Dasoc</li>
								<li>Akisha Mosqueda</li>
								<li>Ryza Gamot</li>
								<li>Jean Andrea J. Morales</li>
								<li>Shekainah Limotan</li>
								<li>Joyce Antoinette Jubahib</li>
								<li>Junalee Grace Jubahib</li>
								<li>Donna Galamiton</li>
							</ul>
						</td>
						<td>8</td>
					</tr>
					<tr>
						<td><strong>ROOM 4</strong></td>
						<td>
							<ul class="boarder-list">
								<li>Althea Aclan</li>
								<li>Ann Patricia Regalado</li>
								<li>Trisha Mae Ombagan</li>
								<li>Crizzavy S. Tanginan</li>
							</ul>
						</td>
						<td>4</td>
					</tr>
					<tr>
						<td><strong>ROOM 5</strong></td>
						<td>
							<ul class="boarder-list">
								<li>Nicola Galorport</li>
								<li>Angel Ann B Planos</li>
								<li>Jiodelyn Patron</li>
								<li>Madronero</li>
							</ul>
						</td>
						<td>4</td>
					</tr>
					<tr>
						<td><strong>ROOM 6</strong></td>
						<td>
							<ul class="boarder-list">
								<li>Manilyn C. Sevilla</li>
							</ul>
						</td>
						<td>1</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<footer class="report-footer">
		<p>Generated: {new Date(data.generated_at).toLocaleString()}</p>
	</footer>
</article>

<style>
	.report { max-width: 100%; }
	.report-header {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 3px solid var(--color-black);
	}
	.header-icon { font-size: 3rem; background: #f3e8ff; padding: 1rem; border: 2px solid var(--color-black); }
	.header-info h1 { font-size: 2.5rem; line-height: 1.1; }
	.period { font-size: 1.1rem; color: #71717a; margin: 0.5rem 0 0; }

	.summary-section, .data-section { margin-bottom: 2.5rem; }
	h2 { font-size: 1.25rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--color-gray-200); }

	.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
	@media (max-width: 800px) { .summary-grid { grid-template-columns: repeat(2, 1fr); } }
	.summary-card { background: white; border: 2px solid var(--color-black); padding: 1.25rem; text-align: center; }
	.summary-card.highlight { background: var(--color-black); color: white; }
	.summary-card .label { display: block; font-size: 0.85rem; text-transform: uppercase; margin-bottom: 0.5rem; opacity: 0.7; }
	.summary-card .value { font-family: var(--font-header); font-size: 1.5rem; font-weight: 700; }

	.trend-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
	@media (max-width: 600px) { .trend-cards { grid-template-columns: 1fr; } }
	.trend-card { background: white; border: 2px solid var(--color-gray-200); padding: 1.5rem; text-align: center; }
	.trend-card.positive { border-color: #22c55e; background: #f0fdf4; }
	.trend-card.negative { border-color: #ef4444; background: #fef2f2; }
	.trend-icon { font-size: 1.5rem; display: block; margin-bottom: 0.5rem; }
	.trend-value { font-family: var(--font-header); font-size: 2rem; font-weight: 700; display: block; }
	.trend-label { font-size: 0.85rem; color: #71717a; }

	.table-wrapper { overflow-x: auto; }
	table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
	th, td { padding: 0.75rem 1rem; text-align: left; border: 1px solid var(--color-gray-200); }
	th { background: var(--color-black); color: white; font-weight: 600; white-space: nowrap; }
	tbody tr:nth-child(even) { background: var(--color-gray-100); }

	.status-badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		border-radius: 2px;
	}
	.status-badge.active { background: #dcfce7; color: #16a34a; }
	.status-badge.inactive { background: #f4f4f5; color: #71717a; }
	.status-badge.pending { background: #fef3c7; color: #d97706; }
	.status-badge.blacklisted { background: #fef2f2; color: #ef4444; }

	.progress-bar { position: relative; background: var(--color-gray-200); height: 24px; width: 100%; min-width: 120px; }
	.progress-fill { height: 100%; background: var(--color-primary); transition: width 0.3s; }
	.progress-label { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 0.85rem; font-weight: 600; }

	.report-footer { font-size: 0.85rem; color: #71717a; border-top: 1px solid var(--color-gray-200); padding-top: 1rem; }
	.boarder-list { list-style: none; padding: 0; margin: 0; }
	.boarder-list li { margin-bottom: 0.25rem; }
</style>
