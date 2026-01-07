<svelte:head>
	<title>15 Daily Checklists - DA Tirol Dorm</title>
</svelte:head>

<article class="chapter">
	<header class="chapter-header">
		<span class="chapter-number">15</span>
		<h1>Daily Checklists</h1>
	</header>

	<section class="section">
		<h2>Caretaker's Daily Rounds</h2>
		<div class="checklist-card">
			<h3>☀️ Morning Shift (6:00 AM - 12:00 PM)</h3>
			<ul class="checklist">
				<li><input type="checkbox"> Open main gates and reception area</li>
				<li><input type="checkbox"> Inspect perimeter for security issues/damages</li>
				<li><input type="checkbox"> Clean reception and office area</li>
				<li><input type="checkbox"> Check all hallway lights (turn off if day entry)</li>
				<li><input type="checkbox"> Inspect common CRs for cleanliness and supplies</li>
				<li><input type="checkbox"> Check water tank levels/pressure</li>
				<li><input type="checkbox"> Record electric/water meter readings (if scheduled)</li>
			</ul>
		</div>

		<div class="checklist-card">
			<h3>🌤️ Afternoon Shift (12:00 PM - 6:00 PM)</h3>
			<ul class="checklist">
				<li><input type="checkbox"> Spot sweep hallways and stairs</li>
				<li><input type="checkbox"> Check trash bins in common areas (empty if full)</li>
				<li><input type="checkbox"> Assist any visiting inquiries/viewings</li>
				<li><input type="checkbox"> Monitor water delivery (if applicable)</li>
				<li><input type="checkbox"> Check fire exits are unobstructed</li>
			</ul>
		</div>

		<div class="checklist-card">
			<h3>🌙 Evening Shift (6:00 PM - 10:00 PM)</h3>
			<ul class="checklist">
				<li><input type="checkbox"> Turn on perimeter and hallway lights</li>
				<li><input type="checkbox"> Secure back entrances/exits</li>
				<li><input type="checkbox"> Final check of common CRs</li>
				<li><input type="checkbox"> Ensure noise levels are acceptable (Quiet Hours)</li>
				<li><input type="checkbox"> Lock main gate (curfew time)</li>
				<li><input type="checkbox"> Activate night security lighting</li>
			</ul>
		</div>
	</section>

	<section class="section">
		<h2>Weekly & Monthly Maintenance</h2>
		<div class="maintenance-grid">
			<div class="maint-box">
				<h3>📅 Weekly</h3>
				<ul class="checklist">
					<li><input type="checkbox"> Deep clean common CRs (scrub tiles/sinks)</li>
					<li><input type="checkbox"> Mop all hallways and stairs</li>
					<li><input type="checkbox"> Wipe down handrails and switches</li>
					<li><input type="checkbox"> Clean window screens/glass in common areas</li>
					<li><input type="checkbox"> Check fire extinguishers (gauge pressure)</li>
				</ul>
			</div>
			<div class="maint-box">
				<h3>📆 Monthly</h3>
				<ul class="checklist">
					<li><input type="checkbox"> Pest control application (spray/maintenance)</li>
					<li><input type="checkbox"> Clean aircon filters (if provided)</li>
					<li><input type="checkbox"> Inspect roof/gutters for debris</li>
					<li><input type="checkbox"> Test emergency lights and smoke detectors</li>
					<li><input type="checkbox"> Inventory check of supplies and assets</li>
				</ul>
			</div>
		</div>
	</section>

	<section class="section">
		<h2>Security Protocol Checklist</h2>
		<div class="protocol-box">
			<h3>🔒 Gate Closure Procedure</h3>
			<ol class="steps">
				<li>Verify no authorized visitors remain inside.</li>
				<li>Check logbook for any unreturned key borrowers.</li>
				<li>Lock pedestrian gate and main vehicular gate.</li>
				<li>Double check padlock security.</li>
				<li>Turn on specific night-security lights.</li>
			</ol>
		</div>
		<div class="protocol-box">
			<h3>👮 Incident Response</h3>
			<ol class="steps">
				<li>Assess immediate danger (call police/ambulance if needed).</li>
				<li>Secure the area/scene.</li>
				<li>Document incident in <strong>Incident Report Form</strong>.</li>
				<li>Notify owner/manager immediately.</li>
				<li>Review CCTV footage if applicable.</li>
			</ol>
		</div>
	</section>

	<section class="section">
		<h2>SOP: Utility Reading Accuracy</h2>
		<div class="protocol-box" style="border-left-color: var(--color-primary); background: var(--color-gray-100);">
			<h3 style="color: black;">⚡ Meter Reading Protocol</h3>
			<p><strong>Frequency:</strong> Every 25th of the month.</p>
			<ol class="steps">
				<li><strong>Announcement:</strong> Post in Group Chat 24 hours prior: <em>"Meter reading tomorrow starting 9 AM."</em></li>
				<li><strong>Door-to-Door Process (Private Rooms):</strong>
					<ul>
						<li>Knock 3 times and announce "Housekeeping/Meter Check".</li>
						<li>Wait for tenant acknowledgement.</li>
						<li>If no answer (and authorized), enter to check sub-meter only.</li>
					</ul>
				</li>
				<li><strong>Visual Proof (CRITICAL):</strong>
					<ul>
						<li>Take a clear PHOTO of the meter reading.</li>
						<li>Ensure serial number is visible.</li>
						<li>Upload photo to App/Logbook immediately.</li>
					</ul>
				</li>
				<li><strong>Validation:</strong> Compare with previous month. If usage spiked >20%, investigate for appliances left running.</li>
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
	.section h2 { font-size: 1.5rem; margin-bottom: 2rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--color-gray-200); }

	.checklist-card { background: white; border: 2px solid var(--color-black); padding: 1.5rem; margin-bottom: 1.5rem; }
	.checklist-card h3 { margin-bottom: 1rem; border-bottom: 1px dashed var(--color-gray-200); padding-bottom: 0.5rem; }

	.checklist { list-style: none; padding: 0; }
	.checklist li { display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.75rem; font-size: 1.05rem; }
	.checklist input[type="checkbox"] { width: 1.2rem; height: 1.2rem; margin-top: 0.2rem; cursor: pointer; }

	.maintenance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
	@media (max-width: 600px) { .maintenance-grid { grid-template-columns: 1fr; } }
	
	.maint-box { background: var(--color-gray-100); padding: 1.5rem; border-top: 4px solid var(--color-primary); }
	.maint-box h3 { font-family: var(--font-header); font-size: 1.3rem; margin-bottom: 1rem; }

	.protocol-box { border-left: 4px solid #ef4444; background: #fef2f2; padding: 1.5rem; margin-bottom: 1.5rem; }
	.protocol-box h3 { color: #dc2626; margin-bottom: 1rem; }
	.steps { margin: 0; padding-left: 1.5rem; }
	.steps li { margin-bottom: 0.5rem; line-height: 1.6; }
</style>
