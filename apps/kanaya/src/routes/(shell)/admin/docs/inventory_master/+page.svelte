<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
</script>

<svelte:head>
	<title>Inventory Master | Kanaya Admin</title>
</svelte:head>

<div class="docs-container">
	<header class="docs-header">
		<div>
			<h1>INVENTORY MASTER</h1>
			<p class="meta">📊 Complete Inventory & Financial Reference | Currency: PHP (₱)</p>
		</div>
		<div class="status-chip">Updated: Jan 2026</div>
	</header>

	<!-- QUICK STATS -->
	<section class="quick-stats">
		<div class="stat-card blue">
			<span class="label">ID Card COGS</span>
			<span class="value">₱5.80 - ₱62</span>
			<span class="sub">Low-End to Premium</span>
		</div>
		<div class="stat-card green">
			<span class="label">Lanyard Cost</span>
			<span class="value">₱35 - ₱40</span>
			<span class="sub">Outsourced (Cebu)</span>
		</div>
		<div class="stat-card purple">
			<span class="label">Terminal Bundle</span>
			<span class="value">₱16,500+</span>
			<span class="sub">Tablet + Scanner</span>
		</div>
		<div class="stat-card amber">
			<span class="label">SMS Cost</span>
			<span class="value">₱0.60</span>
			<span class="sub">Per Message</span>
		</div>
	</section>

	<!-- TOC -->
	<nav class="toc">
		<h2>Quick Navigation</h2>
		<div class="toc-grid">
			<a href="#capex-production">1. Production Equipment</a>
			<a href="#capex-hardware">2. Hardware & Terminals</a>
			<a href="#opex-card">3. Card Materials</a>
			<a href="#opex-smart">4. Smart Card Blanks</a>
			<a href="#opex-thermal">5. Thermal Consumables</a>
			<a href="#opex-lanyard">6. Lanyard Materials</a>
			<a href="#opex-accessories">7. Accessories & Hardware</a>
			<a href="#opex-packaging">8. Packaging & Delivery</a>
			<a href="#opex-maintenance">9. Maintenance</a>
			<a href="#opex-services">10. Software & Services</a>
			<a href="#suppliers">11. Supplier Directory</a>
		</div>
	</nav>

	<!-- SECTION 1: CAPEX PRODUCTION -->
	<section id="capex-production" class="inventory-section">
		<div class="section-header">
			<span class="icon">🖨️</span>
			<h2>1. CAPEX: Production Equipment</h2>
		</div>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Equipment</th>
						<th>Specification</th>
						<th>Unit Cost</th>
						<th>Use Case</th>
						<th>Supplier</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>Epson L8050</strong></td>
						<td>6-Color Inkjet, A4, Modified ID Tray</td>
						<td>₱16,000</td>
						<td>Tier 1 (Low-End) ID</td>
						<td>Shopee / Lazada</td>
					</tr>
					<tr>
						<td><strong>IDP Smart-31S</strong></td>
						<td>Direct-to-Card Thermal</td>
						<td>₱61,020</td>
						<td>Entry Thermal</td>
						<td>Philcopy Corp.</td>
					</tr>
					<tr>
						<td><strong>Magicard 300 NEO</strong></td>
						<td>DTC + HoloKote Security</td>
						<td>₱69,000</td>
						<td>Schools, SMEs</td>
						<td>CCS</td>
					</tr>
					<tr>
						<td><strong>Magicard 600 NEO</strong></td>
						<td>High-speed 150 cards/hr</td>
						<td>₱89,000</td>
						<td>Volume Production</td>
						<td>CCS</td>
					</tr>
					<tr>
						<td><strong>Magicard Prima 4 Uno</strong></td>
						<td>Retransfer (Chip Protection)</td>
						<td>₱230,650</td>
						<td>Premium NFC</td>
						<td>CCS</td>
					</tr>
					<tr>
						<td><strong>UV Flatbed (XP600)</strong></td>
						<td>A4 Flatbed, UV-Curable Ink</td>
						<td>₱85,000+</td>
						<td>Scratch-Proof IDs</td>
						<td>Import / Alibaba</td>
					</tr>
					<tr>
						<td><strong>Heavy Duty Laminator</strong></td>
						<td>A3 Size, Temp Control 180°C</td>
						<td>₱3,500</td>
						<td>PVC Fusion</td>
						<td>Shopee / Local</td>
					</tr>
					<tr>
						<td><strong>Manual Die Cutter</strong></td>
						<td>CR80 Card Punch</td>
						<td>₱2,500</td>
						<td>Card Cutting</td>
						<td>Shopee</td>
					</tr>
					<tr>
						<td><strong>Paper/PVC Cutter</strong></td>
						<td>A4 Guillotine</td>
						<td>₱1,200</td>
						<td>Sheet Prep</td>
						<td>Local</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- SECTION 2: CAPEX HARDWARE -->
	<section id="capex-hardware" class="inventory-section">
		<div class="section-header">
			<span class="icon">📱</span>
			<h2>2. CAPEX: Hardware & Terminals</h2>
		</div>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Device</th>
						<th>Specification</th>
						<th>Unit Cost</th>
						<th>Sell Price</th>
						<th>Margin</th>
					</tr>
				</thead>
				<tbody>
					<tr class="highlight-row">
						<td><strong>Samsung Tab A9+</strong></td>
						<td>Wi-Fi, 4GB/64GB, Android 13</td>
						<td>₱12,877</td>
						<td>₱16,500</td>
						<td class="green">22%</td>
					</tr>
					<tr>
						<td><strong>Samsung Active4 Pro</strong></td>
						<td>Rugged IP68, S Pen, Knox</td>
						<td>₱38,163</td>
						<td>₱45,000</td>
						<td class="green">15%</td>
					</tr>
					<tr>
						<td><strong>Lenovo Tab M9</strong></td>
						<td>Budget 4-8GB RAM</td>
						<td>₱10,525</td>
						<td>₱13,500</td>
						<td class="green">22%</td>
					</tr>
					<tr>
						<td><strong>NETUM 2D Scanner</strong></td>
						<td>USB-C Wired, 300 scans/sec</td>
						<td>₱2,058</td>
						<td>₱3,500</td>
						<td class="green">41%</td>
					</tr>
					<tr>
						<td><strong>Tera 2D Wireless</strong></td>
						<td>Bluetooth/USB, 200 scans/sec</td>
						<td>₱2,470</td>
						<td>₱4,000</td>
						<td class="green">38%</td>
					</tr>
					<tr>
						<td><strong>SecuGen Hamster Plus</strong></td>
						<td>FBI-Certified Fingerprint</td>
						<td>₱4,410</td>
						<td>₱7,000</td>
						<td class="green">37%</td>
					</tr>
					<tr>
						<td><strong>U.are.U 4500</strong></td>
						<td>Basic Fingerprint (PoC)</td>
						<td>₱1,176</td>
						<td>₱2,500</td>
						<td class="green">53%</td>
					</tr>
					<tr>
						<td><strong>USB-C Hub</strong></td>
						<td>Power + Data Passthrough</td>
						<td>₱800</td>
						<td>₱1,500</td>
						<td class="green">47%</td>
					</tr>
					<tr>
						<td><strong>Tablet Stand (VESA)</strong></td>
						<td>Adjustable Mount</td>
						<td>₱1,500</td>
						<td>₱2,500</td>
						<td class="green">40%</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- SECTION 3: OPEX CARD MATERIALS -->
	<section id="opex-card" class="inventory-section">
		<div class="section-header">
			<span class="icon">🎴</span>
			<h2>3. OPEX: Card Production Materials</h2>
		</div>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>SKU / Item</th>
						<th>Unit Size</th>
						<th>Purchase Price</th>
						<th>Yield</th>
						<th>Cost/ID</th>
						<th>Min Stock</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>PVC Dragon Sheets</strong></td>
						<td>Box (50 Sets)</td>
						<td>₱1,150 - ₱1,250</td>
						<td>500 IDs</td>
						<td class="highlight">₱2.30 - ₱2.50</td>
						<td>5 Boxes</td>
					</tr>
					<tr>
						<td><strong>PET Card Sheets</strong></td>
						<td>Box (50 Sets)</td>
						<td>₱1,250</td>
						<td>500 IDs</td>
						<td class="highlight">₱2.50</td>
						<td>5 Boxes</td>
					</tr>
					<tr>
						<td><strong>Epson 057 Ink (OEM)</strong></td>
						<td>Set (6 Bottles, 70mL)</td>
						<td>₱3,300</td>
						<td>~6,000 sides</td>
						<td class="highlight">₱0.50</td>
						<td>2 Sets</td>
					</tr>
					<tr>
						<td><strong>3rd-Party Sub Ink</strong></td>
						<td>Set (6 Bottles)</td>
						<td>₱1,100</td>
						<td>~4,500 sides</td>
						<td class="highlight">₱0.18</td>
						<td>2 Sets</td>
					</tr>
					<tr>
						<td><strong>Laminate Pouch</strong></td>
						<td>Pack (100pcs)</td>
						<td>₱300</td>
						<td>100 IDs</td>
						<td class="highlight">₱3.00</td>
						<td>5 Packs</td>
					</tr>
				</tbody>
			</table>
		</div>
		<div class="cost-summary">
			<strong>Low-End ID Total COGS:</strong> ₱5.28 - ₱5.80 (PVC + Ink + Laminate + Labor)
		</div>
	</section>

	<!-- SECTION 4: SMART CARD BLANKS -->
	<section id="opex-smart" class="inventory-section">
		<div class="section-header">
			<span class="icon">💳</span>
			<h2>4. OPEX: Smart Card Blanks</h2>
		</div>
		<div class="alert-box">
			<strong>💡 Pro Tip:</strong> Import saves 58-84% vs local suppliers. Lead time: 2-3 weeks via AliExpress.
		</div>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Chip Type</th>
						<th>Frequency</th>
						<th>Local Price</th>
						<th>Import Price</th>
						<th>Savings</th>
						<th>Use Case</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>RFID 125kHz</strong></td>
						<td>125 kHz</td>
						<td>₱6.90/pc</td>
						<td class="green">₱2.90/pc</td>
						<td class="green">58%</td>
						<td>Basic Access</td>
					</tr>
					<tr>
						<td><strong>MIFARE 1K</strong></td>
						<td>13.56 MHz</td>
						<td>₱42.00/pc</td>
						<td class="green">₱11.40/pc</td>
						<td class="green">73%</td>
						<td>Secure Access</td>
					</tr>
					<tr>
						<td><strong>NTAG215</strong></td>
						<td>NFC</td>
						<td>₱48.00/pc</td>
						<td class="green">₱7.50/pc</td>
						<td class="green">84%</td>
						<td>Mobile Tap</td>
					</tr>
					<tr>
						<td><strong>NTAG216</strong></td>
						<td>NFC (888 bytes)</td>
						<td>₱55.00/pc</td>
						<td class="green">₱10.26/pc</td>
						<td class="green">81%</td>
						<td>Premium NFC</td>
					</tr>
					<tr>
						<td><strong>RFID Sticker</strong></td>
						<td>13.56 MHz</td>
						<td>₱12.00/pc</td>
						<td>—</td>
						<td>—</td>
						<td>Retrofit Cards</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- SECTION 5: THERMAL CONSUMABLES -->
	<section id="opex-thermal" class="inventory-section">
		<div class="section-header">
			<span class="icon">🔥</span>
			<h2>5. OPEX: Thermal Printer Consumables</h2>
		</div>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Ribbon Type</th>
						<th>Yield</th>
						<th>Price</th>
						<th>Cost/Card</th>
						<th>Security</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>YMCKO (IDP Standard)</strong></td>
						<td>250 prints</td>
						<td>₱5,500</td>
						<td class="highlight">₱22.00</td>
						<td>❌ None</td>
					</tr>
					<tr>
						<td><strong>YMCKO (Magicard)</strong></td>
						<td>300 prints</td>
						<td>₱5,500</td>
						<td class="highlight">₱18.33</td>
						<td>✅ HoloKote</td>
					</tr>
					<tr>
						<td><strong>YMCK-UV</strong></td>
						<td>250 prints</td>
						<td>₱8,000</td>
						<td class="highlight">₱32.00</td>
						<td>✅ UV Fluoro</td>
					</tr>
					<tr>
						<td><strong>Retransfer Film</strong></td>
						<td>1,000 prints</td>
						<td>₱12,000</td>
						<td class="highlight">₱12.00</td>
						<td>✅ Edge-to-Edge</td>
					</tr>
					<tr>
						<td><strong>UV Ink (Flatbed)</strong></td>
						<td>10,000 cards/L</td>
						<td>₱12,000/L</td>
						<td class="highlight">₱1.20</td>
						<td>✅ Scratch-Proof</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- SECTION 6: LANYARD MATERIALS -->
	<section id="opex-lanyard" class="inventory-section">
		<div class="section-header">
			<span class="icon">🎗️</span>
			<h2>6. OPEX: Lanyard Materials</h2>
		</div>
		<p class="section-note">Standard loop = 0.90m (45cm folded). Prices include 5% waste factor.</p>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Material</th>
						<th>1/2" (12mm)</th>
						<th>3/4" (20mm)</th>
						<th>1" (25mm)</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>Polyester Ribbon</strong></td>
						<td>₱8.50/m</td>
						<td>₱12.00/m</td>
						<td>₱15.50/m</td>
					</tr>
					<tr>
						<td><strong>Sublimation Paper</strong></td>
						<td>₱1.20/m</td>
						<td>₱1.80/m</td>
						<td>₱2.40/m</td>
					</tr>
					<tr>
						<td><strong>Sublimation Ink</strong></td>
						<td>₱0.80/m</td>
						<td>₱1.20/m</td>
						<td>₱1.60/m</td>
					</tr>
					<tr class="total-row">
						<td><strong>Material/Lanyard</strong></td>
						<td><strong>₱9.45</strong></td>
						<td><strong>₱13.50</strong></td>
						<td><strong>₱17.55</strong></td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- SECTION 7: ACCESSORIES -->
	<section id="opex-accessories" class="inventory-section">
		<div class="section-header">
			<span class="icon">🔗</span>
			<h2>7. OPEX: Lanyard Hardware & Accessories</h2>
		</div>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Accessory</th>
						<th>Price (MOQ 500)</th>
						<th>Description</th>
						<th>Popular With</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>Bulldog Clip</strong></td>
						<td>₱3.50/pc</td>
						<td>Basic ID card grip</td>
						<td>Budget</td>
					</tr>
					<tr>
						<td><strong>Swivel J-Hook</strong></td>
						<td>₱4.20/pc</td>
						<td>Rotates 360°, metal</td>
						<td>Office</td>
					</tr>
					<tr>
						<td><strong>Lobster Clasp</strong></td>
						<td>₱5.00/pc</td>
						<td>Premium metal release</td>
						<td>Corporate</td>
					</tr>
					<tr>
						<td><strong>Breakaway Connector</strong></td>
						<td>₱5.80/pc</td>
						<td>Safety release</td>
						<td>Schools ⭐</td>
					</tr>
					<tr>
						<td><strong>Hard Plastic ID Case</strong></td>
						<td>₱5.00/pc</td>
						<td>Card protection</td>
						<td>Field Workers</td>
					</tr>
					<tr>
						<td><strong>PVC ID Holder</strong></td>
						<td>₱14.00/pc</td>
						<td>Transparent sleeve</td>
						<td>Events</td>
					</tr>
				</tbody>
			</table>
		</div>
		<div class="cost-summary">
			<strong>Standard Hardware Total:</strong> ₱9.30 (Bulldog + Breakaway) | <strong>Premium:</strong> ₱19.00 (Lobster + Holder)
		</div>
	</section>

	<!-- SECTION 8: PACKAGING -->
	<section id="opex-packaging" class="inventory-section">
		<div class="section-header">
			<span class="icon">📦</span>
			<h2>8. OPEX: Packaging & Delivery</h2>
		</div>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Item</th>
						<th>Unit</th>
						<th>Price</th>
						<th>Usage</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>Polybags (6x9)</strong></td>
						<td>Pack of 100</td>
						<td>₱80</td>
						<td>Individual ID wrap</td>
					</tr>
					<tr>
						<td><strong>Kraft Envelopes (A5)</strong></td>
						<td>Pack of 50</td>
						<td>₱150</td>
						<td>Class batches</td>
					</tr>
					<tr>
						<td><strong>Corrugated Box (Small)</strong></td>
						<td>Per piece</td>
						<td>₱35</td>
						<td>500+ cards</td>
					</tr>
					<tr>
						<td><strong>Packing Tape</strong></td>
						<td>Roll</td>
						<td>₱45</td>
						<td>Box sealing</td>
					</tr>
					<tr>
						<td><strong>Bubble Wrap (10m)</strong></td>
						<td>Roll</td>
						<td>₱120</td>
						<td>Hardware shipping</td>
					</tr>
					<tr>
						<td><strong>Branded Stickers</strong></td>
						<td>Sheet of 50</td>
						<td>₱100</td>
						<td>Package branding</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- SECTION 9: MAINTENANCE -->
	<section id="opex-maintenance" class="inventory-section">
		<div class="section-header">
			<span class="icon">🔧</span>
			<h2>9. OPEX: Maintenance & Cleaning</h2>
		</div>
		<div class="alert-box warning">
			<strong>⚠️ Preventative Rule:</strong> A dirty printer head costs ₱8,000 to replace. Clean weekly!
		</div>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Item</th>
						<th>Price</th>
						<th>Frequency</th>
						<th>Purpose</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>Cleaning Cards (Thermal)</strong></td>
						<td>₱500/pack (5)</td>
						<td>Monthly</td>
						<td>Thermal head</td>
					</tr>
					<tr>
						<td><strong>Isopropyl Alcohol (99%)</strong></td>
						<td>₱180/500mL</td>
						<td>Weekly</td>
						<td>Laminator rollers</td>
					</tr>
					<tr>
						<td><strong>Lint-Free Cloths</strong></td>
						<td>₱250/pack (50)</td>
						<td>Daily</td>
						<td>General wipe</td>
					</tr>
					<tr>
						<td><strong>Canned Air</strong></td>
						<td>₱350/can</td>
						<td>Weekly</td>
						<td>Dust removal</td>
					</tr>
					<tr>
						<td><strong>Waste Ink Pad Reset</strong></td>
						<td>₱500 (service)</td>
						<td>Quarterly</td>
						<td>Epson maintenance</td>
					</tr>
					<tr>
						<td><strong>Die Cutter Blade</strong></td>
						<td>₱800</td>
						<td>6 months</td>
						<td>Blade replacement</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- SECTION 10: SERVICES -->
	<section id="opex-services" class="inventory-section">
		<div class="section-header">
			<span class="icon">☁️</span>
			<h2>10. Software & Services</h2>
		</div>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Service</th>
						<th>Our Cost</th>
						<th>Sell Price</th>
						<th>Margin</th>
						<th>Provider</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>SMS Credits</strong></td>
						<td>₱0.60/SMS</td>
						<td>₱1.00/SMS</td>
						<td class="green">40%</td>
						<td>OneWaySMS.ph</td>
					</tr>
					<tr>
						<td><strong>SaaS Subscription</strong></td>
						<td>~₱0</td>
						<td>₱10-50/user/yr</td>
						<td class="green">~100%</td>
						<td>Self-Hosted</td>
					</tr>
					<tr>
						<td><strong>Priority Support</strong></td>
						<td>~₱200/mo</td>
						<td>₱500/mo</td>
						<td class="green">60%</td>
						<td>Internal</td>
					</tr>
					<tr>
						<td><strong>API Access</strong></td>
						<td>~₱0</td>
						<td>₱2,000/mo</td>
						<td class="green">~100%</td>
						<td>Self-Hosted</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- SECTION 11: SUPPLIERS -->
	<section id="suppliers" class="inventory-section">
		<div class="section-header">
			<span class="icon">📞</span>
			<h2>11. Supplier Directory</h2>
		</div>
		<div class="supplier-grid">
			<div class="supplier-card preferred">
				<h3>🏆 Primary: Cebu Lanyard Source</h3>
				<ul>
					<li><strong>Products:</strong> Custom lanyards (sublimation)</li>
					<li><strong>Price:</strong> ₱35-40/pc (bulk)</li>
					<li><strong>Lead Time:</strong> 7 days</li>
					<li><strong>MOQ:</strong> 100 pcs</li>
				</ul>
			</div>
			<div class="supplier-card">
				<h3>📦 Materials: Quaff/Shopee</h3>
				<ul>
					<li><strong>Products:</strong> PVC sheets, ink, pouches</li>
					<li><strong>Price:</strong> Various</li>
					<li><strong>Lead Time:</strong> 2-5 days</li>
					<li><strong>Notes:</strong> Check ratings</li>
				</ul>
			</div>
			<div class="supplier-card">
				<h3>🖨️ Thermal: Philcopy Corp.</h3>
				<ul>
					<li><strong>Products:</strong> IDP printers, ribbons</li>
					<li><strong>Warranty:</strong> 3-year local</li>
					<li><strong>Lead Time:</strong> 1-2 weeks</li>
					<li><strong>Notes:</strong> Official distributor</li>
				</ul>
			</div>
			<div class="supplier-card">
				<h3>💳 Smart Cards: AliExpress</h3>
				<ul>
					<li><strong>Products:</strong> RFID, NFC blanks</li>
					<li><strong>Savings:</strong> 58-84% vs local</li>
					<li><strong>Lead Time:</strong> 2-3 weeks</li>
					<li><strong>MOQ:</strong> 100-500 pcs</li>
				</ul>
			</div>
			<div class="supplier-card">
				<h3>📱 Hardware: Samsung/Lazada</h3>
				<ul>
					<li><strong>Products:</strong> Tablets, scanners</li>
					<li><strong>Notes:</strong> Official Mall sellers</li>
					<li><strong>Lead Time:</strong> 2-5 days</li>
					<li><strong>Warranty:</strong> Standard</li>
				</ul>
			</div>
			<div class="supplier-card rush">
				<h3>🚨 Rush Source: Manila</h3>
				<ul>
					<li><strong>Products:</strong> Emergency PVC, supplies</li>
					<li><strong>Price:</strong> Higher (₱146+ samples)</li>
					<li><strong>Lead Time:</strong> 2-3 days (J&T/LBC)</li>
					<li><strong>Use:</strong> Emergencies only</li>
				</ul>
			</div>
		</div>
	</section>

	<footer class="docs-footer">
		<p>Kanaya Inventory Master • Internal Use Only • Updated January 2026</p>
		<p><a href="/admin/docs">← Back to Docs Hub</a></p>
	</footer>
</div>

<style>
	:global(body) { background: #f8fafc; }

	.docs-container {
		max-width: 1100px;
		margin: 2rem auto;
		padding: 3rem;
		background: #fff;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0,0,0,0.06);
		font-family: 'Inter', system-ui, sans-serif;
		color: #1e293b;
	}

	.docs-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		border-bottom: 2px solid #e2e8f0;
		padding-bottom: 2rem;
		margin-bottom: 2rem;
	}

	h1 { font-size: 2rem; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -0.02em; }
	.meta { color: #64748b; font-size: 0.95rem; margin-top: 0.5rem; }

	.status-chip {
		background: #ecfdf5;
		color: #059669;
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-weight: 700;
		font-size: 0.75rem;
		border: 1px solid #a7f3d0;
	}

	/* Quick Stats */
	.quick-stats {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		padding: 1.25rem;
		border-radius: 12px;
		text-align: center;
		border-left: 4px solid;
	}

	.stat-card .label { display: block; font-size: 0.8rem; color: #64748b; margin-bottom: 0.25rem; }
	.stat-card .value { display: block; font-size: 1.5rem; font-weight: 800; }
	.stat-card .sub { display: block; font-size: 0.7rem; color: #94a3b8; margin-top: 0.25rem; }

	.stat-card.blue { background: #eff6ff; border-color: #3b82f6; }
	.stat-card.blue .value { color: #2563eb; }
	.stat-card.green { background: #f0fdf4; border-color: #22c55e; }
	.stat-card.green .value { color: #16a34a; }
	.stat-card.purple { background: #faf5ff; border-color: #a855f7; }
	.stat-card.purple .value { color: #9333ea; }
	.stat-card.amber { background: #fffbeb; border-color: #f59e0b; }
	.stat-card.amber .value { color: #d97706; }

	/* TOC */
	.toc {
		background: #f1f5f9;
		padding: 1.5rem;
		border-radius: 12px;
		margin-bottom: 3rem;
	}

	.toc h2 { font-size: 1rem; color: #475569; margin: 0 0 1rem; font-weight: 700; }

	.toc-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}

	.toc-grid a {
		color: #3b82f6;
		text-decoration: none;
		font-size: 0.85rem;
		font-weight: 500;
	}

	.toc-grid a:hover { text-decoration: underline; }

	/* Sections */
	.inventory-section {
		margin-bottom: 3rem;
		padding-top: 1rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
		border-bottom: 1px solid #e2e8f0;
		padding-bottom: 0.75rem;
	}

	.section-header .icon { font-size: 1.5rem; }
	.section-header h2 { font-size: 1.25rem; font-weight: 800; color: #1e293b; margin: 0; }

	.section-note {
		font-size: 0.85rem;
		color: #64748b;
		margin-bottom: 1rem;
		font-style: italic;
	}

	/* Tables */
	.table-wrapper {
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		overflow: hidden;
		margin-bottom: 1rem;
	}

	table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
	th { background: #f8fafc; padding: 0.9rem 1rem; text-align: left; font-weight: 700; color: #475569; border-bottom: 1px solid #e2e8f0; }
	td { padding: 0.9rem 1rem; border-bottom: 1px solid #f1f5f9; }
	tr:last-child td { border-bottom: none; }
	tr:nth-child(even) { background: #fafbfc; }

	.highlight-row { background: #f0fdf4 !important; }
	.total-row { background: #f1f5f9; font-weight: 700; }

	td.highlight { font-weight: 700; color: #0f172a; }
	td.green, .green { color: #16a34a; font-weight: 700; }

	/* Alert Boxes */
	.alert-box {
		padding: 1rem 1.25rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		font-size: 0.9rem;
		background: #eff6ff;
		color: #1e40af;
		border-left: 4px solid #3b82f6;
	}

	.alert-box.warning {
		background: #fffbeb;
		color: #92400e;
		border-left-color: #f59e0b;
	}

	/* Cost Summary */
	.cost-summary {
		background: #f0fdf4;
		padding: 1rem;
		border-radius: 8px;
		font-size: 0.9rem;
		color: #166534;
		text-align: center;
	}

	/* Supplier Grid */
	.supplier-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.supplier-card {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		padding: 1.25rem;
		border-radius: 10px;
	}

	.supplier-card.preferred {
		background: #f0fdf4;
		border-color: #86efac;
		border-left: 4px solid #22c55e;
	}

	.supplier-card.rush {
		background: #fef2f2;
		border-color: #fecaca;
		border-left: 4px solid #ef4444;
	}

	.supplier-card h3 { font-size: 0.95rem; margin: 0 0 0.75rem; color: #1e293b; }
	.supplier-card ul { margin: 0; padding-left: 1.25rem; font-size: 0.85rem; color: #475569; }
	.supplier-card li { margin-bottom: 0.25rem; }

	/* Footer */
	.docs-footer {
		margin-top: 4rem;
		text-align: center;
		font-size: 0.8rem;
		color: #94a3b8;
		border-top: 1px solid #e2e8f0;
		padding-top: 2rem;
	}

	.docs-footer a { color: #64748b; text-decoration: none; font-weight: 600; }
	.docs-footer a:hover { text-decoration: underline; }

	/* Responsive */
	@media (max-width: 900px) {
		.quick-stats { grid-template-columns: repeat(2, 1fr); }
		.toc-grid { grid-template-columns: 1fr 1fr; }
		.supplier-grid { grid-template-columns: 1fr; }
	}

	@media (max-width: 600px) {
		.docs-container { padding: 1.5rem; }
		.quick-stats { grid-template-columns: 1fr; }
		.toc-grid { grid-template-columns: 1fr; }
		.docs-header { flex-direction: column; gap: 1rem; }
	}
</style>
