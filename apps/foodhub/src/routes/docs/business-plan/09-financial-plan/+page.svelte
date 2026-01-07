<script lang="ts">
    import { page } from '$app/stores';
</script>

<svelte:head>
    <title>Financial Plan — FoodHub</title>
</svelte:head>

<div class="page-wrapper">
    <a href="/" class="back-link">← Back to Dashboard</a>
    
    <header class="chapter-header">
        <span class="chapter-number">09</span>
        <h1>Financial Plan</h1>
    </header>

    <main class="content">
        <section class="section">
            <h2>Revenue Model</h2>
            <div class="revenue-grid">
                <div class="revenue-card primary">
                    <h4>🏪 Stall Rental Income</h4>
                    <p>Primary revenue from monthly stall leases. Target: 85% occupancy.</p>
                    <table>
                        <tbody>
                            <tr><td>Premium Stalls (2)</td><td>₱24,000</td></tr>
                            <tr><td>Standard Stalls (7)</td><td>₱56,000</td></tr>
                            <tr><td>Compact Stalls (3)</td><td>₱15,000</td></tr>
                            <tr class="total"><td><strong>Full Occupancy</strong></td><td><strong>₱95,000/mo</strong></td></tr>
                        </tbody>
                    </table>
                </div>
                <div class="revenue-card secondary">
                    <h4>💡 Additional Income</h4>
                    <ul>
                        <li>Electricity markup (cost + handling)</li>
                        <li>Event space rental (occasional)</li>
                        <li>Signage/advertising space</li>
                    </ul>
                </div>
            </div>
        </section>

        <section class="section">
            <h2>Monthly Operating Expenses (OPEX)</h2>
            <table class="expense-table">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Item</th>
                        <th>Monthly Cost</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>Labor</td><td>Operations Manager</td><td>₱15,000</td></tr>
                    <tr><td>Labor</td><td>Maintenance Staff (2)</td><td>₱20,000</td></tr>
                    <tr><td>Labor</td><td>Security (Night)</td><td>₱10,000</td></tr>
                    <tr><td>Utilities</td><td>Common Area Electricity</td><td>₱5,000</td></tr>
                    <tr><td>Utilities</td><td>Common Area Water</td><td>₱2,000</td></tr>
                    <tr><td>Services</td><td>Waste Disposal</td><td>₱2,000</td></tr>
                    <tr><td>Services</td><td>Pest Control</td><td>₱1,500</td></tr>
                    <tr><td>Services</td><td>Internet</td><td>₱2,000</td></tr>
                    <tr><td>Maintenance</td><td>Repairs & Supplies</td><td>₱3,000</td></tr>
                    <tr><td>Marketing</td><td>Marketing/Promos</td><td>₱3,000</td></tr>
                    <tr class="total-row">
                        <td colspan="2"><strong>Total Monthly OPEX</strong></td>
                        <td><strong>₱63,500</strong></td>
                    </tr>
                </tbody>
            </table>
        </section>

        <section class="section">
            <h2>Initial Capital Requirements</h2>
            <div class="financial-card">
                 <h3>Estimated Setup Costs</h3>
                 <ul>
                    <li><strong>Signage:</strong> Tarp design and printing (Figmas link in notes).</li>
                    <li><strong>Security:</strong> Padlocks (approx ₱360), CCTV installation.</li>
                    <li><strong>Cleaning Supplies:</strong> Mops, Trash bins, Garbage bags.</li>
                     <li><strong>Connectivity:</strong> Mikrotik Router & Networking equipment.</li>
                 </ul>
            </div>
        </section>

        <section class="section">
            <h2>Operating Expenses (OPEX)</h2>
            <p><strong>Standard vs. 24-Hour Operation:</strong></p>
            <ul>
                <li><strong>Standard (12 Hours):</strong> Base rent covers standard utilities and maintenance.</li>
                <li><strong>Extended (24 Hours):</strong> Additional rent imposed to cover:
                    <ul>
                         <li>Increased electricity consumption (lighting/ventilation).</li>
                         <li>Overnight security personnel.</li>
                         <li>Extra cleaning cycles.</li>
                    </ul>
                </li>
            </ul>
        </section>

        <section class="section">
             <h2>Revenue Streams</h2>
             <ul>
                <li><strong>Stall Rentals:</strong> Monthly lease fees from 10+ tenants.</li>
                <li><strong>Wi-Fi Vouchers:</strong> Sales from Unit 1 voucher system.</li>
                <li><strong>Parking Fees:</strong> ₱100/hour for non-customers (deterrent/revenue mix).</li>
            </ul>
        </section>

        <section class="section">
            <h2>Break-Even Analysis</h2>
            <div class="breakeven-box">
                <div class="be-item">
                    <span class="be-label">Monthly OPEX</span>
                    <span class="be-value">₱63,500</span>
                </div>
                <div class="be-item">
                    <span class="be-label">Average Stall Rate</span>
                    <span class="be-value">₱7,917</span>
                </div>
                <div class="be-item highlight">
                    <span class="be-label">Stalls Needed to Break Even</span>
                    <span class="be-value">8 stalls (67%)</span>
                </div>
            </div>
        </section>

        <section class="section">
            <h2>Profit Projections</h2>
            <table class="projection-table">
                <thead>
                    <tr>
                        <th>Scenario</th>
                        <th>Occupancy</th>
                        <th>Revenue</th>
                        <th>OPEX</th>
                        <th>Net Profit</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="low">
                        <td>Conservative</td>
                        <td>60%</td>
                        <td>₱57,000</td>
                        <td>₱63,500</td>
                        <td class="negative">-₱6,500</td>
                    </tr>
                    <tr class="target">
                        <td>Target</td>
                        <td>85%</td>
                        <td>₱80,750</td>
                        <td>₱63,500</td>
                        <td class="positive">₱17,250</td>
                    </tr>
                    <tr class="high">
                        <td>Optimistic</td>
                        <td>100%</td>
                        <td>₱95,000</td>
                        <td>₱63,500</td>
                        <td class="positive">₱31,500</td>
                    </tr>
                </tbody>
            </table>
        </section>

        <section class="section">
            <h2>ROI & Payback Period</h2>
            <p class="placeholder">[To be completed: See Chapter 11 (Initial TOTEX) for startup costs. Calculate ROI and payback period based on monthly net profit projections.]</p>
        </section>

        <section class="section">
            <h2>Financial Assumptions</h2>
            <ul>
                <li>All stalls leased at standard rates (no discounts)</li>
                <li>Occupancy stabilizes within 6 months</li>
                <li>5% annual rent escalation</li>
                <li>No major capital repairs in Year 1</li>
                <li>Vendor turnover rate: 15% annually</li>
            </ul>
        </section>
    </main>

    <nav class="chapter-nav">
        <a href="/docs/business-plan/08-organization" class="prev">← Organization</a>
        <a href="/docs/business-plan/10-risk-management" class="next">Risk Management →</a>
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
    .section > ul {
        list-style: none;
        padding: 0;
    }
    .section > ul > li {
        padding: 0.75rem 1rem;
        background: white;
        border-left: 3px solid var(--color-pink);
        margin-bottom: 0.5rem;
    }

    .revenue-grid {
        display: grid;
        grid-template-columns: 1.5fr 1fr;
        gap: 1.5rem;
    }
    @media(max-width: 700px) {
        .revenue-grid { grid-template-columns: 1fr; }
    }
    .revenue-card {
        background: white;
        border: 2px solid var(--color-black);
        padding: 1.5rem;
    }
    .revenue-card.primary {
        box-shadow: 4px 4px 0px var(--color-green);
    }
    .revenue-card.secondary {
        box-shadow: 4px 4px 0px var(--color-pink);
    }
    .revenue-card h4 {
        margin-bottom: 1rem;
        font-size: 1.1rem;
    }
    .revenue-card p {
        color: #52525b;
        margin-bottom: 1rem;
    }
    .revenue-card table {
        width: 100%;
        font-size: 0.9rem;
    }
    .revenue-card table td {
        padding: 0.5rem 0;
        border-bottom: 1px dashed #e4e4e7;
    }
    .revenue-card table td:last-child {
        text-align: right;
        font-weight: 600;
    }
    .revenue-card table .total td {
        border-bottom: none;
        padding-top: 0.75rem;
    }
    .revenue-card ul {
        list-style: disc;
        padding-left: 1.5rem;
        margin: 0;
    }

    .expense-table, .projection-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        font-size: 0.9rem;
    }
    .expense-table th,
    .expense-table td,
    .projection-table th,
    .projection-table td {
        padding: 0.75rem;
        border: 1px solid #e4e4e7;
        text-align: left;
    }
    .expense-table th,
    .projection-table th {
        background: var(--color-black);
        color: white;
        font-family: var(--font-header);
        text-transform: uppercase;
    }
    .total-row {
        background: #fafafa;
    }
    .projection-table .positive { color: var(--color-green); font-weight: 700; }
    .projection-table .negative { color: #ef4444; font-weight: 700; }
    .projection-table .target { background: #dcfce7; }

    .breakeven-box {
        background: var(--color-black);
        padding: 2rem;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.5rem;
        border-radius: 8px;
    }
    @media(max-width: 600px) {
        .breakeven-box { grid-template-columns: 1fr; }
    }
    .be-item {
        text-align: center;
    }
    .be-label {
        display: block;
        color: #a1a1aa;
        font-size: 0.85rem;
        text-transform: uppercase;
        margin-bottom: 0.5rem;
    }
    .be-value {
        font-family: var(--font-header);
        font-size: 1.5rem;
        font-weight: 700;
        color: white;
    }
    .be-item.highlight .be-value {
        color: var(--color-green);
    }

    .placeholder {
        background: var(--color-pink-light);
        padding: 1rem;
        border-radius: 4px;
        border-left: 4px solid var(--color-pink);
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
