<svelte:head>
	<title>Daily Checklists | KUYA'S SILOG & LUGAW</title>
</svelte:head>

<section class="doc-page">
	<h1>15 Daily Checklists</h1>

	<h2>15.1 Opening Checklist (30 min before open)</h2>
	<table>
		<tbody>
			<tr><td>[ ]</td><td>💵 CASH</td><td>Count ₱1,000 change fund. Verify bills & coins.</td></tr>
			<tr><td>[ ]</td><td>🧊 THAW</td><td>Check Thaw Bin. Tapa/Tocino humok na ba?</td></tr>
			<tr><td>[ ]</td><td>🍚 RICE</td><td>Start 1st batch steamed rice (industrial cooker, 20 mins)</td></tr>
			<tr><td>[ ]</td><td>🍲 LUGAW</td><td>Start broth boiling (45 mins minimum)</td></tr>
			<tr><td>[ ]</td><td>🧂 CONDIMENTS</td><td>Refill soy sauce, vinegar, chili oil, sugar jars</td></tr>
			<tr><td>[ ]</td><td>📦 PACKAGING</td><td>Restock takeout boxes, spoons, forks near window</td></tr>
			<tr><td>[ ]</td><td>🗑️ TRASH</td><td>Fresh liners in all trash bins</td></tr>
			<tr><td>[ ]</td><td>📱 TECH</td><td>Turn on tablet/phone, connect WiFi, test printer</td></tr>
			<tr><td>[ ]</td><td>🧹 FLOOR</td><td>Quick sweep around cooking area and service window</td></tr>
			<tr><td>[ ]</td><td>🪟 WINDOW</td><td>Wipe service window glass, remove overnight dust</td></tr>
			<tr><td>[ ]</td><td>🥚 EGGS</td><td>Check egg stock (minimum 30 pcs for day)</td></tr>
			<tr><td>[ ]</td><td>🧅 MISE EN PLACE</td><td>Slice onions, garlic, tomatoes for the day</td></tr>
		</tbody>
	</table>

	<h2>15.2 Midday Check (11AM-12PM)</h2>
	<table>
		<tbody>
			<tr><td>[ ]</td><td>🍚 RICE</td><td>Start 2nd batch if stock below 50%</td></tr>
			<tr><td>[ ]</td><td>📦 SUPPLIES</td><td>Restock takeout boxes if running low</td></tr>
			<tr><td>[ ]</td><td>🧊 THAW</td><td>Check if need to thaw more portions for afternoon rush</td></tr>
			<tr><td>[ ]</td><td>🗑️ TRASH</td><td>Empty bins if more than half full</td></tr>
			<tr><td>[ ]</td><td>💧 WATER</td><td>Refill customer drinking water dispenser</td></tr>
		</tbody>
	</table>

	<h2>15.3 Closing Checklist (End of Day)</h2>
	<table>
		<tbody>
			<tr class="critical"><td>[ ]</td><td>🔥 GAS</td><td><strong>Close TANK VALVE</strong> (not just stove knob)</td></tr>
			<tr><td>[ ]</td><td>🪣 GREASE</td><td>Clean grease trap. Put sludge in trash bag.</td></tr>
			<tr><td>[ ]</td><td>🥩 THAW</td><td>Move tomorrow's meat: Freezer → Fridge</td></tr>
			<tr><td>[ ]</td><td>🍚 RICE</td><td>Leftover rice → container → Fridge (for sinangag)</td></tr>
			<tr><td>[ ]</td><td>🧹 SURFACES</td><td>Wipe walls behind stove (splash zones)</td></tr>
			<tr><td>[ ]</td><td>🗑️ TRASH</td><td>Remove ALL bags outside (pest prevention)</td></tr>
			<tr><td>[ ]</td><td>💰 CASH</td><td>Count sales. Separate ₱1,000 change fund. Remit excess.</td></tr>
			<tr><td>[ ]</td><td>🧽 DISHES</td><td>All utensils washed, dried, and stored</td></tr>
			<tr><td>[ ]</td><td>🧴 SANITIZE</td><td>Spray and wipe all prep surfaces with sanitizer</td></tr>
			<tr><td>[ ]</td><td>📝 LOG</td><td>Record day's sales, inventory used, any incidents</td></tr>
			<tr><td>[ ]</td><td>⚡ APPLIANCES</td><td>Unplug rice cooker, electric fan (keep ref ON)</td></tr>
			<tr class="critical"><td>[ ]</td><td>🔒 LOCK</td><td>Double-check padlock & windows</td></tr>
		</tbody>
	</table>

	<h2>15.4 Weekly Deep Clean (Every Sunday)</h2>
	<table>
		<tbody>
			<tr><td>[ ]</td><td>🧊 FREEZER</td><td>Defrost if ice buildup >1cm. Organize contents.</td></tr>
			<tr><td>[ ]</td><td>🚿 DRAIN</td><td>Pour boiling water + baking soda down all drains</td></tr>
			<tr><td>[ ]</td><td>🪤 PEST CHECK</td><td>Inspect corners for cockroach/ant activity</td></tr>
			<tr><td>[ ]</td><td>📦 INVENTORY</td><td>Full stock count. Note items to reorder.</td></tr>
			<tr><td>[ ]</td><td>🧽 DEEP SCRUB</td><td>Stove grates, exhaust fan filter, cutting boards</td></tr>
		</tbody>
	</table>

	<p class="note">💡 Print, laminate, use whiteboard marker daily.</p>
</section>

<style>
	.doc-page { max-width: 800px; margin: 0 auto; padding: 2rem; font-family: system-ui, sans-serif; }
	h1 { font-size: 1.5rem; margin-bottom: 1.5rem; border-bottom: 2px solid #333; padding-bottom: 0.5rem; }
	h2 { font-size: 1.1rem; margin: 1.5rem 0 0.75rem; color: #1e293b; }
	table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
	td { padding: 0.5rem; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
	td:first-child { width: 30px; font-family: monospace; color: #9ca3af; }
	td:nth-child(2) { width: 120px; font-weight: 600; white-space: nowrap; }
	tr.critical { background: #fef2f2; }
	tr.critical td { border-color: #fecaca; }
	.note { margin-top: 1.5rem; padding: 0.75rem; background: #f8fafc; border-radius: 4px; font-size: 0.85rem; color: #64748b; }
</style>
