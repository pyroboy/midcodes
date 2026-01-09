<script lang="ts">
	import preparedProducts from '$lib/data/prepared-products.json';
	import menuSku from '$lib/data/menu-sku.json';

	// Get all prepared products as a flat array
	const allPreps = Object.values(preparedProducts).flat();

	// Map menu items by ID for quick lookup
	const menuMap = new Map<string, string[]>();
	Object.values(menuSku).flat().forEach((item: any) => {
		item.ingredientRefs?.forEach((ing: any) => {
			if (ing.id.startsWith('PP-')) {
				if (!menuMap.has(ing.id)) menuMap.set(ing.id, []);
				menuMap.get(ing.id)!.push(item.sku);
			}
		});
	});

	// Phase categorization
	const phase1 = ['PP-001', 'PP-009', 'PP-003', 'PP-014', 'PP-011', 'PP-013'];
	const phase2 = ['PP-012', 'PP-016', 'PP-005', 'PP-006', 'PP-007', 'PP-015'];
	const phase3Ids = ['PP-003', 'PP-010', 'PP-013', 'PP-015'];

	function getPrep(id: string) {
		return allPreps.find((p: any) => p.id === id);
	}

	function getUsedIn(id: string): string {
		return menuMap.get(id)?.join(', ') || '—';
	}
</script>

<svelte:head>
	<title>Prep Guidelines | KUYA'S SILOG & LUGAW</title>
</svelte:head>

<section class="doc-page">
	<header class="doc-header">
		<h1>05 Prep<br><span class="highlight">Guidelines</span></h1>
	</header>

	<article class="content">
		<p class="section-intro">
			This Prep List is generated from the "Ingredient Breakdown" sections of your Master Data. 
			Every item corresponds directly to a <code>(Prep)</code> item or bulk raw material from SKU costings.
		</p>

		<!-- CONCURRENCY STRATEGY -->
		<h2>⚡ Concurrency Strategy (The "Overlap" Plan)</h2>
		<div class="strategy-box">
			<p><strong>Key Insight:</strong> Most heavy preps (Lugaw, Sinangag, Boiling Meat) are <em>"Passive"</em> tasks—they cook without needing constant hands-on attention.</p>
			<div class="golden-rule">
				<span class="rule-icon">🏆</span>
				<p><strong>The Golden Rule:</strong> Start the "Passive" tasks first, then do the "Active" (knife work) tasks while the passive ones cook.</p>
			</div>
		</div>

		<!-- PHASE 1: PASSIVE COOKING -->
		<h2>📋 PHASE 1: PASSIVE COOKING</h2>
		<p class="phase-desc">Start these <strong>IMMEDIATELY</strong>. They take time to cook but don't need hands. Get them on the heat first.</p>
		
		<div class="table-container">
			<table class="prep-table">
				<thead>
					<tr>
						<th>Prep Item (Ref)</th>
						<th>Used In SKUs</th>
						<th>Action</th>
						<th>Concurrent Task</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><code>PP-001</code> Lugaw Batch</td>
						<td>LUG-001, 002, 004, 005</td>
						<td>Combine Rice, Ginger, Water in Stock Pot. Bring to boil, then simmer.</td>
						<td class="concurrent">While this simmers (45m+), chop vegetables.</td>
					</tr>
					<tr>
						<td><code>PP-009</code> Boiled Eggs</td>
						<td>LUG-001, 004, SIL-001 to 028</td>
						<td>Place eggs in pot. Boil 10-12 mins.</td>
						<td class="concurrent">While water heats up, prep the rice washing.</td>
					</tr>
					<tr>
						<td><code>PP-003</code> Sinangag Rice</td>
						<td>ALL SILOGS</td>
						<td>Cook rice in Rice Cooker (if not using leftover cold rice).</td>
						<td class="concurrent">Rice cooker runs automatically. Move to butchery.</td>
					</tr>
					<tr>
						<td><code>PP-014</code> Adobo Base</td>
						<td>SIL-017, FB-002</td>
						<td>Simmer Chicken, Soy, Vin, Bay Leaf in pot.</td>
						<td class="concurrent">Simmering is hands-off. Do chopping.</td>
					</tr>
					<tr>
						<td><code>PP-011</code> Chicken Flakes</td>
						<td>LUG-002, 004, 005</td>
						<td>Boil chicken breast/meat for shredding.</td>
						<td class="concurrent">Can share stove space with Adobo.</td>
					</tr>
					<tr>
						<td><code>PP-013</code> Tokwa't Baboy</td>
						<td>ADD-006</td>
						<td>Boil Pork Mask/Kasim chunks until tender.</td>
						<td class="concurrent">Simmering is hands-off.</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- PHASE 2: ACTIVE PREP -->
		<h2>🔪 PHASE 2: ACTIVE PREP (Knife Work & Mixing)</h2>
		<p class="phase-desc">Do these while Phase 1 items are simmering/boiling.</p>
		
		<div class="table-container">
			<table class="prep-table">
				<thead>
					<tr>
						<th>Prep Item (Ref)</th>
						<th>Used In SKUs</th>
						<th>Action</th>
						<th>Constraint</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><code>PP-012</code> Spring Onions</td>
						<td>LUG-001 to 005, NDL-001 to 006</td>
						<td>Wash, Dry, Chop. Store in airtight tub.</td>
						<td class="constraint">Must be dry before chopping or it rots.</td>
					</tr>
					<tr>
						<td><code>PP-016</code> K.S.T. Garnish</td>
						<td>SIDE-001, SIL-001 to 028 (Garnish)</td>
						<td>Slice Tomatoes & Onions.</td>
						<td class="constraint">Prep only enough for 1 shift (freshness).</td>
					</tr>
					<tr>
						<td><code>PP-005</code> Tapa Marinade</td>
						<td>SIL-013, 015, 016</td>
						<td>Slice Beef Sirloin thin. Massage with Soy/Vin/Sugar.</td>
						<td class="constraint">Wear gloves. Portion into 1 serving bags.</td>
					</tr>
					<tr>
						<td><code>PP-006</code> Tocino</td>
						<td>SIL-011, 015</td>
						<td>Portion bulk Tocino into serving bags (100g).</td>
						<td class="constraint">Fast task. Just weighing.</td>
					</tr>
					<tr>
						<td><code>PP-007</code> Thawed Hotdogs</td>
						<td>SIL-008, COMBO-001</td>
						<td>Remove from freezer. Slice diagonal slits.</td>
						<td class="constraint">Keep chilled immediately after slicing.</td>
					</tr>
					<tr>
						<td><code>PP-015</code> Bacon Bits</td>
						<td>NDL-006, SIL-018</td>
						<td>Slice bacon into bits (if not pre-sliced).</td>
						<td class="constraint">Do this before frying (Phase 3).</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- PHASE 3: FINISHING / FRYING -->
		<h2>🍳 PHASE 3: FINISHING / FRYING (The "Oily" Phase)</h2>
		<p class="phase-desc">Do this <strong>last</strong> to keep the texture crispy/fresh.</p>
		
		<div class="table-container">
			<table class="prep-table">
				<thead>
					<tr>
						<th>Prep Item (Ref)</th>
						<th>Used In SKUs</th>
						<th>Action</th>
						<th>Notes</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><code>PP-003</code> Sinangag (Fry)</td>
						<td>ALL SILOGS</td>
						<td>Take cold/cooked rice, fry with Garlic Oil & Magic Sarap in Wok.</td>
						<td class="notes">Store in Rice Cooker on "Warm".</td>
					</tr>
					<tr>
						<td><code>PP-010</code> Fried Garlic</td>
						<td>LUG-001 to 005, ADD-015</td>
						<td>Minced garlic → Fry in oil until golden.</td>
						<td class="notes warning">⚠️ WATCH CLOSELY. Burns in seconds.</td>
					</tr>
					<tr>
						<td><code>PP-013</code> Tokwa Fry</td>
						<td>ADD-006</td>
						<td>Deep fry Tofu blocks until golden. Cube them.</td>
						<td class="notes">Mix with boiled pork from Phase 1.</td>
					</tr>
					<tr>
						<td><code>PP-015</code> Bacon Pre-Cook</td>
						<td>NDL-006, SIL-018</td>
						<td>Fry bacon bits until 80% done.</td>
						<td class="notes">Saves 3 mins per order during rush.</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- PHASE 4: DRINKS & MISC -->
		<h2>🥤 PHASE 4: DRINKS & MISC</h2>
		<p class="phase-desc">Can be done by Front-of-House (FOH) staff concurrently with Kitchen staff.</p>
		
		<div class="table-container">
			<table class="prep-table">
				<thead>
					<tr>
						<th>Prep Item (Ref)</th>
						<th>Used In SKUs</th>
						<th>Action</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><code>PP-D01</code> Iced Tea</td>
						<td>DRK-001, COMBO-002</td>
						<td>Mix Powder + Sugar + Water in Pitcher.</td>
					</tr>
					<tr>
						<td><code>DRK-002</code> Cucumber</td>
						<td>DRK-002, SIDE-002</td>
						<td>Slice cucumber wheels.</td>
					</tr>
					<tr>
						<td><code>PP-008</code> Atchara</td>
						<td>SIL-001, 011, 013, 015</td>
						<td>Weekly Prep: Check stock level. If low, grate papaya.</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- PHASE 5: OUTSOURCED PRODUCTION -->
		<h2>🏭 PHASE 5: OUTSOURCED PRODUCTION</h2>
		<p class="phase-desc">Items purchased ready-to-use from local suppliers. Long cook times make in-house prep <strong>impractical</strong> during daily operations.</p>
		
		<div class="table-container">
			<table class="prep-table">
				<thead>
					<tr>
						<th>Prep Item (Ref)</th>
						<th>Cost/Serving</th>
						<th>Supplier Action</th>
						<th>Learning Notes</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><code>PP-018</code> Sweet Tapa (Outsourced)</td>
						<td class="cost">₱35.00</td>
						<td>Order from local home cook, 2x weekly. Pack (500g = 5 servings).</td>
						<td class="constraint">TO LEARN: Research sweet tapa recipe (sugar, soy, calamansi base).</td>
					</tr>
					<tr class="highlight-row">
						<td><code>PP-019</code> Goto Base (Tripe & Broth)</td>
						<td class="cost">₱18.49</td>
						<td>Order weekly. Ox tripe in kaldo. Total Batch: ₱369.80 / 20 servings.</td>
						<td class="constraint">TO LEARN: Chef RV recipe. 1.5-2hr cook time.</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- GOTO BASE REFERENCE RECIPE (Chef RV) -->
		<div class="reference-recipe">
			<h3>📋 PP-019 Goto Base — Chef RV's Recipe (For Learning)</h3>
			<p class="recipe-intro">This recipe is for reference when transitioning to in-house prep. Currently outsourced due to long cook time.</p>
			
			<div class="recipe-grid">
				<div class="recipe-ingredients">
					<h4>Ingredient Breakdown (20 Servings)</h4>
					<table class="prep-table compact">
						<thead>
							<tr><th>Ingredient</th><th>Qty</th><th>Source</th><th class="right">Cost</th></tr>
						</thead>
						<tbody>
							<tr><td>Ox Tripe (Tuwalya)</td><td>1000g</td><td>Public Market</td><td class="right">₱300.00</td></tr>
							<tr><td>Ginger (Luya)</td><td>100g</td><td>Public Market</td><td class="right">₱15.00</td></tr>
							<tr><td>Garlic</td><td>50g</td><td>Public Market</td><td class="right">₱6.00</td></tr>
							<tr><td>Onion (Sibuyas)</td><td>100g</td><td>Public Market</td><td class="right">₱12.00</td></tr>
							<tr><td>Dried Bay Leaves</td><td>4-5 pcs</td><td>Grocery</td><td class="right">₱2.00</td></tr>
							<tr><td>White Vinegar</td><td>30ml</td><td>Grocery</td><td class="right">₱1.50</td></tr>
							<tr><td>Fish Sauce (Patis)</td><td>60ml</td><td>Grocery</td><td class="right">₱8.50</td></tr>
							<tr><td>Black Pepper</td><td>1 tsp</td><td>Grocery</td><td class="right">₱2.00</td></tr>
							<tr><td>Cooking Oil</td><td>30ml</td><td>Grocery</td><td class="right">₱3.00</td></tr>
							<tr><td>Water (Kaldo)</td><td>2-3L</td><td>Tap/Filtered</td><td class="right">₱2.00</td></tr>
							<tr class="wastage-row"><td>🗑️ Wastage Buffer</td><td colspan="2">5%</td><td class="right">₱17.80</td></tr>
							<tr class="subtotal-row"><td colspan="3"><strong>INGREDIENT SUBTOTAL</strong></td><td class="right"><strong>₱369.80</strong></td></tr>
						</tbody>
					</table>
				</div>
				
				<div class="recipe-overhead">
					<h4>Overhead (If In-House)</h4>
					<table class="prep-table compact">
						<tbody>
							<tr><td>⚡ Electric/Gas</td><td class="right">₱40.00</td><td class="muted">Long boiling (1.5-2 hrs)</td></tr>
							<tr><td>👷 Labor (30min)</td><td class="right">₱30.00</td><td class="muted">Prep & Sauté time</td></tr>
							<tr class="subtotal-row"><td><strong>TOTAL OVERHEAD</strong></td><td class="right"><strong>₱70.00</strong></td><td></td></tr>
						</tbody>
					</table>
				</div>
			</div>
			
			<div class="cooking-steps">
				<h4>🍲 Cooking Instructions (Chef RV Style)</h4>
				<ol class="steps-list">
					<li>
						<strong>Step 1: Cleaning & Prep</strong>
						<ul>
							<li><strong>Triple Wash:</strong> Thoroughly wash the Ox Tripe (Tuwalya) three times.</li>
							<li><strong>Cut:</strong> Slice the tripe into strips.</li>
							<li><strong>Prep Aromatics:</strong> Prepare two sets: <em>Set A (Boiling)</em> and <em>Set B (Sautéing)</em> — each with sliced Ginger, Minced Garlic, Chopped Onions.</li>
						</ul>
					</li>
					<li>
						<strong>Step 2: Tenderizing (The Kaldo)</strong>
						<ul>
							<li>In large pot, place clean Ox Tripe with <em>Set A</em> aromatics, Bay Leaves, Vinegar, Patis, and enough Water to cover.</li>
							<li><strong>Simmer:</strong> Bring to boil, then simmer <strong>1.5 to 2 hours</strong> (or 1 hour in pressure cooker) until tender.</li>
							<li><em>Chef's Tip:</em> Do not discard the water. This liquid is your <em>Kaldo</em> (Broth Base).</li>
						</ul>
					</li>
					<li>
						<strong>Step 3: The Gisa (Flavor Infusion)</strong>
						<ul>
							<li>In separate pan, heat Cooking Oil.</li>
							<li>Sauté <em>Set B</em>: Garlic first (fry until slightly browned), then Onions, then Ginger (removes <em>lansa</em>).</li>
							<li>Season with a pinch of salt.</li>
						</ul>
					</li>
					<li>
						<strong>Step 4: Combining (Creating the Prep Product)</strong>
						<ul>
							<li>Pour sautéed mixture (oil and all) into pot with tenderized Tripe.</li>
							<li>Simmer 5–10 minutes to meld flavors.</li>
							<li>Season with Black Pepper. Adjust with Patis if needed.</li>
						</ul>
					</li>
					<li>
						<strong>Step 5: Storage or Service</strong>
						<ul>
							<li><strong>Immediate Service:</strong> Add washed glutinous rice (Malagkit) directly and cook 20-30 mins until thick.</li>
							<li><strong>Batch Prep (Storage):</strong> Cool, portion into containers, freeze. Thaw, boil, and mix with pre-cooked <code>PP-001</code> Lugaw.</li>
						</ul>
					</li>
				</ol>
			</div>
		</div>

		<!-- CONCURRENCY WORKFLOW CHART -->
		<h2>⏳ Concurrency Workflow Chart</h2>
		<p class="phase-desc">How to run this with <strong>2 Staff (Chef & Assistant/FOH)</strong> in <strong>1 Hour</strong>:</p>

		<div class="workflow-timeline">
			<div class="time-block">
				<div class="time-header">
					<span class="time">0:00 - 0:15</span>
					<span class="phase-label">Setup & Boil</span>
				</div>
				<div class="time-content">
					<div class="role chef">
						<strong>👨‍🍳 CHEF:</strong> Put Lugaw Pot, Adobo Pot, and Egg Pot on the stove. Start Rice Cooker.
					</div>
					<div class="role asst">
						<strong>🧑‍🍳 ASST:</strong> Wash vegetables (Onions, Spring Onions, Cucumber).
					</div>
				</div>
			</div>

			<div class="time-block">
				<div class="time-header">
					<span class="time">0:15 - 0:45</span>
					<span class="phase-label">The Overlap</span>
				</div>
				<div class="time-content">
					<div class="role chef">
						<strong>👨‍🍳 CHEF (Butchery):</strong> While pots simmer... Slice Tapa, Portion Tocino, Slit Hotdogs.
					</div>
					<div class="role asst">
						<strong>🧑‍🍳 ASST (Chopping):</strong> Chop Spring Onions, Slice Tomatoes/Onions, Slice Cucumber. Peel Boiled Eggs (once done).
					</div>
				</div>
			</div>

			<div class="time-block">
				<div class="time-header">
					<span class="time">0:45 - 1:00</span>
					<span class="phase-label">Frying & Finishing</span>
				</div>
				<div class="time-content">
					<div class="role chef">
						<strong>👨‍🍳 CHEF:</strong> Strain Adobo/Chix. Heat Wok. Fry Garlic Bits. Fry Sinangag Batch.
					</div>
					<div class="role asst">
						<strong>🧑‍🍳 ASST:</strong> Mix Iced Tea. Organize Prep Table.
					</div>
				</div>
			</div>
		</div>

	</article>
</section>

<style>
	.doc-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.doc-header h1 {
		font-size: 2.5rem;
		font-weight: 700;
		line-height: 1.2;
		margin-bottom: 1rem;
	}

	.highlight {
		color: #f59e0b;
	}

	.section-intro {
		font-size: 1.1rem;
		color: #6b7280;
		margin-bottom: 2rem;
		line-height: 1.6;
	}

	h2 {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 2.5rem 0 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.strategy-box {
		background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 2rem;
		border: 1px solid #f59e0b;
	}

	.golden-rule {
		display: flex;
		align-items: center;
		gap: 1rem;
		background: white;
		padding: 1rem;
		border-radius: 8px;
		margin-top: 1rem;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	}

	.rule-icon {
		font-size: 2rem;
	}

	.phase-desc {
		color: #6b7280;
		margin-bottom: 1rem;
	}

	.table-container {
		overflow-x: auto;
		margin-bottom: 2rem;
	}

	.prep-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	.prep-table th,
	.prep-table td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid #e5e7eb;
	}

	.prep-table th {
		background: #f9fafb;
		font-weight: 600;
		color: #374151;
	}

	.prep-table tr:hover {
		background: #f9fafb;
	}

	.prep-table code {
		background: #e5e7eb;
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
		font-size: 0.85em;
		font-weight: 600;
	}

	.concurrent {
		color: #059669;
		font-style: italic;
	}

	.constraint {
		color: #dc2626;
		font-style: italic;
	}

	.notes {
		color: #6b7280;
	}

	.notes.warning {
		color: #dc2626;
		font-weight: 600;
	}

	/* Workflow Timeline */
	.workflow-timeline {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.time-block {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 2px 4px rgba(0,0,0,0.05);
	}

	.time-header {
		background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%);
		color: white;
		padding: 0.75rem 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.time {
		font-weight: 700;
		font-size: 1.1rem;
	}

	.phase-label {
		background: rgba(255,255,255,0.2);
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.85rem;
	}

	.time-content {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.role {
		padding: 0.75rem;
		border-radius: 8px;
	}

	.role.chef {
		background: #fef3c7;
		border-left: 4px solid #f59e0b;
	}

	.role.asst {
		background: #dbeafe;
		border-left: 4px solid #3b82f6;
	}

	@media (max-width: 768px) {
		.doc-page {
			padding: 1rem;
		}

		.doc-header h1 {
			font-size: 2rem;
		}

		.prep-table {
			font-size: 0.8rem;
		}

		.prep-table th,
		.prep-table td {
			padding: 0.5rem;
		}
	}

	/* Outsourced Production Section */
	.cost {
		color: #059669;
		font-weight: 600;
	}

	.highlight-row {
		background: linear-gradient(90deg, #fef3c7 0%, #fde68a 50%, #fef3c7 100%);
	}

	.highlight-row td {
		font-weight: 500;
	}

	/* Reference Recipe Section */
	.reference-recipe {
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		border: 2px solid #e2e8f0;
		border-radius: 12px;
		padding: 1.5rem;
		margin: 2rem 0;
	}

	.reference-recipe h3 {
		margin-top: 0;
		color: #1e3a5f;
		font-size: 1.25rem;
	}

	.recipe-intro {
		color: #64748b;
		font-style: italic;
		margin-bottom: 1.5rem;
		padding: 0.75rem 1rem;
		background: #fff7ed;
		border-left: 4px solid #f59e0b;
		border-radius: 0 8px 8px 0;
	}

	.recipe-grid {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	@media (max-width: 968px) {
		.recipe-grid {
			grid-template-columns: 1fr;
		}
	}

	.recipe-ingredients h4,
	.recipe-overhead h4 {
		margin: 0 0 0.75rem 0;
		color: #374151;
		font-size: 1rem;
	}

	.prep-table.compact {
		font-size: 0.85rem;
	}

	.prep-table.compact th,
	.prep-table.compact td {
		padding: 0.5rem 0.75rem;
	}

	.prep-table .right {
		text-align: right;
	}

	.prep-table .muted {
		color: #9ca3af;
		font-size: 0.8rem;
	}

	.wastage-row {
		background: #fef3c7;
	}

	.subtotal-row {
		background: #f3f4f6;
		font-weight: 600;
	}

	/* Cooking Steps */
	.cooking-steps {
		margin-top: 1.5rem;
	}

	.cooking-steps h4 {
		margin: 0 0 1rem 0;
		color: #374151;
	}

	.steps-list {
		margin: 0;
		padding-left: 1.5rem;
	}

	.steps-list > li {
		margin-bottom: 1.25rem;
		line-height: 1.6;
	}

	.steps-list > li > strong {
		display: block;
		color: #1e3a5f;
		margin-bottom: 0.5rem;
	}

	.steps-list ul {
		margin: 0.5rem 0 0 0;
		padding-left: 1.25rem;
	}

	.steps-list ul li {
		margin-bottom: 0.35rem;
		color: #4b5563;
	}
</style>
