<svelte:head>
	<title>05 Services & Amenities - DA Tirol Dorm</title>
</svelte:head>

<article class="chapter">
	<header class="chapter-header">
		<span class="chapter-number">05</span>
		<h1>Services & Amenities</h1>
	</header>

	<section class="section">
		<h2>Room Features</h2>
		<div class="feature-grid">
			<div class="feature-card">
				<span class="icon">🛏️</span>
				<h3>Bedspace Units</h3>
				<ul>
					<li>Single bed with mattress</li>
					<li>Personal locker/cabinet</li>
					<li class="placeholder">Shared CR (X:1 ratio)</li>
					<li>Ceiling fan</li>
				</ul>
			</div>
			<div class="feature-card">
				<span class="icon">🚪</span>
				<h3>Private Rooms</h3>
				<ul>
					<li>Private bathroom</li>
					<li>Bed with mattress</li>
					<li>Wardrobe/cabinet</li>
					<li class="placeholder">Air conditioning (optional)</li>
				</ul>
			</div>
		</div>
	</section>

	<section class="section">
		<h2>Utilities Included</h2>
		<table class="amenity-table">
			<thead>
				<tr>
					<th>Utility</th>
					<th>Details</th>
					<th>Included in Rent</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>💧 Water</td>
					<td class="placeholder">[Details about water supply]</td>
					<td class="placeholder">Yes / Up to [X] cu.m.</td>
				</tr>
				<tr>
					<td>⚡ Electricity</td>
					<td class="placeholder">[Metered / Flat rate]</td>
					<td class="placeholder">No / ₱[X] per kWh</td>
				</tr>
				<tr>
					<td>📶 WiFi</td>
					<td class="placeholder">[Speed: X Mbps]</td>
					<td class="placeholder">Yes / Included</td>
				</tr>
			</tbody>
		</table>
	</section>

	<section class="section">
		<h2>Common Areas</h2>
		<div class="area-list">
			<div class="area-item">
				<h3>🍳 Common Kitchen</h3>
				<p class="placeholder">Shared cooking area with [stove/microwave/refrigerator]. Operating hours: [X:00 AM - X:00 PM].</p>
			</div>
			<div class="area-item">
				<h3>👕 Laundry Area</h3>
				<p class="placeholder">Self-service laundry with [X washing machines]. ₱[X] per load.</p>
			</div>
			<div class="area-item">
				<h3>📚 Study Area</h3>
				<p class="placeholder">Quiet study space with [desks/power outlets/good lighting]. Open 24 hours.</p>
			</div>
			<div class="area-item">
				<h3>📺 Lounge</h3>
				<p class="placeholder">Common area with [TV/seating]. For tenant gatherings and relaxation.</p>
			</div>
		</div>
	</section>

	<section class="section">
		<h2>Security Features</h2>
		<ul class="security-list">
			<li>
				<span class="check">✓</span>
				<strong>CCTV Monitoring</strong>
				<p class="placeholder">[X] cameras covering common areas and entrances</p>
			</li>
			<li>
				<span class="check">✓</span>
				<strong>Secure Entry</strong>
				<p class="placeholder">[Key/Keycard/Biometric] access system</p>
			</li>
			<li>
				<span class="check">✓</span>
				<strong>On-site Caretaker</strong>
				<p class="placeholder">24/7 caretaker on duty</p>
			</li>
			<li>
				<span class="check">✓</span>
				<strong>Fire Safety</strong>
				<p>Fire extinguishers, smoke detectors, and emergency exits on each floor</p>
			</li>
		</ul>
	</section>

	<section class="section">
		<h2>Additional Services</h2>
		<table class="services-table">
			<thead>
				<tr>
					<th>Service</th>
					<th>Description</th>
					<th>Fee</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Laundry Service</td>
					<td class="placeholder">Wash, dry, and fold</td>
					<td class="placeholder">₱[X]/kg</td>
				</tr>
				<tr>
					<td>Room Cleaning</td>
					<td class="placeholder">Weekly room cleaning</td>
					<td class="placeholder">₱[X]/session</td>
				</tr>
				<tr>
					<td>Parcel Receiving</td>
					<td>Package acceptance at reception</td>
					<td>Free</td>
				</tr>
				<tr>
					<td>Wake-up Call</td>
					<td class="placeholder">Morning wake-up service</td>
					<td>Free</td>
				</tr>
			</tbody>
		</table>
	</section>

	<section class="section">
		<h2>House Rules Summary</h2>
		<div class="rules-box">
			<ul>
				<li class="placeholder">Curfew: [X:00 PM] (gate closes)</li>
				<li class="placeholder">Visitor hours: [X:00 AM - X:00 PM]</li>
				<li>No overnight guests</li>
				<li>No smoking inside the building</li>
				<li>No pets allowed</li>
				<li class="placeholder">Quiet hours: [X:00 PM - X:00 AM]</li>
			</ul>
		</div>
	</section>

	<section class="section">
		<h2>SOP: Room Turnaround Protocol</h2>
		<div class="rules-box" style="border-color: var(--color-primary); background: var(--color-gray-100);">
			<h3>🧹 Vacant Room Preparation</h3>
			<p><strong>Objective:</strong> Ensure rooms are "Move-in Ready" within 24 hours of vacancy.</p>
			<ul>
				<li><strong>Deep Clean Checklist:</strong>
					<ul>
						<li>Scrub floors and baseboards.</li>
						<li>Wipe down wall stains (repaint if necessary).</li>
						<li>Sanitize locker/cabinet interiors.</li>
						<li>Wash/Beat cushion/mattress and air out.</li>
					</ul>
				</li>
				<li><strong>Inventory Verification:</strong>
					<ul>
						<li>Count keys (Main Gate + Room Key).</li>
						<li>Check functionality of lights, switches, and outlets.</li>
						<li>Verify "Welcome Kit" placement (if applicable).</li>
					</ul>
				</li>
			</ul>
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
	p { font-size: 1rem; line-height: 1.6; margin: 0.5rem 0; }
	.placeholder { background: #fef3c7; padding: 0.25rem 0.5rem; border-left: 3px solid #f59e0b; }
	.feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
	@media (max-width: 600px) { .feature-grid { grid-template-columns: 1fr; } }
	.feature-card { background: white; border: 2px solid var(--color-black); padding: 1.5rem; }
	.feature-card .icon { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
	.feature-card ul { margin: 0; padding-left: 1.5rem; }
	.feature-card li { margin-bottom: 0.5rem; }
	.amenity-table, .services-table { width: 100%; border-collapse: collapse; }
	.amenity-table th, .amenity-table td, .services-table th, .services-table td { padding: 1rem; border: 1px solid var(--color-gray-200); text-align: left; }
	.amenity-table th, .services-table th { background: var(--color-black); color: white; font-weight: 600; }
	.area-list { display: grid; gap: 1rem; }
	.area-item { background: var(--color-gray-100); padding: 1.5rem; border-left: 4px solid var(--color-primary); }
	.area-item h3 { margin-bottom: 0.5rem; }
	.security-list { list-style: none; padding: 0; }
	.security-list li { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 0.5rem; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px dashed var(--color-gray-200); }
	.security-list li:last-child { border: none; }
	.security-list .check { color: var(--color-accent, #10b981); font-size: 1.25rem; font-weight: 700; }
	.security-list strong { flex: 1; font-size: 1.1rem; }
	.security-list p { flex-basis: 100%; margin: 0.5rem 0 0 1.75rem; font-size: 0.95rem; color: #71717a; }
	.rules-box { background: #fef2f2; border: 2px solid #ef4444; padding: 1.5rem; }
	.rules-box ul { margin: 0; padding-left: 1.5rem; }
	.rules-box li { margin-bottom: 0.75rem; }
</style>
