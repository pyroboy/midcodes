<script lang="ts">
    import { page } from '$app/stores';
</script>

<svelte:head>
    <title>Marketing Strategy — FoodHub</title>
</svelte:head>

<div class="page-wrapper">
    <a href="/" class="back-link">← Back to Dashboard</a>
    
    <header class="chapter-header">
        <span class="chapter-number">06</span>
        <h1>Marketing Strategy</h1>
    </header>

    <main class="content">
        <section class="section">
            <h2>Digital Presence</h2>
            <p>Our primary marketing hub is our Facebook Page, leveraging the local community's heavy social media usage.</p>
            <ul>
                <li><strong>Facebook Page:</strong> "Mama Maly's Food Hub" - Central hub for all tenant menus and updates.</li>
                <li><strong>Content:</strong> High-quality food photos, "Behind the Scenes" kitchen peeps, and tenant spotlights.</li>
                <li><strong>Paid Advertising:</strong> Boosting posts (Budget: ~₱120 per 1000 reach) to target local demographics.</li>
                <li><strong>Influencers:</strong> Collaborating with local micro-influencers to showcase the "aesthetic" and food variety.</li>
            </ul>
        </section>

        <section class="section">
            <h2>Content Strategy</h2>
             <div class="calendar-grid">
                <div class="calendar-card">
                    <h3>Weekly Themes</h3>
                    <ul>
                        <li><strong>Monday:</strong> "Collaboration Day" - Joint tenant promos.</li>
                        <li><strong>Tuesday:</strong> "Taco Tuesday" / Dish of the Week features.</li>
                        <li><strong>Wednesday:</strong> Customer Reviews & Spotlights.</li>
                        <li><strong>Thursday:</strong> Menu Development / New Item Teasers.</li>
                        <li><strong>Friday:</strong> "Weekend Vibes" - Promoting late-night hangouts.</li>
                    </ul>
                </div>
                <div class="calendar-card">
                    <h3>Post Ideas</h3>
                    <ul>
                         <li>"Meet the Team" - Chef/Owner profiles.</li>
                         <li>Foodie Quotes (e.g., Virginia Woolf).</li>
                         <li>Safety Tips (Food safety assurance).</li>
                         <li>Community Engagement initiatives.</li>
                    </ul>
                </div>
            </div>
        </section>

        <section class="section">
            <h2>Promotional Campaigns</h2>
            <div class="promo-grid">
                <div class="promo-card">
                    <h3>Birthday Special</h3>
                    <p>Free meal or special dessert for birthday celebrants with a group.</p>
                </div>
                <div class="promo-card">
                    <h3>Group Promo</h3>
                    <p>Discounts for large groups (barkada bundles), encouraging social dining.</p>
                </div>
                <div class="promo-card">
                    <h3>Student Discount</h3>
                    <p>Special rates or "student meals" during lunch hours (11 AM - 1 PM).</p>
                </div>
                <div class="promo-card">
                    <h3>Wi-Fi Voucher</h3>
                    <p>Free Wi-Fi access with a minimum purchase amount.</p>
                </div>
            </div>
        </section>

        <section class="section">
            <h2>Vendor Acquisition Strategy</h2>
            <div class="strategy-grid">
                <div class="strategy-card">
                    <h4>🎯 Direct Outreach</h4>
                    <ul>
                        <li>Approach successful home-based food sellers</li>
                        <li>Contact food cart operators for upgrading</li>
                        <li>Partner with culinary schools for graduates</li>
                    </ul>
                </div>
                <div class="strategy-card">
                    <h4>📱 Digital Marketing</h4>
                    <ul>
                        <li>Facebook/Instagram ads targeting entrepreneurs</li>
                        <li>Post on local business groups</li>
                        <li>Create "Become a Vendor" landing page</li>
                    </ul>
                </div>
                <div class="strategy-card">
                    <h4>🤝 Partnerships</h4>
                    <ul>
                        <li>Local business chambers</li>
                        <li>DTI entrepreneurship programs</li>
                        <li>Microfinance institutions</li>
                    </ul>
                </div>
            </div>
        </section>

        <section class="section">
            <h2>Customer Traffic Strategy</h2>
            <div class="strategy-grid">
                <div class="strategy-card">
                    <h4>📍 Local Awareness</h4>
                    <ul>
                        <li>Signage and tarpaulins in area</li>
                        <li>Flyer distribution to nearby establishments</li>
                        <li>Google Business Profile optimization</li>
                    </ul>
                </div>
                <div class="strategy-card">
                    <h4>🎉 Events & Promos</h4>
                    <ul>
                        <li>Grand opening celebration</li>
                        <li>Monthly food festivals</li>
                        <li>Loyalty card program</li>
                    </ul>
                </div>
                <div class="strategy-card">
                    <h4>🛵 Delivery Partnerships</h4>
                    <ul>
                        <li>Grab Food onboarding for all vendors</li>
                        <li>Foodpanda registration</li>
                        <li>Dedicated pick-up area</li>
                    </ul>
                </div>
            </div>
        </section>

        <section class="section">
            <h2>Branding Guidelines</h2>
            <div class="brand-box">
                <div class="brand-item">
                    <h4>Logo & Identity</h4>
                    <p class="placeholder">[Insert logo and brand mark]</p>
                </div>
                <div class="brand-colors">
                    <h4>Brand Colors</h4>
                    <div class="color-swatches">
                        <div class="swatch pink">Pink<br><small>#ec4899</small></div>
                        <div class="swatch green">Green<br><small>#22c55e</small></div>
                        <div class="swatch black">Black<br><small>#18181b</small></div>
                    </div>
                </div>
            </div>
        </section>

        <section class="section">
            <h2>Social Media Plan</h2>
            <table class="social-table">
                <thead>
                    <tr>
                        <th>Platform</th>
                        <th>Content Type</th>
                        <th>Frequency</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Facebook</td>
                        <td>Vendor spotlights, promos, events</td>
                        <td>Daily</td>
                    </tr>
                    <tr>
                        <td>Instagram</td>
                        <td>Food photos, stories, reels</td>
                        <td>3x/week</td>
                    </tr>
                    <tr>
                        <td>TikTok</td>
                        <td>Behind-the-scenes, vendor stories</td>
                        <td>2x/week</td>
                    </tr>
                    <tr>
                        <td>Google Business</td>
                        <td>Hours, photos, reviews</td>
                        <td>As needed</td>
                    </tr>
                </tbody>
            </table>
        </section>

        <section class="section">
            <h2>Marketing Budget</h2>
            <p class="placeholder">[To be completed: Monthly marketing budget allocation for digital ads, signage, events, and promotions]</p>
        </section>
    </main>

    <nav class="chapter-nav">
        <a href="/docs/business-plan/05-lease-structure" class="prev">← Lease Structure</a>
        <a href="/docs/business-plan/07-operations" class="next">Operations Plan →</a>
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

    .strategy-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
    }
    .strategy-card {
        background: white;
        border: 2px solid var(--color-black);
        padding: 1.5rem;
        box-shadow: 4px 4px 0px var(--color-green);
    }
    .strategy-card h4 {
        margin-bottom: 1rem;
        font-size: 1.1rem;
    }
    .strategy-card ul {
        list-style: disc;
        padding-left: 1.5rem;
        margin: 0;
    }
    .strategy-card li {
        margin-bottom: 0.5rem;
        font-size: 0.95rem;
    }

    .brand-box {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
    }
    @media(max-width: 600px) {
        .brand-box { grid-template-columns: 1fr; }
    }
    .brand-item, .brand-colors {
        background: white;
        border: 2px solid var(--color-black);
        padding: 1.5rem;
    }
    .brand-item h4, .brand-colors h4 {
        margin-bottom: 1rem;
        font-size: 1.1rem;
    }
    .color-swatches {
        display: flex;
        gap: 1rem;
    }
    .swatch {
        flex: 1;
        padding: 1.5rem 1rem;
        text-align: center;
        font-weight: 700;
        font-size: 0.9rem;
        border-radius: 4px;
    }
    .swatch small { font-weight: 400; opacity: 0.8; }
    .swatch.pink { background: var(--color-pink); color: white; }
    .swatch.green { background: var(--color-green); color: white; }
    .swatch.black { background: var(--color-black); color: white; }

    .placeholder {
        background: var(--color-pink-light);
        padding: 1rem;
        border-radius: 4px;
        border-left: 4px solid var(--color-pink);
    }

    .social-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
    }
    .social-table th,
    .social-table td {
        padding: 0.75rem 1rem;
        border: 1px solid #e4e4e7;
        text-align: left;
    }
    .social-table th {
        background: var(--color-black);
        color: white;
        font-family: var(--font-header);
        text-transform: uppercase;
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
