<script lang="ts">
    import { page } from '$app/stores';
</script>

<svelte:head>
    <title>Initial TOTEX — FoodHub</title>
</svelte:head>

<div class="page-wrapper">
    <a href="/" class="back-link">← Back to Dashboard</a>
    
    <header class="chapter-header">
        <span class="chapter-number">11</span>
        <h1>Initial TOTEX</h1>
    </header>

    <main class="content">
        <section class="section">
            <h2>Capital Expenditures (CAPEX)</h2>
            <table class="capex-table">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Item</th>
                        <th>Cost</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="category-header"><td colspan="3">Facility Construction</td></tr>
                    <tr><td></td><td>Stall partitions & counters (12 units)</td><td>₱180,000</td></tr>
                    <tr><td></td><td>Electrical wiring & sub-meters</td><td>₱50,000</td></tr>
                    <tr><td></td><td>Plumbing & drainage</td><td>₱40,000</td></tr>
                    <tr><td></td><td>Flooring & tiling</td><td>₱60,000</td></tr>
                    <tr><td></td><td>Ceiling & lighting</td><td>₱35,000</td></tr>
                    
                    <tr class="category-header"><td colspan="3">Dining Area</td></tr>
                    <tr><td></td><td>Tables & chairs (50 pax capacity)</td><td>₱40,000</td></tr>
                    <tr><td></td><td>Signage & branding</td><td>₱25,000</td></tr>
                    
                    <tr class="category-header"><td colspan="3">Facilities & Amenities</td></tr>
                    <tr><td></td><td>Restroom fixtures</td><td>₱30,000</td></tr>
                    <tr><td></td><td>CCTV system (8 cameras)</td><td>₱25,000</td></tr>
                    <tr><td></td><td>Fire safety equipment</td><td>₱15,000</td></tr>
                    <tr><td></td><td>Waste bins & containers</td><td>₱5,000</td></tr>
                    
                    <tr class="category-header"><td colspan="3">Pre-Operating</td></tr>
                    <tr><td></td><td>Business permits & licenses</td><td>₱20,000</td></tr>
                    <tr><td></td><td>Legal fees (contracts)</td><td>₱10,000</td></tr>
                    <tr><td></td><td>Marketing (pre-launch)</td><td>₱15,000</td></tr>
                    
                    <tr class="subtotal-row">
                        <td colspan="2"><strong>Total CAPEX</strong></td>
                        <td><strong>₱550,000</strong></td>
                    </tr>
                </tbody>
            </table>
        </section>

        <section class="section">
            <h2>Initial Working Capital</h2>
            <table class="wc-table">
                <tbody>
                    <tr><td>3-month OPEX reserve</td><td>₱190,500</td></tr>
                    <tr><td>Contingency fund (10%)</td><td>₱55,000</td></tr>
                    <tr class="subtotal-row">
                        <td><strong>Total Working Capital</strong></td>
                        <td><strong>₱245,500</strong></td>
                    </tr>
                </tbody>
            </table>
        </section>

        <section class="section">
            <h2>Total Initial Investment (TOTEX)</h2>
            <div class="totex-box">
                <div class="totex-item">
                    <span class="label">CAPEX</span>
                    <span class="value">₱550,000</span>
                </div>
                <div class="totex-item">
                    <span class="label">Working Capital</span>
                    <span class="value">₱245,500</span>
                </div>
                <div class="totex-item total">
                    <span class="label">Total TOTEX</span>
                    <span class="value">₱795,500</span>
                </div>
            </div>
        </section>

        <section class="section">
            <h2>Funding Sources</h2>
            <p class="placeholder">[To be completed: Owner's equity, bank loans, investor capital, etc.]</p>
        </section>

        <section class="section">
            <h2>ROI Calculation</h2>
            <div class="roi-box">
                <table>
                    <tbody>
                        <tr><td>Total Investment</td><td>₱795,500</td></tr>
                        <tr><td>Target Monthly Profit (85% occupancy)</td><td>₱17,250</td></tr>
                        <tr><td>Annual Profit</td><td>₱207,000</td></tr>
                        <tr class="highlight"><td><strong>Simple ROI</strong></td><td><strong>26%</strong></td></tr>
                        <tr class="highlight"><td><strong>Payback Period</strong></td><td><strong>~46 months</strong></td></tr>
                    </tbody>
                </table>
            </div>
        </section>
    </main>

    <nav class="chapter-nav">
        <a href="/docs/business-plan/10-risk-management" class="prev">← Risk Management</a>
        <a href="/docs/business-plan/12-policies-guidelines" class="next">Policies & Guidelines →</a>
    </nav>
</div>

<style>
    .page-wrapper {
        max-width: 900px;
        margin: 0 auto;
        padding: 3rem 2rem;
    }

    .back-link {
        display: inline-block;
        margin-bottom: 2rem;
        color: var(--color-pink);
        font-weight: 600;
        transition: all 0.2s;
    }
    .back-link:hover { padding-left: 0.5rem; }

    .chapter-header {
        margin-bottom: 3rem;
        border-bottom: 4px solid var(--color-black);
        padding-bottom: 1.5rem;
    }
    .chapter-number {
        display: inline-block;
        background: linear-gradient(135deg, var(--color-pink) 0%, var(--color-green) 100%);
        color: white;
        padding: 0.25rem 0.75rem;
        font-family: var(--font-header);
        font-size: 1rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        border-radius: 2px;
    }
    h1 { font-size: 3.5rem; line-height: 1; }

    .content { margin-bottom: 4rem; }

    .section { margin-bottom: 3rem; }
    .section h2 {
        font-size: 1.5rem;
        border-left: 4px solid var(--color-green);
        padding-left: 1rem;
        margin-bottom: 1rem;
    }

    .capex-table, .wc-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        font-size: 0.9rem;
    }
    .capex-table th,
    .capex-table td,
    .wc-table td {
        padding: 0.75rem 1rem;
        border: 1px solid #e4e4e7;
        text-align: left;
    }
    .capex-table th {
        background: var(--color-black);
        color: white;
        font-family: var(--font-header);
        text-transform: uppercase;
    }
    .category-header td {
        background: #f4f4f5;
        font-weight: 700;
        font-family: var(--font-header);
        text-transform: uppercase;
        font-size: 0.85rem;
        color: #71717a;
    }
    .subtotal-row {
        background: var(--color-black);
        color: white;
    }
    .subtotal-row td {
        border-color: var(--color-black);
    }
    .wc-table tr td:first-child {
        width: 70%;
    }
    .wc-table tr td:last-child {
        text-align: right;
    }

    .totex-box {
        background: linear-gradient(135deg, var(--color-black) 0%, #1f1f23 100%);
        padding: 2rem;
        border-radius: 8px;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.5rem;
    }
    @media(max-width: 600px) {
        .totex-box { grid-template-columns: 1fr; }
    }
    .totex-item {
        text-align: center;
    }
    .totex-item .label {
        display: block;
        color: #a1a1aa;
        font-size: 0.85rem;
        text-transform: uppercase;
        margin-bottom: 0.5rem;
    }
    .totex-item .value {
        font-family: var(--font-header);
        font-size: 1.75rem;
        font-weight: 700;
        color: white;
    }
    .totex-item.total .value {
        color: var(--color-green);
        font-size: 2rem;
    }

    .placeholder {
        background: var(--color-pink-light);
        padding: 1rem;
        border-radius: 4px;
        border-left: 4px solid var(--color-pink);
    }

    .roi-box {
        background: white;
        border: 2px solid var(--color-black);
        padding: 1.5rem;
        box-shadow: 4px 4px 0px var(--color-green);
    }
    .roi-box table {
        width: 100%;
    }
    .roi-box td {
        padding: 0.75rem;
        border-bottom: 1px solid #e4e4e7;
    }
    .roi-box tr td:last-child {
        text-align: right;
        font-weight: 600;
    }
    .roi-box .highlight td {
        background: #dcfce7;
        font-size: 1.1rem;
    }

    .chapter-nav {
        display: flex;
        justify-content: space-between;
        padding-top: 2rem;
        border-top: 2px solid #e4e4e7;
    }
    .chapter-nav a {
        padding: 0.75rem 1.5rem;
        background: var(--color-black);
        color: white;
        font-weight: 700;
        font-family: var(--font-header);
        text-transform: uppercase;
        transition: all 0.2s;
    }
    .chapter-nav a:hover { background: var(--color-pink); }
</style>
