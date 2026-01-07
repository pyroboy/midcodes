<script lang="ts">
    import { page } from '$app/stores';
</script>

<svelte:head>
    <title>Market Analysis — FoodHub</title>
</svelte:head>

<div class="page-wrapper">
    <a href="/" class="back-link">← Back to Dashboard</a>
    
    <header class="chapter-header">
        <span class="chapter-number">03</span>
        <h1>Market Analysis</h1>
    </header>

    <main class="content">
        <section class="section">
            <h2>Industry Overview</h2>
            <p>The food court and commercial food space leasing industry continues to grow as entrepreneurs seek affordable entry points into the food service business. Key trends include:</p>
            <ul>
                <li>Growing preference for food court dining experiences</li>
                <li>Rise of food delivery services increasing vendor visibility</li>
                <li>Demand for shared-cost commercial spaces</li>
                <li>Shift toward diverse, multi-vendor dining destinations</li>
            </ul>
        </section>

        <section class="section">
            <h2>Location Analysis</h2>
            <div class="location-card">
                <h3>📍 Site Characteristics</h3>
                <table class="info-table">
                    <tbody>
                        <tr>
                            <td>Area</td>
                            <td>[City/Municipality Name]</td>
                        </tr>
                        <tr>
                            <td>Foot Traffic</td>
                            <td>[High/Medium/Low] — [Estimate/day]</td>
                        </tr>
                        <tr>
                            <td>Nearby Establishments</td>
                            <td>Schools, Offices, Residential Areas</td>
                        </tr>
                        <tr>
                            <td>Accessibility</td>
                            <td>Main road, parking availability</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <section class="section">
            <h2>Target Market</h2>
            <div class="market-grid">
                <div class="market-card vendors">
                    <h4>🍳 Food Vendors (Tenants)</h4>
                    <ul>
                        <li>Start-up food entrepreneurs</li>
                        <li>Home-based food sellers scaling up</li>
                        <li>Franchisees seeking affordable space</li>
                        <li>Experienced vendors expanding locations</li>
                    </ul>
                </div>
                <div class="market-card customers">
                    <h4>👥 End Customers (Diners)</h4>
                    <ul>
                        <li>Office workers (lunch crowd)</li>
                        <li>Students from nearby schools</li>
                        <li>Families and residents</li>
                        <li>Delivery riders (grab-and-go)</li>
                    </ul>
                </div>
            </div>
        </section>

        <section class="section">
            <h2>Target Market Segments</h2>
            <ul>
                <li><strong>Students (Broad):</strong> High school and college students seeking affordable meals, snacks, and a place to study with Wi-Fi.</li>
                <li><strong>Night Shift Workers:</strong> BPO employees and other night-shift staff needing 24-hour food options.</li>
                <li><strong>Residents & Boarders:</strong> Local dormitory residents and families looking for convenient dining.</li>
                <li><strong>Social Groups:</strong> "Party Pete" types and friends gathering for food and drinks.</li>
                <li><strong>Professionals:</strong> Teachers and employees needing quick lunches or a quiet corner (Teacher Tina).</li>
            </ul>
        </section>

        <section class="section">
            <h2>Customer Personas</h2>
            <div class="persona-grid">
                <div class="persona-card">
                    <h3>Student Sally / Busy Bea</h3>
                    <p class="role">College Student</p>
                    <p class="desc">Always on the go. Needs quick, convenient meals between classes. Values free Wi-Fi for studying while snacking.</p>
                </div>
                <div class="persona-card">
                    <h3>Night Owl Nick</h3>
                    <p class="role">BPO Employee</p>
                    <p class="desc">Works night shifts. Needs hearty meals during irregular hours. Prefers 24-hour availability.</p>
                </div>
                <div class="persona-card">
                    <h3>Teacher Tina</h3>
                    <p class="role">High School Teacher</p>
                    <p class="desc">Needs a quick, quality lunch or coffee break. Appreciates diverse healthy options.</p>
                </div>
                <div class="persona-card">
                    <h3>Party Pete</h3>
                    <p class="role">Social Butterfly</p>
                    <p class="desc">Visits after nights out for late-night snacks. Loves the aesthetic vibe to hang out with friends.</p>
                </div>
            </div>
        </section>

        <section class="section">
            <h2>Buying Behaviors</h2>
             <ul>
                <li><strong>Impulse Buyers:</strong> Make spontaneous purchases based on visual appeal.</li>
                <li><strong>Value Seekers:</strong> Prioritize best value for money (students).</li>
                <li><strong>Convenience Seekers:</strong> Grab-and-go mentality for busy schedules.</li>
                <li><strong>Experience Seekers:</strong> Look for "good vibes" and aesthetic environments.</li>
            </ul>
        </section>

        <section class="section">
            <h2>Competitive Landscape</h2>
            <p class="placeholder">[To be completed: List nearby food courts, commercial spaces, and key competitors. Include their rates, occupancy, and differentiators.]</p>
        </section>

        <section class="section">
            <h2>Competitive Advantages</h2>
            <ul>
                <li>Strategic location with high visibility</li>
                <li>Competitive rental rates vs. standalone spaces</li>
                <li>Shared utilities reducing vendor overhead</li>
                <li>Combined marketing efforts driving foot traffic</li>
                <li>Flexible lease terms for new entrepreneurs</li>
            </ul>
        </section>

        <section class="section">
            <h2>SWOT Analysis</h2>
            <div class="swot-grid">
                <div class="swot-card strengths">
                    <h4>💪 Strengths</h4>
                    <ul>
                        <li>Prime location</li>
                        <li>Affordable rates</li>
                        <li>Diverse food options</li>
                    </ul>
                </div>
                <div class="swot-card weaknesses">
                    <h4>⚠️ Weaknesses</h4>
                    <ul>
                        <li>Limited parking</li>
                        <li>New brand recognition</li>
                    </ul>
                </div>
                <div class="swot-card opportunities">
                    <h4>🚀 Opportunities</h4>
                    <ul>
                        <li>Food delivery partnerships</li>
                        <li>Event hosting</li>
                        <li>Expansion potential</li>
                    </ul>
                </div>
                <div class="swot-card threats">
                    <h4>🔥 Threats</h4>
                    <ul>
                        <li>Economic downturns</li>
                        <li>Competitor entry</li>
                        <li>Vendor turnover</li>
                    </ul>
                </div>
            </div>
        </section>
    </main>

    <nav class="chapter-nav">
        <a href="/docs/business-plan/02-company-profile" class="prev">← Company Profile</a>
        <a href="/docs/business-plan/04-facility-stalls" class="next">Facility & Stalls →</a>
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
    .section p {
        font-size: 1.1rem;
        line-height: 1.8;
        color: #52525b;
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

    .placeholder {
        background: var(--color-pink-light);
        padding: 1rem;
        border-radius: 4px;
        border-left: 4px solid var(--color-pink);
    }

    .location-card {
        background: white;
        border: 2px solid var(--color-black);
        padding: 1.5rem;
        box-shadow: 4px 4px 0px var(--color-green);
    }
    .location-card h3 {
        margin-bottom: 1rem;
        font-size: 1.2rem;
    }

    .info-table {
        width: 100%;
        border-collapse: collapse;
    }
    .info-table td {
        padding: 0.75rem;
        border: 1px solid #e4e4e7;
    }
    .info-table tr td:first-child {
        font-weight: 700;
        width: 35%;
        background: #fafafa;
    }

    .market-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
    }
    .market-card {
        background: white;
        border: 2px solid var(--color-black);
        padding: 1.5rem;
    }
    .market-card.vendors {
        box-shadow: 4px 4px 0px var(--color-pink);
    }
    .market-card.customers {
        box-shadow: 4px 4px 0px var(--color-green);
    }
    .market-card h4 {
        margin-bottom: 1rem;
        font-size: 1.1rem;
    }
    .market-card ul {
        list-style: disc;
        padding-left: 1.5rem;
        margin: 0;
    }
    .market-card li {
        margin-bottom: 0.5rem;
    }

    .swot-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }
    @media(max-width: 600px) {
        .swot-grid { grid-template-columns: 1fr; }
    }
    .swot-card {
        background: white;
        border: 2px solid var(--color-black);
        padding: 1rem;
    }
    .swot-card h4 {
        font-size: 1rem;
        margin-bottom: 0.75rem;
    }
    .swot-card ul {
        list-style: disc;
        padding-left: 1.5rem;
        margin: 0;
        font-size: 0.95rem;
    }
    .swot-card.strengths { border-left: 4px solid var(--color-green); }
    .swot-card.weaknesses { border-left: 4px solid #f97316; }
    .swot-card.opportunities { border-left: 4px solid #3b82f6; }
    .swot-card.threats { border-left: 4px solid #ef4444; }

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
