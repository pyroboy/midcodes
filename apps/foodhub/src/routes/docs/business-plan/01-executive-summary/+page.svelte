<script lang="ts">
    import { page } from '$app/stores';
</script>

<svelte:head>
    <title>Executive Summary — FoodHub</title>
</svelte:head>

<div class="page-wrapper">
    <a href="/" class="back-link">← Back to Dashboard</a>
    
    <header class="chapter-header">
        <span class="chapter-number">01</span>
        <h1>Executive Summary</h1>
    </header>

    <main class="content">
        <section class="section">
            <h2>Business Overview</h2>
            <p>Mama Maly's Food Hub is a newly established food court strategically located in the city center. We provide turnkey stall spaces for diverse food businesses, ranging from Korean cuisine to local favorites. Designed with a vibrant, aesthetic atmosphere and equipped with amenities like free Wi-Fi, we cater to a wide demographic including students, office workers, and night-shift employees.</p>
        </section>

        <section class="section">
            <h2>Mission Statement</h2>
            <p>"To provide a diverse and delicious culinary experience in a vibrant, connected environment where good food and good vibes come together for everyone."</p>
        </section>

        <section class="section">
            <h2>Vision Statement</h2>
            <p>"To be the premier 24-hour food destination in the city, known for its diverse selection, welcoming community atmosphere, and commitment to supporting local food entrepreneurs."</p>
        </section>

        <section class="section">
            <h2>Value Proposition</h2>
            <ul>
                <li><strong>Diverse Food Selection:</strong> From snacks to heavy meals, wide variety of cuisines.</li>
                <li><strong>24-Hour Operation:</strong> Catering to all schedules, including late-night diners.</li>
                <li><strong>Free Wi-Fi:</strong> High-speed connection (voucher based) for students and professionals.</li>
                <li><strong>Strategic Location:</strong> Accessible city center spot with foot traffic.</li>
                <li><strong>Vibrant Atmosphere:</strong> Aesthetic, busy, and open environment perfect for socializing.</li>
            </ul>
        </section>

        <section class="section">
            <h2>Investment Highlights</h2>
            <div class="highlight-grid">
                <div class="highlight-card">
                    <span class="highlight-label">Total Stalls</span>
                    <span class="highlight-value">10</span>
                </div>
                <div class="highlight-card">
                    <span class="highlight-label">Target Market</span>
                    <span class="highlight-value">Broad</span>
                </div>
                <div class="highlight-card">
                    <span class="highlight-label">Unit 1 Wi-Fi</span>
                    <span class="highlight-value">Voucher</span>
                </div>
                <div class="highlight-card">
                    <span class="highlight-label">Operation</span>
                    <span class="highlight-value">24 Hours</span>
                </div>
            </div>
        </section>
    </main>

    <nav class="chapter-nav">
        <span></span>
        <a href="/docs/business-plan/02-company-profile" class="next">Next: Company Profile →</a>
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
    .back-link:hover {
        padding-left: 0.5rem;
    }

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
    h1 {
        font-size: 3.5rem;
        line-height: 1;
    }

    .content {
        margin-bottom: 4rem;
    }

    .section {
        margin-bottom: 3rem;
    }
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

    .highlight-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
    }
    .highlight-card {
        background: white;
        border: 2px solid var(--color-black);
        padding: 1.5rem;
        text-align: center;
        box-shadow: 4px 4px 0px var(--color-green);
    }
    .highlight-label {
        display: block;
        font-size: 0.8rem;
        text-transform: uppercase;
        color: #71717a;
        margin-bottom: 0.5rem;
    }
    .highlight-value {
        font-family: var(--font-header);
        font-size: 2rem;
        font-weight: 700;
        color: var(--color-black);
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
    .chapter-nav a:hover {
        background: var(--color-pink);
    }
</style>
