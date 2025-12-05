<script lang="ts">
    import { onMount } from 'svelte';
    

    // --- CONFIGURATION ---
    // Set to true to drag points and copy new JSON
    let debugMode = $state(false); 

    // State Runes
    let scrollY = $state(0);
    let mouseX = $state(0);
    let mouseY = $state(0);
    
    let mapContainer: HTMLDivElement;

    // Hero Fireflies
    const fireflies = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 8 + 4, 
        duration: Math.random() * 10 + 10,
        delay: Math.random() * 5
    }));

    // --- UNIFIED MAP DATA ---
    let mapItems = $state([
    {
        "type": "location",
        "name": "Tagbilaran HQ",
        "top": 67.8,
        "left": 68,
        "main": true
    },
    {
        "type": "location",
        "name": "Tubigon",
        "top": 66.9,
        "left": 69.5
    },
    {
        "type": "location",
        "name": "Alicia",
        "top": 67.8,
        "left": 71
    },
    {
        "type": "location",
        "name": "Catigbian",
        "top": 66.3,
        "left": 70.2
    },
    {
        "type": "location",
        "name": "Dumaguete",
        "top": 69.9,
        "left": 61.2,
        "main": true
    },
    {
        "type": "location",
        "name": "Sibulan",
        "top": 67.3,
        "left": 59.6
    },
    {
        "type": "location",
        "name": "Manjuyod",
        "top": 68.4,
        "left": 60.7
    },
    {
        "type": "location",
        "name": "Tayasan",
        "top": 66.6,
        "left": 61
    },
    {
        "type": "location",
        "name": "Sta. Catalina",
        "top": 67.6,
        "left": 61.7
    },
    {
        "type": "label",
        "name": "BOHOL",
        "top": 70.2,
        "left": 73
    },
    {
        "type": "label",
        "name": "NEGROS",
        "top": 70.2,
        "left": 54.2
    }
]);

    // --- METRICS DATA ---
    const metricsData = [
        { val: "13+", label: "Churches" },
        { val: "50+", label: "Years" },
        { val: "1", label: "Global Mission" }
    ];

    // --- DRAG LOGIC ---
    let draggingIndex = $state<number | null>(null);
    let isDragging = $state(false);

    function startDrag(index: number, event: MouseEvent | TouchEvent) {
        if (!debugMode) return;
        // Prevent default only if we are actually debugging/dragging
        if (event.cancelable) event.preventDefault();
        event.stopPropagation();
        draggingIndex = index;
        isDragging = true;
    }

    function onMove(event: MouseEvent | TouchEvent) {
        if (!debugMode || !isDragging || draggingIndex === null || !mapContainer) return;
        
        const rect = mapContainer.getBoundingClientRect();
        const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
        const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

        let x = ((clientX - rect.left) / rect.width) * 100;
        let y = ((clientY - rect.top) / rect.height) * 100;

        mapItems[draggingIndex].left = Number(x.toFixed(1));
        mapItems[draggingIndex].top = Number(y.toFixed(1));
    }

    function endDrag() {
        isDragging = false;
        draggingIndex = null;
    }

    function copyConfig() {
        const json = JSON.stringify(mapItems, null, 4);
        console.log(json);
        navigator.clipboard.writeText(json).then(() => alert("Full Map Data Copied!"));
    }

    // Ministry Data
    const ministries = [
        {
            title: "Children's Ministry",
            desc: "Guiding children to love God and understand the Bible through joyful foundation building.",
            img: "https://images.unsplash.com/photo-1473649085228-583485e6e4d7?q=80&w=800&auto=format&fit=crop"
        },
        {
            title: "Youth Aflame",
            desc: "Discipling the next generation through fellowship, purposeful activities, and faith building.",
            img: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=800&auto=format&fit=crop"
        },
        {
            title: "Minister's Training",
            desc: "Equipping shepherds to biblically feed, protect, and lead God's flock with integrity.",
            img: "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?q=80&w=800&auto=format&fit=crop"
        },
        {
            title: "Church Planting",
            desc: "Expanding the Kingdom by establishing new faith communities across the nation.",
            img: "https://images.unsplash.com/photo-1507692049790-de58293a4699?q=80&w=800&auto=format&fit=crop"
        },
        {
            title: "Music & Worship",
            desc: "Training musicians and singers to lead the congregation into the presence of God.",
            img: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=800&auto=format&fit=crop"
        },
        {
            title: "Community Outreach",
            desc: "Sharing the love of Jesus through acts of compassion, evangelism, and service.",
            img: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=800&auto=format&fit=crop"
        },
        {
            title: "Radio Ministry",
            desc: "Broadcasting the Good News and biblical teaching to listeners far and wide.",
            img: "https://images.unsplash.com/photo-1478737270239-2f02b77ac6d5?q=80&w=800&auto=format&fit=crop"
        }
    ];

    onMount(() => {
        if (typeof window !== 'undefined') {
            scrollY = window.scrollY;
        }

        const handleScroll = () => { scrollY = window.scrollY; };
        const handleMouse = (e: MouseEvent) => {
            mouseX = (e.clientX / window.innerWidth) - 0.5;
            mouseY = (e.clientY / window.innerHeight) - 0.5;
        };

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('mousemove', handleMouse);
        
        // Global listeners for drag ending (mouseup/touchend) to ensure we catch drops outside the element
        if (debugMode) {
            window.addEventListener('mousemove', onMove);
            window.addEventListener('touchmove', onMove, { passive: false });
            window.addEventListener('mouseup', endDrag);
            window.addEventListener('touchend', endDrag);
        }
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('mousemove', handleMouse);
            if (debugMode) {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('touchmove', onMove);
                window.removeEventListener('mouseup', endDrag);
                window.removeEventListener('touchend', endDrag);
            }
        };
    });
</script>

<svelte:head>
    <title>March of Faith Incorporated - Headquarters Church in Tagbilaran, Bohol</title>
    <meta name="description" content="Welcome to March of Faith Incorporated, the headquarters church in Tagbilaran, Bohol. Every Creature is Reachable." />
    <meta property="og:title" content="March of Faith Incorporated - Every Creature is Reachable" />
    <meta property="og:description" content="Welcome to March of Faith Incorporated, the headquarters church in Tagbilaran, Bohol. Spreading God's love since 1974." />
    <meta name="twitter:title" content="March of Faith Incorporated - Every Creature is Reachable" />
    <meta name="twitter:description" content="Welcome to March of Faith Incorporated, the headquarters church in Tagbilaran, Bohol." />
</svelte:head>

<section class="hero">
    <div class="hero-background">
        <div class="hero-gradient"></div>
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
        <div class="hero-texture"></div>
    </div>

    <div class="hero-content container">
        <div class="hero-text-wrapper" style="transform: translateY({scrollY * 0.2}px); opacity: {1 - scrollY / 500}">
            <span class="pre-title">Welcome to</span>
            <h1 class="hero-title">
                MARCH OF<br/>
                <span class="slab-highlight">FAITH INC.</span>
            </h1>
            <div class="tagline-separator">
                <span class="line"></span>
                <p class="hero-subtitle">Every Creature is Reachable</p>
                <span class="line"></span>
            </div>
            <div class="hero-buttons">
                <a href="/about" class="btn btn-hero-primary">Our Mission</a>
                <a href="/churches" class="btn btn-hero-secondary">Find a Church</a>
            </div>
        </div>
    </div>
    <div class="scroll-mouse" style="opacity: {1 - scrollY / 200}">
        <div class="mouse-wheel"></div>
    </div>
</section>

<section class="who-we-are">
    <div class="bg-gradient-layer"></div>
    
    <div class="container">
        <div class="split-layout">
            
            <div class="narrative-col">
                <div class="section-label">Who We Are</div>
                <h2>Rooted in History,<br>Expanding Our <span class="text-red">Reach</span>.</h2>
                
                <p class="lead-paragraph">
                    We are driven by a single conviction: that every creature is reachable. Headquartered in Tagbilaran City, Bohol, we are expanding our borders to ensure no soul is left behind.
                </p>
                
                <p class="body-paragraph">
                    March of Faith Incorporated isn't just a building; it's a growing movement. From our humble beginnings in 1974 under Rev. Rudy Salomon Trigo, D.D., to our multiplying network of churches today, our goal is to go further—crossing boundaries to bring the Gospel to every community.
                </p>

                <a href="/about" class="learn-more-link">Read Our Full History &rarr;</a>
            </div>

            <div class="map-col">
                
                <div class="map-metrics-mobile">
                    {#each metricsData as metric}
                        <div class="metric-card">
                            <span class="m-val">{metric.val}</span>
                            <span class="m-label">{metric.label}</span>
                        </div>
                    {/each}
                </div>

                <div class="map-aspect-container" bind:this={mapContainer}>
                    
                    <div class="map-shadow-layer"></div>

                    <img 
                        src="https://res.cloudinary.com/dexcw6vg0/image/upload/v1763605976/e4ajlir7axy6jvho2fhy.webp" 
                        alt="Philippines Map Locations" 
                        class="ph-map-img"
                    />

                    <div class="locations-overlay">
                        {#each mapItems as item, i}
                            {#if item.type === 'location'}
                                <div 
                                    class="map-marker {item.main ? 'marker-main' : ''} {debugMode ? 'debug-cursor' : ''}"
                                    class:selected={draggingIndex === i}
                                    role="button"
                                    tabindex="0"
                                    aria-label="Map location {item.name}"
                                    style="top: {item.top}%; left: {item.left}%;"
                                    onmousedown={(e) => startDrag(i, e)}
                                    ontouchstart={(e) => startDrag(i, e)}
                                    onkeydown={() => {}} 
                                >
                                    <div class="dot"></div>
                                    <span class="marker-tooltip">{item.name}</span>
                                </div>
                            {:else if item.type === 'label'}
                                <div 
                                    class="region-label {debugMode ? 'debug-cursor' : ''}"
                                    class:selected-label={draggingIndex === i}
                                    role="button"
                                    tabindex="0"
                                    aria-label="Region label {item.name}"
                                    style="top: {item.top}%; left: {item.left}%;"
                                    onmousedown={(e) => startDrag(i, e)}
                                    ontouchstart={(e) => startDrag(i, e)}
                                    onkeydown={() => {}}
                                >
                                    {item.name}
                                </div>
                            {/if}
                        {/each}
                    </div>
                    
                    <div class="map-metrics-desktop">
                        {#each metricsData as metric}
                            <div class="metric-card">
                                <span class="m-val">{metric.val}</span>
                                <span class="m-label">{metric.label}</span>
                            </div>
                        {/each}
                    </div>

                    {#if debugMode}
                        <div class="debug-controls">
                            <p class="debug-title">📍 Edit Mode</p>
                            <button onclick={copyConfig} class="save-btn">Copy Full Config</button>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</section>

<section class="ministries">
    <div class="container">
        <div class="section-header">
            <h2>Our Ministry</h2>
            <p class="section-subtitle">Serving God through various avenues of faith and fellowship.</p>
        </div>

        <div class="ministry-grid">
            {#each ministries as item}
            <div class="ministry-card">
                <div class="card-image">
                    <img src={item.img} alt={item.title} loading="lazy" />
                    <div class="card-overlay"></div>
                </div>
                <div class="card-content">
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                    <a href="/about" class="card-link">Learn More &rarr;</a>
                </div>
            </div>
            {/each}
        </div>
    </div>
</section>

<section class="location">
    <div class="container">
        <div class="location-wrapper">
            <div class="location-info">
                <span class="section-label text-red-dark">Visit Us</span>
                <h2>Worship With Us</h2>
                <p class="location-desc">Our headquarters in Tagbilaran City, Bohol serves a growing network of March of Faith churches around the nation. We warmly invite you to join us in worship.</p>
                
                <div class="schedule-box">
                    <div class="schedule-item">
                        <span class="day">Sunday Services</span>
                        <span class="time">9:00 AM & 4:00 PM</span>
                    </div>
                    <div class="schedule-item">
                        <span class="day">Wednesday Bible Study</span>
                        <span class="time">7:00 PM</span>
                    </div>
                    <div class="schedule-item">
                        <span class="day">Daily Prayer</span>
                        <span class="time">6:00 AM</span>
                    </div>
                </div>

                <div class="location-actions">
                    <a href="/contact" class="btn btn-primary">Get Directions</a>
                    <a href="/churches" class="btn btn-outline">View All Churches</a>
                </div>
            </div>

            <div class="location-visuals">
                <div class="image-card main-image">
                    <img 
                        src="https://images.unsplash.com/photo-1438232992991-995b70c8cad3?q=80&w=800&auto=format&fit=crop" 
                        alt="Church Gathering" 
                    />
                </div>
                <div class="founder-badge">
                    <div class="badge-content">
                        <img 
                            src="https://res.cloudinary.com/dexcw6vg0/image/upload/v1754821750/rcpqj7mzayco2ndwioqp.png" 
                            alt="Rev. Rudy Salomon Trigo" 
                        />
                        <div class="badge-text">
                            <span class="founded-by">Founded By</span>
                            <span class="founder-name">Rev. Rudy Salomon Trigo, D.D.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<style>
    /* --- Global Utilities --- */
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 2rem;
    }

    :root {
        --brand-red: #981B1E;
        --brand-accent: #C1272D;
        
        /* UPDATED BACKGROUND COLORS */
        --light-bg: #f1f5f9; /* Slate 100 - Very Light Gray-Blue */
        --dark-bg: #2c3e50;  /* Footer Color (Dark Blue-Gray) */
        --darker-bg: #24394e; /* Deepest part of footer gradient */
    }

    /* --- 1. Hero Section --- */
    .hero {
        position: relative;
        height: 100vh;
        min-height: 700px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        background: #981B1E;
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
        20% { opacity: 0.6; }
        50% { transform: translate(40px, -60px) scale(1.2); opacity: 0.3; }
        80% { opacity: 0.5; }
        100% { transform: translate(-20px, -120px) scale(0.8); opacity: 0; }
    }

    .hero-content {
        position: relative;
        z-index: 10;
        text-align: center;
        color: white;
        padding-top: 4rem;
    }

    .pre-title {
        font-family: 'Montserrat', sans-serif;
        font-size: 1.1rem;
        text-transform: uppercase;
        letter-spacing: 3px;
        opacity: 0.9;
        margin-bottom: 0.5rem;
        display: block;
    }

    .hero-title {
        font-family: 'Roboto Slab', serif;
        font-weight: 900;
        font-size: clamp(3.5rem, 9vw, 7.5rem);
        line-height: 0.95;
        text-transform: uppercase;
        margin: 0;
        letter-spacing: -0.03em;
        text-shadow: 0 10px 30px rgba(0,0,0,0.25);
    }

    .slab-highlight { color: white; display: inline-block; }

    .tagline-separator {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin: 2rem 0;
    }

    .line {
        height: 1px;
        width: 60px;
        background: rgba(255,255,255,0.5);
    }

    .hero-subtitle {
        font-family: 'Montserrat', sans-serif;
        font-size: 1.2rem;
        letter-spacing: 1px;
        font-weight: 400;
        margin: 0;
        font-style: italic;
        opacity: 0.9;
    }

    .hero-buttons {
        display: flex;
        gap: 1.5rem;
        justify-content: center;
        margin-top: 2.5rem;
    }

    .btn-hero-primary {
        background: white;
        color: #981B1E;
        padding: 1rem 2.5rem;
        font-weight: 800;
        font-family: 'Montserrat', sans-serif;
        text-transform: uppercase;
        letter-spacing: 1px;
        text-decoration: none;
        border-radius: 4px;
        transition: all 0.3s ease;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }

    .btn-hero-primary:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        background: #f0f0f0;
    }

    .btn-hero-secondary {
        background: transparent;
        color: white;
        padding: 1rem 2.5rem;
        font-weight: 700;
        font-family: 'Montserrat', sans-serif;
        text-transform: uppercase;
        letter-spacing: 1px;
        text-decoration: none;
        border: 2px solid rgba(255,255,255,0.4);
        border-radius: 4px;
        transition: all 0.3s ease;
    }

    .btn-hero-secondary:hover {
        background: rgba(255,255,255,0.1);
        border-color: white;
    }

    .scroll-mouse {
        position: absolute;
        bottom: 40px;
        left: 50%;
        transform: translateX(-50%);
        width: 26px;
        height: 44px;
        border: 2px solid rgba(255,255,255,0.5);
        border-radius: 20px;
        z-index: 10;
    }

    .mouse-wheel {
        width: 4px;
        height: 8px;
        background: white;
        border-radius: 2px;
        position: absolute;
        top: 8px;
        left: 50%;
        transform: translateX(-50%);
        animation: scroll 2s infinite;
    }

    @keyframes scroll {
        0% { top: 8px; opacity: 1; }
        100% { top: 24px; opacity: 0; }
    }

    /* --- 2. Who We Are (Split Layout) --- */
    .who-we-are {
        position: relative;
        padding: 0; 
        background: var(--light-bg);
        overflow: hidden;
    }

    /* SMOOTH GRADIENT BACKGROUND */
    .bg-gradient-layer {
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        z-index: 0;
        background: linear-gradient(
            120deg, 
            var(--light-bg) 0%, 
            var(--light-bg) 20%, 
            var(--dark-bg) 95%, 
            var(--darker-bg) 100%
        );
    }

    .split-layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        min-height: 700px;
        position: relative;
        z-index: 2;
    }

    /* Left: Narrative (Light Side) */
    .narrative-col {
        padding: 6rem 4rem 6rem 0;
        color: #334155; /* Dark Slate */
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .section-label {
        font-family: 'Montserrat', sans-serif;
        font-weight: 700;
        text-transform: uppercase;
        font-size: 0.85rem;
        letter-spacing: 2px;
        color: var(--brand-accent);
        margin-bottom: 1.5rem;
    }

    .narrative-col h2 {
        font-family: 'Roboto Slab', serif;
        font-size: 3rem;
        margin-bottom: 2rem;
        line-height: 1.15;
        color: #0f172a; /* Very Dark Slate */
    }

    .text-red { color: var(--brand-accent); font-style: italic; }

    .lead-paragraph {
        font-size: 1.25rem;
        line-height: 1.7;
        color: #334155;
        margin-bottom: 1.5rem;
        font-weight: 600;
    }

    .body-paragraph {
        font-size: 1rem;
        line-height: 1.7;
        color: #475569;
        margin-bottom: 2.5rem;
    }

    .learn-more-link {
        color: #C1272D;
        text-decoration: none;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-size: 0.9rem;
        border-bottom: 2px solid rgba(193, 39, 45, 0.2);
        padding-bottom: 4px;
        align-self: flex-start;
        transition: all 0.3s;
    }

    .learn-more-link:hover { border-bottom-color: #C1272D; }

    /* Right: Map (Dark Side) */
    .map-col {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 4rem 0;
    }

    .map-aspect-container {
        position: relative;
        width: 100%;
        max-width: 550px;
        aspect-ratio: 3/4; 
        display: flex;
        justify-content: center;
        align-items: center;
    }

    /* Shadow Glow behind Map */
    .map-shadow-layer {
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-49%, -49%) scale(1.02);
        width: 100%; height: 100%;
        background-color: #521a1a; 
        /* UPDATED SHADOW MASK URL */
        -webkit-mask-image: url("https://res.cloudinary.com/dexcw6vg0/image/upload/v1763605976/e4ajlir7axy6jvho2fhy.webp");
        mask-image: url("https://res.cloudinary.com/dexcw6vg0/image/upload/v1763605976/e4ajlir7axy6jvho2fhy.webp");
        -webkit-mask-size: contain;
        mask-size: contain;
        -webkit-mask-repeat: no-repeat;
        mask-repeat: no-repeat;
        mask-position: center;
        -webkit-mask-position: center;
        filter: blur(25px);
        opacity: 0.6;
        z-index: 0;
        pointer-events: none;
    }

    /* MAP RED TINT */
    .ph-map-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        position: relative;
        z-index: 1;
        filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5));
        opacity: 0.95;
    }

    .locations-overlay {
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        z-index: 2;
    }

    .map-marker {
        position: absolute;
        transform: translate(-50%, -50%);
        width: 20px; height: 20px;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; pointer-events: auto;
    }
    
    .debug-cursor { cursor: grab; }
    .debug-cursor:active { cursor: grabbing; }
    .selected .dot { background: #FFFF00; transform: scale(1.5); }

    .dot {
        width: 8px; height: 8px;
        background-color: white;
        border-radius: 50%;
        box-shadow: 0 0 8px rgba(255,255,255,0.9);
        transition: transform 0.2s ease;
    }
    
    .marker-main .dot {
        width: 12px; height: 12px;
        border: 2px solid rgba(255,255,255,0.5);
    }

    .marker-tooltip {
        position: absolute;
        top: -30px; left: 50%;
        transform: translateX(-50%);
        background: white;
        color: #981B1E;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 0.7rem;
        white-space: nowrap;
        opacity: 0;
        transition: 0.3s;
        pointer-events: none;
        font-weight: 700;
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    }

    .map-marker:hover .marker-tooltip { opacity: 1; top: -35px; }

    /* Region Labels - Draggable */
    .region-label {
        position: absolute;
        transform: translate(-50%, -50%);
        color: rgba(255,255,255,0.3);
        font-size: 0.7rem;
        font-weight: 800;
        letter-spacing: 3px;
        pointer-events: none;
        user-select: none;
        white-space: nowrap;
        z-index: 3;
        text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }
    
    .region-label.debug-cursor { pointer-events: auto; }
    .selected-label { color: #FFFF00 !important; opacity: 1; }

    /* --- METRICS STYLING --- */
    
    /* Desktop: Absolute overlay at bottom */
    .map-metrics-desktop {
        position: absolute;
        bottom: 0%; left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 2rem;
        z-index: 5;
        width: 100%;
        justify-content: center;
    }

    /* Mobile: Hidden by default */
    .map-metrics-mobile {
        display: none;
    }

    .metric-card {
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 1rem 1.5rem;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        min-width: 110px;
        transition: transform 0.3s ease;
    }
    
    .metric-card:hover {
        transform: translateY(-5px);
        background: rgba(255,255,255,0.15);
    }

    .m-val {
        font-family: 'Roboto Slab', serif;
        font-size: 1.8rem;
        font-weight: 700;
        color: #fff;
        line-height: 1;
        margin-bottom: 0.3rem;
    }

    .m-label {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        opacity: 0.8;
        color: white;
        text-align: center;
    }

    .debug-controls {
        position: absolute; bottom: 10px; left: 10px;
        background: #333; color: white; padding: 10px;
        border-radius: 8px; font-family: monospace; font-size: 0.8rem; z-index:100;
    }
    .save-btn { background: #C1272D; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer; margin-top: 5px; }

    /* --- 3. Ministry Section --- */
    .ministries {
        padding: 8rem 0;
        background: #f4f5f7;
    }

    .section-header {
        text-align: center;
        max-width: 700px;
        margin: 0 auto 4rem;
    }

    .section-header h2 {
        font-family: 'Roboto Slab', serif;
        font-size: 3rem;
        color: #333;
        margin-bottom: 0.5rem;
    }

    .section-subtitle {
        font-size: 1.2rem;
        color: #666;
        font-family: 'Montserrat', sans-serif;
    }

    .ministry-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 2rem;
    }

    .ministry-card {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        transition: all 0.4s ease;
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .ministry-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }

    .card-image {
        height: 220px;
        width: 100%;
        overflow: hidden;
        position: relative;
    }

    .card-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s ease;
    }

    .ministry-card:hover .card-image img {
        transform: scale(1.1);
    }

    .card-overlay {
        position: absolute;
        bottom: 0; left: 0; right: 0; height: 50%;
        background: linear-gradient(to top, rgba(0,0,0,0.5), transparent);
    }

    .card-content {
        padding: 2rem;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
    }

    .card-content h3 {
        font-size: 1.4rem;
        color: #981B1E;
        margin-bottom: 0.75rem;
        font-weight: 700;
        font-family: 'Roboto Slab', serif;
    }

    .card-content p {
        color: #555;
        line-height: 1.6;
        font-size: 0.95rem;
        margin-bottom: 1.5rem;
        flex-grow: 1;
    }

    .card-link {
        color: #C1272D;
        font-weight: 700;
        text-decoration: none;
        text-transform: uppercase;
        font-size: 0.85rem;
        letter-spacing: 1px;
        align-self: flex-start;
        transition: color 0.2s;
    }

    .card-link:hover {
        color: #981B1E;
    }

    /* --- 4. Location Section --- */
    .location {
        padding: 8rem 0;
        background: white;
        position: relative;
    }

    .location-wrapper {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4rem;
        align-items: center;
    }

    .text-red-dark { color: #981B1E; }

    .location-info h2 {
        font-family: 'Roboto Slab', serif;
        font-size: 3rem;
        color: #333;
        margin-bottom: 1.5rem;
        line-height: 1;
    }

    .location-desc {
        font-size: 1.15rem;
        color: #666;
        line-height: 1.7;
        margin-bottom: 2.5rem;
    }

    .schedule-box {
        background: #f9fafb;
        border-left: 4px solid #C1272D;
        padding: 2rem;
        border-radius: 4px;
        margin-bottom: 2.5rem;
    }

    .schedule-item {
        display: flex;
        justify-content: space-between;
        padding: 0.75rem 0;
        border-bottom: 1px dashed #e5e5e5;
        font-family: 'Montserrat', sans-serif;
    }

    .schedule-item:last-child { border-bottom: none; }

    .schedule-item .day { font-weight: 700; color: #333; }
    .schedule-item .time { color: #981B1E; font-weight: 600; }

    .location-actions {
        display: flex;
        gap: 1rem;
    }

    /* Standard Buttons */
    .btn {
        padding: 1rem 2rem;
        border-radius: 4px;
        font-weight: 700;
        text-decoration: none;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-size: 0.9rem;
        transition: all 0.3s;
        text-align: center;
    }

    .btn-primary {
        background: #C1272D;
        color: white;
        box-shadow: 0 4px 15px rgba(193, 39, 45, 0.3);
    }
    .btn-primary:hover { background: #981B1E; transform: translateY(-2px); }

    .btn-outline {
        background: transparent;
        border: 2px solid #C1272D;
        color: #C1272D;
    }
    .btn-outline:hover { background: #C1272D; color: white; }

    /* Location Visuals */
    .location-visuals {
        position: relative;
    }

    .image-card {
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 20px 50px rgba(0,0,0,0.15);
        transform: rotate(2deg);
        transition: transform 0.3s ease;
    }
    
    .location-visuals:hover .image-card {
        transform: rotate(0deg);
    }

    .image-card img {
        width: 100%;
        height: auto;
        display: block;
    }

    .founder-badge {
        position: absolute;
        bottom: -30px;
        left: -30px;
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        max-width: 220px;
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    .badge-content {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .badge-content img {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid #f0f0f0;
    }

    .badge-text {
        display: flex;
        flex-direction: column;
    }

    .founded-by {
        font-size: 0.7rem;
        text-transform: uppercase;
        color: #999;
        font-weight: 700;
        letter-spacing: 1px;
    }

    .founder-name {
        font-size: 0.9rem;
        font-weight: 700;
        color: #333;
        line-height: 1.3;
    }

    /* --- Responsive --- */
    @media (max-width: 900px) {
        /* Mobile Background: Vertical Split */
        .bg-gradient-layer {
            background: linear-gradient(
                180deg, 
                var(--light-bg) 0%, 
                var(--light-bg) 40%, 
                var(--dark-bg) 80%, 
                var(--darker-bg) 100%
            );
        }

        .split-layout {
            grid-template-columns: 1fr;
            gap: 2rem;
        }
        
        .narrative-col {
            padding: 4rem 0 2rem;
            text-align: center;
        }
        
        .map-col { 
            height: auto; 
            padding: 2rem 0 6rem;
        }
        
        /* Hide Desktop Metrics */
        .map-metrics-desktop {
            display: none;
        }

        /* Show Mobile Metrics Above Map */
        .map-metrics-mobile {
            display: flex;
            flex-direction: row;
            justify-content: center;
            width: 100%;
            gap: 1rem;
            margin-bottom: 2rem; /* Space between metrics and map */
            padding: 0 1rem;
        }
        
        .metric-card {
            min-width: 90px;
            padding: 0.8rem;
        }
    }

    @media (max-width: 768px) {
        .hero-title { font-size: 3.5rem; }
        .hero-buttons { flex-direction: column; width: 100%; padding: 0 2rem; }
        
        .location-wrapper { grid-template-columns: 1fr; gap: 3rem; }
        .location-visuals { margin-top: 2rem; }
        .founder-badge { left: 0; bottom: -20px; }
        
        .location-actions { flex-direction: column; }
        .btn { width: 100%; }
    }
</style>