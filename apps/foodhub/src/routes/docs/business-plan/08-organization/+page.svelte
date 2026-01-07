<script lang="ts">
    import { page } from '$app/stores';
</script>

<svelte:head>
    <title>Organization — FoodHub</title>
</svelte:head>

<div class="page-wrapper">
    <a href="/" class="back-link">← Back to Dashboard</a>
    
    <header class="chapter-header">
        <span class="chapter-number">08</span>
        <h1>Organization</h1>
    </header>

    <main class="content">
        <section class="section">
            <h2>Organizational Structure</h2>
            <div class="org-chart">
                <div class="org-level owner">
                    <div class="org-box">
                        <h4>Owner / Lessor</h4>
                        <p>[Owner Name]</p>
                    </div>
                </div>
                <div class="org-connector"></div>
                <div class="org-level management">
                    <div class="org-box">
                        <h4>Operations Manager</h4>
                        <p>Day-to-day operations, vendor relations</p>
                    </div>
                </div>
                <div class="org-connector"></div>
                <div class="org-level staff">
                    <div class="org-box">
                        <h4>Maintenance Staff</h4>
                        <p>Cleaning, repairs</p>
                    </div>
                    <div class="org-box">
                        <h4>Security</h4>
                        <p>Night watch, lockup</p>
                    </div>
                </div>
            </div>
        </section>

        <section class="section">
            <h2>Key Roles & Responsibilities</h2>
            <div class="role-grid">
                <div class="role-card">
                    <h4>👔 Owner / Lessor</h4>
                    <ul>
                        <li>Strategic decision-making</li>
                        <li>Financial oversight</li>
                        <li>Lease approvals</li>
                        <li>Major vendor relationships</li>
                    </ul>
                </div>
                <div class="role-card">
                    <h4>📋 Operations Manager</h4>
                    <ul>
                        <li>Daily operations oversight</li>
                        <li>Vendor onboarding & support</li>
                        <li>Rent collection coordination</li>
                        <li>Issue resolution</li>
                        <li>Staff supervision</li>
                    </ul>
                </div>
                <div class="role-card">
                    <h4>🧹 Maintenance Staff</h4>
                    <ul>
                        <li>Common area cleaning</li>
                        <li>Restroom maintenance</li>
                        <li>Minor repairs</li>
                        <li>Waste management</li>
                    </ul>
                </div>
                <div class="role-card">
                    <h4>🛡️ Security</h4>
                    <ul>
                        <li>Facility lockup/opening</li>
                        <li>CCTV monitoring</li>
                        <li>After-hours patrol</li>
                        <li>Emergency response</li>
                    </ul>
                </div>
            </div>
        </section>

        <section class="section">
            <h2>Staffing Plan</h2>
            <table class="staff-table">
                <thead>
                    <tr>
                        <th>Position</th>
                        <th>Count</th>
                        <th>Schedule</th>
                        <th>Monthly Cost</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Operations Manager</td>
                        <td>1</td>
                        <td>Full-time (Mon-Sat)</td>
                        <td>₱15,000</td>
                    </tr>
                    <tr>
                        <td>Maintenance/Cleaner</td>
                        <td>2</td>
                        <td>Split shift</td>
                        <td>₱10,000 × 2</td>
                    </tr>
                    <tr>
                        <td>Security (Night)</td>
                        <td>1</td>
                        <td>Night shift</td>
                        <td>₱10,000</td>
                    </tr>
                    <tr class="total-row">
                        <td colspan="3"><strong>Total Monthly Labor</strong></td>
                        <td><strong>₱45,000</strong></td>
                    </tr>
                </tbody>
            </table>
        </section>

        <section class="section">
            <h2>External Services</h2>
            <ul>
                <li><strong>Accountant/Bookkeeper:</strong> Monthly financial reporting (outsourced)</li>
                <li><strong>Pest Control:</strong> Monthly service contract</li>
                <li><strong>Electrician/Plumber:</strong> On-call basis</li>
                <li><strong>Legal:</strong> Lease agreement review (as needed)</li>
            </ul>
        </section>

        <section class="section">
            <h2>Key Contact Information</h2>
            <p class="placeholder">[To be completed: Emergency contacts, utility providers, maintenance contractors]</p>
        </section>
    </main>

    <nav class="chapter-nav">
        <a href="/docs/business-plan/07-operations" class="prev">← Operations Plan</a>
        <a href="/docs/business-plan/09-financial-plan" class="next">Financial Plan →</a>
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

    .org-chart {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }
    .org-level {
        display: flex;
        gap: 1.5rem;
        justify-content: center;
        flex-wrap: wrap;
    }
    .org-box {
        background: white;
        border: 2px solid var(--color-black);
        padding: 1.5rem 2rem;
        text-align: center;
        min-width: 180px;
    }
    .org-level.owner .org-box {
        background: var(--color-black);
        color: white;
        box-shadow: 4px 4px 0px var(--color-pink);
    }
    .org-level.owner .org-box h4 { color: white; }
    .org-level.management .org-box {
        box-shadow: 4px 4px 0px var(--color-green);
    }
    .org-level.staff .org-box {
        box-shadow: 4px 4px 0px #3b82f6;
    }
    .org-box h4 {
        margin-bottom: 0.5rem;
        font-size: 1rem;
    }
    .org-box p {
        margin: 0;
        font-size: 0.9rem;
        color: #71717a;
    }
    .org-level.owner .org-box p { color: #a1a1aa; }
    .org-connector {
        width: 2px;
        height: 30px;
        background: var(--color-black);
    }

    .role-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1.5rem;
    }
    .role-card {
        background: white;
        border: 2px solid var(--color-black);
        padding: 1.5rem;
        box-shadow: 4px 4px 0px var(--color-pink);
    }
    .role-card h4 {
        margin-bottom: 1rem;
        font-size: 1.1rem;
    }
    .role-card ul {
        list-style: disc;
        padding-left: 1.5rem;
        margin: 0;
        font-size: 0.95rem;
    }
    .role-card li {
        margin-bottom: 0.5rem;
    }

    .staff-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
    }
    .staff-table th,
    .staff-table td {
        padding: 0.75rem 1rem;
        border: 1px solid #e4e4e7;
        text-align: left;
    }
    .staff-table th {
        background: var(--color-black);
        color: white;
        font-family: var(--font-header);
        text-transform: uppercase;
    }
    .total-row {
        background: #fafafa;
        font-weight: 700;
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
