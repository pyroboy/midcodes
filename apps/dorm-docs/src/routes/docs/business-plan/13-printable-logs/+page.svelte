<svelte:head>
	<title>13 Printable Logs - DA Tirol Dorm</title>
</svelte:head>

<article class="chapter">
	<header class="chapter-header">
		<span class="chapter-number">13</span>
		<h1>Printable Logs</h1>
	</header>

	<section class="section">
		<h2>Monthly Logs</h2>
		<div class="link-grid">
			<a href="/docs/business-plan/13-printable-logs/tenant-payment-log" class="link-card">
				<div class="card-icon">📊</div>
				<div class="card-content">
					<h3>Monthly Tenant Payment Log</h3>
					<p>Printable checklist for tracking rent and electricity payments for all occupants.</p>
					<span class="fake-link">Open Log →</span>
				</div>
			</a>
		</div>
	</section>

	<section class="section">
		<h2>Daily Visitor Log</h2>
		<div class="printable-form">
			<div class="form-header">
				<h3>Visitor Usage Log</h3>
				<span class="date-field">Date: _________________</span>
			</div>
			<table class="log-table">
				<thead>
					<tr>
						<th>Time In</th>
						<th>Visitor Name</th>
						<th>Visit Purpose/Tenant</th>
						<th>ID Presented</th>
						<th>Time Out</th>
						<th>Signature</th>
					</tr>
				</thead>
				<tbody>
					{#each Array(10) as _}
					<tr>
						<td>&nbsp;</td>
						<td>&nbsp;</td>
						<td>&nbsp;</td>
						<td>&nbsp;</td>
						<td>&nbsp;</td>
						<td>&nbsp;</td>
					</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section class="section">
		<h2>Key Borrowing Log</h2>
		<div class="printable-form">
			<div class="form-header">
				<h3>Key Management Log</h3>
			</div>
			<table class="log-table">
				<thead>
					<tr>
						<th>Date</th>
						<th>Key / Room</th>
						<th>Borrower Name</th>
						<th>Reason</th>
						<th>Time Out</th>
						<th>Time In</th>
						<th>Issued By</th>
					</tr>
				</thead>
				<tbody>
					{#each Array(5) as _}
					<tr>
						<td>&nbsp;</td>
						<td>&nbsp;</td>
						<td>&nbsp;</td>
						<td>&nbsp;</td>
						<td>&nbsp;</td>
						<td>&nbsp;</td>
						<td>&nbsp;</td>
					</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section class="section">
		<h2>Incident Report Form</h2>
		<div class="printable-form incident-form">
			<h3>Incident Report</h3>
			<div class="form-row">
				<div class="field">
					<span class="label">Date of Incident:</span>
					<span class="line">_______________________</span>
				</div>
				<div class="field">
					<span class="label">Time:</span>
					<span class="line">_______________________</span>
				</div>
			</div>
			<div class="form-row">
				<div class="field full">
					<span class="label">Location:</span>
					<span class="line">________________________________________________</span>
				</div>
			</div>
			<div class="form-row">
				<div class="field full">
					<span class="label">Involved Parties:</span>
					<span class="line">__________________________________________</span>
				</div>
			</div>
			<div class="field-block">
				<span class="label">Description of Incident:</span>
				<div class="box-area"></div>
			</div>
			<div class="field-block">
				<span class="label">Action Taken:</span>
				<div class="box-area"></div>
			</div>
			<div class="form-row bottom">
				<div class="field">
					<span class="label">Reported By:</span>
					<span class="line">_______________________</span>
				</div>
				<div class="field">
					<span class="label">Received By:</span>
					<span class="line">_______________________</span>
				</div>
			</div>
		</div>
	</section>

	<section class="section">
		<h2>Material Gate Pass</h2>
		<div class="printable-form gate-pass">
			<div class="pass-header">
				<h3>GATE PASS</h3>
				<span class="pass-no">No: _______</span>
			</div>
			<div class="form-row">
				<div class="field">
					<span class="label">Date:</span>
					<span class="line">_________________</span>
				</div>
				<div class="field">
					<span class="label">Tenant/Bearer:</span>
					<span class="line">_________________</span>
				</div>
			</div>
			<table class="log-table small">
				<thead>
					<tr>
						<th>Qty</th>
						<th>Item Description</th>
						<th>Remarks</th>
					</tr>
				</thead>
				<tbody>
					{#each Array(5) as _}
					<tr>
						<td>&nbsp;</td>
						<td>&nbsp;</td>
						<td>&nbsp;</td>
					</tr>
					{/each}
				</tbody>
			</table>
			<div class="form-row bottom">
				<div class="field">
					<span class="label">Authorized By:</span>
					<span class="line">_________________</span>
				</div>
				<div class="field">
					<span class="label">Guard/Caretaker:</span>
					<span class="line">_________________</span>
				</div>
			</div>
		</div>
	</section>
</article>

<style>
	.chapter { max-width: 800px; }
	.chapter-header { margin-bottom: 3rem; }
	.chapter-number { font-family: var(--font-header); font-size: 4rem; font-weight: 700; color: var(--color-primary); opacity: 0.3; line-height: 1; }
	.chapter-header h1 { font-size: 3rem; margin-top: 0.5rem; line-height: 1.1; }
	.section { margin-bottom: 3rem; page-break-inside: avoid; }
	.section h2 { font-size: 1.5rem; margin-bottom: 1.5rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--color-gray-200); }
	
	.printable-form {
		background: white;
		border: 1px solid var(--color-black);
		padding: 2rem;
		margin-bottom: 2rem;
	}

	.form-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 1rem;
	}

	.form-header h3 { margin: 0; text-transform: uppercase; }

	.log-table {
		width: 100%;
		border-collapse: collapse;
	}

	.log-table th, .log-table td {
		border: 1px solid var(--color-black);
		padding: 0.5rem;
		text-align: left;
		font-size: 0.9rem;
	}

	.log-table th {
		background: var(--color-gray-100);
		font-weight: 600;
	}

	.log-table td { height: 2rem; }

	.incident-form { padding: 3rem; }
	.incident-form h3 { text-align: center; margin-bottom: 2rem; font-size: 1.5rem; }
	
	.form-row { display: flex; gap: 2rem; margin-bottom: 1.5rem; }
	.field { display: flex; align-items: baseline; gap: 0.5rem; white-space: nowrap; }
	.field.full { width: 100%; }
	.field .line { border-bottom: 1px solid black; flex-grow: 1; min-width: 150px; }
	.field-block { margin-bottom: 1.5rem; }
	.field-block .label { display: block; margin-bottom: 0.5rem; font-weight: 600; }
	.box-area { border: 1px solid var(--color-black); height: 100px; width: 100%; }
	
	.gate-pass { max-width: 500px; margin: 0 auto; border: 2px dashed var(--color-black); }
	.pass-header { display: flex; justify-content: space-between; margin-bottom: 1.5rem; border-bottom: 2px solid var(--color-black); padding-bottom: 0.5rem; }
	.gate-pass .log-table.small th, .gate-pass .log-table.small td { padding: 0.25rem; font-size: 0.85rem; }

	.link-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.link-card {
		display: flex;
		gap: 1rem;
		padding: 1.5rem;
		background: white;
		border: 2px solid var(--color-black);
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
	}

	.link-card:hover {
		transform: translateY(-2px);
		box-shadow: 4px 4px 0 var(--color-black);
	}

	.card-icon {
		font-size: 2rem;
	}

	.card-content h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.1rem;
		font-weight: 700;
		text-transform: uppercase;
	}

	.card-content p {
		margin: 0 0 1rem 0;
		font-size: 0.9rem;
		color: #555;
		line-height: 1.4;
	}

	.fake-link {
		font-weight: 600;
		color: var(--color-primary);
		font-size: 0.9rem;
	}
</style>
