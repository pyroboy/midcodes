<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Strategic Procurement Analysis | Kanaya Admin</title>
</svelte:head>

<div class="docs-container">
	<header class="docs-header">
		<div class="header-top">
			<h1>Strategic Procurement Analysis</h1>
			<span class="badge">Market Intelligence</span>
		</div>
		<p class="meta">Scope: Identity Credentialing Infrastructure in the Philippine Market</p>
		<p class="subject">
			Subject: High-End vs. Low-End Architectures, UV Technology, and Supply Chain Matrices
		</p>
	</header>

	<nav class="toc">
		<h2>Report Index</h2>
		<ol>
			<li><a href="#executive">1. Executive Intelligence</a></li>
			<li><a href="#highend">2. The High-End Ecosystem (Thermal)</a></li>
			<li><a href="#lowend">3. The Low-End Disruption (Inkjet)</a></li>
			<li><a href="#uv">4. The UV Frontier (Security vs. Curing)</a></li>
			<li><a href="#materials">5. Raw Materials Supply Chain</a></li>
			<li><a href="#economics">6. Operational Economics (OPEX)</a></li>
			<li><a href="#suppliers">7. Strategic Supplier List</a></li>
		</ol>
	</nav>

	<section id="executive">
		<h2>1. Executive Intelligence and Market Architecture</h2>
		<p>
			The contemporary landscape of identity credentialing in the Philippines is defined by a rigorous
			bifurcation between institutional-grade thermal transfer technologies and an increasingly sophisticated
			"gray market" of modified consumer inkjet solutions.
		</p>
		<p>
			This document serves as a comprehensive supplier and technology index, synthesizing pricing, feature
			sets, and supply chain reliability. It dissects the technical specifications of key market
			players—from the industrial robustness of IDP and Magicard to the disruptive economics of the Epson
			L8050 series—providing a granular roadmap for establishing a resilient ID production facility.
		</p>
	</section>

	<section id="highend">
		<h2>2. The High-End Security Ecosystem</h2>
		<p class="subtext">Direct-to-Card (DTC) and Retransfer Technologies.</p>

		<div class="content-block">
			<h3>2.1 Direct-to-Card (DTC): The Corporate Standard</h3>
			<p>
				DTC technology utilizes a thermal printhead to heat specific panels of a ribbon (YMCKO). The defining
				characteristic is the "Overlay" (O) panel, a clear protective layer that shields the card from UV
				fading and abrasion.
			</p>

			<h4>2.1.1 IDP Smart Series (Philcopy)</h4>
			<p>
				<strong>IDP Smart-51S:</strong> The flagship single-sided printer (~17 sec/card). Known for metal chassis
				construction and native support for UV fluorescent ribbons (YMCKFO), specifically Part #659380. This
				allows for covert security features invisible to standard scanners.
			</p>
			<p>
				<strong>IDP Smart-31S:</strong> Cost-reduced alternative for branch offices. Slower speed (23 sec/card) but
				maintains security feature compatibility.
			</p>

			<h4>2.1.2 Magicard (HoloKote)</h4>
			<p><strong>Magicard 300 NEO:</strong> Standard enterprise unit.</p>
			<p>
				<strong>Magicard 600 NEO:</strong> Offers <strong>600 dpi resolution</strong>, enabling "micro-text" (text
				smaller than 6pt) which acts as a Level 2 security feature.
			</p>
			<p>
				<strong>HoloKote:</strong> Exploits the Overlay panel physics to burn a watermark pattern without extra cost.
				The 600 NEO allows for Custom HoloKote (Client Logo).
			</p>
		</div>

		<h3>Table 1: High-End Printer Analysis</h3>
		<table class="data-table">
			<thead>
				<tr>
					<th>Supplier</th>
					<th>Model</th>
					<th>Technology</th>
					<th>Est. Price (PHP)</th>
					<th>Key Feature</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Philcopy</td>
					<td>IDP Smart-51S</td>
					<td>DTC</td>
					<td>₱117,000</td>
					<td>UV Ribbon (YMCKFO) Support</td>
				</tr>
				<tr>
					<td>Philcopy</td>
					<td>IDP Smart-31S</td>
					<td>DTC</td>
					<td>₱61,020 - ₱63,720</td>
					<td>Branch Office Compact</td>
				</tr>
				<tr>
					<td>CCS</td>
					<td>Magicard 600 NEO</td>
					<td>DTC</td>
					<td>₱89,000 (Promo)</td>
					<td>600 dpi Micro-text</td>
				</tr>
				<tr>
					<td>CCS</td>
					<td>Magicard 300 NEO</td>
					<td>DTC</td>
					<td>₱69,000 (Promo)</td>
					<td>HoloKote Watermark</td>
				</tr>
				<tr>
					<td>CCS</td>
					<td>Magicard Prima 4</td>
					<td>Retransfer</td>
					<td>₱230,650</td>
					<td>Over-the-Edge / Chip Protection</td>
				</tr>
				<tr>
					<td>CCS</td>
					<td>DNP 600</td>
					<td>Retransfer</td>
					<td>₱354,330</td>
					<td>Heavy Duty Industrial</td>
				</tr>
			</tbody>
		</table>
	</section>

	<section id="lowend">
		<h2>3. The Low-End Disruption: Modified Inkjet</h2>
		<div class="alert-box">
			<strong>Technical Note:</strong> These printers use a modified "CD/DVD Printing Mode" to print onto a specialized tray
			holding two cards. Manual intervention is required every 2 cards.
		</div>

		<h3>3.1 The Epson L8050 and L18050 Paradigm</h3>
		<p>
			The current market standards are the Epson L8050 (A4 size) and L18050 (A3+ size). These printers
			utilize Epson’s Micro Piezo printhead technology, originally designed for high-fidelity photo printing
			on paper.
		</p>

		<h4>3.1.1 The Modification Mechanism</h4>
		<p>
			These devices are not sold by Epson as ID card printers. The "modification" relies on a specific
			accessory: the ID Card Tray.
		</p>
		<ul>
			<li>
				<strong>Workflow:</strong> The printer's firmware includes a mode for printing on CD/DVDs. Third-party
				manufacturers produce a plastic tray with the same dimensions as a CD tray but cutouts for two (2)
				standard CR-80 PVC cards.
			</li>
			<li>
				<strong>Process:</strong> The operator places two "Inkjet-Printable" PVC cards into the tray, inserts it
				into the CD slot, and prints using the CD printing mode.
			</li>
			<li>
				<strong>Throughput Limitations:</strong> Unlike the automatic hoppers of the IDP Smart series (100+
				cards), this is a manual process. The operator must physically load and unload the tray every two
				cards, severely limiting throughput for large batches.
			</li>
		</ul>

		<h4>3.1.2 Economic Disruption: The "Piso Print"</h4>
		<p>
			The driving force behind this adoption is the sheer disparity in consumable costs.
		</p>
		<ul>
			<li>
				<strong>Thermal Economics:</strong> A typical YMCKO ribbon costs ~₱5,500 and yields ~250 prints,
				resulting in a print cost of roughly ₱22.00 per side.
			</li>
			<li>
				<strong>Inkjet Economics:</strong> A set of generic 6-color dye inks costs roughly ₱1,500 and can
				print thousands of cards. The ink cost per card is often &lt; ₱1.00 per side even with genuine Epson
				057 ink bottles (₱300–₱700 each).
			</li>
		</ul>

		<h3>3.2 The "Barn.ph" and Shopee Supply Chain</h3>
		<p>
			The report references "Barn.ph" in the context of Shopee sellers, but the dominant brands for ID
			supplies are Quaff and Cuyi.
		</p>
		<ul>
			<li>
				<strong>Gray Market:</strong> These sellers typically provide limited "shop warranty" rather than
				manufacturer-backed service.
			</li>
			<li>
				<strong>Raw Material Availability:</strong> They are the primary source for "Inkjet Printable PVC," a
				specific raw material coated with a hydrophilic layer to accept aqueous ink. Standard PVC cards from
				CCS/Philcopy will not work in these Epson printers.
			</li>
		</ul>

		<h4>Table 2. Low-End Printer and Modifier Pricing</h4>
		<table class="data-table">
			<thead>
				<tr>
					<th>Supplier</th>
					<th>Model</th>
					<th>Technology</th>
					<th>Price (PHP)</th>
					<th>UV Capability</th>
					<th>Features</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Shopee / Lazada</td>
					<td>Epson L8050</td>
					<td>Inkjet (6-Color)</td>
					<td>₱15,985–₱18,300</td>
					<td>No*</td>
					<td>High Res Photo, WiFi, Cheap Ink</td>
				</tr>
				<tr>
					<td>Shopee / Lazada</td>
					<td>Epson L18050</td>
					<td>Inkjet (A3+)</td>
					<td>₱28,925–₱31,000</td>
					<td>No*</td>
					<td>A3 Size Sheets, High Volume Tank</td>
				</tr>
				<tr>
					<td>Shopee</td>
					<td>ID Card Tray</td>
					<td>Accessory</td>
					<td>₱300–₱1,400</td>
					<td>N/A</td>
					<td>Essential mod for L8050/L18050</td>
				</tr>
				<tr>
					<td>Shopee (Generic)</td>
					<td>Generic L800</td>
					<td>Inkjet (Old Gen)</td>
					<td>~₱18,000</td>
					<td>No</td>
					<td>Older model, often refurbished</td>
				</tr>
			</tbody>
		</table>
		<p class="note">
			*"UV" here, when advertised by ink vendors, usually means UV-resistant (fade resistant), not
			UV-fluorescent security printing.
		</p>
	</section>

	<section id="uv">
		<h2>4. The UV Frontier: Differentiating Security from Flatbeds</h2>
		<p>
			A critical ambiguity in the requirement—"ID card printer with UV"—requires precise technical
			decoupling. In the ID industry, "UV" refers to two completely different technologies with different
			costs and applications.
		</p>

		<h3>4.1 Scenario A: UV for Security (Fluorescence)</h3>
		<p>
			This is the domain of the High-End Thermal Printers (IDP/Magicard, etc.).
		</p>
		<ul>
			<li><strong>Mechanism:</strong> Specialized ribbon (YMCKFO or YMCK-UV) transfers a clear material that
				fluoresces under 365nm UV light.
			</li>
			<li><strong>Application:</strong> Anti-counterfeiting. A guard shines a UV torch to reveal a hidden logo
				or pattern.
			</li>
			<li><strong>Procurement:</strong> Requires IDP Smart-51S or Magicard Prima 4 (or similar).
			</li>
		</ul>

		<h3>4.2 Scenario B: UV for Curing (Flatbed Printing)</h3>
		<p>
			This is the domain of industrial UV Flatbed Printers, often utilizing the Epson XP600 printhead.
		</p>
		<ul>
			<li>
				<strong>Mechanism:</strong> Liquid ink is cured instantly by a UV LED lamp. The UV refers to the
				curing method, not visibility.
			</li>
			<li>
				<strong>Application:</strong> Durability and texture—hardened, solvent-resistant ink that can be
				layered for 3D emboss effects.
			</li>
			<li>
				<strong>Pricing:</strong> Entry A4 flatbeds with XP600 heads start around ₱65,000 and scale past
				₱400,000 for large-format units.
			</li>
		</ul>

		<h4>Table 3. UV Flatbed Options (Industrial/Versatile)</h4>
		<table class="data-table">
			<thead>
				<tr>
					<th>Supplier</th>
					<th>Model</th>
					<th>Printhead</th>
					<th>Price (PHP)</th>
					<th>UV Type</th>
					<th>Target Use</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Shopee (Generic)</td>
					<td>A4 UV Flatbed</td>
					<td>Epson XP600</td>
					<td>₱65,000–₱100,000</td>
					<td>Cured (LED Lamp)</td>
					<td>Gift Shops, Phone Cases, Durable IDs</td>
				</tr>
				<tr>
					<td>Photolock</td>
					<td>Cuyi 9060 UV</td>
					<td>Epson F1080/XP600</td>
					<td>₱468,000</td>
					<td>Cured (LED Lamp)</td>
					<td>Industrial Signage, Volume Production</td>
				</tr>
				<tr>
					<td>Shopee</td>
					<td>Generic A3 UV</td>
					<td>Epson XP600</td>
					<td>~₱22,020 (Deposit)</td>
					<td>Cured (LED Lamp)</td>
					<td>Small Biz Versatility</td>
				</tr>
			</tbody>
		</table>
	</section>

	<section id="raw-materials">
		<h2>5. Raw Materials: The Substrate Supply Chain</h2>
		<p>
			The choice of printer dictates the entire supply chain for raw materials. A procurement error (e.g.,
			buying standard PVC for an Epson L8050) will result in total production failure.
		</p>

		<h3>5.1 Card Substrates</h3>
		<ul>
			<li>
				<strong>Standard PVC (CR-80):</strong> Compatible only with thermal (IDP/Magicard) and UV flatbed
				printers.
			</li>
			<li>
				<strong>Inkjet Printable PVC:</strong> Coated with a chemical reception layer. Compatible only with
				Epson L8050/L18050-type printers.
			</li>
			<li>
				<strong>PET / Composite Cards:</strong> Required for Retransfer printers or laminating printers to
				prevent heat warping.
			</li>
		</ul>

		<h3>5.2 Smart Cards (Proximity and RFID)</h3>
		<ul>
			<li>
				<strong>125 kHz Proximity:</strong> Simple tap cards. Thin ISO versions are printable; clamshell
				versions are not.
			</li>
			<li>
				<strong>13.56 MHz Mifare:</strong> Higher security, read/write. Includes Mifare 1K and Desfire EV2
				variants.
			</li>
		</ul>

		<h3>5.3 Magnetic Stripe Cards</h3>
		<p>
			HiCo magstripe remains important for loyalty and legacy systems.
		</p>

		<h4>Table 4. Raw Materials Pricing and Compatibility Matrix</h4>
		<table class="data-table">
			<thead>
				<tr>
					<th>Category</th>
					<th>Type</th>
					<th>Compatible Printers</th>
					<th>Supplier</th>
					<th>Price (PHP)</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Card Substrate</td>
					<td>Standard PVC CR-80</td>
					<td>IDP, Magicard, UV Flatbed</td>
					<td>CCS, Philcopy</td>
					<td>₱4.80–₱5.00 / pc</td>
				</tr>
				<tr>
					<td>Card Substrate</td>
					<td>Inkjet Coated PVC</td>
					<td>Epson L8050/L18050</td>
					<td>Shopee (Quaff)</td>
					<td>₱4.00–₱5.00 / pc</td>
				</tr>
				<tr>
					<td>Smart Card</td>
					<td>125kHz Proximity (Thin)</td>
					<td>All*</td>
					<td>CCS, Yale</td>
					<td>₱24.00–₱30.00 / pc</td>
				</tr>
				<tr>
					<td>Smart Card</td>
					<td>Mifare 1K (13.56MHz)</td>
					<td>All*</td>
					<td>CCS</td>
					<td>₱30.00–₱42.00 / pc</td>
				</tr>
				<tr>
					<td>Smart Card</td>
					<td>Mifare Desfire EV2</td>
					<td>All*</td>
					<td>CCS</td>
					<td>₱174.00 / pc</td>
				</tr>
				<tr>
					<td>Magstripe</td>
					<td>HiCo (3-Track)</td>
					<td>All*</td>
					<td>AllCard, Shopee</td>
					<td>₱12.80–₱15.00 / pc</td>
				</tr>
			</tbody>
		</table>
		<p class="note">
			*Physical fit only; inkjet printers still require inkjet-compatible surfaces on smart cards.
		</p>
	</section>

	<section id="consumables">
		<h2>6. Consumables and Operational Economics</h2>
		<p>
			Operational expenditure (OPEX) often inversely correlates with capital expenditure (CAPEX). Thermal
			printers have higher consumable costs; inkjet and UV systems have cheaper ink but higher maintenance
			and manual labor components.
		</p>

		<h3>6.1 Thermal Ribbons (High OPEX)</h3>
		<ul>
			<li><strong>YMCKO Ribbon (IDP):</strong> ~₱5,500 / 250 prints → ~₱22.00 per card.</li>
			<li><strong>YMCKFO UV Ribbon (IDP):</strong> ~₱6,000+ / 200 prints → ≥₱30.00 per card.</li>
			<li><strong>HoloKote (Magicard):</strong> No extra consumable; uses standard overlay.</li>
		</ul>

		<h3>6.2 Inkjet Inks (Low OPEX)</h3>
		<ul>
			<li>
				<strong>Epson 057 Ink:</strong> Genuine bottles ~₱300–₱700 each; full set &lt;₱2,000 with thousands
				of prints.
			</li>
			<li><strong>UV Curable Ink (XP600):</strong> ~₱1,200 for 500ml; still low cost per square inch.
			</li>
		</ul>

		<h4>Table 5. Consumable Cost Analysis</h4>
		<table class="data-table">
			<thead>
				<tr>
					<th>Printer Ecosystem</th>
					<th>Consumable</th>
					<th>Supplier</th>
					<th>Unit Price (PHP)</th>
					<th>Yield</th>
					<th>Est. Cost/Card</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>IDP Smart-51</td>
					<td>YMCKO Ribbon</td>
					<td>Philcopy</td>
					<td>₱4,700–₱5,500</td>
					<td>250</td>
					<td>~₱22.00</td>
				</tr>
				<tr>
					<td>IDP Smart-51</td>
					<td>YMCKFO UV Ribbon</td>
					<td>Philcopy</td>
					<td>₱6,000+</td>
					<td>200</td>
					<td>≥₱30.00</td>
				</tr>
				<tr>
					<td>Magicard 300</td>
					<td>YMCKO Ribbon</td>
					<td>CCS</td>
					<td>₱5,500</td>
					<td>300</td>
					<td>~₱18.33</td>
				</tr>
				<tr>
					<td>Magicard Prima</td>
					<td>YMCK-UV Ribbon</td>
					<td>CCS</td>
					<td>~₱25,000</td>
					<td>750</td>
					<td>~₱33.00</td>
				</tr>
				<tr>
					<td>Epson L8050</td>
					<td>057 Dye Ink (Set)</td>
					<td>Shopee</td>
					<td>₱1,500–₱2,000</td>
					<td>2,000+ cards</td>
					<td>~₱0.75–₱1.00</td>
				</tr>
				<tr>
					<td>XP600 Flatbed</td>
					<td>UV Curable Ink (500ml)</td>
					<td>Shopee</td>
					<td>₱1,200</td>
					<td>High</td>
					<td>Varies</td>
				</tr>
			</tbody>
		</table>
	</section>

	<section id="suppliers">
		<h2>7. Strategic Supplier List and Procurement Recommendations</h2>

		<h3>7.1 Supplier Profiles</h3>
		<ul class="bullet-list">
			<li>
				<strong>Philcopy Corporation:</strong> Definitive source for IDP. Best for nationwide support and
				warranty. "Safe" choice for corporate fleets.
			</li>
			<li>
				<strong>Competitive Card Solutions (CCS):</strong> Specialist for Magicard, DNP, and smart materials.
				Ideal for complex security projects.
			</li>
			<li>
				<strong>Shopee/Lazada (Barn/Quaff/Cuyi):</strong> Low-end supply chain. Only source for Epson
				modifications and inkjet PVC materials; weaker warranty.
			</li>
			<li>
				<strong>International (CardLogix/AlphaCard):</strong> US-based, advanced solutions but with import
				complexity and minimal local service.
			</li>
		</ul>

		<h3>7.2 Recommendations</h3>
		<ul class="bullet-list">
			<li>
				<strong>Government / Banking (High Security):</strong> Magicard Prima 4 or IDP Smart-51S. Prima for
				best over-the-edge and chip protection; Smart-51S as solid UV mid-range.
			</li>
			<li>
				<strong>Corporate / Education (Mid-Range):</strong> Magicard 300 NEO or IDP Smart-31S. HoloKote on the
				300 reduces TCO.
			</li>
			<li>
				<strong>Service Bureaus / Retail (Low Cost):</strong> Epson L18050 or XP600 UV Flatbed. Epson for
				"Piso Print" economics; flatbed for premium embossed products.
			</li>
		</ul>

		<h4>Table 6. Master Supplier Contact List</h4>
		<table class="data-table">
			<thead>
				<tr>
					<th>Supplier</th>
					<th>Primary Brands</th>
					<th>Website / Platform</th>
					<th>Focus Area</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Philcopy Corporation</td>
					<td>IDP, Kyocera</td>
					<td>philcopy.net</td>
					<td>Corporate/Gov, Warranty Support</td>
				</tr>
				<tr>
					<td>Competitive Card Solutions</td>
					<td>Magicard, DNP, Zebra</td>
					<td>ccs.com.ph</td>
					<td>High Security, Smart Cards, Retransfer</td>
				</tr>
				<tr>
					<td>Shopee (Generic/Quaff)</td>
					<td>Epson Mods, Cuyi, Quaff</td>
					<td>shopee.ph</td>
					<td>Low Cost, Inkjet PVC, Flatbeds</td>
				</tr>
				<tr>
					<td>CardLogix</td>
					<td>CardLogix, BIOSID</td>
					<td>cardlogix.com</td>
					<td>Biometric/Chip Solutions (Import)</td>
				</tr>
				<tr>
					<td>AlphaCard</td>
					<td>AlphaCard, Fargo</td>
					<td>alphacard.com</td>
					<td>US Import, Complete Systems</td>
				</tr>
			</tbody>
		</table>
	</section>

	<section id="conclusion">
		<h2>8. Conclusion</h2>
		<p>
			The Philippine ID issuance market is not monolithic. The "Low-End" Epson inkjet modification offers
			an unbeatable entry price and operating cost (&lt;₱1.00/card) but sacrifices security and automation. The
			"High-End" thermal ecosystem (IDP/Magicard) demands higher capital and operating costs (~₱20.00/card)
			but delivers the speed, security (UV/HoloKote), and durability required for institutional credentials.
		</p>
		<p>
			For the specific requirement of "UV," the buyer must decide between <strong>Covert Security</strong>
			(IDP/Magicard with specialized ribbons) or <strong>Overt Durability</strong> (XP600 Flatbed with
			UV-cured ink). This distinction is the pivot point upon which the entire procurement strategy—from
			printer selection to raw material sourcing—must turn.
		</p>
		<p class="closing">End of Report</p>
	</section>

	<footer class="docs-footer">
		<p>Kanaya Strategic Procurement Dossier • Internal Use Only</p>
		<p><a href="/admin/docs">← Back to Documentation Hub</a></p>
	</footer>
</div>

<style>
	.docs-container {
		max-width: 960px;
		margin: 0 auto;
		padding: 2rem;
		font-family: 'Segoe UI', system-ui, sans-serif;
		color: #1a202c;
		line-height: 1.7;
	}

	.docs-header {
		border-bottom: 3px solid #4a5568;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
	}

	.docs-header h1 {
		margin: 0;
		font-size: 1.8rem;
		color: #2d3748;
	}

	.meta {
		color: #718096;
		font-size: 0.9rem;
		margin-top: 0.25rem;
	}

	.subject {
		margin-top: 0.25rem;
		font-weight: 600;
		color: #4a5568;
	}

	.toc {
		background: #edf2f7;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 3rem;
	}

	.toc h2 {
		margin: 0 0 1rem;
		font-size: 1.1rem;
		color: #2d3748;
	}

	.toc ol {
		margin: 0;
		padding-left: 1.5rem;
	}

	.toc a {
		color: #2b6cb0;
		text-decoration: none;
		font-weight: 500;
	}

	.toc a:hover {
		text-decoration: underline;
	}

	section {
		margin-bottom: 3rem;
	}

	h2 {
		font-size: 1.4rem;
		border-left: 5px solid #4a5568;
		padding-left: 1rem;
		margin-bottom: 1.25rem;
		color: #1a202c;
	}

	h3 {
		font-size: 1.15rem;
		margin-top: 1.5rem;
		margin-bottom: 0.5rem;
		color: #2d3748;
	}

	h4 {
		font-size: 1rem;
		margin-top: 1.25rem;
		margin-bottom: 0.5rem;
		color: #4a5568;
	}

	p {
		margin: 0.5rem 0;
	}

	ul,
	ol {
		margin: 0.5rem 0 0.75rem;
		padding-left: 1.5rem;
	}

	li {
		margin-bottom: 0.25rem;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		margin: 1rem 0 2rem;
		font-size: 0.9rem;
	}

	.data-table th,
	.data-table td {
		border: 1px solid #e2e8f0;
		padding: 0.6rem 0.75rem;
		text-align: left;
		vertical-align: top;
	}

	.data-table th {
		background: #2d3748;
		color: #f7fafc;
		font-weight: 600;
	}

	.data-table tbody tr:nth-child(even) {
		background: #f7fafc;
	}

	.note {
		font-size: 0.85rem;
		color: #718096;
		margin-top: -0.5rem;
		margin-bottom: 1.5rem;
	}

	.bullet-list li {
		margin-bottom: 0.4rem;
	}

	.closing {
		margin-top: 1.5rem;
		font-style: italic;
		color: #4a5568;
	}

	.docs-footer {
		margin-top: 3rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e2e8f0;
		text-align: center;
		font-size: 0.9rem;
		color: #a0aec0;
	}

	.docs-footer a {
		color: #2b6cb0;
		text-decoration: none;
	}

	.docs-footer a:hover {
		text-decoration: underline;
	}
</style>
