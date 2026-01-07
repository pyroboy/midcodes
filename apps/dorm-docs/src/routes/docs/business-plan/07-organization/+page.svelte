<svelte:head>
	<title>07 Organization - DA Tirol Dorm</title>
</svelte:head>

<article class="chapter">
	<header class="chapter-header">
		<span class="chapter-number">07</span>
		<h1>Organization</h1>
	</header>

	<section class="section">
		<h2>Organizational Structure</h2>
		<div class="org-chart">
			<div class="role owner">
				<span class="role-title">Owner/Manager</span>
				<span class="role-name placeholder">[Name]</span>
			</div>
			<div class="role-group">
				<div class="role">
					<span class="role-title">Caretaker</span>
					<span class="role-name placeholder">[Name]</span>
				</div>
				<div class="role">
					<span class="role-title">Accountant</span>
					<span class="role-name placeholder">[Name/Outsourced]</span>
				</div>
			</div>
		</div>
	</section>

	<section class="section">
		<h2>Roles & Responsibilities</h2>
		
		<div class="role-card">
			<h3>👤 Owner/Manager</h3>
			<ul>
				<li>Overall business management and decision-making</li>
				<li>Tenant screening and contract approval</li>
				<li>Financial oversight and reporting</li>
				<li>Major maintenance approvals</li>
				<li>Property improvements planning</li>
			</ul>
		</div>

		<div class="role-card">
			<h3>🏠 Caretaker</h3>
			<ul>
				<li>Daily property inspection and security</li>
				<li>Rent collection and remittance</li>
				<li>Minor maintenance and repairs</li>
				<li>Tenant issue resolution</li>
				<li>Utility meter readings</li>
				<li>Cleanliness of common areas</li>
			</ul>
			<div class="terms">
				<p><strong>Schedule:</strong> <span class="placeholder">[24/7 on-site / Shift-based]</span></p>
				<p><strong>Compensation:</strong> <span class="placeholder">₱[X]/month + free accommodation</span></p>
			</div>
		</div>

		<div class="role-card">
			<h3>📊 Accountant/Bookkeeper</h3>
			<ul>
				<li>Monthly financial statements</li>
				<li>Tax computation and filing</li>
				<li>Billing reconciliation</li>
				<li>Expense tracking</li>
			</ul>
			<div class="terms">
				<p><strong>Arrangement:</strong> <span class="placeholder">[In-house / Outsourced / Part-time]</span></p>
				<p><strong>Fee:</strong> <span class="placeholder">₱[X]/month</span></p>
			</div>
		</div>
	</section>

	<section class="section">
		<h2>Staffing Summary</h2>
		<table class="staff-table">
			<thead>
				<tr>
					<th>Position</th>
					<th>Count</th>
					<th>Type</th>
					<th>Monthly Cost</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Caretaker</td>
					<td class="placeholder">1</td>
					<td class="placeholder">Full-time</td>
					<td class="placeholder">₱[X]</td>
				</tr>
				<tr>
					<td>Cleaner</td>
					<td class="placeholder">1</td>
					<td class="placeholder">Part-time</td>
					<td class="placeholder">₱[X]</td>
				</tr>
				<tr>
					<td>Bookkeeper</td>
					<td class="placeholder">1</td>
					<td class="placeholder">Outsourced</td>
					<td class="placeholder">₱[X]</td>
				</tr>
				<tr class="total-row">
					<td colspan="3"><strong>Total Monthly Labor Cost</strong></td>
					<td class="placeholder"><strong>₱[X]</strong></td>
				</tr>
			</tbody>
		</table>
	</section>

	<section class="section">
		<h2>Labor Compliance</h2>
		<div class="compliance-box">
			<ul>
				<li class="placeholder">Salary based on current minimum wage: ₱[X]/day</li>
				<li>13th month pay provided to all regular employees</li>
				<li class="placeholder">SSS/PhilHealth/Pag-IBIG contributions [if applicable]</li>
				<li class="placeholder">BMBE status: [Yes/No] - if yes, exempt from minimum wage</li>
			</ul>
		</div>
	</section>

	<section class="section">
		<h2>Emergency Contacts</h2>
		<table class="contact-table">
			<thead>
				<tr>
					<th>Role</th>
					<th>Name</th>
					<th>Contact</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Owner</td>
					<td class="placeholder">[Name]</td>
					<td class="placeholder">[Phone]</td>
				</tr>
				<tr>
					<td>Caretaker</td>
					<td class="placeholder">[Name]</td>
					<td class="placeholder">[Phone]</td>
				</tr>
				<tr>
					<td>Electrician</td>
					<td class="placeholder">[Name]</td>
					<td class="placeholder">[Phone]</td>
				</tr>
				<tr>
					<td>Plumber</td>
					<td class="placeholder">[Name]</td>
					<td class="placeholder">[Phone]</td>
				</tr>
			</tbody>
		</table>
	</section>
</article>

<style>
	.chapter { max-width: 800px; }
	.chapter-header { margin-bottom: 3rem; }
	.chapter-number { font-family: var(--font-header); font-size: 4rem; font-weight: 700; color: var(--color-primary); opacity: 0.3; line-height: 1; }
	.chapter-header h1 { font-size: 3rem; margin-top: 0.5rem; line-height: 1.1; }
	.section { margin-bottom: 3rem; }
	.section h2 { font-size: 1.5rem; margin-bottom: 1.5rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--color-gray-200); }
	.section h3 { font-size: 1.1rem; margin-bottom: 0.75rem; text-transform: none; }
	.placeholder { background: #fef3c7; padding: 0.25rem 0.5rem; border-left: 3px solid #f59e0b; }
	.org-chart { text-align: center; margin-bottom: 2rem; }
	.role { background: white; border: 2px solid var(--color-black); padding: 1rem 2rem; display: inline-block; margin-bottom: 1rem; }
	.role.owner { background: var(--color-black); color: white; }
	.role-title { display: block; font-weight: 700; font-family: var(--font-header); text-transform: uppercase; }
	.role-name { display: block; font-size: 0.9rem; opacity: 0.8; }
	.role-group { display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; }
	.role-card { background: var(--color-gray-100); padding: 1.5rem; margin-bottom: 1rem; border-left: 4px solid var(--color-primary); }
	.role-card h3 { margin-bottom: 1rem; }
	.role-card ul { margin: 0 0 1rem; padding-left: 1.5rem; }
	.role-card li { margin-bottom: 0.5rem; }
	.terms { background: white; padding: 1rem; margin-top: 1rem; border: 1px solid var(--color-gray-200); }
	.terms p { margin: 0.25rem 0; font-size: 0.95rem; }
	.staff-table, .contact-table { width: 100%; border-collapse: collapse; }
	.staff-table th, .staff-table td, .contact-table th, .contact-table td { padding: 1rem; border: 1px solid var(--color-gray-200); text-align: left; }
	.staff-table th, .contact-table th { background: var(--color-black); color: white; font-weight: 600; }
	.total-row { background: var(--color-gray-100); }
	.compliance-box { background: #dbeafe; border: 2px solid #3b82f6; padding: 1.5rem; }
	.compliance-box ul { margin: 0; padding-left: 1.5rem; }
	.compliance-box li { margin-bottom: 0.75rem; }
</style>
