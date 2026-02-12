<svelte:head>
	<title>06 Operations - DA Tirol Dorm</title>
</svelte:head>

<article class="chapter">
	<header class="chapter-header">
		<span class="chapter-number">06</span>
		<h1>Operations</h1>
	</header>

	<section class="section">
		<h2>Daily Operations</h2>
		<div class="schedule">
			<div class="schedule-item">
				<span class="time">6:00 AM</span>
				<p>Morning inspection and common area check</p>
			</div>
			<div class="schedule-item">
				<span class="time">8:00 AM</span>
				<p>Office opens, tenant inquiries</p>
			</div>
			<div class="schedule-item">
				<span class="time">12:00 PM</span>
				<p>Midday walkthrough</p>
			</div>
			<div class="schedule-item">
				<span class="time">6:00 PM</span>
				<p>Evening security check</p>
			</div>
			<div class="schedule-item">
				<span class="time">10:00 PM</span>
				<p><strong>Gate closure and curfew</strong> (per Contract of Lease)</p>
			</div>
		</div>
	</section>

	<section class="section">
		<h2>Tenant Onboarding</h2>
		<div class="process-steps">
			<div class="step">
				<span class="step-num">1</span>
				<h3>Inquiry & Viewing</h3>
				<p>Schedule property tour, explain rates (₱2,000/bedspace) and inclusions</p>
			</div>
			<div class="step">
				<span class="step-num">2</span>
				<h3>Application</h3>
				<p>Submit valid ID, complete tenant information form</p>
			</div>
			<div class="step">
				<span class="step-num">3</span>
				<h3>Initial Payment</h3>
				<p><strong>1-month security deposit + 1-month advance rent</strong> (non-refundable, consumable)</p>
			</div>
			<div class="step">
				<span class="step-num">4</span>
				<h3>Contract Signing</h3>
				<p>Review and sign Contract of Lease (<strong>minimum 6-month term</strong>)</p>
			</div>
			<div class="step">
				<span class="step-num">5</span>
				<h3>Move-in</h3>
				<p>Room assignment, key handover, orientation on House Rules (Annex A)</p>
			</div>
		</div>
	</section>

	<section class="section">
		<h2>Community & Communication</h2>
		<div class="communication-channels">
			<div class="channel-card">
				<h3>📢 Official Announcements</h3>
				<p><strong>Primary Channel: Facebook Messenger Group Chat</strong></p>
				<p>All official notices regarding utility interruptions, policy updates, and general announcements are broadcast via the official tenant group chat.</p>
				<ul>
					<li>Admins only can post official announcements (if restricted).</li>
					<li>"Seen" feature is used to verify receipt.</li>
				</ul>
			</div>
			<div class="channel-card">
				<h3>💬 Tenant Concerns</h3>
				<p><strong>Channel: Direct Message (DM) to Page/Admin</strong></p>
				<p>For privacy, billing inquiries, and maintenance requests, tenants are instructed to message the Admin account directly, not the group chat.</p>
			</div>
			<div class="channel-card">
				<h3>🚨 Emergency</h3>
				<p><strong>Channel: Phone Call / Caretaker Station</strong></p>
				<p>Urgent safety or facility issues requiring immediate attention.</p>
			</div>
		</div>
	</section>

	<section class="section">
		<h2>Billing & Collections</h2>
		<p><strong>Cycle:</strong> Billing statements issued 3-5 days before due date. Due date is strictly on the 1st or 15th depending on move-in.</p>
		<p><strong>Payment Methods:</strong> Cash (to Admin/Caretaker) or GCash/Bank Transfer (for convenience).</p>
		<p><strong>Penalties:</strong> Late payment charges apply after grace period. ₱50/day penalty for late rent.</p>
	</section>

	<section class="section">
		<h2>Maintenance Procedures</h2>
		<div class="maintenance-types">
			<div class="maint-item">
				<h3>🔧 Routine Maintenance</h3>
				<ul>
					<li>Weekly cleaning of common areas</li>
					<li>Monthly pest control</li>
					<li class="placeholder">Quarterly deep cleaning</li>
				</ul>
			</div>
			<div class="maint-item">
				<h3>🚨 Emergency Repairs</h3>
				<ul>
					<li class="placeholder">Response time: Within [X] hours</li>
					<li>Contact: On-duty caretaker</li>
					<li class="placeholder">List of trusted contractors</li>
				</ul>
			</div>
			<div class="maint-item">
				<h3>📝 Repair Request Process</h3>
				<ol>
					<li>Tenant reports issue to caretaker/admin</li>
					<li>Assessment and scheduling</li>
					<li>Repair completion</li>
					<li>Tenant confirmation</li>
				</ol>
			</div>
		</div>
	</section>

	<section class="section">
		<h2>Utility Management</h2>
		<div class="utility-box">
			<h3>⚡ Electricity</h3>
			<p class="placeholder">Individual meters per room. Readings taken every [X day of month]. Rate: ₱[X]/kWh.</p>
		</div>
		<div class="utility-box">
			<h3>💧 Water</h3>
			<p class="placeholder">[Included in rent / Allocated per room / Metered]. Excess consumption billed at ₱[X]/cu.m.</p>
		</div>
		<div class="utility-box">
			<h3>📶 Internet</h3>
			<p class="placeholder">[Fiber/DSL] connection shared across property. Speed: [X] Mbps. Included in rent.</p>
		</div>
	</section>

	<section class="section">
		<h2>System Workflows</h2>
		<div class="workflow-card">
			<h3>📲 Utility Billing Process (Manual/Spreadsheet)</h3>
			<ol>
				<li><strong>Navigate:</strong> Go to <code>/dorm/utility-billings</code>.</li>
				<li><strong>Select Context:</strong> Choose Property and Utility Type (e.g., Electricity).</li>
				<li><strong>Batch Entry:</strong> System displays active meters. Enter current readings.
					<ul>
						<li><em>System Limit:</em> Alerts if consumption variance &gt; 20%.</li>
					</ul>
				</li>
				<li><strong>Generate:</strong> Click "Generate Bills". System calculates cost based on current rate.</li>
				<li><strong>Publish:</strong> Admins send individual billing summaries via <strong>Facebook Messenger</strong>.</li>
			</ol>
		</div>
		<div class="workflow-card">
			<h3>📝 Lease Creation Workflow</h3>
			<ol>
				<li><strong>Navigate:</strong> Go to <code>/dorm/leases</code>.</li>
				<li><strong>Select Unit:</strong> Choose an available Rental Unit.</li>
				<li><strong>Assign Tenant:</strong> Search existing or "Create New Tenant".</li>
				<li><strong>Set Terms:</strong>
					<ul>
						<li>Start/End Date (System defaults to 6/12 months).</li>
						<li>Rent Amount & Security Deposit (Auto-filled from Unit base rate).</li>
					</ul>
				</li>
			</ol>
		</div>
		<div class="workflow-card">
			<h3>🔄 Lease Renewal Workflow</h3>
			<ol>
				<li><strong>Notification (30 Days Prior):</strong> Admin checks "Days Until Expiry" report and sends a reminder via Messenger.
					<ul>
						<li><em>"Hi [Name], your contract expires on [Date]. Please let us know if you wish to renew or move out."</em></li>
					</ul>
				</li>
				<li><strong>Tenant Decision (15 Days Prior):</strong>
					<ul>
						<li><strong>Renew:</strong> Confirm new duration. Admin prepares "Lease Extension Agreement".</li>
						<li><strong>Move-out:</strong> Send "Move-out Checklist" and schedule inspection.</li>
					</ul>
				</li>
				<li><strong>Signing:</strong> Tenant signs the extension form (physical or digital copy).</li>
				<li><strong>System Update:</strong> Admin updates the "Lease End Date" in the records/spreadsheet.</li>
			</ol>
		</div>
	</section>

	<section class="section">
		<h2>Move-out Process</h2>
		<div class="process-steps">
			<div class="step">
				<span class="step-num">1</span>
				<h3>Notice</h3>
				<p>Tenant provides <strong>30 days</strong> written notice (per Contract of Lease)</p>
			</div>
			<div class="step">
				<span class="step-num">2</span>
				<h3>Inspection</h3>
				<p>Room inspection for damages beyond normal wear and tear</p>
			</div>
			<div class="step">
				<span class="step-num">3</span>
				<h3>Final Billing</h3>
				<p>Outstanding utilities and charges calculated; cleaning fee up to <strong>₱200</strong> if not left clean</p>
			</div>
			<div class="step">
				<span class="step-num">4</span>
				<h3>Key Return</h3>
				<p>All keys (Main Gate + Room Key) returned to admin</p>
			</div>
			<div class="step">
				<span class="step-num">5</span>
				<h3>Deposit Application</h3>
				<p>Security deposit is <strong>consumable</strong> — applied to last month's rent (not refundable in cash). Early termination before 6 months forfeits the deposit.</p>
			</div>
		</div>
	</section>

	<section class="section">
		<h2>SOP: Incident Escalation Matrix</h2>
		<table class="spec-table" style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
			<thead>
				<tr style="background: var(--color-black); color: white;">
					<th style="padding: 1rem;">Scenario</th>
					<th style="padding: 1rem;">Immediate Action (If This...)</th>
					<th style="padding: 1rem;">Escalation (Then That...)</th>
				</tr>
			</thead>
			<tbody>
				<tr style="border-bottom: 1px solid #ddd;">
					<td style="padding: 1rem;"><strong>Late Payment (5 Days)</strong></td>
					<td style="padding: 1rem;">Automated/Manual Reminder via Messenger</td>
					<td style="padding: 1rem;">Apply ₱50/day penalty.</td>
				</tr>
				<tr style="border-bottom: 1px solid #ddd;">
					<td style="padding: 1rem;"><strong>Late Payment (15 Days)</strong></td>
					<td style="padding: 1rem;">Caretaker Personal Visit/knock</td>
					<td style="padding: 1rem;">Issue "Notice to Vacate" warning.</td>
				</tr>
				<tr style="border-bottom: 1px solid #ddd;">
					<td style="padding: 1rem;"><strong>Major Leak/Electrical (2 AM)</strong></td>
					<td style="padding: 1rem;">Shut off main valve/breaker.</td>
					<td style="padding: 1rem;">Call Emergency Plumber/Electrician (See Chap 12).</td>
				</tr>
				<tr style="border-bottom: 1px solid #ddd;">
					<td style="padding: 1rem;"><strong>Establishment Lockout</strong></td>
					<td style="padding: 1rem;">Verify Identity.</td>
					<td style="padding: 1rem;">Charge "Door Opening Fee" (if applicable).</td>
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
	p { font-size: 1rem; line-height: 1.6; margin: 0.5rem 0; }
	.placeholder { background: #fef3c7; padding: 0.25rem 0.5rem; border-left: 3px solid #f59e0b; }
	.schedule { border-left: 3px solid var(--color-primary); padding-left: 2rem; }
	.schedule-item { margin-bottom: 1.5rem; position: relative; }
	.schedule-item::before { content: ''; width: 12px; height: 12px; background: var(--color-primary); border-radius: 50%; position: absolute; left: -2.4rem; top: 0.25rem; }
	.time { font-family: var(--font-header); font-weight: 700; display: block; margin-bottom: 0.25rem; }
	.process-steps { display: grid; gap: 1rem; }
	.step { display: flex; align-items: flex-start; gap: 1rem; padding: 1rem; background: var(--color-gray-100); }
	.step-num { background: var(--color-black); color: white; width: 2rem; height: 2rem; display: flex; align-items: center; justify-content: center; font-family: var(--font-header); font-weight: 700; flex-shrink: 0; }
	.step h3 { margin-bottom: 0.25rem; }
	.step p { margin: 0; }
	.maintenance-types { display: grid; gap: 1rem; }
	.maint-item { background: white; border: 2px solid var(--color-black); padding: 1.5rem; }
	.maint-item ul, .maint-item ol { margin: 0; padding-left: 1.5rem; }
	.maint-item li { margin-bottom: 0.5rem; }
	.utility-box { background: var(--color-gray-100); padding: 1.5rem; margin-bottom: 1rem; border-left: 4px solid var(--color-primary); }
	.utility-box h3 { margin-bottom: 0.5rem; }
	.utility-box p { margin: 0; }
	.workflow-card { background: white; border: 2px solid var(--color-black); padding: 1.5rem; margin-bottom: 1rem; }
	.workflow-card h3 { margin-bottom: 0.5rem; }
	.workflow-card ol { margin: 0; padding-left: 1.5rem; }
	.workflow-card li { margin-bottom: 0.5rem; }
</style>
