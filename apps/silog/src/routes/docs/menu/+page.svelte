<svelte:head>
	<title>Silog Business | Menu Engineering</title>
</svelte:head>

<section class="doc-page">
	<a href="/" class="back-link">← Back to Dashboard</a>
	
	<header>
		<h1>Menu Engineering & Profitability</h1>
		<p class="meta">Detailed COGS breakdown per item.</p>
	</header>

	<article class="content">
		
		<div class="highlight-box red">
			<h3>The "Base Plate" Cost</h3>
			<p>Every silog meal incurs a fixed deduction of <strong>₱21.00</strong> before the viand is added.</p>
			<ul>
				<li>Rice (200g): ₱4.00</li>
				<li>Egg: ₱8.00</li>
				<li>Oil, Gas, Condiments: ₱6.00</li>
				<li>Packaging: ₱3.00</li>
			</ul>
		</div>

		<h3>🏆 High Profit "Winners" (>50% Margin)</h3>
		<table class="menu-table">
			<thead>
				<tr>
					<th>Item</th>
					<th>SRP</th>
					<th>Viand Cost</th>
					<th>Total COGS</th>
					<th>Net Profit</th>
					<th>Margin</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Longsilog</td>
					<td>₱85</td>
					<td>₱16</td>
					<td>₱37</td>
					<td class="profit">₱48</td>
					<td class="high-margin">56.5%</td>
				</tr>
				<tr>
					<td>Squidsilog</td>
					<td>₱100</td>
					<td>₱24</td>
					<td>₱45</td>
					<td class="profit">₱55</td>
					<td class="high-margin">55.0%</td>
				</tr>
				<tr>
					<td>Shanghai Rice</td>
					<td>₱85</td>
					<td>₱18</td>
					<td>₱39</td>
					<td class="profit">₱46</td>
					<td class="high-margin">54.1%</td>
				</tr>
                <tr>
					<td>Chicken Tapa</td>
					<td>₱95</td>
					<td>₱24</td>
					<td>₱45</td>
					<td class="profit">₱50</td>
					<td class="high-margin">52.6%</td>
				</tr>
			</tbody>
		</table>

        <h3>📊 Standard Volume Drivers (40-49%)</h3>
		<table class="menu-table">
			<thead>
				<tr>
					<th>Item</th>
					<th>SRP</th>
					<th>Viand Cost</th>
					<th>Total COGS</th>
					<th>Net Profit</th>
					<th>Margin</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Basic Silog (Rice+Egg)</td>
					<td>₱45</td>
					<td>₱0</td>
					<td>₱21</td>
					<td class="profit">₱24</td>
					<td class="mid-margin">53.3%</td>
				</tr>
				<tr>
					<td>Chicken Mushroom</td>
					<td>₱99</td>
					<td>₱30</td>
					<td>₱51</td>
					<td class="profit">₱48</td>
					<td class="mid-margin">48.5%</td>
				</tr>
                <tr>
					<td>Corned Beef</td>
					<td>₱90</td>
					<td>₱25</td>
					<td>₱46</td>
					<td class="profit">₱44</td>
					<td class="mid-margin">48.9%</td>
				</tr>
                <tr>
					<td>Burgersilog</td>
					<td>₱80</td>
					<td>₱20</td>
					<td>₱41</td>
					<td class="profit">₱39</td>
					<td class="mid-margin">48.8%</td>
				</tr>
			</tbody>
		</table>

        <h3>💎 Critical / Premium (Low Margin)</h3>
        <p class="note">⚠️ Price increased to avoid loss. Keep inventory low.</p>
		<table class="menu-table">
			<thead>
				<tr>
					<th>Item</th>
					<th>SRP</th>
					<th>Viand Cost</th>
					<th>Total COGS</th>
					<th>Net Profit</th>
					<th>Margin</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Sisigsilog</td>
					<td>₱135</td>
					<td>₱63</td>
					<td>₱84</td>
					<td class="profit">₱51</td>
					<td class="low-margin">37.8%</td>
				</tr>
				<tr>
					<td>Chicksilog</td>
					<td>₱110</td>
					<td>₱48</td>
					<td>₱69</td>
					<td class="profit">₱41</td>
					<td class="low-margin">37.3%</td>
				</tr>
                <tr>
					<td>Tapsilog (Beef)</td>
					<td>₱140</td>
					<td>₱93</td>
					<td>₱114</td>
					<td class="profit">₱26</td>
					<td class="low-margin">18.6%</td>
				</tr>
			</tbody>
		</table>

	</article>
</section>

<style>
	:global(body) {
		background-color: #f8fafc;
		font-family: 'Inter', sans-serif;
		color: #334155;
	}

	.doc-page {
		max-width: 900px;
		margin: 0 auto;
		padding: 3rem 2rem;
		background: white;
		min-height: 100vh;
		box-shadow: 0 0 50px rgba(0,0,0,0.05);
	}

	.back-link {
		display: inline-block;
		margin-bottom: 2rem;
		color: #64748b;
		text-decoration: none;
		font-weight: 500;
	}

    h1 { margin: 0 0 0.5rem; color: #0f172a; }
    h3 { margin-top: 2.5rem; color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.5rem; }

    .highlight-box {
        background: #fef2f2;
        border: 1px solid #fca5a5;
        padding: 1.5rem;
        border-radius: 8px;
        margin-top: 2rem;
    }
    .highlight-box h3 { margin-top: 0; color: #991b1b; border: none; }
    .highlight-box p { margin-bottom: 0.5rem; color: #7f1d1d; }
    .highlight-box ul { margin: 0; color: #7f1d1d; }

    .menu-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    .menu-table th { text-align: left; padding: 10px; background: #f8fafc; color: #64748b; font-size: 0.9rem; }
    .menu-table td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 0.95rem; }
    
    .profit { font-weight: bold; color: #16a34a; }
    .high-margin { color: #16a34a; font-weight: bold; background: #dcfce7; padding: 2px 6px; border-radius: 4px; display: inline-block; font-size: 0.85rem;}
    .mid-margin { color: #ca8a04; font-weight: bold; background: #fef9c3; padding: 2px 6px; border-radius: 4px; display: inline-block; font-size: 0.85rem;}
    .low-margin { color: #dc2626; font-weight: bold; background: #fee2e2; padding: 2px 6px; border-radius: 4px; display: inline-block; font-size: 0.85rem;}

    .note { font-size: 0.9rem; color: #dc2626; font-style: italic; }
</style>
