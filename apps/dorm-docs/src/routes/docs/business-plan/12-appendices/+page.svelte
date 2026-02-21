<svelte:head>
	<title>12 Appendices - DA Tirol Dorm</title>
</svelte:head>

<script>
	const electricityPrompt = `Role: Property Billing Auditor
Task: Calculate the monthly electricity distribution for a building with two main meters and multiple sub-meters.

Variables to Request from User:
- kWh Rate: (Standard price per kWh)
- Main Meter Readings (Previous & Current): 2nd Floor Main, 3rd Floor Main
- Sub-Meter Readings (Previous & Current):
  - 2nd Floor: Rooms 1, 2, 3, 4, 5
  - 3rd Floor: Rooms 1, 2, 3, 4, 5, 6, 7
- Divisor: All rooms (12 total)

Calculation Logic:
1. Individual Consumption (C): Current Reading - Previous Reading
2. Room Base Cost: C × Rate
3. The "Gap" (Excess kWh):
   - 2nd Floor Excess (2B): (2nd Floor Main Consumption) - (Sum of 2nd Floor Room Consumptions)
   - 3rd Floor Excess (3B): (3rd Floor Main Consumption) - (Sum of 3rd Floor Room Consumptions)
4. Excess Share (ES): ((2B + 3B) × Rate) ÷ Divisor
5. Final Bill: (Room Consumption × Rate) + ES. Round to nearest whole number.

Output Format:
A clean list titled "ELECTRICITY BILLING [Month]" followed by each room and its final Peso amount.`;

	let copyStatus = 'Copy Prompt';

	function copyPrompt() {
		navigator.clipboard.writeText(electricityPrompt);
		copyStatus = 'Copied!';
		setTimeout(() => copyStatus = 'Copy Prompt', 2000);
	}
</script>

<article class="chapter">
	<header class="chapter-header">
		<span class="chapter-number">12</span>
		<h1>Appendices</h1>
	</header>

	<section class="section">
		<h2>Document Templates</h2>
		<div class="doc-list">
			<div class="doc-item">
				<span class="doc-icon">📄</span>
				<div class="doc-info">
					<h3>Contract of Lease</h3>
					<p>Standard lease agreement (6-month minimum term)</p>
				</div>
			</div>
			<div class="doc-item">
				<span class="doc-icon">📄</span>
				<div class="doc-info">
					<h3>Tenant Information Form</h3>
					<p>Tenant personal and emergency contact details</p>
				</div>
			</div>
			<div class="doc-item">
				<span class="doc-icon">📄</span>
				<div class="doc-info">
					<h3>Move-in/Move-out Checklist</h3>
					<p>Room condition checklist for inspections</p>
				</div>
			</div>
			<div class="doc-item">
				<span class="doc-icon">📄</span>
				<div class="doc-info">
					<h3>Maintenance Request Form</h3>
					<p>Standard repair/issue reporting form</p>
				</div>
			</div>
		</div>
	</section>

	<section class="section">
		<h2>Annex A: House Rules</h2>
		<p>The following rules are part of the <strong>Contract of Lease</strong> and must be followed by all tenants:</p>
		<div class="rules-list">
			<ol>
				<li><strong>Timely Rent Payment:</strong> The Tenant shall pay the rent on time as stipulated in the rental agreement.</li>
				<li><strong>Utility Payments:</strong> The Tenant is responsible for paying their utility bills on or before the due date.</li>
				<li><strong>Cleanliness and Maintenance:</strong> The Tenant shall keep their room and common areas clean and tidy, promptly report any necessary repairs to the landlord, and not withhold rent for incomplete repairs.</li>
				<li><strong>Residential Use:</strong> The premises shall be used exclusively for residential purposes.</li>
				<li><strong>Preservation of Property:</strong> The Tenant is prohibited from defacing or causing damage to the premises or any chattels. All issues or damage should be reported immediately.</li>
				<li><strong>Noise and Disturbances:</strong> The Tenant shall respect neighbors and other tenants by minimizing noise and disturbances.</li>
				<li><strong>Alterations:</strong> The Tenant shall not make alterations to the property without the landlord's written consent.</li>
				<li><strong>Lawful Conduct:</strong> The Tenant shall not engage in any unlawful activities on the premises.</li>
				<li><strong>End of Tenancy:</strong> Upon the tenancy's conclusion, the Tenant shall leave the room clean and tidy, remove all personal belongings, and dispose of any rubbish.</li>
				<li><strong>Return of Property:</strong> The Tenant shall return all keys and property-related items to the landlord at the end of the tenancy.</li>
				<li><strong>Liability for Damages:</strong> The Tenant shall be responsible for the full cost of damage caused by them or their guests, either intentionally or resulting from an act or omission that constitutes an imprisonable offense.</li>
				<li><strong>Guest Policy:</strong> Entry of guests into the room without prior notification to and permission from the landlord is prohibited. Overnight guests are allowed up to a <strong>5-day stay at ₱250/night</strong>. Any extended stay will be charged at the tenant's rate. Unauthorized guests may result in penalties for the tenant.</li>
				<li><strong>Shared Facilities:</strong> The Tenant shall use shared facilities (bathrooms, kitchens) responsibly and respectfully, leaving them clean and available for other tenants.</li>
				<li><strong>Safety, Security, and Curfew:</strong> Tenants must take reasonable measures to ensure safety and security. This includes locking doors and windows when away and promptly reporting any security concerns to the landlord. Gates should be closed when entering or leaving the premises. A <strong>curfew is in place from 10:00 PM</strong> to ensure the tranquility and security of all occupants.</li>
				<li><strong>Garbage Segregation:</strong> The Tenant shall segregate their garbage according to the waste management policy implemented in the rental property. The Tenant shall dispose of their segregated garbage in the designated trash bins or areas at the appropriate time to prevent pest infestation and maintain cleanliness.</li>
			</ol>
		</div>
		<p class="note">⚠️ Any violation of the house rules may result in penalties, property damage charges, or termination of the tenancy. Maximum of <strong>3 violations</strong> before automatic contract termination.</p>
	</section>

	<section class="section">
		<h2>Annex B: Fees & Penalties</h2>
		<p>All fees and surcharges must be paid in full by the last day of each month. Failure to do so will result in late fees and penalties.</p>
		<table class="penalty-table">
			<thead>
				<tr>
					<th>Situation</th>
					<th>Penalty</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><strong>Failure to Pay Utility Bills</strong></td>
					<td>Warning + 3-day grace period; then 5% of security deposit</td>
				</tr>
				<tr>
					<td><strong>Failure to Pay Rent</strong></td>
					<td>Warning + 3-day grace period; then 5% of security deposit</td>
				</tr>
				<tr>
					<td><strong>Property Damages (Minor)</strong></td>
					<td>Cost of repair or replacement</td>
				</tr>
				<tr>
					<td><strong>Property Damages (Major)</strong></td>
					<td>Cost of repair or replacement + up to 50% of monthly rent</td>
				</tr>
				<tr>
					<td><strong>Unauthorized Room Entry of Guests</strong></td>
					<td>₱50 fine per occurrence; 3 warnings = contract termination</td>
				</tr>
				<tr>
					<td><strong>Unpaid Utility Bills (After 15 Days)</strong></td>
					<td>Unpaid amount + up to 25% of monthly rent</td>
				</tr>
				<tr>
					<td><strong>Unpaid Rent (After 30 Days)</strong></td>
					<td>Contract termination and eviction + up to 100% of monthly rent</td>
				</tr>
				<tr>
					<td><strong>Early Termination (Before 6 Months)</strong></td>
					<td>Forfeiture of entire security deposit</td>
				</tr>
				<tr>
					<td><strong>Less than 30 Days Notice</strong></td>
					<td>Additional rent equivalent to one month or remaining balance</td>
				</tr>
				<tr>
					<td><strong>Cleaning Fee (Move-out)</strong></td>
					<td>Up to ₱200 if premises not left clean</td>
				</tr>
			</tbody>
		</table>
	</section>

	<section class="section">
		<h2>Legal Documents</h2>
		<table class="legal-table">
			<thead>
				<tr>
					<th>Document</th>
					<th>Status</th>
					<th>Location</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>DTI Registration</td>
					<td class="placeholder">[Active]</td>
					<td class="placeholder">[File location]</td>
				</tr>
				<tr>
					<td>Business Permit</td>
					<td class="placeholder">[Active]</td>
					<td class="placeholder">[File location]</td>
				</tr>
				<tr>
					<td>Fire Safety Certificate</td>
					<td class="placeholder">[Active]</td>
					<td class="placeholder">[File location]</td>
				</tr>
				<tr>
					<td>BIR Certificate of Registration</td>
					<td class="placeholder">[Active]</td>
					<td class="placeholder">[File location]</td>
				</tr>
				<tr>
					<td>Property Tax Receipts</td>
					<td class="placeholder">[Current]</td>
					<td class="placeholder">[File location]</td>
				</tr>
				<tr>
					<td>Land Title / Lease Contract</td>
					<td class="placeholder">[On file]</td>
					<td class="placeholder">[File location]</td>
				</tr>
			</tbody>
		</table>
	</section>

	<section class="section">
		<h2>Floor Plans & Photos</h2>
		<div class="media-grid">
			<div class="media-placeholder">
				<span>📐</span>
				<p class="placeholder">Ground Floor Plan</p>
			</div>
			<div class="media-placeholder">
				<span>📐</span>
				<p class="placeholder">2nd Floor Plan</p>
			</div>
			<div class="media-placeholder">
				<span>📷</span>
				<p class="placeholder">Building Exterior</p>
			</div>
			<div class="media-placeholder">
				<span>📷</span>
				<p class="placeholder">Sample Room Photos</p>
			</div>
		</div>
	</section>

	<section class="section">
		<h2>Contractor Directory</h2>
		<table class="contractor-table">
			<thead>
				<tr>
					<th>Service</th>
					<th>Name/Company</th>
					<th>Contact</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Electrician</td>
					<td class="placeholder">[Name]</td>
					<td class="placeholder">[Contact]</td>
				</tr>
				<tr>
					<td>Plumber</td>
					<td class="placeholder">[Name]</td>
					<td class="placeholder">[Contact]</td>
				</tr>
				<tr>
					<td>Carpenter</td>
					<td class="placeholder">[Name]</td>
					<td class="placeholder">[Contact]</td>
				</tr>
				<tr>
					<td>Pest Control</td>
					<td class="placeholder">[Company]</td>
					<td class="placeholder">[Contact]</td>
				</tr>
				<tr>
					<td>Aircon Technician</td>
					<td class="placeholder">[Name/Company]</td>
					<td class="placeholder">[Contact]</td>
				</tr>
			</tbody>
		</table>
	</section>

	<section class="section">
		<h2>Reference Materials</h2>
		<ul class="reference-list">
			<li class="placeholder">Local rental rate survey data</li>
			<li class="placeholder">Competitor pricing research</li>
			<li class="placeholder">Utility rate schedules ([Electric Coop], [Water District])</li>
			<li class="placeholder">Labor rate references (DOLE minimum wage orders)</li>
			<li class="placeholder">Tax reference materials (BIR percentage tax, income tax)</li>
		</ul>
	</section>

	<section class="section">
		<h2>Document Revision History</h2>
		<table class="revision-table">
			<thead>
				<tr>
					<th>Version</th>
					<th>Date</th>
					<th>Changes</th>
					<th>Author</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>1.0</td>
					<td class="placeholder">[Date]</td>
					<td>Initial document creation</td>
					<td class="placeholder">[Name]</td>
				</tr>
			</tbody>
		</table>
	</section>

	<section class="section">
		<h2>AI Prompts</h2>
		<p>Pre-written prompts for AI assistants to help with property management tasks.</p>
		
		<div class="prompt-card">
			<h3>🤖 Property Billing Auditor — Electricity</h3>
			<div class="prompt-content">
				<p><strong>Role:</strong> Property Billing Auditor</p>
				<p><strong>Task:</strong> Calculate the monthly electricity distribution for a building with two main meters and multiple sub-meters.</p>
				
				<h4>Variables to Request from User:</h4>
				<ul>
					<li><strong>kWh Rate:</strong> Standard price per kWh</li>
					<li><strong>Main Meter Readings (Previous & Current):</strong> 2nd Floor Main, 3rd Floor Main</li>
					<li><strong>Sub-Meter Readings (Previous & Current):</strong>
						<ul>
							<li>2nd Floor: Rooms 1, 2, 3, 4, 5</li>
							<li>3rd Floor: Rooms 1, 2, 3, 4, 5, 6, 7</li>
						</ul>
					</li>
					<li><strong>Divisor:</strong> All rooms (12 total)</li>
				</ul>
				
				<h4>Calculation Logic:</h4>
				<ol>
					<li><strong>Individual Consumption (C):</strong> Current Reading − Previous Reading</li>
					<li><strong>Room Base Cost:</strong> C × Rate</li>
					<li><strong>The "Gap" (Excess kWh):</strong>
						<ul>
							<li>2nd Floor Excess (2B): (2nd Floor Main Consumption) − (Sum of 2nd Floor Room Consumptions)</li>
							<li>3rd Floor Excess (3B): (3rd Floor Main Consumption) − (Sum of 3rd Floor Room Consumptions)</li>
						</ul>
					</li>
					<li><strong>Excess Share (ES):</strong> ((2B + 3B) × Rate) ÷ Divisor</li>
					<li><strong>Final Bill:</strong> (Room Consumption × Rate) + ES. Round to nearest whole number.</li>
				</ol>
				
				<h4>Output Format:</h4>
				<p>A clean list titled <code>ELECTRICITY BILLING [Month]</code> followed by each room and its final Peso amount.</p>
			</div>
			<button class="copy-btn" onclick={copyPrompt}>📋 {copyStatus}</button>
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
	.section h3 { font-size: 1rem; margin-bottom: 0.25rem; text-transform: none; }
	p { font-size: 1rem; line-height: 1.6; margin: 0; }
	.placeholder { background: #fef3c7; padding: 0.25rem 0.5rem; border-left: 3px solid #f59e0b; }
	.doc-list { display: grid; gap: 0.75rem; }
	.doc-item { display: flex; align-items: center; gap: 1rem; background: var(--color-gray-100); padding: 1rem 1.5rem; border-left: 4px solid var(--color-primary); }
	.doc-icon { font-size: 1.5rem; }
	.doc-info { flex: 1; }
	.doc-info p { font-size: 0.9rem; color: #71717a; }
	table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
	th, td { padding: 0.75rem 1rem; border: 1px solid var(--color-gray-200); text-align: left; font-size: 0.95rem; }
	th { background: var(--color-black); color: white; font-weight: 600; }
	.media-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
	@media (max-width: 600px) { .media-grid { grid-template-columns: 1fr; } }
	.media-placeholder { background: var(--color-gray-200); padding: 3rem; text-align: center; border: 2px dashed var(--color-gray-200); }
	.media-placeholder span { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
	.media-placeholder p { margin: 0; font-size: 0.9rem; }
	.reference-list { list-style: none; padding: 0; }
	.reference-list li { padding: 0.75rem 1rem; margin-bottom: 0.5rem; background: var(--color-gray-100); border-left: 3px solid var(--color-primary); }
	.rules-list { margin: 1rem 0 1.5rem; }
	.rules-list ol { padding-left: 1.5rem; }
	.rules-list li { margin-bottom: 1rem; line-height: 1.6; }
	.note { font-size: 0.95rem; color: #71717a; font-style: italic; background: #fef2f2; padding: 1rem; border-left: 4px solid #ef4444; margin-top: 1rem; }
	.penalty-table tbody tr:nth-child(even) { background: var(--color-gray-100); }

	/* AI Prompts */
	.prompt-card { background: var(--color-gray-100); border: 2px solid var(--color-primary); padding: 1.5rem; margin-top: 1.5rem; }
	.prompt-card h3 { margin-bottom: 1rem; font-size: 1.2rem; }
	.prompt-card h4 { margin: 1rem 0 0.5rem; font-size: 0.95rem; color: var(--color-primary); }
	.prompt-content { font-size: 0.95rem; line-height: 1.6; }
	.prompt-content ul, .prompt-content ol { padding-left: 1.5rem; margin: 0.5rem 0; }
	.prompt-content li { margin-bottom: 0.5rem; }
	.prompt-content code { background: #e0e7ff; padding: 0.2rem 0.4rem; border-radius: 3px; font-size: 0.9rem; }
	.copy-btn { margin-top: 1rem; background: var(--color-primary); color: white; border: none; padding: 0.75rem 1.5rem; font-weight: 600; cursor: pointer; border-radius: 4px; }
	.copy-btn:hover { opacity: 0.9; }
</style>
