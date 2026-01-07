<svelte:head>
	<title>16 Contingency & Emergency - DA Tirol Dorm</title>
</svelte:head>

<article class="chapter">
	<header class="chapter-header">
		<span class="chapter-number">16</span>
		<h1>Contingency & Emergency</h1>
	</header>

	<section class="section">
		<h2>Emergency Contact Directory</h2>
		<div class="contact-grid">
			<div class="contact-card emergency">
				<h3>🚑 Medical / Police / Fire</h3>
				<ul>
					<li><strong>National Emergency:</strong> 911</li>
					<li class="placeholder"><strong>Local Police Station:</strong> [Phone Number]</li>
					<li class="placeholder"><strong>Local Fire Station:</strong> [Phone Number]</li>
					<li class="placeholder"><strong>Nearest Hospital:</strong> [Hospital Name / Phone]</li>
					<li class="placeholder"><strong>Barangay Hall:</strong> [Phone Number]</li>
				</ul>
			</div>
			<div class="contact-card admin">
				<h3>👤 Building Admin</h3>
				<ul>
					<li class="placeholder"><strong>Property Owner:</strong> [Phone Number]</li>
					<li class="placeholder"><strong>Head Caretaker:</strong> [Phone Number]</li>
					<li class="placeholder"><strong>Security Guard:</strong> [Phone Number]</li>
				</ul>
			</div>
		</div>
	</section>

	<section class="section">
		<h2>Fire Safety Protocol</h2>
		<div class="protocol-steps">
			<div class="step warning">
				<span class="step-icon">🔥</span>
				<div class="step-content">
					<h3>In Case of Fire</h3>
					<ol>
						<li><strong>ALARM:</strong> Activate the nearest fire alarm or shout "SUNOG!" loud and clear.</li>
						<li><strong>EVACUATE:</strong> Calmly proceed to the designated Fire Exits. <strong>DO NOT USE ELEVATORS</strong> (if any).</li>
						<li><strong>ASSEMBLE:</strong> Gather at the designated Evacuation Area: <span class="placeholder">[Location, e.g., Parking Lot]</span>.</li>
						<li><strong>COUNT:</strong> Caretaker to check attendance based on tenant log.</li>
						<li><strong>CONTACT:</strong> Call the Fire Department immediately.</li>
					</ol>
				</div>
			</div>
			<div class="equipment-box">
				<h3>🧯 Fire Extinguisher Locations</h3>
				<ul class="equipment-list">
					<li class="placeholder"><strong>Ground Floor:</strong> Reception Lobby, Kitchen</li>
					<li class="placeholder"><strong>2nd Floor:</strong> Hallway near Room 201</li>
					<li class="placeholder"><strong>3rd Floor:</strong> Hallway near Room 301</li>
				</ul>
			</div>
		</div>
	</section>

	<section class="section">
		<h2>Typhoon & Flood Protocol</h2>
		<div class="alert-levels">
			<div class="level yellow">
				<h3>Signal No. 1 / Yellow Warning</h3>
				<ul>
					<li>Monitor weather updates.</li>
					<li>Secure loose items outside windows or balconies.</li>
					<li>Charge emergency lights and mobile phones.</li>
				</ul>
			</div>
			<div class="level orange">
				<h3>Signal No. 2-3 / Orange-Red Warning</h3>
				<ul>
					<li>Stay indoors. Lock all windows and doors.</li>
					<li>Store sufficient clean water and ready-to-eat food.</li>
					<li>Prepare for potential power interruption.</li>
					<li>Move important items to higher shelves (if ground floor).</li>
				</ul>
			</div>
		</div>
	</section>

	<section class="section">
		<h2>Utility Interruptions</h2>
		<div class="interruption-plans">
			<div class="plan">
				<h3>⚡ Power Outage</h3>
				<ul>
					<li>Emergency lights in hallways will activate automatically.</li>
					<li>Portable lamps available at the Caretaker's desk.</li>
					<li><strong>Do not use candles</strong> inside rooms.</li>
					<li class="placeholder">Generator (if available) runs from [Time] to [Time] for common areas only.</li>
				</ul>
			</div>
			<div class="plan">
				<h3>💧 Water Interruption</h3>
				<ul>
					<li>Use stored water in backup tank sparingly.</li>
					<li class="placeholder">Schedule water rationing: [Time AM] and [Time PM].</li>
					<li>Notify tenants via group chat immediately upon advisory.</li>
					<li>Order water delivery truck if outage exceeds 24 hours.</li>
				</ul>
			</div>
		</div>
	</section>

	<section class="section">
		<h2>Medical Emergency</h2>
		<ol class="procedure-list">
			<li>Assess the situation. If life-threatening, call ambulance/er immediately.</li>
			<li>Notify the Caretaker/Admin for assistance.</li>
			<li>Admin provides First Aid Kit located at <span class="placeholder">[Reception/Office]</span>.</li>
			<li>Contact victim's emergency contact (from tenant file).</li>
			<li>Assist in transport to nearest hospital if ambulance is delayed and safe to do so.</li>
		</ol>
	</section>
</article>

<style>
	.chapter { max-width: 800px; }
	.chapter-header { margin-bottom: 3rem; }
	.chapter-number { font-family: var(--font-header); font-size: 4rem; font-weight: 700; color: var(--color-primary); opacity: 0.3; line-height: 1; }
	.chapter-header h1 { font-size: 3rem; margin-top: 0.5rem; line-height: 1.1; }
	.section { margin-bottom: 4rem; }
	.section h2 { font-size: 1.5rem; margin-bottom: 2rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--color-gray-200); }

	.contact-grid { display: grid; gap: 1.5rem; }
	.contact-card { padding: 2rem; border-radius: 4px; }
	.contact-card h3 { margin-bottom: 1rem; font-size: 1.25rem; }
	.contact-card.emergency { background: #fef2f2; border: 2px solid #ef4444; color: #991b1b; }
	.contact-card.admin { background: #e0f2fe; border: 2px solid #3b82f6; color: #1e40af; }
	.contact-card ul { list-style: none; padding: 0; }
	.contact-card li { margin-bottom: 0.5rem; font-size: 1.1rem; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 0.5rem; }
	.contact-card li:last-child { border: none; }

	.step.warning { background: #fff7ed; border-left: 6px solid #f97316; padding: 2rem; display: flex; gap: 1.5rem; margin-bottom: 2rem; }
	.step-icon { font-size: 3rem; }
	.step-content h3 { color: #c2410c; margin-bottom: 1rem; }
	.step-content ol { padding-left: 1.5rem; }
	.step-content li { margin-bottom: 0.75rem; line-height: 1.6; }

	.equipment-box { background: var(--color-gray-100); padding: 1.5rem; border: 1px solid var(--color-gray-200); }
	.equipment-list { margin: 0; padding-left: 1.5rem; }
	.equipment-list li { margin-bottom: 0.5rem; }

	.alert-levels { display: grid; gap: 1rem; }
	.level { padding: 1.5rem; border-left: 6px solid; }
	.level h3 { font-size: 1.1rem; margin-bottom: 0.5rem; font-weight: 700; text-transform: uppercase; }
	.level.yellow { background: #fefce8; border-color: #eab308; }
	.level.orange { background: #fff1f2; border-color: #f43f5e; }
	.level ul { margin: 0; padding-left: 1.5rem; }

	.interruption-plans { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
	@media (max-width: 600px) { .interruption-plans { grid-template-columns: 1fr; } }
	.plan { border: 2px solid var(--color-black); padding: 1.5rem; }
	.plan h3 { margin-bottom: 1rem; border-bottom: 2px solid var(--color-gray-200); padding-bottom: 0.5rem; display: inline-block; }
	.plan ul { padding-left: 1.5rem; margin: 0; }
	.plan li { margin-bottom: 0.75rem; }

	.procedure-list { background: white; border: 2px solid var(--color-primary); padding: 2rem 2rem 2rem 3rem; }
	.procedure-list li { margin-bottom: 1rem; font-size: 1.1rem; font-weight: 500; }
	
	.placeholder { background: #fef3c7; padding: 0 0.25rem; }
</style>
