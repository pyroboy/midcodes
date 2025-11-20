<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';

    // --- HERO ANIMATION LOGIC (Matches Main Page) ---
    const fireflies = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 8 + 4, 
        duration: Math.random() * 10 + 10,
        delay: Math.random() * 5
    }));

    let scrollY = 0;
    
    onMount(() => {
        const handleScroll = () => { scrollY = window.scrollY; };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    });
</script>

<svelte:head>
    <title>About - March of Faith Incorporated</title>
    <meta name="description" content="Learn about March of Faith Incorporated's rich history, mission, and values." />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
    <link href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@700;900&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<section class="about-hero">
    <div class="hero-background">
        <div class="hero-gradient"></div>
        <div class="hero-texture"></div>
        <div class="fireflies-container">
            {#each fireflies as fly}
                <div 
                    class="firefly"
                    style="
                        left: {fly.left}%; 
                        top: {fly.top}%; 
                        width: {fly.size}px; 
                        height: {fly.size}px; 
                        animation-duration: {fly.duration}s;
                        animation-delay: -{fly.delay}s;
                    "
                ></div>
            {/each}
        </div>
    </div>

    <div class="container hero-content">
        <div class="text-wrapper" style="transform: translateY({scrollY * 0.2}px); opacity: {1 - scrollY / 400}">
            <span class="pre-title">Our Story & Identity</span>
            <h1>About <span class="slab-highlight">March of Faith</span></h1>
            <div class="tagline-separator">
                <span class="line"></span>
                <p class="hero-subtitle">Every Creature is Reachable</p>
                <span class="line"></span>
            </div>
        </div>
    </div>
</section>

<div class="nav-wrapper">
    <div class="container">
        <nav class="tab-navigation">
            <a href="/about" class="tab-link" class:active={$page.url.pathname === '/about'}>Overview</a>
            <a href="/about/history-purpose" class="tab-link" class:active={$page.url.pathname === '/about/history-purpose'}>History & Purpose</a>
            <a href="/about/founding-minister" class="tab-link" class:active={$page.url.pathname === '/about/founding-minister'}>Founding Minister</a>
            <a href="/about/presiding-minister" class="tab-link" class:active={$page.url.pathname === '/about/presiding-minister'}>Presiding Minister</a>
        </nav>
    </div>
</div>

<section class="about-content">
    <div class="container">
        <div class="content-layout">
            
            <div class="main-column">
                
                <div class="content-card welcome-card">
                    <div class="card-header">
                        <span class="section-label">Est. 1975</span>
                        <h2>Welcome to the Family</h2>
                        <p class="lead-text">
                            For nearly five decades, March of Faith Incorporated has been a cornerstone of faith in Bohol, Philippines. We are more than a building; we are a spiritual home to countless believers committed to the Great Commission.
                        </p>
                    </div>
                    
                    <div class="founder-block">
                        <div class="founder-visual">
                            <img 
                                src="https://res.cloudinary.com/dexcw6vg0/image/upload/v1754821750/rcpqj7mzayco2ndwioqp.png" 
                                alt="Rev. Rudy Salomon Trigo" 
                            />
                            <div class="visual-backdrop"></div>
                        </div>
                        <div class="founder-text">
                            <h3>Our Founding Minister</h3>
                            <p><strong>Rev. Rudy Salomon Trigo, D.D.</strong> (1938-2011) established this ministry with a divine vision: to create a sanctuary where believers could grow in grace and truth.</p>
                            <a href="/about/founding-minister" class="text-link">Read His Story &rarr;</a>
                        </div>
                    </div>

                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-num">50+</span>
                            <span class="stat-lbl">Years of Grace</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-num">13+</span>
                            <span class="stat-lbl">Churches</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-num">∞</span>
                            <span class="stat-lbl">Lives Changed</span>
                        </div>
                    </div>
                </div>

                <div class="mv-grid">
                    <div class="mv-card mission">
                        <div class="mv-icon">🎯</div>
                        <h3>Our Mission</h3>
                        <p>To be a Christ-centered community that strengthens faith, builds meaningful relationships, and spreads God's love throughout the Philippines and beyond.</p>
                    </div>
                    <div class="mv-card vision">
                        <div class="mv-icon">🌟</div>
                        <h3>Our Vision</h3>
                        <p>To see transformed lives and thriving communities as we make disciples of Jesus Christ, equipped for service and empowered to be salt and light.</p>
                    </div>
                </div>

                <div class="values-section">
                    <h2>Our Core Values</h2>
                    <div class="values-grid">
                        {#each [
                            {icon: '📖', title: 'Biblical Foundation', desc: 'Scripture is our ultimate guide for faith and life.'},
                            {icon: '❤️', title: 'Christ-Centered Love', desc: 'Demonstrating compassion and service to all.'},
                            {icon: '🤝', title: 'Community Fellowship', desc: 'Creating spaces where everyone belongs.'},
                            {icon: '🌱', title: 'Spiritual Growth', desc: 'Committed to lifelong discipleship.'},
                            {icon: '✋', title: 'Faithful Service', desc: 'Using our gifts to build His kingdom.'},
                            {icon: '🌍', title: 'Global Perspective', desc: 'Reaching beyond our local borders.'}
                        ] as val}
                            <div class="value-item">
                                <span class="val-icon">{val.icon}</span>
                                <div class="val-content">
                                    <h4>{val.title}</h4>
                                    <p>{val.desc}</p>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>

            </div>

            <aside class="sidebar-column">
                
                <div class="widget-card info-widget">
                    <h3>Quick Facts</h3>
                    <ul class="info-list">
                        <li>
                            <span class="label">Founded</span>
                            <span class="value">Nov 19, 1975</span>
                        </li>
                        <li>
                            <span class="label">HQ Location</span>
                            <span class="value">Tagbilaran City</span>
                        </li>
                        <li>
                            <span class="label">SEC Reg.</span>
                            <span class="value">No. 0000058834</span>
                        </li>
                    </ul>
                </div>

                <div class="widget-card scripture-widget">
                    <div class="quote-mark">"</div>
                    <blockquote>
                        And he gave the apostles, the prophets, the evangelists, the shepherds and teachers, to equip the saints for the work of ministry.
                    </blockquote>
                    <cite>— Ephesians 4:11-12</cite>
                </div>

                <div class="widget-card contact-widget">
                    <h3>Get in Touch</h3>
                    <p>We'd love to hear from you or pray with you.</p>
                    <div class="contact-details">
                        <div class="c-row">
                            <span class="icon">📞</span>
                            <span>+63 99 9953 6700</span>
                        </div>
                        <div class="c-row">
                            <span class="icon">📧</span>
                            <span>marchoffaith@gmail.com</span>
                        </div>
                    </div>
                    <a href="/contact" class="btn-sidebar">Visit Our Church</a>
                </div>

            </aside>

        </div>
    </div>
</section>

<style>
    /* --- CSS VARIABLES (Matching Main Page) --- */
    :root {
        --brand-red: #981B1E;
        --brand-accent: #C1272D;
        --dark-text: #1e293b;
        --light-text: #64748b;
        --bg-light: #f8fafc;
        --card-bg: #ffffff;
    }

    /* --- GLOBAL UTILS --- */
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 2rem;
    }

    /* --- HERO SECTION --- */
    .about-hero {
        position: relative;
        height: 60vh;
        min-height: 400px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        background: #981B1E;
        margin-top: -85px; /* Pull up behind transparent header */
        padding-top: 85px; /* Compensate content */
    }

    .hero-background {
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        z-index: 1;
    }

    .hero-gradient {
        position: absolute;
        width: 100%; height: 100%;
        background: linear-gradient(145deg, #6e1315 0%, #981B1E 60%, #b92328 100%);
    }

    .hero-texture {
        position: absolute;
        width: 100%; height: 100%;
        background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E");
        opacity: 0.3;
    }

    .firefly {
        position: absolute;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
        filter: blur(4px);
        opacity: 0;
        animation: fly ease-in-out infinite;
    }

    @keyframes fly {
        0% { transform: translate(0, 0) scale(0.8); opacity: 0; }
        50% { transform: translate(40px, -60px) scale(1.2); opacity: 0.3; }
        100% { transform: translate(-20px, -120px) scale(0.8); opacity: 0; }
    }

    .hero-content {
        position: relative;
        z-index: 10;
        text-align: center;
        color: white;
    }

    .pre-title {
        font-family: 'Montserrat', sans-serif;
        font-size: 1rem;
        text-transform: uppercase;
        letter-spacing: 3px;
        opacity: 0.9;
        display: block;
        margin-bottom: 0.5rem;
    }

    .about-hero h1 {
        font-family: 'Roboto Slab', serif;
        font-weight: 900;
        font-size: clamp(2.5rem, 6vw, 4.5rem);
        line-height: 1;
        text-transform: uppercase;
        margin: 0;
        text-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }

    .slab-highlight { display: inline-block; }

    .tagline-separator {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin-top: 1.5rem;
    }

    .line {
        height: 1px;
        width: 40px;
        background: rgba(255,255,255,0.5);
    }

    .hero-subtitle {
        font-family: 'Montserrat', sans-serif;
        font-size: 1.1rem;
        font-style: italic;
        margin: 0;
    }

    /* --- NAVIGATION TABS --- */
    .nav-wrapper {
        background: white;
        border-bottom: 1px solid #e2e8f0;
        position: sticky;
        top: 70px; /* Height of scrolled header approx */
        z-index: 90;
        box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    }

    .tab-navigation {
        display: flex;
        overflow-x: auto;
        gap: 2rem;
        scrollbar-width: none; /* Hide scrollbar */
    }

    .tab-link {
        padding: 1.25rem 0;
        color: var(--light-text);
        text-decoration: none;
        font-family: 'Montserrat', sans-serif;
        font-weight: 600;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 3px solid transparent;
        transition: all 0.3s ease;
        white-space: nowrap;
    }

    .tab-link:hover { color: var(--brand-red); }

    .tab-link.active {
        color: var(--brand-red);
        border-bottom-color: var(--brand-red);
    }

    /* --- CONTENT LAYOUT --- */
    .about-content {
        background: var(--bg-light);
        padding: 4rem 0;
    }

    .content-layout {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 3rem;
        align-items: start;
    }

    /* --- MAIN COLUMN STYLES --- */
    .content-card {
        background: white;
        border-radius: 16px;
        padding: 3rem;
        box-shadow: 0 10px 30px rgba(0,0,0,0.04);
        border: 1px solid rgba(0,0,0,0.04);
        margin-bottom: 3rem;
    }

    .section-label {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--brand-accent);
        text-transform: uppercase;
        letter-spacing: 2px;
        display: block;
        margin-bottom: 0.5rem;
    }

    .welcome-card h2 {
        font-family: 'Roboto Slab', serif;
        font-size: 2.5rem;
        color: var(--dark-text);
        margin: 0 0 1.5rem 0;
        line-height: 1.1;
    }

    .lead-text {
        font-size: 1.15rem;
        line-height: 1.7;
        color: #475569;
    }

    /* Founder Block */
    .founder-block {
        display: flex;
        gap: 2rem;
        background: #fef2f2; /* Very light red tint */
        padding: 2rem;
        border-radius: 12px;
        margin: 2.5rem 0;
        align-items: center;
        border-left: 4px solid var(--brand-red);
    }

    .founder-visual {
        position: relative;
        width: 120px;
        height: 120px;
        flex-shrink: 0;
    }

    .founder-visual img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        position: relative;
        z-index: 2;
    }

    .founder-text h3 {
        font-family: 'Roboto Slab', serif;
        color: var(--brand-red);
        margin: 0 0 0.5rem 0;
        font-size: 1.2rem;
    }

    .founder-text p {
        font-size: 0.95rem;
        line-height: 1.5;
        color: var(--light-text);
        margin-bottom: 1rem;
    }

    .text-link {
        color: var(--brand-accent);
        font-weight: 700;
        text-decoration: none;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    /* Stats */
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        border-top: 1px dashed #cbd5e1;
        padding-top: 2rem;
    }

    .stat-item { text-align: center; }
    
    .stat-num {
        display: block;
        font-family: 'Roboto Slab', serif;
        font-size: 2rem;
        font-weight: 700;
        color: var(--brand-red);
    }

    .stat-lbl {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--light-text);
    }

    /* Mission / Vision */
    .mv-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin-bottom: 3rem;
    }

    .mv-card {
        background: white;
        padding: 2rem;
        border-radius: 16px;
        text-align: center;
        box-shadow: 0 5px 20px rgba(0,0,0,0.03);
        transition: transform 0.3s ease;
        border-top: 4px solid transparent;
    }

    .mv-card.mission { border-top-color: var(--brand-red); }
    .mv-card.vision { border-top-color: #1e293b; }

    .mv-card:hover { transform: translateY(-5px); }

    .mv-icon { font-size: 2.5rem; margin-bottom: 1rem; display: block; }

    .mv-card h3 {
        font-family: 'Roboto Slab', serif;
        font-size: 1.4rem;
        margin-bottom: 1rem;
        color: var(--dark-text);
    }

    .mv-card p {
        font-size: 0.95rem;
        line-height: 1.6;
        color: var(--light-text);
    }

    /* Values */
    .values-section h2 {
        font-family: 'Roboto Slab', serif;
        text-align: center;
        font-size: 2.5rem;
        margin-bottom: 2rem;
        color: var(--dark-text);
    }

    .values-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
    }

    .value-item {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        box-shadow: 0 2px 10px rgba(0,0,0,0.03);
        border: 1px solid #f1f5f9;
        transition: all 0.2s ease;
    }

    .value-item:hover {
        box-shadow: 0 10px 25px rgba(0,0,0,0.06);
        border-color: transparent;
    }

    .val-icon { font-size: 1.8rem; }
    
    .val-content h4 {
        font-family: 'Montserrat', sans-serif;
        font-weight: 700;
        color: var(--brand-red);
        margin: 0 0 0.5rem 0;
    }

    .val-content p {
        margin: 0;
        font-size: 0.9rem;
        color: var(--light-text);
        line-height: 1.5;
    }

    /* --- SIDEBAR --- */
    .sidebar-column {
        position: sticky;
        top: 140px; /* Nav height + header height buffer */
    }

    .widget-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 5px 20px rgba(0,0,0,0.04);
        border: 1px solid #f1f5f9;
    }

    .widget-card h3 {
        font-family: 'Roboto Slab', serif;
        font-size: 1.1rem;
        color: var(--dark-text);
        margin: 0 0 1rem 0;
        padding-bottom: 0.75rem;
        border-bottom: 2px solid #f1f5f9;
    }

    .info-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .info-list li {
        display: flex;
        justify-content: space-between;
        padding: 0.75rem 0;
        border-bottom: 1px dashed #e2e8f0;
        font-size: 0.9rem;
    }
    .info-list li:last-child { border: none; }

    .info-list .label { color: var(--light-text); }
    .info-list .value { font-weight: 600; color: var(--dark-text); text-align: right; }

    /* Scripture Widget */
    .scripture-widget {
        background: var(--brand-red);
        color: white;
        text-align: center;
        position: relative;
        overflow: hidden;
    }
    
    .quote-mark {
        position: absolute;
        top: -10px; left: 10px;
        font-size: 6rem;
        font-family: serif;
        opacity: 0.2;
        line-height: 1;
    }

    .scripture-widget blockquote {
        font-family: 'Roboto Slab', serif;
        font-size: 1.1rem;
        font-style: italic;
        margin: 1rem 0;
        position: relative;
        z-index: 2;
        line-height: 1.6;
    }

    .scripture-widget cite {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        opacity: 0.9;
    }

    /* Contact Widget */
    .contact-widget p {
        font-size: 0.9rem;
        color: var(--light-text);
        margin-bottom: 1.5rem;
    }

    .c-row {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        margin-bottom: 0.75rem;
        font-size: 0.9rem;
        color: var(--dark-text);
        font-weight: 500;
    }

    .btn-sidebar {
        display: block;
        text-align: center;
        background: var(--brand-red);
        color: white;
        text-decoration: none;
        padding: 0.8rem;
        border-radius: 6px;
        font-weight: 700;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.85rem;
        text-transform: uppercase;
        margin-top: 1.5rem;
        transition: background 0.2s;
    }
    .btn-sidebar:hover { background: #7f1618; }

    /* --- RESPONSIVE --- */
    @media (max-width: 900px) {
        .content-layout { grid-template-columns: 1fr; }
        .sidebar-column { position: static; margin-top: 3rem; }
        .about-hero { margin-top: 0; padding-top: 0; }
    }

    @media (max-width: 600px) {
        .founder-block { flex-direction: column; text-align: center; }
        .stats-grid { grid-template-columns: 1fr; }
        .mv-grid { grid-template-columns: 1fr; }
        .welcome-card { padding: 1.5rem; }
        .about-hero h1 { font-size: 2.5rem; }
    }
</style>