<script lang="ts">
    import { page } from '$app/stores';
</script>

<svelte:head>
    <title>Operations Plan — FoodHub</title>
</svelte:head>

<div class="page-wrapper">
    <a href="/" class="back-link">← Back to Dashboard</a>
    
    <header class="chapter-header">
        <span class="chapter-number">07</span>
        <h1>Operations Plan</h1>
    </header>

    <main class="content">
        <section class="section">
            <h2>Operating Hours</h2>
            <table class="hours-table">
                <tbody>
                    <tr>
                        <td>Monday – Friday</td>
                        <td>6:00 AM – 10:00 PM</td>
                    </tr>
                    <tr>
                        <td>Saturday – Sunday</td>
                        <td>7:00 AM – 10:00 PM</td>
                    </tr>
                    <tr>
                        <td>Holidays</td>
                        <td>Operating (reduced hours available)</td>
                    </tr>
                </tbody>
            </table>
        </section>

        <section class="section">
            <h2>Daily Operations Schedule</h2>
            <div class="schedule-grid">
                <div class="schedule-item">
                    <span class="time">5:30 AM</span>
                    <span class="task">Facility opens for vendor prep</span>
                </div>
                <div class="schedule-item">
                    <span class="time">6:00 AM</span>
                    <span class="task">Stalls open for business</span>
                </div>
                <div class="schedule-item">
                    <span class="time">8:00 AM</span>
                    <span class="task">Morning cleaning (common areas)</span>
                </div>
                <div class="schedule-item">
                    <span class="time">2:00 PM</span>
                    <span class="task">Afternoon cleaning round</span>
                </div>
                <div class="schedule-item">
                    <span class="time">10:00 PM</span>
                    <span class="task">Stalls close for the day</span>
                </div>
                <div class="schedule-item">
                    <span class="time">10:30 PM</span>
                    <span class="task">Final cleaning & lockup</span>
                </div>
            </div>
        </section>

        <section class="section">
            <h2>Facility Maintenance</h2>
            <div class="maintenance-grid">
                <div class="maint-card">
                    <h4>🧹 Daily</h4>
                    <ul>
                        <li>Common area sweeping/mopping</li>
                        <li>Restroom cleaning (2x/day)</li>
                        <li>Trash collection</li>
                        <li>Table/chair wiping</li>
                    </ul>
                </div>
                <div class="maint-card">
                    <h4>📅 Weekly</h4>
                    <ul>
                        <li>Deep cleaning of restrooms</li>
                        <li>Grease trap cleaning</li>
                        <li>Drainage maintenance</li>
                        <li>Pest control inspection</li>
                    </ul>
                </div>
                <div class="maint-card">
                    <h4>📆 Monthly</h4>
                    <ul>
                        <li>HVAC/ventilation check</li>
                        <li>Electrical system inspection</li>
                        <li>Fire extinguisher check</li>
                        <li>General repairs</li>
                    </ul>
                </div>
            </div>
        </section>

        <section class="section">
            <h2>Operating Hours</h2>
            <div class="schedule-table">
                <div class="schedule-row header">
                    <span>Service Period</span>
                    <span>Time</span>
                </div>
                <div class="schedule-row">
                    <span>Breakfast Service</span>
                    <span>8:00 AM - 10:00 AM</span>
                </div>
                <div class="schedule-row">
                    <span>Lunch Service</span>
                    <span>11:00 AM - 2:00 PM</span>
                </div>
                 <div class="schedule-row">
                    <span>Afternoon Snacks</span>
                    <span>2:00 PM - 5:00 PM</span>
                </div>
                <div class="schedule-row">
                    <span>Dinner Service</span>
                    <span>5:00 PM - 8:00 PM</span>
                </div>
                <div class="schedule-row">
                    <span>Late-Night / 24H</span>
                    <span>8:00 PM - 8:00 AM</span>
                </div>
            </div>
            <p class="note"><em>Note: 24-hour operation requires additional rent to cover maintenance and utility costs.</em></p>
        </section>

        <section class="section">
            <h2>Operational Requirements</h2>
             <ul>
                <li><strong>Security:</strong> Rolling shutters, CCTV surveillance, 2nd-floor access control.</li>
                <li><strong>Trash Management:</strong> Strict segregation (Non-biodegradable only collected by city MWF 6:00-7:30). Owners/Tenants responsible for segregation.</li>
                <li><strong>Wi-Fi System:</strong> Mikrotik voucher system managed by Unit 1 (5 devices per unit allocation).</li>
                <li><strong>Safety:</strong> Fire extinguishers in every stall, visible and elevated.</li>
            </ul>
        </section>

        <section class="section">
            <h2>Supplies & Inventory</h2>
             <div class="inventory-list">
                <h3>Cleaning & Maintenance</h3>
                <ul>
                    <li>Trash Bins & Garbage Bags (Large)</li>
                    <li>Mops & Cleaning cloth</li>
                    <li>Table Spray / Sanitizer</li>
                    <li>Padlocks (for gate/stalls)</li>
                </ul>
            </div>
        </section>

        <section class="section">
            <h2>Security Measures</h2>
            <ul>
                <li>24/7 CCTV surveillance (common areas)</li>
                <li>Secure lockup after operating hours</li>
                <li>Key/access card system for vendors</li>
                <li>Emergency contact numbers posted</li>
                <li>Fire safety equipment maintained</li>
            </ul>
        </section>

        <section class="section">
            <h2>Utility Management</h2>
            <table class="utility-table">
                <tbody>
                    <tr>
                        <td>Electricity</td>
                        <td>Sub-metered per stall; monthly billing based on actual usage</td>
                    </tr>
                    <tr>
                        <td>Water</td>
                        <td>Shared meter; prorated based on stall size</td>
                    </tr>
                    <tr>
                        <td>Waste Disposal</td>
                        <td>Central bins; scheduled daily pickup</td>
                    </tr>
                    <tr>
                        <td>Internet</td>
                        <td>Shared WiFi; optional dedicated line available</td>
                    </tr>
                </tbody>
            </table>
        </section>

        <section class="section">
            <h2>Vendor Support</h2>
            <div class="support-list">
                <div class="support-item">
                    <h4>📞 Issue Reporting</h4>
                    <p>Dedicated hotline for maintenance issues. Response time: 2 hours for urgent, 24 hours for non-urgent.</p>
                </div>
                <div class="support-item">
                    <h4>📊 Monthly Check-ins</h4>
                    <p>Regular meetings with vendors to address concerns and gather feedback.</p>
                </div>
                <div class="support-item">
                    <h4>📋 Onboarding</h4>
                    <p>New vendor orientation covering policies, operations, and best practices.</p>
                </div>
            </div>
        </section>
    </main>

    <nav class="chapter-nav">
        <a href="/docs/business-plan/06-marketing-strategy" class="prev">← Marketing Strategy</a>
        <a href="/docs/business-plan/08-organization" class="next">Organization →</a>
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
        font-weight: 500;
    }

    .hours-table, .utility-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
    }
    .hours-table td, .utility-table td {
        padding: 1rem;
        border: 1px solid #e4e4e7;
    }
    .hours-table tr td:first-child, .utility-table tr td:first-child {
        font-weight: 700;
        width: 35%;
        background: #fafafa;
    }

    .schedule-grid {
        display: grid;
        gap: 0.5rem;
    }
    .schedule-item {
        display: flex;
        align-items: center;
        background: white;
        border: 1px solid #e4e4e7;
        padding: 1rem;
    }
    .schedule-item .time {
        font-family: var(--font-header);
        font-weight: 700;
        min-width: 100px;
        color: var(--color-pink);
    }
    .schedule-item .task {
        color: #52525b;
    }

    .maintenance-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1.5rem;
    }
    .maint-card {
        background: white;
        border: 2px solid var(--color-black);
        padding: 1.5rem;
        box-shadow: 4px 4px 0px var(--color-green);
    }
    .maint-card h4 {
        margin-bottom: 1rem;
        font-size: 1.1rem;
    }
    .maint-card ul {
        list-style: disc;
        padding-left: 1.5rem;
        margin: 0;
        font-size: 0.95rem;
    }
    .maint-card li {
        margin-bottom: 0.5rem;
    }

    .support-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    .support-item {
        background: white;
        border: 1px solid #e4e4e7;
        padding: 1.5rem;
        border-left: 4px solid var(--color-pink);
    }
    .support-item h4 {
        margin-bottom: 0.5rem;
        font-size: 1.1rem;
    }
    .support-item p {
        margin: 0;
        color: #52525b;
        line-height: 1.6;
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
