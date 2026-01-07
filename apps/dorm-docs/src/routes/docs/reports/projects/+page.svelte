<script lang="ts">
	import type { ProjectsReportData } from '$lib/types/reports';
	import projectsData from '$lib/data/projects.json';

	const data = projectsData as ProjectsReportData;
</script>

<svelte:head>
	<title>Projects Report - DA Tirol Dorm</title>
</svelte:head>

<article class="report">
	<header class="report-header">
		<div class="header-icon">🔧</div>
		<div class="header-info">
			<h1>Projects Report</h1>
			<p class="period">As of {data.report_date}</p>
		</div>
	</header>

	<section class="summary-section">
		<h2>Summary</h2>
		<div class="summary-grid">
			<div class="summary-card">
				<span class="label">Total Projects</span>
				<span class="value">{data.summary.total_projects}</span>
			</div>
			<div class="summary-card highlight">
				<span class="label">Active Projects</span>
				<span class="value">{data.summary.active_projects}</span>
			</div>
			<div class="summary-card">
				<span class="label">Completed</span>
				<span class="value">{data.summary.completed_projects}</span>
			</div>
			<div class="summary-card">
				<span class="label">Total Budget</span>
				<span class="value">₱{data.summary.total_planned_budget.toLocaleString()}</span>
			</div>
		</div>
		<div class="budget-summary">
			<div class="budget-item">
				<span class="label">Total Spent:</span>
				<span class="value spent">₱{data.summary.total_actual_spent.toLocaleString()}</span>
			</div>
			<div class="budget-item">
				<span class="label">Budget Remaining:</span>
				<span class="value remaining">₱{data.summary.budget_variance.toLocaleString()}</span>
			</div>
		</div>
	</section>

	<section class="data-section">
		<h2>Projects by Status</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Status</th>
						<th>Count</th>
						<th>Total Budget</th>
						<th>Amount Spent</th>
					</tr>
				</thead>
				<tbody>
					{#each data.projects_by_status as item}
					<tr>
						<td><span class="status-badge {item.status.toLowerCase().replace('_', '-')}">{item.status.replace('_', ' ')}</span></td>
						<td><strong>{item.count}</strong></td>
						<td>₱{item.total_budget.toLocaleString()}</td>
						<td>₱{item.total_spent.toLocaleString()}</td>
					</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section class="data-section">
		<h2>Active & Recent Projects</h2>
		{#each data.projects as project}
		<div class="project-card">
			<div class="project-header">
				<div class="project-info">
					<h3>{project.project_name}</h3>
					<p class="project-desc">{project.project_description ?? 'No description'}</p>
					<div class="project-meta">
						<span class="category">{project.project_category ?? 'Uncategorized'}</span>
						<span class="property">📍 {project.property_name}</span>
						{#if project.start_date}
						<span class="dates">{project.start_date} → {project.end_date}</span>
						{/if}
					</div>
				</div>
				<div class="project-status">
					<span class="status-badge {project.status.toLowerCase().replace('_', '-')}">{project.status.replace('_', ' ')}</span>
				</div>
			</div>
			
			<div class="project-budget">
				<div class="budget-bar">
					<div class="budget-fill" style="width: {Math.min((project.actual_amount / project.planned_amount) * 100, 100)}%"></div>
				</div>
				<div class="budget-details">
					<span>Planned: ₱{project.planned_amount.toLocaleString()}</span>
					<span>Spent: ₱{project.actual_amount.toLocaleString()}</span>
					<span>Pending: ₱{project.pending_amount.toLocaleString()}</span>
				</div>
			</div>

			{#if project.budget_items.length > 0}
			<div class="budget-items">
				<h4>Budget Items</h4>
				<table class="items-table">
					<thead>
						<tr>
							<th>Item</th>
							<th>Category</th>
							<th>Planned</th>
							<th>Actual</th>
							<th>Variance</th>
						</tr>
					</thead>
					<tbody>
						{#each project.budget_items as item}
						<tr>
							<td>{item.name}</td>
							<td>{item.category}</td>
							<td>₱{item.planned_amount.toLocaleString()}</td>
							<td>₱{item.actual_amount.toLocaleString()}</td>
							<td class:positive={item.variance > 0} class:negative={item.variance < 0}>
								{item.variance >= 0 ? '+' : ''}₱{item.variance.toLocaleString()}
							</td>
						</tr>
						{/each}
					</tbody>
				</table>
			</div>
			{/if}

			<div class="project-progress">
				<span class="progress-label">Progress:</span>
				<div class="progress-bar">
					<div class="progress-fill" style="width: {project.progress_percentage}%"></div>
					<span class="progress-text">{project.progress_percentage}%</span>
				</div>
			</div>
		</div>
		{/each}
	</section>

	{#if data.upcoming_projects.length > 0}
	<section class="data-section">
		<h2>Upcoming Projects</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Project</th>
						<th>Category</th>
						<th>Budget</th>
						<th>Start Date</th>
					</tr>
				</thead>
				<tbody>
					{#each data.upcoming_projects as project}
					<tr>
						<td><strong>{project.project_name}</strong></td>
						<td>{project.project_category ?? '-'}</td>
						<td>₱{project.planned_amount.toLocaleString()}</td>
						<td>{project.start_date ?? 'TBD'}</td>
					</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
	{/if}

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
	.header-icon { font-size: 3rem; background: #fef3c7; padding: 1rem; border: 2px solid var(--color-black); }
	.header-info h1 { font-size: 2.5rem; line-height: 1.1; }
	.period { font-size: 1.1rem; color: #71717a; margin: 0.5rem 0 0; }

	.summary-section, .data-section { margin-bottom: 2.5rem; }
	h2 { font-size: 1.25rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--color-gray-200); }

	.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1rem; }
	@media (max-width: 800px) { .summary-grid { grid-template-columns: repeat(2, 1fr); } }
	.summary-card { background: white; border: 2px solid var(--color-black); padding: 1.25rem; text-align: center; }
	.summary-card.highlight { background: var(--color-primary); color: white; border-color: var(--color-primary); }
	.summary-card .label { display: block; font-size: 0.85rem; text-transform: uppercase; margin-bottom: 0.5rem; opacity: 0.7; }
	.summary-card .value { font-family: var(--font-header); font-size: 1.5rem; font-weight: 700; }

	.budget-summary { display: flex; gap: 2rem; flex-wrap: wrap; }
	.budget-item .label { color: #71717a; }
	.budget-item .value { font-weight: 700; margin-left: 0.5rem; }
	.budget-item .spent { color: #dc2626; }
	.budget-item .remaining { color: #16a34a; }

	.table-wrapper { overflow-x: auto; }
	table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
	th, td { padding: 0.75rem 1rem; text-align: left; border: 1px solid var(--color-gray-200); }
	th { background: var(--color-black); color: white; font-weight: 600; white-space: nowrap; }
	tbody tr:nth-child(even) { background: var(--color-gray-100); }

	.status-badge { display: inline-block; padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; border-radius: 2px; }
	.status-badge.completed { background: #dcfce7; color: #16a34a; }
	.status-badge.in-progress { background: #dbeafe; color: #2563eb; }
	.status-badge.planned { background: #f3e8ff; color: #7c3aed; }
	.status-badge.on-hold { background: #fef3c7; color: #d97706; }
	.status-badge.cancelled { background: #fef2f2; color: #ef4444; }

	.project-card { background: white; border: 2px solid var(--color-black); margin-bottom: 1.5rem; padding: 1.5rem; }
	.project-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; }
	.project-info h3 { margin: 0 0 0.5rem; font-size: 1.25rem; text-transform: none; }
	.project-desc { margin: 0 0 0.5rem; color: #71717a; font-size: 0.95rem; }
	.project-meta { display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.85rem; }
	.category { background: var(--color-gray-200); padding: 0.25rem 0.5rem; font-weight: 600; }

	.project-budget { margin-bottom: 1rem; }
	.budget-bar { background: var(--color-gray-200); height: 12px; width: 100%; margin-bottom: 0.5rem; }
	.budget-fill { height: 100%; background: var(--color-primary); }
	.budget-details { display: flex; justify-content: space-between; font-size: 0.85rem; flex-wrap: wrap; gap: 0.5rem; }

	.budget-items { margin: 1rem 0; }
	.budget-items h4 { font-size: 0.95rem; margin-bottom: 0.5rem; text-transform: none; }
	.items-table th { background: var(--color-gray-200); color: var(--color-black); }
	.positive { color: #16a34a; }
	.negative { color: #ef4444; }

	.project-progress { display: flex; align-items: center; gap: 1rem; }
	.progress-label { font-weight: 600; font-size: 0.9rem; }
	.progress-bar { position: relative; background: var(--color-gray-200); height: 24px; flex: 1; }
	.progress-fill { height: 100%; background: #16a34a; }
	.progress-text { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 0.85rem; font-weight: 600; }

	.report-footer { font-size: 0.85rem; color: #71717a; border-top: 1px solid var(--color-gray-200); padding-top: 1rem; }
</style>
