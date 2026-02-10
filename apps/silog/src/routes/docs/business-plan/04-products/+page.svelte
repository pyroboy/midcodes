<script lang="ts">
	import menuSku from '$lib/data/menu-sku.json';
	import rawMaterials from '$lib/data/raw-materials.json';
	import preparedProducts from '$lib/data/prepared-products.json';
	import consumables from '$lib/data/consumables.json';
	import equipment from '$lib/data/equipment.json';
	import condiments from '$lib/data/condiments.json';
	import utilities from '$lib/data/utilities.json';

	// Type definitions
	interface IngredientRef {
		id: string;
		qty: string;
	}

	interface Ingredient {
		item: string;
		qty: string;
		supplier: string;
		frequency: string;
	}

	interface Portioning {
		main: string;
		addons: string;
		total?: string;
		notes?: string;
	}

	interface PrepTime {
		cookMins: number;
		prepMins: number;
	}

	interface MenuItem {
		sku: string;
		name: string;
		tier: string;
		description: string;
		cost?: number; // Calculated dynamically
		srp: number;
		margin?: number; // Calculated dynamically
		portioning: Portioning;
		prepTime: PrepTime;
		ingredientRefs: IngredientRef[];
		takeoutCost?: number; // Packaging cost
		takeoutPrepMins?: number; // Additional time for packing
	}

	interface RawMaterial {
		id: string;
		name: string;
		useCase: string;
		unit: string;
		unitSize: number;
		unitType: string;
		price: number;
		supplier: string;
		frequency: string;
		critical: boolean;
	}

	interface Consumable {
		name: string;
		useCase: string;
		unit: string;
		price: number;
		reorderPoint: number;
		supplier: string;
	}

	interface Equipment {
		name: string;
		qty: number;
		unitPrice: number;
		notes: string;
	}

	interface Condiment {
		name: string;
		portion: string;
		container: string;
		refillPolicy: string;
	}

	interface PrepOverhead {
		cookElectricity: number;
		cookGas: number;
		cookLaborMins: number;
		warmingPerHour: number;
		avgWarmingHrs: number;
		refPerServing?: number;
	}

	interface PreparedProduct {
		id: string;
		name: string;
		description: string;
		batchSize: number;
		batchUnit: string;
		ingredientRefs: IngredientRef[];
		overhead: PrepOverhead;
		notes: string;
	}

	interface MenuConfig {
		wastageBuffer: number;
		wastageBufferNote: string;
		calculation: string;
		effectiveMargin: string;
		takeoutFee: number;
		takeoutFeeNote: string;
	}

	// Type assertions for JSON imports
	// menuData has both _config and category arrays, so we use Record<string, any>
	const menuData = menuSku as Record<string, MenuItem[] | MenuConfig>;
	const rawMaterialsData = rawMaterials as Record<string, RawMaterial[]>;
	const prepProductsData = preparedProducts as Record<string, PreparedProduct[]>;
	const consumablesData = consumables as any;
	const equipmentData = equipment as Record<string, Equipment[]>;
	const condimentsData = condiments as Condiment[];

	// Helper to get _config safely
	const menuConfig = menuData._config as MenuConfig | undefined;

	// Create a flat lookup map for all raw materials
	const rawMaterialsMap = new Map<string, RawMaterial>();
	Object.values(rawMaterialsData).flat().forEach((item) => {
		rawMaterialsMap.set(item.id, item);
	});

	// Create a flat lookup map for all prepared products
	const prepProductsMap = new Map<string, PreparedProduct>();
	Object.values(prepProductsData).flat().forEach((item) => {
		prepProductsMap.set(item.id, item);
	});

	// Labor rate per minute
	const LABOR_RATE = 1.00;  // ₱1.00/min (₱60/hr)
	
	// Wastage buffer percentage (spillage, evaporation, portion variance)
	const WASTAGE_BUFFER = 0.05;  // 5%

	// Calculate total batch cost for a prepared product
	function calculatePrepBatchCost(prep: PreparedProduct): { 
		ingredientCost: number;
		wastageBuffer: number;
		overheadCost: number; 
		totalBatchCost: number;
		costPerServing: number;
	} {
		// Ingredient costs (raw)
		const ingredientCost = prep.ingredientRefs.reduce(
			(sum, ref) => sum + calculateIngredientCost(ref), 0
		);
		
		// Wastage buffer
		const wastageBuffer = ingredientCost * WASTAGE_BUFFER;
		
		// Overhead costs
		const laborCost = prep.overhead.cookLaborMins * LABOR_RATE;
		const warmingCost = prep.overhead.warmingPerHour * prep.overhead.avgWarmingHrs;
		const overheadCost = prep.overhead.cookElectricity + prep.overhead.cookGas + laborCost + warmingCost;
		
		const totalBatchCost = ingredientCost + wastageBuffer + overheadCost;
		const costPerServing = totalBatchCost / prep.batchSize;
		
		return { ingredientCost, wastageBuffer, overheadCost, totalBatchCost, costPerServing };
	}

	// Parse quantity string to extract numeric value (e.g., "100g" → 100, "1 pc" → 1)
	function parseQty(qty: string): number {
		const match = qty.match(/^[\d.]+/);
		return match ? parseFloat(match[0]) : 1;
	}

	// Extract serving unit from batchUnit (e.g., "servings (270g each)" → "270g", "servings (2 pcs each)" → "2 pcs")
	function extractServingUnit(batchUnit: string): { value: string; hasUnit: boolean } {
		// Match patterns like "(270g each)", "(2 pcs each)", "(50g)", "(350ml each)"
		const match = batchUnit.match(/\((\d+\s*(?:g|ml|pcs?)?(?:\s*each)?)\)/i);
		if (match) {
			// Clean up the match - remove "each" and extra spaces
			const cleaned = match[1].replace(/\s*each\s*/i, '').trim();
			return { value: cleaned, hasUnit: true };
		}
		// Check if it's just "eggs" or similar simple unit
		if (batchUnit === 'eggs') {
			return { value: '1 egg', hasUnit: true };
		}
		return { value: 'serving', hasUnit: false };
	}

	// Get batch yield for prepared product (e.g., "5940g" = batchSize × serving unit)
	function getBatchYield(prep: PreparedProduct): string {
		const unit = extractServingUnit(prep.batchUnit);
		if (!unit.hasUnit || unit.value === '1 egg') return `${prep.batchSize} ${prep.batchUnit.split(' ')[0]}`;
		// Try to extract numeric value for gram calculations
		const numMatch = unit.value.match(/^(\d+)/);
		if (numMatch && unit.value.includes('g')) {
			const unitValue = parseInt(numMatch[1]);
			const totalGrams = prep.batchSize * unitValue;
			return `${totalGrams}g`;
		}
		return `${prep.batchSize} ${prep.batchUnit.split(' ')[0]}`;
	}

	// Get servings count for prepared product (e.g., "22")
	function getServingsCount(prep: PreparedProduct): string {
		return `${prep.batchSize}`;
	}

	// Get display qty for ingredient - shows unit for PP-*, original qty for RM-*
	function getDisplayQty(ref: IngredientRef): string {
		if (ref.id.startsWith('PP-')) {
			const prep = prepProductsMap.get(ref.id);
			if (!prep) return ref.qty;
			const qty = parseQty(ref.qty);
			const unit = extractServingUnit(prep.batchUnit);
			// If no specific unit found, return original qty string
			if (!unit.hasUnit) return ref.qty;
			// Format: "270g" for qty=1, "2× 270g" for qty=2
			return qty === 1 ? unit.value : `${qty}× ${unit.value}`;
		}
		return ref.qty;
	}

	// Calculate cost for a single ingredient reference (handles RM- and PP- prefixes)
	function calculateIngredientCost(ref: IngredientRef): number {
		const id = ref.id;
		const qty = parseQty(ref.qty);

		// Check if this is a prepared product reference (PP-xxx)
		if (id.startsWith('PP-')) {
			const prep = prepProductsMap.get(id);
			if (!prep) return 0;
			const costs = calculatePrepBatchCost(prep);
			return qty * costs.costPerServing;
		}

		// Otherwise, it's a raw material (RM-xxx)
		const material = rawMaterialsMap.get(id);
		if (!material) return 0;
		
		const costPerUnit = material.price / material.unitSize;
		return qty * costPerUnit;
	}

	// Overhead rates per minute (based on utilities.json January 2026 research)
	// Electricity: ₱12/kWh → ~₱0.30/min for 1.5kW cooking appliance
	// LPG: Based on realistic silog operation (medium burner high ~₱11.08/hr + frying ~₱14.19/hr avg)
	// Formula: 0.073 kg/kW/hr × ₱86.59/kg = cost per kW per hour
	const OVERHEAD_RATES = {
		electricity: 0.30,  // ₱0.30/min (₱12/kWh × 1.5kW ÷ 60min)
		gas: 0.24,          // ₱0.24/min (₱14.19/hr avg silog operation ÷ 60min)
		labor: 1.00         // ₱1.00/min (prep + cook time)
	};

	// Utility rates from JSON for display
	const electricityRate = utilities.electricity.rate.perKwh; // ₱12/kWh
	const lpgPerHour = utilities.lpg.typicalSilogOperation.avgCostPerHour; // ₱14.19/hr
	const lpgTankPrice = utilities.lpg.tank.price; // ₱952.50

	// Appliance definitions with wattage/gas info
	type Appliance = { name: string; type: 'electric' | 'gas'; power: string; icon: string };
	const APPLIANCES: Record<string, Appliance> = {
		riceCooker: { name: 'Rice Cooker', type: 'electric', power: '700W', icon: '🍚' },
		gasStove: { name: 'Gas Stove', type: 'gas', power: '2-Burner', icon: '🔥' },
		wok: { name: 'Wok (on Gas)', type: 'gas', power: 'High Heat', icon: '🥘' },
		fryingPan: { name: 'Frying Pan (on Gas)', type: 'gas', power: 'Med-High', icon: '🍳' },
		stockPot: { name: 'Stock Pot (on Gas)', type: 'gas', power: 'Low-Med', icon: '🍲' },
		griddle: { name: 'Griddle (on Gas)', type: 'gas', power: 'Med Heat', icon: '🥩' },
		deepFryer: { name: 'Deep Fryer (on Gas)', type: 'gas', power: 'High Heat', icon: '🍟' },
		sizzlingPlate: { name: 'Sizzling Plate (on Gas)', type: 'gas', power: 'High Heat', icon: '♨️' },
		electricKettle: { name: 'Electric Kettle', type: 'electric', power: '1500W', icon: '☕' },
		refrigerator: { name: 'Refrigerator (ambient)', type: 'electric', power: '150W', icon: '❄️' }
	};

	// Get appliances used for a menu item based on category and cooking method
	function getAppliancesUsed(item: MenuItem, category: string): Appliance[] {
		const appliances: Appliance[] = [];
		const name = item.name.toLowerCase();
		
		// All silog items need sinangag (rice cooker prereq + wok for frying)
		if (category === 'silog') {
			appliances.push(APPLIANCES.riceCooker); // Rice warming
			appliances.push(APPLIANCES.wok); // Sinangag frying
			appliances.push(APPLIANCES.fryingPan); // Egg + protein frying
			
			// Specific additions based on item type
			if (name.includes('bagnet') || name.includes('shanghai') || name.includes('pork chop')) {
				appliances.push(APPLIANCES.deepFryer);
			}
			if (name.includes('sisig')) {
				appliances.push(APPLIANCES.sizzlingPlate);
			}
		}
		
		// Lugaw items
		if (category === 'lugaw') {
			appliances.push(APPLIANCES.riceCooker); // Porridge cooking
			appliances.push(APPLIANCES.stockPot); // Broth
			if (name.includes('arroz')) {
				appliances.push(APPLIANCES.gasStove); // Extra simmering
			}
		}
		
		// Noodles
		if (category === 'noodles') {
			appliances.push(APPLIANCES.gasStove); // Boiling water
			appliances.push(APPLIANCES.wok); // Stir-frying
		}
		
		// Drinks
		if (category === 'drinks') {
			if (name.includes('coffee')) {
				appliances.push(APPLIANCES.electricKettle);
			} else {
				appliances.push(APPLIANCES.refrigerator); // Cold drinks
			}
		}
		
		// Add-ons (minimal)
		if (['lugaw_addons', 'silog_addons', 'noodle_addons', 'sides'].includes(category)) {
			if (name.includes('egg') || name.includes('rice') || name.includes('longganisa') || name.includes('hotdog')) {
				appliances.push(APPLIANCES.fryingPan);
			}
			if (name.includes('shanghai') || name.includes('chicharon') || name.includes('tawilis') || name.includes('tokwa')) {
				appliances.push(APPLIANCES.deepFryer);
			}
		}
		
		return appliances;
	}

	// Calculate overhead costs for a specific item based on its prep time
	function getOverhead(item: MenuItem): { electricity: number; gas: number; labor: number; total: number } {
		const cookMins = item.prepTime?.cookMins || 0;
		const prepMins = item.prepTime?.prepMins || 0;
		const totalMins = cookMins + prepMins;
		
		const electricity = cookMins * OVERHEAD_RATES.electricity;
		const gas = cookMins * OVERHEAD_RATES.gas;
		const labor = totalMins * OVERHEAD_RATES.labor;
		
		return { electricity, gas, labor, total: electricity + gas + labor };
	}

	// Calculate ingredient cost only (without overhead)
	function calculateIngredientTotal(item: MenuItem | PreparedProduct): number {
		return item.ingredientRefs.reduce(
			(sum, ref) => sum + calculateIngredientCost(ref), 0
		);
	}

	// Calculate total cost for a menu item (ingredients + overhead)
	function calculateSkuCost(item: MenuItem): number {
		const buffer = menuConfig?.wastageBuffer || 0.05;
		const ingredientTotal = calculateIngredientTotal(item);
		// Apply buffer to ingredient cost
		const bufferedIngredientCost = ingredientTotal * (1 + buffer);
		
		return bufferedIngredientCost + getOverhead(item).total;
	}

	// Resolve ingredient reference to full ingredient details (handles RM- and PP-)
	function resolveIngredient(ref: IngredientRef): Ingredient | null {
		const id = ref.id;

		// Check if this is a prepared product reference
		if (id.startsWith('PP-')) {
			const prep = prepProductsMap.get(id);
			if (!prep) return null;
			return {
				item: `${prep.name} (Prep)`,
				qty: ref.qty,
				supplier: 'In-House',
				frequency: 'daily'
			};
		}

		// Otherwise, it's a raw material
		const material = rawMaterialsMap.get(id);
		if (!material) return null;
		return {
			item: material.name,
			qty: ref.qty,
			supplier: material.supplier,
			frequency: material.frequency
		};
	}

	// Helper functions
	function getTierBadge(tier: string) {
		const badges: Record<string, { label: string; class: string }> = {
			winner: { label: 'WINNER', class: 'badge-winner' },
			signature: { label: 'SIGNATURE', class: 'badge-signature' },
			premium: { label: 'PREMIUM', class: 'badge-premium' },
			volume: { label: 'VOLUME', class: 'badge-volume' }
		};
		return badges[tier] || badges.volume;
	}

	function isHighMargin(margin: number): boolean {
		return margin >= 50;
	}

	function isCriticalItem(item: RawMaterial): boolean {
		return item.critical === true;
	}

	// Expanded state for ingredient rows
	let expandedSkus: Record<string, boolean> = {};

	function toggleExpand(sku: string) {
		expandedSkus[sku] = !expandedSkus[sku];
	}

	// Category labels
	const categoryLabels: Record<string, string> = {
		lugaw: 'Lugaw Matrix (LUG)',
		drinks: 'Drinks Matrix (DRK)',
		noodles: 'Noodles Matrix (NDL)',
		silog: 'Silog Master List (SIL)',
		combos: '🍱 Busog Meals / Combos (COMBO)',
		lugaw_addons: '🥚 Lugaw Add-ons',
		silog_addons: '🍚 Silog Add-ons',
		noodle_addons: '🍜 Noodle Add-ons',
		sides: '🍟 Sides & Appetizers'
	};

	const rawMaterialLabels: Record<string, string> = {
		grains: 'Grains & Starch',
		proteins: 'Proteins (Fresh & Frozen)',
		processed: 'Processed / Frozen Goods',
		vegetables: 'Vegetables & Aromatics',
		pantry: 'Pantry & Seasonings',
		beverages: 'Beverages'
	};

	const consumableLabels: Record<string, string> = {
		packaging: 'Packaging',
		hygiene: 'Hygiene',
		cleaning: 'Cleaning',
		fuel: 'Fuel'
	};

	const equipmentLabels: Record<string, string> = {
		cooking: 'Cooking Equipment',
		coldStorage: 'Cold Storage',
		prepTools: 'Prep Tools',
		servingTools: 'Serving Tools',
		dineIn: 'Dine-In Furniture',
		cleaning: 'Cleaning Equipment'
	};
</script>

<svelte:head>
	<title>Menu & Inventory Master | KUYA'S SILOG & LUGAW</title>
</svelte:head>

<section class="doc-page">
	<header class="doc-header">
		<h1>04 Menu &<br><span class="highlight">Inventory Master</span></h1>
	</header>

	<article class="content">
		<!-- SECTION 1: MENU SKU MASTER -->
		<h2>1. Menu SKU Master</h2>
		<p class="section-intro">All finished products with pricing, portioning, and ingredient breakdown. Click any row to expand ingredients.</p>

		{#each Object.entries(menuData).filter(([key]) => key !== '_config') as [category, items]}
			{@const menuItems = items as MenuItem[]}
			<h3>{categoryLabels[category]}</h3>
			<div class="sku-cards">
				{#each menuItems as item}
					{@const overhead = getOverhead(item)}
					{@const ingredientCost = calculateIngredientTotal(item)}
					{@const totalCost = calculateSkuCost(item)}
					{@const profit = item.srp - totalCost}
					{@const actualMargin = Math.round((profit / item.srp) * 100)}
					
					{@const toPrep = (item.takeoutPrepMins || 1)}
					{@const toTime = item.prepTime.prepMins + item.prepTime.cookMins + toPrep}
					{@const toLabor = toTime * LABOR_RATE}
					{@const toPack = item.takeoutCost || 0}
					{@const toTotal = toLabor + overhead.electricity + overhead.gas + toPack}
					{@const buffer = menuConfig?.wastageBuffer || 0.05}
					{@const bufferedIngredientCost = ingredientCost * (1 + buffer)}
					{@const appliances = getAppliancesUsed(item, category)}

					<div class="sku-card">
						<!-- Card Header -->
						<div class="sku-header-new header-{category}">
							<div class="sku-info-left">
								<span class="sku-code">{item.sku}</span>
								<span class="sku-name">{item.name}</span>
							</div>
							
							<div class="sku-metrics-flex">
								<div class="metric-inline">
									<span class="label">Dine-In Cost:</span>
									<span class="value cost">₱{totalCost.toFixed(2)}</span>
								</div>
								<div class="metric-inline">
									<span class="label">Take-Out Cost:</span>
									<span class="value cost-takeout">₱{(bufferedIngredientCost + toTotal).toFixed(2)}</span>
								</div>
								<div class="metric-inline">
									<span class="label">Margin:</span>
									<span class="value margin {actualMargin >= 50 ? 'high' : ''}">{actualMargin}%</span>
								</div>
								<div class="metric-inline">
									<span class="label">SRP:</span>
									<span class="value srp">₱{item.srp.toFixed(2)}</span>
								</div>
							</div>
						</div>
						
						<!-- Card Body -->
						<div class="sku-body-grid">
							<!-- Left Column: Ingredients -->
							<div class="col-ingredients">
								<div class="section-title">INGREDIENT BREAKDOWN (Direct Costs)</div>
								<table class="ingredient-table">
									<thead>
										<tr>
											<th>Item</th>
											<th class="right">Batch Cost</th>
											<th class="center">Batch Yield</th>
											<th class="center">Servings</th>
											<th>Qty</th>
											<th class="right">Cost</th>
										</tr>
									</thead>
									<tbody>
										{#each item.ingredientRefs as ref}
											{@const ing = resolveIngredient(ref)}
											{@const ingCost = calculateIngredientCost(ref)}
											{@const isPrep = ref.id.startsWith('PP-')}
											{@const prepItem = isPrep ? prepProductsMap.get(ref.id) : null}
											{@const prepCosts = isPrep && prepItem ? calculatePrepBatchCost(prepItem) : null}
											{#if ing}
												<tr>
													<td>{ing.item}</td>
													<td class="right batch-cost">{isPrep && prepCosts ? `₱${prepCosts.totalBatchCost.toFixed(2)}` : '—'}</td>
													<td class="center batch-info">{isPrep && prepItem ? getBatchYield(prepItem) : '—'}</td>
													<td class="center batch-info">{isPrep && prepItem ? getServingsCount(prepItem) : '—'}</td>
													<td>{getDisplayQty(ref)}</td>
													<td class="right cost">₱{ingCost.toFixed(2)}</td>
												</tr>
											{/if}
										{/each}
									</tbody>
									<tfoot>
										<tr class="subtotal-row">
											<td colspan="5">INGREDIENT SUBTOTAL</td>
											<td class="right">₱{calculateIngredientTotal(item).toFixed(2)}</td>
										</tr>
										<tr class="wastage-row">
											<td colspan="5" class="wastage-label">
												<span class="muted">Wastage Buffer ({((menuConfig?.wastageBuffer || 0.05) * 100).toFixed(0)}%)</span>
											</td>
											<td class="right muted">
												₱{(calculateIngredientTotal(item) * (menuConfig?.wastageBuffer || 0.05)).toFixed(2)}
											</td>
										</tr>
										<tr class="total-ing-row">
											<td colspan="5"><strong>TOTAL INGREDIENT COST</strong></td>
											<td class="right strong">
												₱{(calculateIngredientTotal(item) * (1 + (menuConfig?.wastageBuffer || 0.05))).toFixed(2)}
											</td>
										</tr>
									</tfoot>
								</table>
							</div>

							<!-- Right Column: Overhead -->
						<div class="col-overhead">
							<div class="section-title">OPERATIONAL OVERHEAD</div>
							
							<!-- Appliances Used -->
							{#if appliances.length > 0}
								<div class="appliances-used">
									<span class="appliances-label">Appliances:</span>
									<div class="appliance-tags">
										{#each appliances as app}
											<span class="appliance-tag {app.type}">
												{app.icon} {app.name} <small>({app.power})</small>
											</span>
										{/each}
									</div>
								</div>
							{/if}
							
							<table class="overhead-table">
								<thead>
									<tr>
										<th></th>
										<th class="center">🍽️ Dine-In</th>
										<th class="center">🥡 Take-Out</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td class="row-label">🕒 TIME</td>
										<td class="center">
											{item.prepTime.prepMins + item.prepTime.cookMins}m
										</td>
										<td class="center">
											+{toPrep} min
										</td>
									</tr>
									<tr>
										<td class="row-label">👤 LABOR</td>
										<td class="center">₱{overhead.labor.toFixed(2)}</td>
										<td class="center">₱{toLabor.toFixed(2)}</td>
									</tr>
									<tr>
										<td class="row-label">⚡ ELECTRIC</td>
										<td class="center">₱{overhead.electricity.toFixed(2)}</td>
										<td class="center">₱{overhead.electricity.toFixed(2)}</td>
									</tr>
									<tr>
										<td class="row-label">🔥 LPG GAS</td>
										<td class="center">₱{overhead.gas.toFixed(2)}</td>
										<td class="center">₱{overhead.gas.toFixed(2)}</td>
									</tr>
									<tr>
										<td class="row-label">📦 PACKAGING</td>
										<td class="center muted">—</td>
										<td class="center cost-alert">₱{toPack.toFixed(2)}</td>
									</tr>
									<tr class="total-row">
										<td class="row-label">TOTAL OVERHEAD</td>
										<td class="center">₱{overhead.total.toFixed(2)}</td>
										<td class="center cost-takeout">₱{toTotal.toFixed(2)}</td>
									</tr>
								</tbody>
							</table>
						</div>
						</div>
					</div>
				{/each}
			</div>
		{/each}

		<div class="divider"></div>

		<!-- SECTION: PREPARED PRODUCTS -->
		<h2>1.5 Prepared Products (Batch Costing)</h2>
		<p class="section-intro">Pre-made items cooked in batches. Cost per serving includes ingredients + overhead (electricity, gas, labor, warming).</p>

		{#each Object.entries(prepProductsData) as [category, items]}
			<h3>{category === 'batches' ? 'Batch-Cooked Items' : 'Drink Preparations'}</h3>
			<div class="sku-cards">
				{#each items as prep}
					{@const costs = calculatePrepBatchCost(prep)}
					<div class="sku-card prep-card">
						<!-- Header -->
						<div class="sku-header-new {category === 'batches' ? 'header-lugaw' : 'header-drinks'}">
							<div class="sku-info-left">
								<span class="sku-code">{prep.id}</span>
								<span class="sku-name">{prep.name}</span>
							</div>
							
							<div class="sku-metrics-flex">
								<div class="metric-inline">
									<span class="label">Batch Size:</span>
									<span class="value cost">{prep.batchSize} {prep.batchUnit}</span>
								</div>
								<div class="metric-inline">
									<span class="label">Batch Cost:</span>
									<span class="value cost-takeout">₱{costs.totalBatchCost.toFixed(2)}</span>
								</div>
								<div class="metric-inline">
									<span class="label">Per Serving:</span>
									<span class="value srp">₱{costs.costPerServing.toFixed(2)}</span>
								</div>
							</div>
						</div>

						<!-- Card Body -->
						<div class="sku-body-grid">
							<!-- Left Column: Ingredients -->
							<div class="col-ingredients">
								<div class="section-title">Ingredient Breakdown</div>
								<table class="ingredient-table">
									<thead>
										<tr>
											<th>Ingredient</th>
											<th>Qty (batch)</th>
											<th>Source</th>
											<th class="right">Cost</th>
										</tr>
									</thead>
									<tbody>
										{#each prep.ingredientRefs as ref}
											{@const ing = resolveIngredient(ref)}
											{@const ingCost = calculateIngredientCost(ref)}
											{#if ing}
												<tr>
													<td>{ing.item}</td>
													<td>{ing.qty}</td>
													<td class="source">{ing.supplier}</td>
													<td class="right cost">₱{ingCost.toFixed(2)}</td>
												</tr>
											{/if}
										{/each}
									</tbody>
									<tfoot>
										<tr class="wastage-row">
											<td colspan="3">🗑️ Wastage Buffer ({(WASTAGE_BUFFER * 100).toFixed(0)}%)</td>
											<td class="right cost-alert">₱{costs.wastageBuffer.toFixed(2)}</td>
										</tr>
										<tr class="subtotal-row">
											<td colspan="3">INGREDIENT SUBTOTAL</td>
											<td class="right">₱{(costs.ingredientCost + costs.wastageBuffer).toFixed(2)}</td>
										</tr>
									</tfoot>
								</table>
							</div>

							<!-- Right Column: Overhead -->
							<div class="col-overhead">
								<div class="section-title">Overhead Breakdown</div>
								<table class="overhead-table">
									<tbody>
										{#if prep.overhead.cookElectricity > 0}
											<tr>
												<td class="row-label">⚡ Electric</td>
												<td class="right">₱{prep.overhead.cookElectricity.toFixed(2)}</td>
											</tr>
										{/if}
										{#if prep.overhead.cookGas > 0}
											<tr>
												<td class="row-label">🔥 Gas</td>
												<td class="right">₱{prep.overhead.cookGas.toFixed(2)}</td>
											</tr>
										{/if}
										<tr>
											<td class="row-label">👷 Labor ({prep.overhead.cookLaborMins}min)</td>
											<td class="right">₱{(prep.overhead.cookLaborMins * LABOR_RATE).toFixed(2)}</td>
										</tr>
										{#if prep.overhead.warmingPerHour > 0}
											<tr>
												<td class="row-label">🔥 Warming ({prep.overhead.avgWarmingHrs}hrs)</td>
												<td class="right">₱{(prep.overhead.warmingPerHour * prep.overhead.avgWarmingHrs).toFixed(2)}</td>
											</tr>
										{/if}
										<tr class="total-row">
											<td class="row-label">TOTAL OVERHEAD</td>
											<td class="right">₱{costs.overheadCost.toFixed(2)}</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>

						<!-- Notes -->
						{#if prep.notes}
							<p class="prep-notes">{prep.notes}</p>
						{/if}
					</div>
				{/each}
			</div>
		{/each}

		<div class="divider"></div>

		<!-- SECTION 2: SAUCES & CONDIMENTS -->
		<h2>2. Sauces & Condiments</h2>
		<div class="table-container">
			<table class="compact">
				<thead>
					<tr>
						<th>Condiment</th>
						<th>Std. Portion</th>
						<th>Container</th>
						<th>Refill Policy</th>
					</tr>
				</thead>
				<tbody>
					{#each condimentsData as item, i}
						<tr class:zebra={i % 2 === 1}>
							<td><strong>{item.name}</strong></td>
							<td>{item.portion}</td>
							<td>{item.container}</td>
							<td>{item.refillPolicy}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="divider"></div>

		<!-- SECTION 3: RAW MATERIALS INVENTORY -->
		<h2>3. Raw Materials Inventory</h2>
		<p class="section-intro">All ingredients required for menu production.</p>

		{#each Object.entries(rawMaterialsData) as [category, items]}
			<h3>{rawMaterialLabels[category]}</h3>
			<div class="table-container">
				<table class="compact">
					<thead>
						<tr>
							<th>Item</th>
							<th>Use Case</th>
							<th>Unit</th>
							<th class="right">Est. Price</th>
							<th>Supplier</th>
							<th>Freq</th>
						</tr>
					</thead>
					<tbody>
						{#each items as item, i}
							<tr class:zebra={i % 2 === 1} class:critical={isCriticalItem(item)}>
								<td><strong>{item.name}</strong></td>
								<td>{item.useCase}</td>
								<td>{item.unit}</td>
								<td class="right">₱{item.price.toLocaleString()}</td>
								<td>{item.supplier}</td>
								<td class="freq-badge">{item.frequency}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/each}

		<div class="divider"></div>

		<!-- SECTION 4: CONSUMABLES & PACKAGING -->
		<h2>4. Consumables & Packaging</h2>
		<p class="section-intro">Packaging with real Bohol landed costs, hygiene, cleaning, and fuel supplies.</p>

		<!-- PACKAGING CONTAINERS -->
		<h3>Packaging Containers</h3>
		<div class="table-container">
			<table class="compact">
				<thead>
					<tr>
						<th>Item</th>
						<th>Spec</th>
						<th class="right">Per Pc</th>
						<th class="right">Pack</th>
						<th>Best Strategy</th>
						<th>Supplier</th>
					</tr>
				</thead>
				<tbody>
					{#each consumablesData.packaging.containers as item, i}
						<tr class:zebra={i % 2 === 1}>
							<td><strong>{item.name}</strong></td>
							<td class="source">{item.spec}</td>
							<td class="right">₱{item.pricePerPc.toFixed(2)}</td>
							<td class="right">₱{item.packPrice}</td>
							<td class="strategy-cell">{item.bestStrategy}</td>
							<td class="source">{item.supplier}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- PACKAGING UTENSILS -->
		<h3>Utensils</h3>
		<div class="table-container">
			<table class="compact">
				<thead>
					<tr>
						<th>Item</th>
						<th>Spec</th>
						<th class="right">Per Pc</th>
						<th class="right">Pack</th>
						<th>Best Strategy</th>
						<th>Supplier</th>
					</tr>
				</thead>
				<tbody>
					{#each consumablesData.packaging.utensils as item, i}
						<tr class:zebra={i % 2 === 1}>
							<td><strong>{item.name}</strong></td>
							<td class="source">{item.spec}</td>
							<td class="right">₱{item.pricePerPc.toFixed(2)}</td>
							<td class="right">₱{item.packPrice}</td>
							<td class="strategy-cell">{item.bestStrategy}</td>
							<td class="source">{item.supplier}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- PACKAGING CARRIERS -->
		<h3>Carriers & Misc</h3>
		<div class="table-container">
			<table class="compact">
				<thead>
					<tr>
						<th>Item</th>
						<th>Spec</th>
						<th class="right">Per Pc</th>
						<th class="right">Pack</th>
						<th>Best Strategy</th>
						<th>Supplier</th>
					</tr>
				</thead>
				<tbody>
					{#each consumablesData.packaging.carriers as item, i}
						<tr class:zebra={i % 2 === 1}>
							<td><strong>{item.name}</strong></td>
							<td class="source">{item.spec}</td>
							<td class="right">₱{item.pricePerPc.toFixed(2)}</td>
							<td class="right">₱{item.packPrice}</td>
							<td class="strategy-cell">{item.bestStrategy}</td>
							<td class="source">{item.supplier}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- TOTAL PACKAGING COST BY CATEGORY -->
		<h3>Total Packaging Cost (TPC) by Category</h3>
		<div class="table-container">
			<table class="compact">
				<thead>
					<tr>
						<th>Category</th>
						<th class="right">Container</th>
						<th class="right">Utensil</th>
						<th class="right">Carrier</th>
						<th class="right">Total</th>
						<th>Target SRP</th>
						<th class="right">Pkg %</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>Lugaw</strong></td>
						<td class="right">₱{consumablesData.packaging.totalPackagingCosts.lugaw.container.toFixed(2)}</td>
						<td class="right">₱{consumablesData.packaging.totalPackagingCosts.lugaw.utensil.toFixed(2)}</td>
						<td class="right">₱{consumablesData.packaging.totalPackagingCosts.lugaw.carrier.toFixed(2)}</td>
						<td class="right cost"><strong>₱{consumablesData.packaging.totalPackagingCosts.lugaw.total.toFixed(2)}</strong></td>
						<td>{consumablesData.packaging.totalPackagingCosts.lugaw.targetSRP}</td>
						<td class="right">{consumablesData.packaging.totalPackagingCosts.lugaw.pkgPercent}</td>
					</tr>
					<tr class="zebra">
						<td><strong>Silog (Standard)</strong></td>
						<td class="right">₱{consumablesData.packaging.totalPackagingCosts.silogStandard.container.toFixed(2)}</td>
						<td class="right">₱{consumablesData.packaging.totalPackagingCosts.silogStandard.utensil.toFixed(2)}</td>
						<td class="right">₱{consumablesData.packaging.totalPackagingCosts.silogStandard.carrier.toFixed(2)}</td>
						<td class="right cost"><strong>₱{consumablesData.packaging.totalPackagingCosts.silogStandard.total.toFixed(2)}</strong></td>
						<td>{consumablesData.packaging.totalPackagingCosts.silogStandard.targetSRP}</td>
						<td class="right">{consumablesData.packaging.totalPackagingCosts.silogStandard.pkgPercent}</td>
					</tr>
					<tr>
						<td><strong>Silog (Budget)</strong></td>
						<td class="right">₱{consumablesData.packaging.totalPackagingCosts.silogBudget.container.toFixed(2)}</td>
						<td class="right">₱{consumablesData.packaging.totalPackagingCosts.silogBudget.utensil.toFixed(2)}</td>
						<td class="right">₱{consumablesData.packaging.totalPackagingCosts.silogBudget.carrier.toFixed(2)}</td>
						<td class="right cost"><strong>₱{consumablesData.packaging.totalPackagingCosts.silogBudget.total.toFixed(2)}</strong></td>
						<td>{consumablesData.packaging.totalPackagingCosts.silogBudget.targetSRP}</td>
						<td class="right">{consumablesData.packaging.totalPackagingCosts.silogBudget.pkgPercent}</td>
					</tr>
					<tr class="zebra">
						<td><strong>Drinks</strong></td>
						<td class="right">₱{consumablesData.packaging.totalPackagingCosts.drinks.container.toFixed(2)}</td>
						<td class="right">₱{consumablesData.packaging.totalPackagingCosts.drinks.utensil.toFixed(2)}</td>
						<td class="right">₱{consumablesData.packaging.totalPackagingCosts.drinks.carrier.toFixed(2)}</td>
						<td class="right cost"><strong>₱{consumablesData.packaging.totalPackagingCosts.drinks.total.toFixed(2)}</strong></td>
						<td>{consumablesData.packaging.totalPackagingCosts.drinks.targetSRP}</td>
						<td class="right">{consumablesData.packaging.totalPackagingCosts.drinks.pkgPercent}</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- PROCUREMENT STRATEGY -->
		<h3>Procurement Strategy by Volume</h3>
		<div class="table-container">
			<table class="compact">
				<thead>
					<tr>
						<th>Business Stage</th>
						<th>Order Volume</th>
						<th>Primary Channel</th>
						<th>Logistics</th>
						<th class="right">Expected Cost</th>
					</tr>
				</thead>
				<tbody>
					{#each consumablesData.packaging.procurementStrategy as strat, i}
						<tr class:zebra={i % 2 === 1}>
							<td><strong>{strat.stage}</strong></td>
							<td>{strat.volume}</td>
							<td>{strat.channel}</td>
							<td>{strat.logistics}</td>
							<td class="right">{strat.expectedCost}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- HYGIENE SUPPLIES -->
		<h3>Hygiene</h3>
		<div class="table-container">
			<table class="compact">
				<thead>
					<tr>
						<th>Item</th>
						<th>Use Case</th>
						<th>Unit</th>
						<th class="right">Price</th>
						<th>Supplier</th>
					</tr>
				</thead>
				<tbody>
					{#each consumablesData.hygiene as item, i}
						<tr class:zebra={i % 2 === 1}>
							<td><strong>{item.name}</strong></td>
							<td>{item.useCase}</td>
							<td>{item.unit}</td>
							<td class="right">₱{item.price.toLocaleString()}</td>
							<td>{item.supplier}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- CLEANING SUPPLIES -->
		<h3>Cleaning</h3>
		<div class="table-container">
			<table class="compact">
				<thead>
					<tr>
						<th>Item</th>
						<th>Use Case</th>
						<th>Unit</th>
						<th class="right">Price</th>
						<th>Supplier</th>
					</tr>
				</thead>
				<tbody>
					{#each consumablesData.cleaning as item, i}
						<tr class:zebra={i % 2 === 1}>
							<td><strong>{item.name}</strong></td>
							<td>{item.useCase}</td>
							<td>{item.unit}</td>
							<td class="right">₱{item.price.toLocaleString()}</td>
							<td>{item.supplier}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- FUEL -->
		<h3>Fuel</h3>
		<div class="table-container">
			<table class="compact">
				<thead>
					<tr>
						<th>Item</th>
						<th>Use Case</th>
						<th>Unit</th>
						<th class="right">Price</th>
						<th>Supplier</th>
					</tr>
				</thead>
				<tbody>
					{#each consumablesData.fuel as item, i}
						<tr class:zebra={i % 2 === 1}>
							<td><strong>{item.name}</strong></td>
							<td>{item.useCase}</td>
							<td>{item.unit}</td>
							<td class="right">₱{item.price.toLocaleString()}</td>
							<td>{item.supplier}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="divider"></div>

		<!-- SECTION 5: STATIC EQUIPMENT -->
		<h2>5. Static Equipment</h2>
		<p class="section-intro">All equipment needed for operations.</p>

		{#each Object.entries(equipmentData) as [category, items]}
			<h3>{equipmentLabels[category]}</h3>
			<div class="table-container">
				<table class="compact">
					<thead>
						<tr>
							<th>Item</th>
							<th class="right">Qty</th>
							<th class="right">Unit Price</th>
							<th class="right">Total</th>
							<th>Notes</th>
						</tr>
					</thead>
					<tbody>
						{#each items as item, i}
							<tr class:zebra={i % 2 === 1}>
								<td><strong>{item.name}</strong></td>
								<td class="right">{item.qty}</td>
								<td class="right">₱{item.unitPrice.toLocaleString()}</td>
								<td class="right">₱{(item.qty * item.unitPrice).toLocaleString()}</td>
								<td class="notes-cell">{item.notes}</td>
									<td class="notes-cell">{item.notes}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/each}

			<div class="divider"></div>

			<!-- SECTION 6: UTILITIES BREAKDOWN -->
			<h2>6. Utilities Breakdown</h2>
			<p class="section-intro">Electricity, LPG, and water costs based on actual rates. These costs are factored into overhead calculations for all SKUs.</p>

			<!-- Utility Rates Summary -->
			<div class="utility-summary">
				<div class="rate-card">
					<span class="rate-label">⚡ Electricity</span>
					<span class="rate-value">₱{electricityRate}/kWh</span>
				</div>
				<div class="rate-card">
					<span class="rate-label">🔥 LPG (11kg)</span>
					<span class="rate-value">₱{lpgTankPrice}/tank</span>
				</div>
				<div class="rate-card">
					<span class="rate-label">🔥 LPG Rate</span>
					<span class="rate-value">₱{lpgPerHour}/hour</span>
				</div>
				<div class="rate-card">
					<span class="rate-label">💧 Water</span>
					<span class="rate-value">₱{utilities.water.rate.perCubicMeter}/m³</span>
				</div>
			</div>

			<h3>Electricity Appliances</h3>
			<div class="table-container">
				<table class="compact">
					<thead>
						<tr>
							<th>Appliance</th>
							<th class="right">Watts</th>
							<th class="right">Hrs/Day</th>
							<th class="right">kWh/Day</th>
							<th class="right">Daily Cost</th>
							<th class="right">Monthly Cost</th>
						</tr>
					</thead>
					<tbody>
						{#each utilities.electricity.appliances as appliance, i}
							<tr class:zebra={i % 2 === 1}>
								<td><strong>{appliance.name}</strong></td>
								<td class="right">{appliance.watts}W</td>
								<td class="right">{appliance.hoursPerDay}h</td>
								<td class="right">{appliance.kwhPerDay}</td>
								<td class="right">₱{appliance.dailyCost.toFixed(2)}</td>
								<td class="right">₱{appliance.monthlyCost.toLocaleString()}</td>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr class="total-row">
							<td colspan="3"><strong>TOTAL ELECTRICITY</strong></td>
							<td class="right">{utilities.electricity.summary.totalDailyKwh} kWh</td>
							<td class="right">₱{utilities.electricity.summary.totalDailyCost.toFixed(2)}</td>
							<td class="right"><strong>₱{utilities.electricity.summary.totalMonthlyCost.toLocaleString()}</strong></td>
						</tr>
					</tfoot>
				</table>
			</div>

			<h3>LPG Consumption by Burner Type</h3>
			<p class="section-intro">Formula: 0.073 kg per kW per hour × ₱{utilities.lpg.tank.pricePerKg}/kg</p>
			<div class="table-container">
				<table class="compact">
					<thead>
						<tr>
							<th>Burner Type</th>
							<th class="right">Power (kW)</th>
							<th class="right">g/hour</th>
							<th class="right">Cost/Hour</th>
							<th class="right">Tank Life</th>
						</tr>
					</thead>
					<tbody>
						{#each utilities.lpg.consumptionRates.burners as burner, i}
							<tr class:zebra={i % 2 === 1} class:critical={burner.type.includes('Silog') || burner.type.includes('Medium')}>
								<td><strong>{burner.type}</strong></td>
								<td class="right">{burner.kw} kW</td>
								<td class="right">{burner.gramsPerHour}g</td>
								<td class="right">₱{burner.costPerHour.toFixed(2)}</td>
								<td class="right">{burner.tankLifeHours}h</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div class="silog-operation-note">
				<strong>🍳 Typical Silog Operation:</strong> {utilities.lpg.typicalSilogOperation.description}<br>
				Average: <strong>₱{utilities.lpg.typicalSilogOperation.avgCostPerHour}/hour</strong> × {utilities.lpg.typicalSilogOperation.estimatedHoursPerDay}h/day = <strong>₱{utilities.lpg.typicalSilogOperation.dailyCost.toFixed(2)}/day</strong>
			</div>

			<h3>Monthly Utility Summary</h3>
			<div class="table-container">
				<table class="compact">
					<thead>
						<tr>
							<th>Utility</th>
							<th class="right">Daily Cost</th>
							<th class="right">Monthly Cost</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>⚡ <strong>Electricity</strong></td>
							<td class="right">₱{utilities.summary.dailyUtilityCosts.electricity.toFixed(2)}</td>
							<td class="right">₱{utilities.summary.monthlyUtilityCosts.electricity.toLocaleString()}</td>
						</tr>
						<tr class:zebra={true}>
							<td>🔥 <strong>LPG</strong></td>
							<td class="right">₱{utilities.summary.dailyUtilityCosts.lpg.toFixed(2)}</td>
							<td class="right">₱{utilities.summary.monthlyUtilityCosts.lpg.toLocaleString()}</td>
						</tr>
						<tr>
							<td>💧 <strong>Water</strong></td>
							<td class="right">₱{utilities.summary.dailyUtilityCosts.water.toFixed(2)}</td>
							<td class="right">₱{utilities.summary.monthlyUtilityCosts.water.toLocaleString()}</td>
						</tr>
					</tbody>
					<tfoot>
						<tr class="total-row">
							<td><strong>TOTAL UTILITIES</strong></td>
							<td class="right"><strong>₱{utilities.summary.dailyUtilityCosts.total.toFixed(2)}</strong></td>
							<td class="right"><strong>₱{utilities.summary.monthlyUtilityCosts.total.toLocaleString()}</strong></td>
						</tr>
					</tfoot>
				</table>
			</div>

			<div class="overhead-note">
				<strong>📊 SKU Overhead Rates:</strong> Based on utilities data, cooking overhead is calculated at <strong>₱{OVERHEAD_RATES.electricity.toFixed(2)}/min</strong> (electricity) + <strong>₱{OVERHEAD_RATES.gas.toFixed(2)}/min</strong> (LPG) + <strong>₱{OVERHEAD_RATES.labor.toFixed(2)}/min</strong> (labor).
			</div>
		</article>
</section>

<style>
	/* PAGE LAYOUT - Compact */
	.doc-page {
		max-width: 1100px;
		margin: 0 auto;
		padding: 3rem 1.5rem;
		background: white;
		min-height: 100vh;
		font-family: 'Inter', sans-serif;
		color: #334155;
	}

	/* HEADER */
	.doc-header h1 {
		font-size: 4rem;
		line-height: 0.9;
		margin-bottom: 3rem;
		color: #0f172a;
	}
	.highlight { color: white; background: #0f172a; padding: 0 0.75rem; }
	@media(max-width:600px) { .doc-header h1 { font-size: 2.5rem; }}

	/* CONTENT */
	h2 {
		border-left: 5px solid #0f172a;
		padding-left: 0.75rem;
		margin-bottom: 1rem;
		margin-top: 2rem;
		color: #1e293b;
		font-size: 1.25rem;
		font-weight: 700;
	}

	h3 {
		font-size: 0.95rem;
		font-weight: 600;
		color: #475569;
		margin: 1.5rem 0 0.5rem 0;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.section-intro { 
		font-size: 0.85rem; 
		color: #64748b; 
		margin-bottom: 1rem; 
	}

	.divider { 
		height: 1px; 
		background: #e2e8f0; 
		margin: 2rem 0; 
	}

	/* COMPACT TABLE */
	.table-container { 
		overflow-x: auto; 
		margin-bottom: 1rem; 
		border: 1px solid #e2e8f0;
	}
	
	table.compact { 
		width: 100%; 
		border-collapse: collapse; 
		font-size: 0.85rem; 
	}
	
	th { 
		background: #f1f5f9; 
		padding: 8px 12px; 
		text-align: left; 
		font-weight: 600; 
		color: #334155; 
		border-bottom: 1px solid #e2e8f0;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.3px;
	}
	
	td { 
		padding: 8px 12px; 
		border-bottom: 1px solid #f1f5f9; 
		color: #334155;
		vertical-align: top;
	}

	.right { text-align: right; }
	
	/* ZEBRA STRIPING */
	tr.zebra { background: #f8fafc; }
	
	/* COLOR CODING */
	tr.critical { background: #fef3c7; }
	.profit { color: #16a34a; font-weight: 600; }

	/* BADGES */
	.freq-badge, .freq-cell {
		font-size: 0.75rem;
		color: #64748b;
	}

	/* SKU CARDS - NEW LAYOUT */
	.sku-cards {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		margin-bottom: 3rem;
	}

	.sku-card {
		background: white;
		border-radius: 8px;
		box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
		overflow: hidden;
		border: 1px solid #e2e8f0;
	}

	/* HEADER */
	.sku-header-new {
		display: flex;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		background: #f1f5f9; /* Default fallback */
		border-bottom: 1px solid #cbd5e1;
		gap: 1rem;
		align-items: center;
	}

	/* Category Specific Header Colors */
	.header-lugaw { background: #fef9c3; border-bottom-color: #fde047; }   /* Yellow-100 */
	.header-silog { background: #ffe4e6; border-bottom-color: #fda4af; }   /* Rose-100 */
	.header-drinks { background: #e0f2fe; border-bottom-color: #7dd3fc; }  /* Sky-100 */
	.header-noodles { background: #ffedd5; border-bottom-color: #fdba74; } /* Orange-100 */
	.header-addons { background: #f1f5f9; border-bottom-color: #cbd5e1; }  /* Slate-100 */

	.sku-info-left {
		display: flex;
		flex-direction: row;
		gap: 12px;
		align-items: baseline;
	}
	.sku-code { font-size: 1.25rem; font-weight: 800; color: #0f172a; line-height: 1; }
	.sku-name { font-size: 1.5rem; font-weight: 800; color: #1e293b; line-height: 1; }

	/* METRICS FLEX LAYOUT */
	.sku-metrics-flex {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 24px;
	}

	.metric-inline {
		display: flex;
		gap: 6px;
		align-items: baseline;
	}

	/* Unified Metric Styles */
	.metric-inline .label { 
		font-size: 0.75rem; 
		color: #475569; 
		font-weight: 600; 
		text-transform: uppercase;
	}
	
	.metric-inline .value { 
		font-size: 1rem; 
		font-weight: 700; 
		color: #334155; 
	}

	/* Specific Value Overrides */
	.metric-inline .cost-takeout { color: #b91c1c; }
	
	.metric-inline .margin.high { color: #15803d; }
	
	.metric-inline .srp { 
		font-size: 1.25rem; 
		color: #0f172a; 
		font-weight: 800; 
	}

	@media(max-width: 1024px) {
		.sku-body-grid { grid-template-columns: 1fr; gap: 1rem; }
		.sku-header-new { flex-direction: column; align-items: flex-start; }
		.sku-metrics-flex { width: 100%; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-top: 8px; }
	}

	/* BODY GRID */
	.sku-body-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		padding: 1.5rem;
	}

	.section-title {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		color: #0f172a;
		margin-bottom: 1rem;
		letter-spacing: 0.5px;
	}

	/* INGREDIENT TABLE OVERRIDES */
	.ingredient-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
	.ingredient-table th { padding: 6px 4px; border-bottom: 1px solid #cbd5e1; color: #0f172a; font-weight: 700; font-size: 0.7rem; }
	.ingredient-table td { padding: 6px 4px; border-bottom: 1px solid #e2e8f0; font-size: 0.75rem; }
	.ingredient-table th:nth-child(1) { width: 24%; } /* Item */
	.ingredient-table th:nth-child(2) { width: 14%; } /* Batch Cost */
	.ingredient-table th:nth-child(3) { width: 14%; } /* Batch Yield */
	.ingredient-table th:nth-child(4) { width: 14%; } /* Servings */
	.ingredient-table th:nth-child(5) { width: 14%; } /* Qty */
	.ingredient-table th:nth-child(6) { width: 12%; } /* Cost */
	.col-ingredients .right { text-align: right; }
	.col-ingredients .center { text-align: center; }
	
	/* Batch info column styling */
	.batch-cost, .batch-info { 
		font-size: 0.7rem; 
		color: #64748b;
		white-space: nowrap;
	}
	
	.subtotal-row td {
		border-top: 2px solid #cbd5e1;
		font-weight: 700;
		padding-top: 12px;
		color: #0f172a;
	}

	/* OVERHEAD TABLE */
	.overhead-table { width: 100%; border-collapse: collapse; }
	.overhead-table th { padding: 6px; border-bottom: 1px solid #cbd5e1; font-weight: 700; color: #0f172a; font-size: 0.8rem; }
	.overhead-table td { padding: 8px 6px; border-bottom: 1px solid #e2e8f0; font-size: 0.85rem; }
	.overhead-table .row-label { font-weight: 700; color: #0f172a; font-size: 0.8rem; }
	.overhead-table .center { text-align: center; }
	.cost-alert { color: #b91c1c; font-weight: 700; }
	
	.total-row td {
		border-top: 2px solid #cbd5e1;
		font-weight: 800;
		padding-top: 12px;
		color: #15803d;
	}
	.total-row .cost-takeout { color: #b91c1c; }

	@media(max-width: 1024px) {
		.sku-body-grid { grid-template-columns: 1fr; gap: 1rem; }
		.sku-header-new { flex-direction: column; align-items: flex-start; }
		.sku-metrics-grid { width: 100%; grid-template-columns: 1fr 1fr; }
	}

	/* Prep Card specific */
	.prep-card { border-left: 4px solid #f59e0b; }
	.prep-notes { 
		padding: 8px 16px; 
		font-size: 0.8rem; 
		color: #64748b; 
		background: #fefce8;
		margin: 0;
	}
	.batch-size { 
		background: #fef3c7; 
		padding: 2px 8px; 
		border-radius: 4px;
		font-size: 0.8rem;
	}

	/* Prep Analysis Table */
	.prep-analysis {
		margin-top: 12px;
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		overflow: hidden;
	}
	.analysis-header {
		background: #f1f5f9;
		padding: 6px 12px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		color: #475569;
		border-bottom: 1px solid #e2e8f0;
	}
	/* Analysis table styles removed - not currently in use */

	/* APPLIANCES USED */
	.appliances-used {
		margin-bottom: 1rem;
		padding: 0.75rem;
		background: #f8fafc;
		border-radius: 6px;
		border: 1px solid #e2e8f0;
	}

	.appliances-label {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		color: #64748b;
		display: block;
		margin-bottom: 0.5rem;
	}

	.appliance-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.appliance-tag {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 0.7rem;
		font-weight: 600;
	}

	.appliance-tag.electric {
		background: #dbeafe;
		color: #1e40af;
		border: 1px solid #93c5fd;
	}

	.appliance-tag.gas {
		background: #ffedd5;
		color: #c2410c;
		border: 1px solid #fdba74;
	}

	.appliance-tag small {
		font-weight: 400;
		opacity: 0.8;
	}

	/* UTILITIES SECTION */
	.utility-summary {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 1.5rem;
	}

	.rate-card {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 1rem 1.5rem;
		background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
		border-radius: 8px;
		border: 1px solid #cbd5e1;
		min-width: 140px;
	}

	.rate-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.3px;
	}

	.rate-value {
		font-size: 1.25rem;
		font-weight: 800;
		color: #0f172a;
	}

	.overhead-note {
		background: #eff6ff;
		border: 1px solid #3b82f6;
		border-left: 4px solid #3b82f6;
		padding: 1rem 1.5rem;
		border-radius: 6px;
		font-size: 0.9rem;
		color: #1e40af;
		margin-top: 1.5rem;
	}

	.silog-operation-note {
		background: #fef3c7;
		border: 1px solid #f59e0b;
		border-left: 4px solid #f59e0b;
		padding: 1rem 1.5rem;
		border-radius: 6px;
		font-size: 0.9rem;
		color: #92400e;
		margin-top: 1rem;
		margin-bottom: 1.5rem;
	}

	@media(max-width:768px) {
		.doc-page { padding: 2rem 1rem; }
		table.compact { font-size: 0.8rem; }
		th, td { padding: 6px 8px; }
		.sku-footer { flex-direction: column; gap: 8px; }
		.utility-summary { flex-direction: column; }
		.rate-card { min-width: 100%; }
	}
</style>
