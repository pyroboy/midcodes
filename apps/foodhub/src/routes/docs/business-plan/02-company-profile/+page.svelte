<script lang="ts">
    import { page } from '$app/stores';
</script>

<svelte:head>
    <title>Company Profile — FoodHub</title>
</svelte:head>

<div class="page-wrapper">
    <a href="/" class="back-link">← Back to Dashboard</a>
    
    <header class="chapter-header">
        <span class="chapter-number">02</span>
        <h1>Company Profile</h1>
    </header>

    <main class="content">
        <section class="section">
            <h2>Legal Structure</h2>
            <table class="info-table">
                <tbody>
                    <tr>
                        <td>Business Name</td>
                        <td>[FoodHub / Your Business Name]</td>
                    </tr>
                    <tr>
                        <td>Legal Entity</td>
                        <td>Sole Proprietorship / Corporation</td>
                    </tr>
                    <tr>
                        <td>DTI/SEC Registration</td>
                        <td>[Registration Number]</td>
                    </tr>
                    <tr>
                        <td>BIR TIN</td>
                        <td>[TIN Number]</td>
                    </tr>
                    <tr>
                        <td>Business Permit</td>
                        <td>[Permit Number]</td>
                    </tr>
                </tbody>
            </table>
        </section>

        <section class="section">
            <h2>Ownership Structure</h2>
            <p class="placeholder">[To be completed: List owners/shareholders and their respective equity stakes]</p>
        </section>

        <section class="section">
            <h2>Company Identity</h2>
            <div class="identity-card">
                <div class="detail-row">
                    <span class="label">Store Name</span>
                    <span class="value">Mama Maly's Food Hub</span>
                </div>
                <div class="detail-row">
                    <span class="label">Location</span>
                    <span class="value">City Center</span>
                </div>
                <div class="detail-row">
                    <span class="label">Concept</span>
                    <span class="value">Food Court / Food Hub</span>
                </div>
                <div class="detail-row">
                    <span class="label">Tagline</span>
                    <span class="value">"Good Food and Good Vibes"</span>
                </div>
            </div>
        </section>

        <section class="section">
            <h2>Operational Environment</h2>
            <p>Mama Maly's creates a distinct atmosphere that balances energy with functionality:</p>
            <ul>
                <li><strong>Type:</strong> Food court style setup with open seating.</li>
                <li><strong>Vibe:</strong> Busy, aesthetic, and lively.</li>
                <li><strong>Noise Level:</strong> Moderate to Noisy (energetic atmosphere).</li>
                <li><strong>Amenities:</strong> Free Wi-Fi access for customers.</li>
                <li><strong>Note:</strong> While aesthetic, it is an open and busy environment, primarily for dining and socializing rather than quiet study.</li>
            </ul>
        </section>

        <section class="section">
            <h2>Service Hours</h2>
            <div class="schedule-grid">
                <div class="time-slot">
                    <span class="time-label">Breakfast</span>
                    <span class="time-value">8:00 AM - 10:00 AM</span>
                </div>
                <div class="time-slot">
                    <span class="time-label">Lunch</span>
                    <span class="time-value">11:00 AM - 2:00 PM</span>
                </div>
                <div class="time-slot">
                    <span class="time-label">Afternoon Snacks</span>
                    <span class="time-value">2:00 PM - 5:00 PM</span>
                </div>
                <div class="time-slot">
                    <span class="time-label">Dinner</span>
                    <span class="time-value">5:00 PM - 8:00 PM</span>
                </div>
                <div class="time-slot full-width">
                    <span class="time-label">Late-Night Dining</span>
                    <span class="time-value">8:00 PM - 8:00 AM (24-Hour Option)</span>
                </div>
            </div>
        </section>

        <section class="section">
            <h2>Business Location</h2>
            <div class="location-card">
                <h3>📍 Primary Location</h3>
                <p>[Street Address]<br>[Barangay, City]<br>[Province, Postal Code]</p>
            </div>
        </section>

        <section class="section">
            <h2>Business History</h2>
            <div class="timeline">
                <div class="timeline-item">
                    <span class="year">[Year]</span>
                    <p>Business Concept Development</p>
                </div>
                <div class="timeline-item">
                    <span class="year">[Year]</span>
                    <p>Location Secured & Renovation</p>
                </div>
                <div class="timeline-item">
                    <span class="year">[Year]</span>
                    <p>Grand Opening</p>
                </div>
            </div>
        </section>

        <section class="section">
            <h2>Key Milestones</h2>
            <ul>
                <li>Secured prime location with high foot traffic</li>
                <li>Completed facility renovation and stall construction</li>
                <li>Obtained all necessary permits and licenses</li>
                <li>Onboarded first batch of food vendors</li>
            </ul>
        </section>
    </main>

    <nav class="chapter-nav">
        <a href="/docs/business-plan/01-executive-summary" class="prev">← Executive Summary</a>
        <a href="/docs/business-plan/03-market-analysis" class="next">Market Analysis →</a>
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
    .section ul {
        list-style: none;
        padding: 0;
    }
    .section ul li {
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

    .info-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
    }
    .info-table td {
        padding: 1rem;
        border: 1px solid #e4e4e7;
    }
    .info-table tr td:first-child {
        font-weight: 700;
        width: 40%;
        background: #fafafa;
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
    .location-card p {
        margin: 0;
        line-height: 1.8;
    }

    .timeline {
        border-left: 3px solid var(--color-pink);
        padding-left: 2rem;
        margin-left: 1rem;
    }
    .timeline-item {
        position: relative;
        margin-bottom: 2rem;
    }
    .timeline-item::before {
        content: '';
        position: absolute;
        left: -2.4rem;
        top: 0.3rem;
        width: 12px;
        height: 12px;
        background: var(--color-pink);
        border-radius: 50%;
    }
    .year {
        display: inline-block;
        background: var(--color-black);
        color: white;
        padding: 0.25rem 0.75rem;
        font-family: var(--font-header);
        font-size: 0.9rem;
        margin-bottom: 0.5rem;
    }
    .timeline-item p {
        margin: 0;
        font-weight: 500;
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
