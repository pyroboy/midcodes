<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';
	import { FileText, Download, Plus, Trash2, Eye, EyeOff } from '@lucide/svelte';

	// --- Form State ---
	let clientName = $state('');
	let clientOrg = $state('');
	let contactPerson = $state('');
	let contactEmail = $state('');
	let contactPhone = $state('');
	let proposalDate = $state(new Date().toISOString().split('T')[0]);
	let validityDays = $state(15);

	// Line items
	let lineItems = $state<
		Array<{
			description: string;
			detail: string;
			qty: number;
			unitPrice: number;
			waived: boolean;
		}>
	>([
		{
			description: 'Smart Student ID (PVC + QR)',
			detail: 'Includes: Lanyard, Case, Design, Layout',
			qty: 500,
			unitPrice: 150,
			waived: false
		},
		{
			description: 'On-Site Data Capture',
			detail: 'Professional photography setup for 2 days.',
			qty: 1,
			unitPrice: 5000,
			waived: false
		},
		{
			description: 'Kanaya Database Setup',
			detail: 'Data migration, cleaning, and cloud setup.',
			qty: 1,
			unitPrice: 10000,
			waived: true
		}
	]);

	// Payment terms
	let downpaymentPercent = $state(50);

	// UI state
	let showForm = $state(true);
	let generating = $state(false);

	// --- Derived ---
	let subtotal = $derived(
		lineItems.reduce((sum, item) => sum + (item.waived ? 0 : item.qty * item.unitPrice), 0)
	);
	let downpaymentAmount = $derived(Math.round(subtotal * (downpaymentPercent / 100)));
	let balanceAmount = $derived(subtotal - downpaymentAmount);

	let displayClientName = $derived(clientName || '[Client Name]');
	let displayClientOrg = $derived(clientOrg || '[School/Company Name]');

	// --- Actions ---
	function addLineItem() {
		lineItems = [
			...lineItems,
			{ description: '', detail: '', qty: 1, unitPrice: 0, waived: false }
		];
	}

	function removeLineItem(index: number) {
		lineItems = lineItems.filter((_, i) => i !== index);
	}

	function formatCurrency(amount: number): string {
		return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

	async function downloadPdf() {
		generating = true;
		try {
			const payload = {
				clientName: displayClientName,
				clientOrg: displayClientOrg,
				contactPerson,
				contactEmail,
				contactPhone,
				proposalDate,
				validityDays,
				downpaymentPercent,
				lineItems: lineItems.map((item) => ({
					description: item.description,
					detail: item.detail,
					qty: item.qty,
					unitPrice: item.unitPrice,
					waived: item.waived
				}))
			};

			const res = await fetch('/api/proposal/export', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!res.ok) throw new Error('PDF generation failed');

			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			const safeName = (clientOrg || clientName || 'client').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
			a.download = `kanaya-proposal-${safeName}-${proposalDate}.pdf`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (err) {
			console.error('PDF export failed:', err);
			alert('Failed to generate PDF. Please try again.');
		} finally {
			generating = false;
		}
	}
</script>

<svelte:head>
	<title>Proposal Generator | Kanaya Admin</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-6 pb-12">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">Proposal Generator</h1>
			<p class="text-muted-foreground">Generate client proposals with live preview and PDF export</p>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="outline" size="sm" onclick={() => (showForm = !showForm)}>
				{#if showForm}
					<EyeOff class="h-4 w-4 mr-2" />
					Hide Form
				{:else}
					<Eye class="h-4 w-4 mr-2" />
					Show Form
				{/if}
			</Button>
			<Button onclick={downloadPdf} disabled={generating}>
				<Download class="h-4 w-4 mr-2" />
				{generating ? 'Generating...' : 'Download PDF'}
			</Button>
		</div>
	</div>

	<!-- Form Section -->
	{#if showForm}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<!-- Client Details -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<FileText class="h-5 w-5" />
						Client Details
					</CardTitle>
					<CardDescription>Who is this proposal for?</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div>
						<Label for="clientOrg">Organization / School Name</Label>
						<Input id="clientOrg" bind:value={clientOrg} placeholder="e.g. Holy Name University" />
					</div>
					<div>
						<Label for="clientName">Client Name / Decision Maker</Label>
						<Input id="clientName" bind:value={clientName} placeholder="e.g. Dr. Francisco Rojas" />
					</div>
					<div>
						<Label for="contactPerson">Contact Person</Label>
						<Input id="contactPerson" bind:value={contactPerson} placeholder="e.g. Ma'am Rosie, Registrar" />
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<Label for="contactEmail">Email</Label>
							<Input id="contactEmail" type="email" bind:value={contactEmail} placeholder="registrar@hnu.edu.ph" />
						</div>
						<div>
							<Label for="contactPhone">Phone</Label>
							<Input id="contactPhone" bind:value={contactPhone} placeholder="0917-XXX-XXXX" />
						</div>
					</div>
				</CardContent>
			</Card>

			<!-- Proposal Settings -->
			<Card>
				<CardHeader>
					<CardTitle>Proposal Settings</CardTitle>
					<CardDescription>Date, validity, and payment terms</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="grid grid-cols-2 gap-4">
						<div>
							<Label for="proposalDate">Proposal Date</Label>
							<Input id="proposalDate" type="date" bind:value={proposalDate} />
						</div>
						<div>
							<Label for="validityDays">Valid For (days)</Label>
							<Input id="validityDays" type="number" min="1" bind:value={validityDays} />
						</div>
					</div>
					<div>
						<Label for="downpayment">Downpayment (%)</Label>
						<Input id="downpayment" type="number" min="0" max="100" bind:value={downpaymentPercent} />
					</div>
					<div class="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
						<div class="flex justify-between">
							<span>Subtotal:</span>
							<strong>{formatCurrency(subtotal)}</strong>
						</div>
						<div class="flex justify-between">
							<span>Downpayment ({downpaymentPercent}%):</span>
							<strong>{formatCurrency(downpaymentAmount)}</strong>
						</div>
						<div class="flex justify-between border-t pt-2">
							<span>Balance on delivery:</span>
							<strong>{formatCurrency(balanceAmount)}</strong>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Line Items -->
		<Card>
			<CardHeader>
				<div class="flex items-center justify-between">
					<div>
						<CardTitle>Line Items</CardTitle>
						<CardDescription>Products and services included in this proposal</CardDescription>
					</div>
					<Button variant="outline" size="sm" onclick={addLineItem}>
						<Plus class="h-4 w-4 mr-2" />
						Add Item
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<div class="space-y-3">
					{#each lineItems as item, index}
						<div class="flex items-start gap-3 p-3 border rounded-lg">
							<div class="flex-1 grid grid-cols-1 md:grid-cols-6 gap-3">
								<div class="md:col-span-2">
									<Label>Description</Label>
									<Input bind:value={item.description} placeholder="Item name" />
								</div>
								<div class="md:col-span-2">
									<Label>Detail</Label>
									<Input bind:value={item.detail} placeholder="Additional detail" />
								</div>
								<div>
									<Label>Qty</Label>
									<Input type="number" min="1" bind:value={item.qty} />
								</div>
								<div>
									<Label>Unit Price (₱)</Label>
									<Input type="number" min="0" bind:value={item.unitPrice} />
								</div>
							</div>
							<div class="flex flex-col items-end gap-1 pt-6">
								<span class="text-sm font-semibold whitespace-nowrap">
									{#if item.waived}
										<span class="line-through text-red-400">{formatCurrency(item.qty * item.unitPrice)}</span>
										<span class="text-green-600 ml-1">WAIVED</span>
									{:else}
										{formatCurrency(item.qty * item.unitPrice)}
									{/if}
								</span>
								<div class="flex items-center gap-1">
									<label class="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer">
										<input type="checkbox" bind:checked={item.waived} class="rounded" />
										Waive
									</label>
									<Button variant="ghost" size="sm" onclick={() => removeLineItem(index)}>
										<Trash2 class="h-3 w-3 text-red-500" />
									</Button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	{/if}

	<!-- ======================= LIVE PROPOSAL PREVIEW ======================= -->
	<div class="proposal-preview">
		<div class="docs-container">
			<header class="docs-header">
				<div class="header-top">
					<h1>Formal Project Proposal</h1>
					<span class="badge">Kanaya Identity Solutions</span>
				</div>
				<p class="meta">Date: {proposalDate} &bull; Valid for {validityDays} days</p>
			</header>

			<nav class="toc">
				<h2>Proposal Sections</h2>
				<ol>
					<li><a href="#cover">1. Executive Summary (The "Why")</a></li>
					<li><a href="#technical">2. Technical Proposal (The "What")</a></li>
					<li><a href="#financial">3. Financial Investment (The "How Much")</a></li>
					<li><a href="#timeline">4. Rollout Timeline (The "When")</a></li>
				</ol>
			</nav>

			<section id="cover">
				<h2>1. Executive Summary</h2>
				<div class="paper-doc">
					<h3>Project: Digital Identity & Campus Safety Upgrade</h3>
					<p><strong>Prepared For:</strong> {displayClientOrg}</p>
					<p><strong>Prepared By:</strong> Kanaya Identity Solutions</p>
					{#if contactPerson}
						<p><strong>Attention:</strong> {contactPerson}</p>
					{/if}
					<br />
					<h4>The Challenge</h4>
					<p>
						Current identification systems at <strong>{displayClientOrg}</strong> are static,
						easily counterfeited, and disconnected from modern safety protocols. A lost ID poses
						a security risk and requires days to replace, leaving the facility vulnerable.
					</p>

					<h4>The Kanaya Solution</h4>
					<p>
						We propose the implementation of the <strong>Kanaya Digital Identity Ecosystem</strong
						>. Unlike traditional PVC printing, our solution integrates physical durability with
						cloud-based verification. This ensures:
					</p>
					<ul>
						<li>
							<strong>Instant Verification:</strong> Guards can scan IDs via NFC/QR to verify active
							status.
						</li>
						<li>
							<strong>Anti-Fraud:</strong> Proprietary "Ghost Image" and Encrypted Data layers.
						</li>
						<li><strong>Rapid Issuance:</strong> Lost cards replaced in under 2 hours.</li>
					</ul>
				</div>
			</section>

			<section id="technical">
				<h2>2. Technical Specifications</h2>
				<div class="paper-doc">
					<h3>2.1 The Physical Credential</h3>
					<table class="spec-table">
						<tbody>
							<tr>
								<td><strong>Material Construction</strong></td>
								<td>3-Layer Fused PVC (Sandwich Type) - Non-fading.</td>
							</tr>
							<tr>
								<td><strong>Dimensions</strong></td>
								<td>CR-80 (85.60 x 53.98 mm) - ISO Standard 7810.</td>
							</tr>
							<tr>
								<td><strong>Smart Chip</strong></td>
								<td>NXP Mifare 1K EV1 (13.56 MHz) - <em>[Optional Upsell]</em>.</td>
							</tr>
							<tr>
								<td><strong>Data Encoding</strong></td>
								<td>AES-128 Encrypted UID linked to Kanaya Cloud.</td>
							</tr>
						</tbody>
					</table>

					<h3>2.2 The Digital Platform (SaaS)</h3>
					<p>
						The contract includes access to the <strong>Kanaya Admin Dashboard</strong>,
						allowing {displayClientOrg} to:
					</p>
					<ul>
						<li>Deactivate lost/stolen cards instantly.</li>
						<li>View real-time entry logs (if scanning is enabled).</li>
						<li>Batch export student data for DepEd/CHED compliance.</li>
					</ul>
				</div>
			</section>

			<section id="financial">
				<h2>3. Financial Proposal</h2>
				<div class="paper-doc">
					<h3>Option A: The "Secure Campus" Package (Recommended)</h3>
					<table class="finance-table">
						<thead>
							<tr>
								<th>Item Description</th>
								<th>Qty</th>
								<th>Unit Price</th>
								<th>Total</th>
							</tr>
						</thead>
						<tbody>
							{#each lineItems as item}
								<tr>
									<td>
										<strong>{item.description || 'Unnamed Item'}</strong>
										{#if item.detail}<br /><small>{item.detail}</small>{/if}
									</td>
									<td>{item.qty.toLocaleString()}</td>
									<td>{formatCurrency(item.unitPrice)}</td>
									<td>
										{#if item.waived}
											<span style="text-decoration: line-through; color: red;"
												>{formatCurrency(item.qty * item.unitPrice)}</span
											><br /><strong>WAIVED</strong>
										{:else}
											{formatCurrency(item.qty * item.unitPrice)}
										{/if}
									</td>
								</tr>
							{/each}
							<tr class="total-row">
								<td colspan="3"><strong>GRAND TOTAL</strong></td>
								<td><strong>{formatCurrency(subtotal)}</strong></td>
							</tr>
						</tbody>
					</table>

					<h3>Payment Terms (Strict)</h3>
					<ul>
						<li>
							<strong>{downpaymentPercent}% Downpayment</strong> ({formatCurrency(downpaymentAmount)})
							required upon contract signing to commence production.
						</li>
						<li>
							<strong>{100 - downpaymentPercent}% Balance</strong> ({formatCurrency(balanceAmount)})
							due upon delivery of the first batch (or Full Delivery).
						</li>
						<li>
							<strong>Validity:</strong> This quote is valid for {validityDays} days.
						</li>
					</ul>
				</div>
			</section>

			<section id="timeline">
				<h2>4. Execution Timeline (The "Batch" Plan)</h2>
				<div class="timeline-box">
					<div class="event">
						<div class="day">Day 1</div>
						<div class="desc">
							<strong>Contract Signing & Downpayment.</strong><br />Mobilization of materials.
						</div>
					</div>
					<div class="event">
						<div class="day">Day 2-3</div>
						<div class="desc">
							<strong>Data Capture / Photo Session.</strong><br />On-site team takes student
							photos by section.
						</div>
					</div>
					<div class="event">
						<div class="day">Day 4-6</div>
						<div class="desc">
							<strong>Production Phase (Batch 1).</strong><br />Printing, Laminating, and Curing.
						</div>
					</div>
					<div class="event">
						<div class="day">Day 7</div>
						<div class="desc">
							<strong>Delivery & Turnover.</strong><br />Testing of QR/NFC codes with School Admin.
						</div>
					</div>
				</div>
			</section>

			{#if contactPerson || contactEmail || contactPhone}
				<section>
					<h2>Contact Information</h2>
					<div class="paper-doc">
						<p><strong>Kanaya Identity Solutions</strong></p>
						<p>Arjo Magno, CEO</p>
						{#if contactPerson}
							<p>Prepared for: {contactPerson}, {displayClientOrg}</p>
						{/if}
						{#if contactEmail}
							<p>Email: {contactEmail}</p>
						{/if}
						{#if contactPhone}
							<p>Phone: {contactPhone}</p>
						{/if}
					</div>
				</section>
			{/if}

			<footer class="docs-footer">
				<p>Kanaya Identity Solutions &bull; Confidential Proposal &bull; {proposalDate}</p>
			</footer>
		</div>
	</div>
</div>

<style>
	/* Proposal Preview Styling */
	.proposal-preview {
		border: 2px solid #e2e8f0;
		border-radius: 12px;
		overflow: hidden;
		background: white;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
	}

	.docs-container {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem;
		font-family: 'Times New Roman', serif;
		color: #1a202c;
	}

	.docs-header {
		font-family: 'Segoe UI', sans-serif;
		border-bottom: 4px solid #2b6cb0;
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
	}
	.header-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}
	.docs-header h1 {
		color: #2c5282;
		margin: 0;
		font-size: 2rem;
	}
	.badge {
		background: #2b6cb0;
		color: white;
		padding: 0.3rem 0.8rem;
		border-radius: 4px;
		font-weight: bold;
		font-size: 0.8rem;
		font-family: sans-serif;
		text-transform: uppercase;
	}
	.meta {
		color: #718096;
		font-family: sans-serif;
		margin-top: 0.5rem;
	}

	.toc {
		background: #ebf8ff;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 3rem;
		border: 1px solid #bee3f8;
		font-family: 'Segoe UI', sans-serif;
	}
	.toc h2 {
		margin: 0 0 1rem;
		font-size: 1.2rem;
		color: #2c5282;
		border: none;
		padding: 0;
	}
	.toc ol {
		padding-left: 1.5rem;
	}
	.toc a {
		text-decoration: none;
		color: #2b6cb0;
		font-weight: 600;
	}

	.paper-doc {
		background: white;
		padding: 3rem;
		border: 1px solid #d1d5db;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
		margin-bottom: 2rem;
	}
	.paper-doc h3 {
		margin-top: 0;
		border-bottom: 2px solid #000;
		padding-bottom: 0.5rem;
		margin-bottom: 1.5rem;
		text-transform: uppercase;
		letter-spacing: 1px;
	}
	.paper-doc h4 {
		margin-bottom: 0.5rem;
		font-size: 1.1rem;
		color: #444;
		text-transform: uppercase;
	}
	.paper-doc p {
		font-size: 1.05rem;
		line-height: 1.6;
		margin-bottom: 1rem;
	}
	.paper-doc ul {
		margin-bottom: 1rem;
	}

	.spec-table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 1.5rem;
	}
	.spec-table td {
		border: 1px solid #000;
		padding: 10px;
		vertical-align: top;
	}
	.spec-table td:first-child {
		background: #f3f4f6;
		font-weight: bold;
		width: 30%;
	}

	.finance-table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 1.5rem;
	}
	.finance-table th {
		background: #1f2937;
		color: white;
		padding: 10px;
		text-align: left;
		text-transform: uppercase;
		font-size: 0.9rem;
	}
	.finance-table td {
		border: 1px solid #d1d5db;
		padding: 10px;
	}
	.total-row {
		background: #f3f4f6;
		font-size: 1.1rem;
	}

	.timeline-box {
		border-left: 4px solid #2b6cb0;
		padding-left: 2rem;
		margin-left: 1rem;
	}
	.event {
		margin-bottom: 1.5rem;
		position: relative;
	}
	.event::before {
		content: '';
		width: 16px;
		height: 16px;
		background: #2b6cb0;
		border-radius: 50%;
		position: absolute;
		left: -42px;
		top: 4px;
		border: 3px solid white;
		box-shadow: 0 0 0 1px #2b6cb0;
	}
	.day {
		font-weight: bold;
		color: #2b6cb0;
		margin-bottom: 0.3rem;
		font-family: 'Segoe UI', sans-serif;
	}
	.desc {
		font-size: 1rem;
		color: #333;
	}

	section {
		margin-bottom: 4rem;
	}
	h2 {
		font-family: 'Segoe UI', sans-serif;
		font-size: 1.6rem;
		color: #2d3748;
		border-left: 5px solid #2b6cb0;
		padding-left: 1rem;
		margin-bottom: 1.5rem;
	}

	.docs-footer {
		font-family: 'Segoe UI', sans-serif;
		margin-top: 4rem;
		text-align: center;
		color: #a0aec0;
		border-top: 1px solid #e2e8f0;
		padding-top: 2rem;
	}
</style>
