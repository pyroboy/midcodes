<script>
    import '../app.css';
    import { config } from '$lib/config';
    import UnderConstruction from '$lib/components/UnderConstruction.svelte';
    import Header from '$lib/components/Header.svelte';
    import Footer from '$lib/components/Footer.svelte';
    import { page } from '$app/stores';
</script>

<svelte:head>
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
    <link href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@700;900&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="https://marchoffaith.org{$page.url.pathname}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://marchoffaith.org{$page.url.pathname}" />
    <meta property="og:site_name" content="March of Faith Incorporated" />
    <meta property="og:locale" content="en_PH" />
    <meta property="og:image" content="https://res.cloudinary.com/dexcw6vg0/image/upload/v1763355713/ojlomimmfvtgwzxjyptq.webp" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="March of Faith Incorporated - Every Creature is Reachable" />
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="https://res.cloudinary.com/dexcw6vg0/image/upload/v1763355713/ojlomimmfvtgwzxjyptq.webp" />
    
    <!-- Additional SEO -->
    <meta name="robots" content="index, follow" />
    <meta name="author" content="March of Faith Incorporated" />
    <meta name="geo.region" content="PH-BOH" />
    <meta name="geo.placename" content="Tagbilaran City, Bohol" />
    
    <!-- JSON-LD Structured Data -->
    {@html `<script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Church",
        "name": "March of Faith Incorporated",
        "alternateName": "MOFI",
        "description": "A Christian church organization headquartered in Tagbilaran City, Bohol, Philippines. Spreading God's love since 1974 with the vision: Every Creature is Reachable.",
        "url": "https://marchoffaith.org",
        "logo": "https://res.cloudinary.com/dexcw6vg0/image/upload/v1763355713/ojlomimmfvtgwzxjyptq.webp",
        "image": "https://res.cloudinary.com/dexcw6vg0/image/upload/v1763355713/ojlomimmfvtgwzxjyptq.webp",
        "telephone": "+63-99-9953-6700",
        "email": "marchoffaith@gmail.com",
        "foundingDate": "1974-11-19",
        "founder": {
            "@type": "Person",
            "name": "Rev. Rudy Salomon Trigo, D.D."
        },
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "San Isidro District",
            "addressLocality": "Tagbilaran City",
            "addressRegion": "Bohol",
            "addressCountry": "PH"
        },
        "sameAs": [],
        "openingHoursSpecification": [
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": "Sunday",
                "opens": "09:00",
                "closes": "12:00"
            },
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": "Sunday",
                "opens": "16:00",
                "closes": "18:00"
            },
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": "Wednesday",
                "opens": "19:00",
                "closes": "21:00"
            }
        ]
    }
    </script>`}
</svelte:head>

{#if config.underConstruction}
    <UnderConstruction />
{:else}
    <div class="app">
        <Header />
        <main>
            <slot />
        </main>
        <Footer />
    </div>
{/if}

<style>
    .app {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }

    main {
        flex: 1;
        display: flex;
        flex-direction: column;
        width: 100%;
        margin: 0 auto;
        box-sizing: border-box;
    }
</style>
