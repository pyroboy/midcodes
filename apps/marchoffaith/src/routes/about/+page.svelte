<script lang="ts">
    import { page } from '$app/stores';
    import Hero from '$lib/components/Hero.svelte';
    import AboutNav from '$lib/components/AboutNav.svelte';
</script>

<svelte:head>
	<title>About Us - March of Faith Incorporated</title>
	<meta name="description" content="Learn about March of Faith Incorporated - our history, mission, leadership, and beliefs. Serving the community in Tagbilaran City, Bohol since 1974." />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<Hero subtitle="A community of believers dedicated to spreading God's love and serving the people of Bohol since 1974">
	ABOUT US
</Hero>

<!-- Navigation Tabs -->
<AboutNav />

<!-- Main Content -->
<section class="about-content">
    <div class="container">

        <!-- Mission & Vision - Featured Section -->
        <div class="mv-section">
            <div class="mv-header">
                <span class="mv-label">Our Purpose</span>
                <h2>Called to Serve</h2>
            </div>
            <div class="mv-cards">
                <div class="mv-card vision-card">
                    <div class="mv-card-inner">
                        <div class="mv-badge">Vision</div>
                        <p class="mv-statement">"Every Creature Reachable."</p>
                        <div class="mv-verse">Mark 16:15</div>
                    </div>
                </div>
                <div class="mv-card mission-card">
                    <div class="mv-card-inner">
                        <div class="mv-badge">Mission</div>
                        <p class="mv-statement">"Reach the unreached. Preach Jesus. Make disciples."</p>
                        <div class="mv-verse">Matthew 28:19-20</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="content-layout">

            <div class="main-column">

                <!-- Welcome Section -->
                <div class="welcome-section">
                    <div class="welcome-header">
                        <span class="section-badge">Est. 1974</span>
                        <h2>Welcome to the Family</h2>
                    </div>
                    <p class="lead-text">
                        For over five decades, March of Faith Incorporated has been a cornerstone of faith in Bohol, Philippines. We are more than a building; we are a spiritual home to countless believers committed to the Great Commission.
                    </p>

                    <!-- Founder Feature -->
                    <a href="/about/founding-minister" class="founder-feature">
                        <div class="founder-image">
                            <img
                                src="https://res.cloudinary.com/dexcw6vg0/image/upload/v1754821750/rcpqj7mzayco2ndwioqp.png"
                                alt="Rev. Rudy Salomon Trigo, D.D."
                            />
                        </div>
                        <div class="founder-info">
                            <span class="founder-role">Our Founding Minister</span>
                            <h3>Rev. Rudy Salomon Trigo, D.D.</h3>
                            <p>(1938 - 2011)</p>
                            <span class="founder-link">Read His Story <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
                        </div>
                    </a>

                    <!-- Stats -->
                    <div class="stats-row">
                        <div class="stat-box">
                            <span class="stat-number">50+</span>
                            <span class="stat-label">Years of Ministry</span>
                        </div>
                        <div class="stat-divider"></div>
                        <div class="stat-box">
                            <span class="stat-number">13+</span>
                            <span class="stat-label">Local Churches</span>
                        </div>
                        <div class="stat-divider"></div>
                        <div class="stat-box">
                            <span class="stat-number">∞</span>
                            <span class="stat-label">Lives Touched</span>
                        </div>
                    </div>
                </div>

                <!-- Core Values -->
                <div class="values-section">
                    <div class="values-header">
                        <h2>Our Core Values</h2>
                        <p>The principles that guide everything we do</p>
                    </div>
                    <div class="values-grid">
                        {#each [
                            {icon: '📖', title: 'Biblical Foundation', desc: 'Scripture is our ultimate guide for faith and life.'},
                            {icon: '❤️', title: 'Christ-Centered Love', desc: 'Demonstrating compassion and service to all.'},
                            {icon: '🤝', title: 'Community Fellowship', desc: 'Creating spaces where everyone belongs.'},
                            {icon: '🌱', title: 'Spiritual Growth', desc: 'Committed to lifelong discipleship.'},
                            {icon: '✋', title: 'Faithful Service', desc: 'Using our gifts to build His kingdom.'},
                            {icon: '🌍', title: 'Global Perspective', desc: 'Reaching beyond our local borders.'}
                        ] as val}
                            <div class="value-card">
                                <span class="value-icon">{val.icon}</span>
                                <h4>{val.title}</h4>
                                <p>{val.desc}</p>
                            </div>
                        {/each}
                    </div>
                </div>

            </div>

            <aside class="sidebar-column">

                <!-- Quick Facts -->
                <div class="sidebar-card facts-card">
                    <h3>Quick Facts</h3>
                    <ul class="facts-list">
                        <li>
                            <span class="fact-label">Founded</span>
                            <span class="fact-value">November 19, 1974</span>
                        </li>
                        <li>
                            <span class="fact-label">Headquarters</span>
                            <span class="fact-value">Tagbilaran City, Bohol</span>
                        </li>
                        <li>
                            <span class="fact-label">SEC Registration</span>
                            <span class="fact-value">No. 0000058834</span>
                        </li>
                    </ul>
                </div>

                <!-- Scripture Card -->
                <div class="sidebar-card scripture-card">
                    <div class="scripture-bg"></div>
                    <div class="scripture-content">
                        <svg class="quote-icon" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" opacity="0.3"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>
                        <blockquote>
                            And he gave the apostles, the prophets, the evangelists, the shepherds and teachers, to equip the saints for the work of ministry.
                        </blockquote>
                        <cite>Ephesians 4:11-12</cite>
                    </div>
                </div>

                <!-- Contact Card -->
                <div class="sidebar-card contact-card">
                    <h3>Get in Touch</h3>
                    <p>We'd love to hear from you or pray with you.</p>
                    <div class="contact-rows">
                        <div class="contact-row">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            <span>+63 99 9953 6700</span>
                        </div>
                        <div class="contact-row">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            <span>marchoffaith@gmail.com</span>
                        </div>
                    </div>
                    <a href="/contact" class="btn-contact">Visit Our Church</a>
                </div>

            </aside>

        </div>
    </div>
</section>

<style>
    /* --- CSS VARIABLES --- */
    :root {
        --brand-primary: #981B1E;
        --brand-accent: #C1272D;
        --brand-dark: #7a1517;
        --text-dark: #1e293b;
        --text-muted: #64748b;
        --text-light: #94a3b8;
        --bg-light: #f8fafc;
        --bg-cream: #fefdfb;
        --card-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        --card-shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }

    /* --- GLOBAL --- */
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 2rem;
    }

    .about-content {
        background: linear-gradient(180deg, var(--bg-light) 0%, var(--bg-cream) 100%);
        padding: 4rem 0 6rem;
    }

    /* --- MISSION & VISION SECTION --- */
    .mv-section {
        margin-bottom: 4rem;
    }

    .mv-header {
        text-align: center;
        margin-bottom: 2.5rem;
    }

    .mv-label {
        font-family: 'Inter', sans-serif;
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--brand-accent);
        text-transform: uppercase;
        letter-spacing: 3px;
        display: block;
        margin-bottom: 0.75rem;
    }

    .mv-header h2 {
        font-family: 'Playfair Display', serif;
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--text-dark);
        margin: 0;
    }

    .mv-cards {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 2rem;
    }

    .mv-card {
        border-radius: 20px;
        overflow: hidden;
        position: relative;
    }

    .vision-card {
        background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-dark) 100%);
    }

    .mission-card {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    }

    .mv-card-inner {
        padding: 3rem 2.5rem;
        text-align: center;
        position: relative;
        z-index: 1;
    }

    .mv-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        opacity: 0.5;
    }

    .mv-badge {
        display: inline-block;
        background: rgba(255,255,255,0.2);
        color: white;
        font-family: 'Inter', sans-serif;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 2px;
        padding: 0.5rem 1.25rem;
        border-radius: 50px;
        margin-bottom: 1.5rem;
    }

    .mv-statement {
        font-family: 'Playfair Display', serif;
        font-size: 1.75rem;
        font-weight: 600;
        color: white;
        line-height: 1.4;
        margin: 0 0 1.5rem 0;
    }

    .mv-verse {
        font-family: 'Inter', sans-serif;
        font-size: 0.8rem;
        color: rgba(255,255,255,0.7);
        font-weight: 500;
    }

    /* --- CONTENT LAYOUT --- */
    .content-layout {
        display: grid;
        grid-template-columns: 1fr 380px;
        gap: 3rem;
        align-items: start;
    }

    /* --- WELCOME SECTION --- */
    .welcome-section {
        background: white;
        border-radius: 24px;
        padding: 3rem;
        box-shadow: var(--card-shadow);
        margin-bottom: 2.5rem;
    }

    .welcome-header {
        margin-bottom: 1.5rem;
    }

    .section-badge {
        display: inline-block;
        font-family: 'Inter', sans-serif;
        font-size: 0.7rem;
        font-weight: 700;
        color: var(--brand-accent);
        text-transform: uppercase;
        letter-spacing: 2px;
        background: rgba(193, 39, 45, 0.1);
        padding: 0.4rem 1rem;
        border-radius: 50px;
        margin-bottom: 1rem;
    }

    .welcome-header h2 {
        font-family: 'Playfair Display', serif;
        font-size: 2.25rem;
        font-weight: 700;
        color: var(--text-dark);
        margin: 0;
    }

    .lead-text {
        font-family: 'Inter', sans-serif;
        font-size: 1.1rem;
        line-height: 1.8;
        color: var(--text-muted);
        margin-bottom: 2rem;
    }

    /* Founder Feature */
    .founder-feature {
        display: flex;
        gap: 1.5rem;
        align-items: center;
        background: linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%);
        padding: 1.5rem;
        border-radius: 16px;
        text-decoration: none;
        border: 1px solid rgba(193, 39, 45, 0.1);
        margin-bottom: 2.5rem;
        transition: all 0.3s ease;
    }

    .founder-feature:hover {
        transform: translateY(-3px);
        box-shadow: var(--card-shadow-lg);
        border-color: rgba(193, 39, 45, 0.2);
    }

    .founder-image {
        width: 90px;
        height: 90px;
        border-radius: 50%;
        overflow: hidden;
        flex-shrink: 0;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .founder-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .founder-info {
        flex: 1;
    }

    .founder-role {
        font-family: 'Inter', sans-serif;
        font-size: 0.7rem;
        font-weight: 700;
        color: var(--brand-accent);
        text-transform: uppercase;
        letter-spacing: 1.5px;
    }

    .founder-info h3 {
        font-family: 'Playfair Display', serif;
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-dark);
        margin: 0.25rem 0 0.15rem;
    }

    .founder-info p {
        font-family: 'Inter', sans-serif;
        font-size: 0.85rem;
        color: var(--text-muted);
        margin: 0 0 0.5rem;
    }

    .founder-link {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-family: 'Inter', sans-serif;
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--brand-accent);
    }

    .founder-link svg {
        transition: transform 0.2s ease;
    }

    .founder-feature:hover .founder-link svg {
        transform: translateX(4px);
    }

    /* Stats */
    .stats-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2rem;
        padding-top: 2rem;
        border-top: 1px solid #e2e8f0;
    }

    .stat-box {
        text-align: center;
        flex: 1;
    }

    .stat-number {
        display: block;
        font-family: 'Playfair Display', serif;
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--brand-primary);
        line-height: 1;
    }

    .stat-label {
        font-family: 'Inter', sans-serif;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-top: 0.5rem;
        display: block;
    }

    .stat-divider {
        width: 1px;
        height: 50px;
        background: #e2e8f0;
    }

    /* --- VALUES SECTION --- */
    .values-section {
        background: white;
        border-radius: 24px;
        padding: 3rem;
        box-shadow: var(--card-shadow);
    }

    .values-header {
        text-align: center;
        margin-bottom: 2.5rem;
    }

    .values-header h2 {
        font-family: 'Playfair Display', serif;
        font-size: 2rem;
        font-weight: 700;
        color: var(--text-dark);
        margin: 0 0 0.5rem;
    }

    .values-header p {
        font-family: 'Inter', sans-serif;
        font-size: 1rem;
        color: var(--text-muted);
        margin: 0;
    }

    .values-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.25rem;
    }

    .value-card {
        background: var(--bg-light);
        padding: 1.5rem;
        border-radius: 16px;
        text-align: center;
        transition: all 0.3s ease;
        border: 1px solid transparent;
    }

    .value-card:hover {
        background: white;
        border-color: rgba(193, 39, 45, 0.15);
        box-shadow: var(--card-shadow);
        transform: translateY(-3px);
    }

    .value-icon {
        font-size: 2rem;
        display: block;
        margin-bottom: 0.75rem;
    }

    .value-card h4 {
        font-family: 'Inter', sans-serif;
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--text-dark);
        margin: 0 0 0.5rem;
    }

    .value-card p {
        font-family: 'Inter', sans-serif;
        font-size: 0.85rem;
        color: var(--text-muted);
        line-height: 1.5;
        margin: 0;
    }

    /* --- SIDEBAR --- */
    .sidebar-column {
        position: sticky;
        top: 140px;
    }

    .sidebar-card {
        background: white;
        border-radius: 20px;
        padding: 1.75rem;
        margin-bottom: 1.5rem;
        box-shadow: var(--card-shadow);
    }

    .sidebar-card h3 {
        font-family: 'Playfair Display', serif;
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--text-dark);
        margin: 0 0 1.25rem;
        padding-bottom: 0.75rem;
        border-bottom: 2px solid var(--bg-light);
    }

    /* Facts Card */
    .facts-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .facts-list li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.85rem 0;
        border-bottom: 1px solid #f1f5f9;
        font-family: 'Inter', sans-serif;
    }

    .facts-list li:last-child {
        border: none;
        padding-bottom: 0;
    }

    .fact-label {
        font-size: 0.85rem;
        color: var(--text-muted);
    }

    .fact-value {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-dark);
        text-align: right;
    }

    /* Scripture Card */
    .scripture-card {
        background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-dark) 100%);
        position: relative;
        overflow: hidden;
    }

    .scripture-card h3 {
        display: none;
    }

    .scripture-bg {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    }

    .scripture-content {
        position: relative;
        z-index: 1;
        text-align: center;
    }

    .quote-icon {
        color: white;
        margin-bottom: 0.5rem;
    }

    .scripture-card blockquote {
        font-family: 'Playfair Display', serif;
        font-size: 1.05rem;
        font-style: italic;
        color: white;
        line-height: 1.6;
        margin: 0 0 1rem;
    }

    .scripture-card cite {
        font-family: 'Inter', sans-serif;
        font-size: 0.75rem;
        font-weight: 600;
        color: rgba(255,255,255,0.8);
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    /* Contact Card */
    .contact-card p {
        font-family: 'Inter', sans-serif;
        font-size: 0.9rem;
        color: var(--text-muted);
        margin: 0 0 1.25rem;
        line-height: 1.5;
    }

    .contact-rows {
        margin-bottom: 1.5rem;
    }

    .contact-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.6rem 0;
        font-family: 'Inter', sans-serif;
        font-size: 0.9rem;
        color: var(--text-dark);
    }

    .contact-row svg {
        color: var(--brand-accent);
        flex-shrink: 0;
    }

    .btn-contact {
        display: block;
        text-align: center;
        background: linear-gradient(135deg, var(--brand-accent) 0%, var(--brand-primary) 100%);
        color: white;
        text-decoration: none;
        padding: 0.9rem;
        border-radius: 12px;
        font-family: 'Inter', sans-serif;
        font-weight: 600;
        font-size: 0.85rem;
        transition: all 0.3s ease;
    }

    .btn-contact:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(193, 39, 45, 0.3);
    }

    /* --- RESPONSIVE --- */
    @media (max-width: 1024px) {
        .content-layout {
            grid-template-columns: 1fr;
        }

        .sidebar-column {
            position: static;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
        }

        .sidebar-card {
            margin-bottom: 0;
        }
    }

    @media (max-width: 768px) {
        .mv-cards {
            grid-template-columns: 1fr;
        }

        .mv-statement {
            font-size: 1.5rem;
        }

        .values-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .sidebar-column {
            grid-template-columns: 1fr;
        }

        .stats-row {
            flex-direction: column;
            gap: 1.5rem;
        }

        .stat-divider {
            width: 60px;
            height: 1px;
        }
    }

    @media (max-width: 600px) {
        .about-content {
            padding: 2rem 0 4rem;
        }

        .container {
            padding: 0 1rem;
        }

        .welcome-section,
        .values-section {
            padding: 2rem 1.5rem;
            border-radius: 16px;
        }

        .welcome-header h2 {
            font-size: 1.75rem;
        }

        .founder-feature {
            flex-direction: column;
            text-align: center;
        }

        .values-grid {
            grid-template-columns: 1fr;
        }

        .mv-card-inner {
            padding: 2rem 1.5rem;
        }
    }
</style>
