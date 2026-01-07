<script lang="ts">
    import { page } from '$app/stores';
</script>

<svelte:head>
    <title>Lease Structure — FoodHub</title>
</svelte:head>

<div class="page-wrapper">
    <a href="/" class="back-link">← Back to Dashboard</a>
    
    <header class="chapter-header">
        <span class="chapter-number">05</span>
        <h1>Lease Structure</h1>
    </header>

    <main class="content">
        <section class="section">
            <h2>Rental Rates Summary</h2>
            <table class="rate-table">
                <thead>
                    <tr>
                        <th>Stall Type</th>
                        <th>Monthly Rate</th>
                        <th>Security Deposit</th>
                        <th>Advance Rent</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Premium (Corner)</td>
                        <td>₱12,000</td>
                        <td>2 months</td>
                        <td>1 month</td>
                    </tr>
                    <tr>
                        <td>Standard</td>
                        <td>₱8,000</td>
                        <td>2 months</td>
                        <td>1 month</td>
                    </tr>
                    <tr>
                        <td>Compact (Kiosk)</td>
                        <td>₱5,000</td>
                        <td>2 months</td>
                        <td>1 month</td>
                    </tr>
                </tbody>
            </table>
        </section>

        <section class="section">
            <h2>Lease Terms</h2>
            <div class="terms-grid">
                <div class="term-card">
                    <h4>📅 Lease Duration</h4>
                    <p><strong>Minimum:</strong> 6 months</p>
                    <p><strong>Standard:</strong> 1 year</p>
                    <p><strong>Renewal:</strong> Automatic unless terminated 30 days prior</p>
                </div>
                <div class="term-card">
                    <h4>💰 Payment Terms</h4>
                    <p><strong>Due Date:</strong> 5th of each month</p>
                    <p><strong>Grace Period:</strong> 5 days</p>
                    <p><strong>Late Fee:</strong> ₱500 + 2%/day</p>
                </div>
                <div class="term-card">
                    <h4>📈 Rate Escalation</h4>
                    <p><strong>Annual Increase:</strong> 5%</p>
                    <p><strong>Notice Period:</strong> 60 days</p>
                    <p><strong>Cap:</strong> Based on CPI</p>
                </div>
            </div>
        </section>

        <section class="section">
            <h2>Move-In Requirements</h2>
            <div class="checklist">
                <div class="check-item">✓ Completed Application Form</div>
                <div class="check-item">✓ Valid Government ID (2 copies)</div>
                <div class="check-item">✓ DTI/SEC Business Registration</div>
                <div class="check-item">✓ Barangay Business Clearance</div>
                <div class="check-item">✓ 2-month Security Deposit</div>
                <div class="check-item">✓ 1-month Advance Rent</div>
                <div class="check-item">✓ Signed Lease Agreement</div>
                <div class="check-item">✓ Food Handler's Certificate (if applicable)</div>
            </div>
        </section>

        <section class="section">
            <h2>Included Utilities</h2>
            <table class="utility-table">
                <tbody>
                    <tr>
                        <td>Water</td>
                        <td>Shared meter — prorated monthly</td>
                    </tr>
                    <tr>
                        <td>Electricity</td>
                        <td>Sub-metered — pay actual consumption</td>
                    </tr>
                    <tr>
                        <td>WiFi</td>
                        <td>Included (shared connection)</td>
                    </tr>
                    <tr>
                        <td>Waste Disposal</td>
                        <td>Included in rent</td>
                    </tr>
                    <tr>
                        <td>Common Area Maintenance</td>
                        <td>Included in rent</td>
                    </tr>
                </tbody>
            </table>
        </section>

        <section class="section">
            <h2>Termination Clauses</h2>
            <div class="clause-list">
                <div class="clause">
                    <h4>Early Termination by Tenant</h4>
                    <p>60-day written notice required. Security deposit forfeited if terminated before minimum lease term.</p>
                </div>
                <div class="clause">
                    <h4>Termination by Lessor</h4>
                    <p>May terminate for non-payment (30+ days overdue), policy violations, or illegal activities. 15-day cure period for minor violations.</p>
                </div>
                <div class="clause">
                    <h4>Security Deposit Return</h4>
                    <p>Refundable within 30 days of move-out, less unpaid utilities and damages.</p>
                </div>
            </div>
        </section>

        <section class="section">
            <h2>Sample Lease Agreement</h2>
            <p class="placeholder">[Link to downloadable lease agreement template — See Appendices for printable version]</p>
        </section>
    </main>

    <nav class="chapter-nav">
        <a href="/docs/business-plan/04-facility-stalls" class="prev">← Facility & Stalls</a>
        <a href="/docs/business-plan/06-marketing-strategy" class="next">Marketing Strategy →</a>
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

    .rate-table, .utility-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
    }
    .rate-table th,
    .rate-table td {
        padding: 1rem;
        border: 1px solid #e4e4e7;
        text-align: left;
    }
    .rate-table th {
        background: var(--color-black);
        color: white;
        font-family: var(--font-header);
        text-transform: uppercase;
    }
    .rate-table tr:nth-child(even) {
        background: #fafafa;
    }

    .utility-table td {
        padding: 0.75rem 1rem;
        border: 1px solid #e4e4e7;
    }
    .utility-table tr td:first-child {
        font-weight: 700;
        width: 30%;
        background: #fafafa;
    }

    .terms-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
    }
    .term-card {
        background: white;
        border: 2px solid var(--color-black);
        padding: 1.5rem;
        box-shadow: 4px 4px 0px var(--color-pink);
    }
    .term-card h4 {
        margin-bottom: 1rem;
        font-size: 1.1rem;
    }
    .term-card p {
        margin: 0.5rem 0;
        font-size: 0.95rem;
        color: #52525b;
    }

    .checklist {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 0.5rem;
    }
    .check-item {
        background: white;
        padding: 0.75rem 1rem;
        border-left: 3px solid var(--color-green);
        font-weight: 500;
    }

    .clause-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    .clause {
        background: white;
        border: 1px solid #e4e4e7;
        padding: 1.5rem;
        border-left: 4px solid var(--color-pink);
    }
    .clause h4 {
        margin-bottom: 0.5rem;
        font-size: 1.1rem;
    }
    .clause p {
        margin: 0;
        color: #52525b;
        line-height: 1.6;
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
