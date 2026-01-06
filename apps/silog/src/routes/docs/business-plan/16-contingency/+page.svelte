<svelte:head>
	<title>Contingency Plan | KUYA'S SILOG & LUGAW</title>
</svelte:head>

<section class="doc-page">
	<header class="doc-header">
		<h1>16 Contingency<br><span class="highlight">Plan</span></h1>
		<p class="tagline">Protocols para sa emergencies sa Bohol</p>
	</header>

	<article class="content">
		<h2>🕯️ 16.1 Brownout Protocol</h2>
		<p class="section-intro">Tagbilaran naay unexpected outages. Be ready.</p>

		<div class="protocol-card">
			<h4>💡 LIGHTS</h4>
			<p>I-on ang Rechargeable Emergency Bulb (naka-plug in pirme sa ZONE C).</p>
			<div class="script-box">
				<span class="label">Bisaya:</span>
				<span class="script">"Kuhaa ang emergency light sa Zone C."</span>
			</div>
		</div>

		<div class="protocol-card critical">
			<h4>❄️ FREEZER - CRITICAL</h4>
			<p><strong>AYAW ABRIHI</strong> ang freezer door. Full freezer stays cold 4-6 hours if closed.</p>
			<div class="rule-box">Kung brownout > 4 hours: Palit'g ice blocks ug ibutang sulod.</div>
			<div class="script-box">
				<span class="label">Bisaya:</span>
				<span class="script">"Ayaw jud abrihi ang freezer. Mas dugay mabugnaw kung dili pag-abrihi."</span>
			</div>
		</div>

		<div class="protocol-card">
			<h4>🌬️ VENTILATION</h4>
			<p>Exhaust fan mu-stop. Abrihi ang service window fully. Minimize high-smoke cooking (Tapa/Dried Fish).</p>
			<div class="script-box">
				<span class="label">Bisaya:</span>
				<span class="script">"Abrihi gyud ang bintana. Ayaw'g luto'g tapa o dried fish kay dakog aso."</span>
			</div>
		</div>

		<div class="protocol-card">
			<h4>🍚 RICE (Electric → Gas)</h4>
			<p>Shift to Gas Pot Method. <strong>Ratio: 1 Cup Rice : 1 Cup Water</strong></p>
			<ul>
				<li>Boil sa gas stove</li>
				<li>Kung nag-boil na, i-lowest ang fire</li>
				<li>Steam for 15 minutes. Ayaw tangtanga ang takob!</li>
			</ul>
			<div class="script-box">
				<span class="label">Bisaya:</span>
				<span class="script">"Lutua ang kan-on sa gas. 1:1 ratio. Pabukal, dayon low fire 15 mins."</span>
			</div>
		</div>

		<div class="divider"></div>

		<h2>💧 16.2 Water Interruption</h2>
		<p class="section-intro">Kung mawala ang tubig sa gripo.</p>

		<div class="protocol-card water">
			<h4>🛢️ THE "RED BARREL"</h4>
			<p>Maintain a 50L plastic drum of tap water sa likod. Pun-on pirme kada gabii.</p>
			<div class="script-box">
				<span class="label">Bisaya:</span>
				<span class="script">"Siguraduhon nga puno pirme ang red barrel. Mao na atong backup nga tubig."</span>
			</div>
		</div>

		<div class="protocol-card">
			<h4>🧽 DISHWASHING</h4>
			<p>Switch to "Bucket Mode" - 3-Basin System:</p>
			<div class="basin-row">
				<span class="basin">1️⃣ Soapy</span>
				<span class="basin">2️⃣ Rinse</span>
				<span class="basin">3️⃣ Final</span>
			</div>
			<div class="script-box">
				<span class="label">Bisaya:</span>
				<span class="script">"Gamita ang 3-basin system. Tipid sa tubig."</span>
			</div>
		</div>

		<div class="protocol-card warning">
			<h4>📦 MENU LOCK</h4>
			<p>If critical, stop plate-heavy meals. <strong>Push Takeout Boxes ONLY</strong> (no washing required).</p>
			<div class="script-box">
				<span class="label">Bisaya:</span>
				<span class="script">"Kung grabe na ang tubig situation, takeout lang ta. Box ra tanan."</span>
			</div>
		</div>

		<div class="divider"></div>

		<div class="highlight-box">
			<h3>📞 Emergency Numbers (Tagbilaran)</h3>
			<ul>
				<li><strong>Emergency:</strong> 911</li>
				<li><strong>Bureau of Fire:</strong> (038) 411-3131</li>
				<li><strong>PNP Tagbilaran:</strong> (038) 411-3017</li>
				<li><strong>BOHECO I (Power):</strong> (038) 411-3356</li>
				<li><strong>BWUD (Water):</strong> (038) 411-5008</li>
			</ul>
		</div>
	</article>
</section>

<style>
	.doc-page { max-width: 900px; margin: 0 auto; padding: 4rem 2rem; background: white; min-height: 100vh; font-family: 'Inter', sans-serif; color: #334155; }
	.doc-header h1 { font-size: 5rem; line-height: 0.9; margin-bottom: 1rem; color: #0f172a; }
	.highlight { color: white; background: #0f172a; padding: 0 1rem; }
	.tagline { font-size: 1.1rem; color: #64748b; margin-bottom: 4rem; }
	@media(max-width:600px) { .doc-header h1 { font-size: 3rem; }}

	h2 { border-left: 6px solid #0f172a; padding-left: 1rem; margin-bottom: 1.5rem; margin-top: 3rem; color: #1e293b; font-size: 1.5rem; font-weight: 700; }
	p { font-size: 1.05rem; line-height: 1.6; margin-bottom: 1rem; color: #3f3f46; }
	.section-intro { color: #64748b; font-size: 0.95rem; }
	.divider { height: 2px; background: #e4e4e7; margin: 3rem 0; }

	.protocol-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
	.protocol-card.critical { background: #fef2f2; border: 2px solid #f87171; }
	.protocol-card.water { background: #eff6ff; border: 2px solid #3b82f6; }
	.protocol-card.warning { background: #fffbeb; border: 2px solid #f59e0b; }
	.protocol-card h4 { margin: 0 0 0.75rem 0; font-size: 1.1rem; color: #0f172a; }
	.protocol-card ul { margin: 0.5rem 0 1rem 1.25rem; font-size: 0.95rem; }

	.rule-box { background: #fbbf24; color: #0f172a; padding: 0.75rem; border-radius: 6px; font-size: 0.9rem; font-weight: 600; margin: 0.75rem 0; }

	.script-box { background: #0f172a; border-radius: 6px; padding: 0.75rem 1rem; margin-top: 0.75rem; }
	.script-box .label { font-size: 0.7rem; text-transform: uppercase; font-weight: 700; color: #94a3b8; margin-right: 0.5rem; }
	.script-box .script { font-size: 0.9rem; color: #fbbf24; font-style: italic; }

	.basin-row { display: flex; gap: 0.5rem; margin: 0.75rem 0; }
	.basin { flex: 1; text-align: center; padding: 0.5rem; background: #dbeafe; border-radius: 6px; font-size: 0.85rem; font-weight: 600; color: #1d4ed8; }

	.highlight-box { border: 2px solid #0f172a; padding: 2rem; background: white; box-shadow: 6px 6px 0px #ef4444; margin: 2rem 0; }
	.highlight-box h3 { font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem; color: #0f172a; }
	.highlight-box ul { margin: 0; padding-left: 1.25rem; }
	.highlight-box li { margin-bottom: 0.5rem; }
</style>
