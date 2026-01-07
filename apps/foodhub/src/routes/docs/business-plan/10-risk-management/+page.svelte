<script lang="ts">
    import { page } from '$app/stores';
</script>

<svelte:head>
    <title>Risk Management — FoodHub</title>
</svelte:head>

<div class="page-wrapper">
    <a href="/" class="back-link">← Back to Dashboard</a>
    
    <header class="chapter-header">
        <span class="chapter-number">10</span>
        <h1>Risk Management</h1>
    </header>

    <main class="content">
        <section class="section">
            <h2>Risk Assessment Matrix</h2>
            <table class="risk-table">
                <thead>
                    <tr>
                        <th>Risk</th>
                        <th>Likelihood</th>
                        <th>Impact</th>
                        <th>Rating</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>High Vacancy Rate</td>
                        <td>Medium</td>
                        <td>High</td>
                        <td class="rating high">HIGH</td>
                    </tr>
                    <tr>
                        <td>Vendor Non-Payment</td>
                        <td>Medium</td>
                        <td>Medium</td>
                        <td class="rating medium">MEDIUM</td>
                    </tr>
                    <tr>
                        <td>Vendor Quality Issues</td>
                        <td>Medium</td>
                        <td>Medium</td>
                        <td class="rating medium">MEDIUM</td>
                    </tr>
                    <tr>
                        <td>Competition Entry</td>
                        <td>Low</td>
                        <td>Medium</td>
                        <td class="rating low">LOW</td>
                    </tr>
                    <tr>
                        <td>Fire/Safety Incident</td>
                        <td>Low</td>
                        <td>High</td>
                        <td class="rating medium">MEDIUM</td>
                    </tr>
                    <tr>
                        <td>Economic Downturn</td>
                        <td>Low</td>
                        <td>High</td>
                        <td class="rating medium">MEDIUM</td>
                    </tr>
                    <tr>
                        <td>Regulatory Changes</td>
                        <td>Low</td>
                        <td>Medium</td>
                        <td class="rating low">LOW</td>
                    </tr>
                </tbody>
            </table>
        </section>

        <section class="section">
            <h2>Mitigation Strategies</h2>
            
            <div class="risk-card">
                <h4>🏪 High Vacancy Rate</h4>
                <p class="risk-desc">Risk of stalls remaining empty, impacting revenue.</p>
                <div class="mitigation">
                    <strong>Mitigation:</strong>
                    <ul>
                        <li>Competitive rental rates vs. market</li>
                        <li>Flexible lease terms for new vendors</li>
                        <li>Active marketing and vendor outreach</li>
                        <li>Referral incentives for existing vendors</li>
                        <li>Offer first-month discount for new tenants</li>
                    </ul>
                </div>
            </div>

            <div class="risk-card">
                <h4>💰 Vendor Non-Payment</h4>
                <p class="risk-desc">Tenants defaulting on rent payments.</p>
                <div class="mitigation">
                    <strong>Mitigation:</strong>
                    <ul>
                        <li>2-month security deposit requirement</li>
                        <li>Strict payment terms with late fees</li>
                        <li>Clear eviction procedures in contract</li>
                        <li>Regular payment monitoring</li>
                    </ul>
                </div>
            </div>

            <div class="risk-card">
                <h4>⚠️ Vendor Quality Issues</h4>
                <p class="risk-desc">Poor-quality vendors affecting overall reputation.</p>
                <div class="mitigation">
                    <strong>Mitigation:</strong>
                    <ul>
                        <li>Vendor screening during application</li>
                        <li>Quality standards in lease agreement</li>
                        <li>Regular hygiene inspections</li>
                        <li>Customer feedback monitoring</li>
                        <li>Termination clause for violations</li>
                    </ul>
                </div>
            </div>

            <div class="risk-card">
                <h4>🔥 Fire/Safety Incidents</h4>
                <p class="risk-desc">Potential fire or safety hazards in food preparation areas.</p>
                <div class="mitigation">
                    <strong>Mitigation:</strong>
                    <ul>
                        <li>Proper fire extinguishers installed</li>
                        <li>Regular fire safety inspections</li>
                        <li>Vendor fire safety training</li>
                        <li>Proper ventilation systems</li>
                        <li>Insurance coverage</li>
                    </ul>
                </div>
            </div>
        </section>

        <section class="section">
            <h2>Insurance Coverage</h2>
            <table class="insurance-table">
                <tbody>
                    <tr>
                        <td>Property Insurance</td>
                        <td>Coverage for facility and fixtures</td>
                    </tr>
                    <tr>
                        <td>Liability Insurance</td>
                        <td>Coverage for third-party claims</td>
                    </tr>
                    <tr>
                        <td>Fire Insurance</td>
                        <td>Protection against fire damage</td>
                    </tr>
                </tbody>
            </table>
            <p class="note">Note: Vendors are required to maintain their own liability insurance for their operations.</p>
        </section>

        <section class="section">
            <h2>Contingency Planning</h2>
            <ul>
                <li><strong>Emergency Fund:</strong> Maintain 3-month OPEX reserve</li>
                <li><strong>Vendor Pipeline:</strong> Maintain waitlist of prospective vendors</li>
                <li><strong>Lease Flexibility:</strong> Ability to convert stall sizes if needed</li>
                <li><strong>Alternative Revenue:</strong> Event hosting during low periods</li>
            </ul>
        </section>
    </main>

    <nav class="chapter-nav">
        <a href="/docs/business-plan/09-financial-plan" class="prev">← Financial Plan</a>
        <a href="/docs/business-plan/11-initial-totex" class="next">Initial TOTEX →</a>
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

    .risk-table, .insurance-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
    }
    .risk-table th,
    .risk-table td {
        padding: 0.75rem 1rem;
        border: 1px solid #e4e4e7;
        text-align: left;
    }
    .risk-table th {
        background: var(--color-black);
        color: white;
        font-family: var(--font-header);
        text-transform: uppercase;
    }
    .rating {
        font-weight: 700;
        font-size: 0.8rem;
        text-align: center;
    }
    .rating.high { color: #ef4444; }
    .rating.medium { color: #f97316; }
    .rating.low { color: var(--color-green); }

    .insurance-table td {
        padding: 0.75rem 1rem;
        border: 1px solid #e4e4e7;
    }
    .insurance-table tr td:first-child {
        font-weight: 700;
        width: 35%;
        background: #fafafa;
    }

    .risk-card {
        background: white;
        border: 2px solid var(--color-black);
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 4px 4px 0px var(--color-pink);
    }
    .risk-card h4 {
        margin-bottom: 0.5rem;
        font-size: 1.2rem;
    }
    .risk-desc {
        color: #71717a;
        margin-bottom: 1rem;
    }
    .mitigation {
        background: #f4f4f5;
        padding: 1rem;
        border-radius: 4px;
    }
    .mitigation strong {
        display: block;
        margin-bottom: 0.5rem;
    }
    .mitigation ul {
        list-style: disc;
        padding-left: 1.5rem;
        margin: 0;
    }
    .mitigation li {
        margin-bottom: 0.25rem;
        font-size: 0.95rem;
    }

    .note {
        font-size: 0.9rem;
        color: #71717a;
        font-style: italic;
        margin-top: 1rem;
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
