<svelte:head>
	<title>13 App Specification - DA Tirol Dorm</title>
</svelte:head>

<article class="chapter">
	<header class="chapter-header">
		<span class="chapter-number">18</span>
		<h1>App Specification</h1>
	</header>

	<section class="section">
		<h2>Product Overview</h2>
		<p><strong>Product Name:</strong> Dorm Management App</p>
		<p><strong>Description:</strong> A comprehensive property management system designed to handle lease management, utility tracking, and monthly reporting. Focused on efficient utility sub-metering and financial transparency.</p>
		<div class="spec-card">
			<h3>Core Value Proposition</h3>
			<ul>
				<li><strong>Efficient Utility Tracking:</strong> Batch entry for electric/water readings with auto-calculation.</li>
				<li><strong>Financial Clarity:</strong> Automated monthly reports and bill generation.</li>
				<li><strong>Tenant Management:</strong> Organized lease tracking and payment monitoring.</li>
			</ul>
		</div>
	</section>

	<section class="section">
		<h2>MVP Features (Priority 1)</h2>
		<table class="spec-table">
			<thead>
				<tr>
					<th>Module</th>
					<th>Key Functionalities</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><strong>Utility Management</strong></td>
					<td>Batch reading entry, Anomaly detection (spikes), Rate configuration</td>
				</tr>
				<tr>
					<td><strong>Monthly Reporting</strong></td>
					<td>Floor-wise summaries, Occupancy tracking, Income vs Expense</td>
				</tr>
				<tr>
					<td><strong>Lease Management</strong></td>
					<td>Tenant registration, Room assignment, Payment tracking</td>
				</tr>
			</tbody>
		</table>
	</section>

	<section class="section">
		<h2>Technical Architecture</h2>
		<ul class="tech-stack">
			<li><strong>Frontend:</strong> Svelte 5 + SvelteKit + TailwindCSS</li>
			<li><strong>Backend:</strong> Supabase (PostgreSQL + Auth)</li>
			<li><strong>State:</strong> Svelte Stores (Runes) + SuperForms</li>
			<li><strong>Testing:</strong> Vitest (Unit) + Playwright (E2E)</li>
		</ul>
		
		<h3>Performance Optimizations</h3>
		<div class="spec-card">
			<ul>
				<li><strong>Caching Strategy:</strong>
					<ul>
						<li>Client-side Data Cache (TTL-based)</li>
						<li>Cached Supabase Client for read-heavy queries</li>
						<li>Service Worker for static asset caching</li>
					</ul>
				</li>
				<li><strong>Lazy Loading:</strong> "Skeleton" loading pattern for heavy routes (e.g., Tenants list) to ensure instant navigation.</li>
				<li><strong>Route Optimization:</strong> Intelligent route prefetching based on user behavior.</li>
			</ul>
		</div>

		<h3>Database Schema Highlights</h3>
		<p>The system uses a robust PostgreSQL schema with Row Level Security (RLS).</p>
		<div class="code-block">
			<pre><code>
// Core Entities
properties (id, name, address, type, status)
rental_unit (id, property_id, name, capacity, status, base_rate)
tenants (id, name, contact_info, status, profile_picture)

// Lease Management
leases (id, rental_unit_id, start_date, end_date, rent_amount, security_deposit)
lease_tenants (id, lease_id, tenant_id) // Many-to-Many link

// Financials
billings (
  id, lease_id, type [RENT, UTILITY, PENALTY], 
  amount, paid_amount, balance, status, due_date
)
payments (
  id, amount, method, paid_by, billing_ids[], 
  status, receipt_url
)

// Utility Management
meters (id, name, type [ELECTRICITY, WATER], relation_id)
readings (id, meter_id, reading, date, consumption)
			</code></pre>
		</div>
	</section>

	<section class="section">
		<h2>Security & Permissions</h2>
		<div class="spec-card">
			<h3>Role-Based Access Control (RBAC)</h3>
			<ul>
				<li><strong>Super Admin:</strong> Full system access, Organization management.</li>
				<li><strong>Property Admin:</strong> Full access to specific properties and staff management.</li>
				<li><strong>Property Staff:</strong>
					<ul>
						<li><em>Manager:</em> View/Update leases, billings, tenants.</li>
						<li><em>Frontdesk:</em> View/Create bookings, payments.</li>
						<li><em>Maintenance:</em> View/Update maintenance tickets.</li>
						<li><em>Utility:</em> Input meter readings.</li>
					</ul>
				</li>
				<li><strong>Tenant:</strong> Read-only access to own profile, lease, and billings.</li>
			</ul>
			<h3>Row Level Security (RLS)</h3>
			<p>Database policies enforce strict data isolation. Tenants can strictly only query rows linked to their own <code>auth.uid</code>.</p>
		</div>
	</section>

	<section class="section">
		<h2>User Flows</h2>
		<div class="flow-card">
			<h3>Utility Reading Process</h3>
			<ol>
				<li>Admin selects Property & Utility Type (Electric/Water).</li>
				<li>System presents Batch Entry Table for all active rooms.</li>
				<li>Admin inputs current readings (system auto-calculates consumption).</li>
				<li>System flags anomalies (>20% variance).</li>
				<li>Admin confirms and saves. Bills are generated.</li>
			</ol>
		</div>
	</section>

	<section class="section">
		<h2>SOP: Data Integrity & Backup</h2>
		<div class="spec-card" style="border-left-color: #ef4444;">
			<h3>📉 Fallback Protocol (System Offline)</h3>
			<p><strong>Trigger:</strong> Internet outage or Server downtime prevent access to the App.</p>
			<ol>
				<li><strong>Activate Manual Logs:</strong> Caretaker immediately retrieves "Emergency Printable Logs" (Chapter 13).</li>
				<li><strong>Physical Recording:</strong>
					<ul>
						<li>All meter readings written on "Utility Log Sheet".</li>
						<li>All payments issued a physical "Acknowledgement Receipt".</li>
					</ul>
				</li>
				<li><strong>Data Recovery (Post-Outage):</strong>
					<ul>
						<li><strong>Within 24 Hours:</strong> Admin manually encodes all physical logs into the App once online.</li>
						<li><strong>Mark as "Backdated":</strong> Add a note in the system "Entry delayed due to outage".</li>
					</ul>
				</li>
			</ol>
		</div>
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
	
	.spec-card, .flow-card { background: var(--color-gray-100); padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 1rem; border-left: 4px solid var(--color-primary); }
	.spec-card ul, .flow-card ol { margin: 0; padding-left: 1.5rem; }
	.spec-card li, .flow-card li { margin-bottom: 0.5rem; }

	.spec-table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
	.spec-table th, .spec-table td { padding: 1rem; border: 1px solid var(--color-gray-200); text-align: left; }
	.spec-table th { background: var(--color-black); color: white; }

	.tech-stack { list-style: none; padding: 0; display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
	.tech-stack li { background: var(--color-primary); color: white; padding: 0.5rem 1rem; border-radius: 2rem; font-weight: 600; font-size: 0.9rem; }

	.code-block { background: #1e1e1e; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; color: #d4d4d4; font-family: monospace; }
</style>
