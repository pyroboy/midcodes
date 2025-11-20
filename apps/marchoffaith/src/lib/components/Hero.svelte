<script lang="ts">
    import { onMount } from 'svelte';

    export let subtitle: string;
    export let preTitle: string = '';

    // --- HERO ANIMATION LOGIC ---
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

<section class="hero-section">
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
            {#if preTitle}
                <span class="pre-title">{preTitle}</span>
            {/if}
            <h1><slot /></h1>
            <div class="tagline-separator">
                <span class="line"></span>
                <p class="hero-subtitle">{subtitle}</p>
                <span class="line"></span>
            </div>
        </div>
    </div>
</section>

<style>
    /* --- GLOBAL UTILS --- */
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 2rem;
    }

    /* --- HERO SECTION --- */
    .hero-section {
        position: relative;
        height: 45vh;
        min-height: 350px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        background: #981B1E;
        margin-top: -85px; /* Pull up behind transparent header */
        padding-top: 150px; /* Compensate content */
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
        width: 100%;
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

    h1 {
        font-family: 'Roboto Slab', serif;
        font-weight: 900;
        font-size: clamp(2.5rem, 6vw, 4.5rem);
        line-height: 1;
        text-transform: uppercase;
        margin: 0;
        text-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }

    /* We need to ensure the slot content (like .slab-highlight) works. 
       Since styles are scoped, we might need :global() for the slot content if we want to define it here,
       OR we expect the parent to pass styled content.
       However, .slab-highlight was defined in the page styles. 
       Let's define it here globally for the hero context or just use :global.
    */
    :global(.slab-highlight) { 
        display: inline-block; 
    }

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

    @media (max-width: 900px) {
        .hero-section { margin-top: 0; padding-top: 0; }
    }

    @media (max-width: 600px) {
        h1 { font-size: 2.5rem; }
    }
</style>
