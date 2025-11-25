<script lang="ts">
    import { onMount } from 'svelte';

    // --- CAROUSEL STATE ---
    let currentSlide = $state(0);
    let touchStartX = $state(0);
    let touchEndX = $state(0);

    // --- TYPE DEFINITIONS ---
    interface ArticleImage { url: string; alt: string; caption: string; }
    interface ParagraphBlock { type: 'paragraph'; text: string; }
    interface HeadingBlock { type: 'heading'; text: string; }
    interface QuoteBlock { type: 'quote'; text: string; }
    interface ImageBlock { type: 'image'; src: string; alt: string; caption: string; }
    interface ListBlock { type: 'list'; items: string[]; }
    interface CarouselBlock { type: 'imageCarousel'; }

    type ContentBlock = ParagraphBlock | HeadingBlock | QuoteBlock | ImageBlock | ListBlock | CarouselBlock;

    // --- CAROUSEL LOGIC ---
    const nextSlide = () => { currentSlide = (currentSlide + 1) % article.images.length; };
    const prevSlide = () => { currentSlide = (currentSlide - 1 + article.images.length) % article.images.length; };
    const goToSlide = (index: number) => { currentSlide = index; };
    const handleTouchStart = (e: TouchEvent) => { touchStartX = e.touches[0].clientX; };
    const handleTouchMove = (e: TouchEvent) => { touchEndX = e.touches[0].clientX; };
    const handleTouchEnd = () => {
        const diff = touchStartX - touchEndX;
        if (diff > 50) nextSlide();
        else if (diff < -50) prevSlide();
    };

    // --- ARTICLE DATA ---
    const article: {
        title: string;
        date: string;
        category: string;
        images: ArticleImage[];
        content: ContentBlock[];
    } = {
        title: 'March of Faith Inc. Marks 51 Years of Unyielding Gospel Advance',
        date: 'November 16, 2025',
        category: 'Events',
        images: [
            {
                url: 'https://res.cloudinary.com/dexcw6vg0/image/upload/v1763359983/tp0rs7obrolyxzzx88ww.jpg',
                alt: '51st Anniversary Celebration',
                caption: 'March of Faith 51st Anniversary Celebration Service'
            },
            {
                url: 'https://res.cloudinary.com/dexcw6vg0/image/upload/v1763359983/yfitomjie5maevvj2mp5.jpg',
                alt: 'Worship team leading the congregation',
                caption: 'Worship team leading the congregation in praise and worship'
            },
            {
                url: 'https://res.cloudinary.com/dexcw6vg0/image/upload/v1763359983/i8u8getdupgaxdgyqqpl.jpg',
                alt: 'Pastor delivering the message',
                caption: 'Pastor delivering the anniversary message to the congregation'
            },
            {
                url: 'https://res.cloudinary.com/dexcw6vg0/image/upload/v1763359984/sfewc9c6qvtprbvt0m7y.jpg',
                alt: 'Congregational worship',
                caption: 'Members of the congregation participating in worship'
            },
            {
                url: 'https://res.cloudinary.com/dexcw6vg0/image/upload/v1763359983/ks4dfsafoxgrp8wdk3jr.jpg',
                alt: 'Youth group performance',
                caption: 'Youth group special performance during the celebration'
            },
            {
                url: 'https://res.cloudinary.com/dexcw6vg0/image/upload/v1763359983/o9gbuact3klwl6ia4ppd.jpg',
                alt: 'Church leaders in prayer',
                caption: 'Church leaders joining in prayer during the service'
            },
            {
                url: 'https://res.cloudinary.com/dexcw6vg0/image/upload/v1763359983/wa2cepmyildowei3erwu.jpg',
                alt: 'Closing worship',
                caption: 'Closing worship and benediction of the 51st Anniversary Celebration'
            }
        ],
        content: [
            { type: 'imageCarousel' },
            { type: 'paragraph', text: '<strong>TAGBILARAN CITY</strong> — Across thirteen distinct locations spanning the islands of Bohol and Negros Oriental, March of Faith Inc. celebrated its 51st Foundation Day on November 16, 2025. The event was not merely a commemoration of time passed, but a synchronized declaration of the ministry’s enduring mission.' },
            { type: 'paragraph', text: "Half a century ago, the late <strong>Dr. Rev. Rudy Trigo</strong> established the ministry’s foundations, heeding a divine call to ignite a movement in the Visayas. Today, that torch is borne by his son and successor, <strong>Ralph Steven Dinsay Trigo</strong>, who leads the organization with a vision that honors its heritage while aggressively pursuing its future." },
            { type: 'heading', text: 'A Rallying Cry: Endure and Proclaim' },
            { type: 'paragraph', text: 'The celebration centered on the theme "Endure and Proclaim," derived from Matthew 24:13-14. This was more than a slogan; it served as a strategic mandate for every believer within the network—a reminder that the work of evangelism requires resilience.' },
            { type: 'quote', text: 'Our mission is not complete until every soul has heard the Good News. This anniversary is a call to perseverance. We do not just look back at what has been done; we look forward with renewed grit, anchoring our hearts in Christ as we advance the Kingdom to the very end.' },
            { type: 'paragraph', text: 'Despite geographic separation, the spirit of the celebration was singular. From the bustling streets of Tagbilaran to the quiet barangays of Negros, congregations united in simultaneous worship, breaking bread, performing baptisms, and engaging in community outreach.' },
            { type: 'heading', text: 'Unified Across 13 Locations' },
            { type: 'paragraph', text: 'The simultaneous services were held in the following communities:' },
            { type: 'list', items: [ 
                'Tagbilaran City, Bohol', 
                'Triple Union, Catigbian, Bohol', 
                'Caningag, Alicia, Bohol', 
                'Libertad, Tubigon, Bohol', 
                'Ajong, Sibulan, Negros Oriental', 
                'Poblacion, Sibulan, Negros Oriental', 
                'Magatas, Sibulan, Negros Oriental', 
                'Pinucawan, Tayasan, Negros Oriental', 
                'Cambaye, Tayasan, Negros Oriental', 
                'Linao, Tayasan, Negros Oriental', 
                'Dumaguete City, Negros Oriental', 
                'Bolisong, Manjuyod, Negros Oriental', 
                'Manlawaan, Sta. Catalina, Negros Oriental' 
            ] },
            { type: 'paragraph', text: "As March of Faith Inc. steps into its 52nd year, the organization remains steadfast. With plans already in motion for new church plants and expanded community development initiatives, the 51st anniversary stands as a testament to God's faithfulness and a launchpad for the work yet to be done." }
        ]
    };
</script>

<svelte:head>
    <title>{article.title} | March of Faith Inc.</title>
    <meta name="description" content="March of Faith Inc. celebrates its 51st Foundation Day across 13 locations in Bohol and Negros Oriental." />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
    <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap" rel="stylesheet">
</svelte:head>

<div class="page-wrapper">
    
    <nav class="breadcrumb">
        <div class="content-container">
            <a href="/">Home</a>
            <span class="separator">/</span>
            <a href="/news">News</a>
            <span class="separator">/</span>
            <span class="current">Article</span>
        </div>
    </nav>

    <header class="article-title-section">
        <div class="content-container">
            <div class="article-meta">
                <span class="article-category">{article.category}</span>
                <span class="meta-separator">·</span>
                <time datetime={new Date(article.date).toISOString().split('T')[0]} class="article-date">
                    {article.date}
                </time>
            </div>
            <h1 class="article-h1">{article.title}</h1>
        </div>
    </header>

    <article class="article-body">
        <div class="content-container">
            {#each article.content as block}
                {#if block.type === 'imageCarousel'}
                    <div class="carousel-wrapper">
                        <div class="carousel-container">
                            <div
                                class="carousel-track"
                                style:transform="translateX(-{currentSlide * 100}%)"
                                ontouchstart={handleTouchStart}
                                ontouchmove={handleTouchMove}
                                ontouchend={handleTouchEnd}
                            >
                                {#each article.images as image}
                                    <figure class="carousel-slide">
                                        <img src={image.url} alt={image.alt} class="carousel-image" loading="lazy" />
                                        <figcaption class="carousel-caption">{image.caption}</figcaption>
                                    </figure>
                                {/each}
                            </div>
                            <button class="carousel-btn prev-btn" onclick={prevSlide} aria-label="Previous"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg></button>
                            <button class="carousel-btn next-btn" onclick={nextSlide} aria-label="Next"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6" /></svg></button>
                            <div class="carousel-indicators">
                                {#each article.images as _, k}
                                    <button class="indicator {k === currentSlide ? 'active' : ''}" onclick={() => goToSlide(k)} aria-label={`Slide ${k + 1}`}></button>
                                {/each}
                            </div>
                        </div>
                    </div>
                {:else if block.type === 'paragraph'}
                    <p class="paragraph">{@html block.text}</p>
                {:else if block.type === 'heading'}
                    <h2 class="heading">{block.text}</h2>
                {:else if block.type === 'quote'}
                    <blockquote class="quote"><p>{block.text}</p></blockquote>
                {:else if block.type === 'image'}
                    <figure class="image-figure">
                        <img src={block.src} alt={block.alt} class="content-image" loading="lazy" />
                        <figcaption class="image-caption">{block.caption}</figcaption>
                    </figure>
                {:else if block.type === 'list'}
                    <ul class="list">
                        {#each block.items as item}<li class="list-item">{item}</li>{/each}
                    </ul>
                {/if}
            {/each}
        </div>
    </article>

    <aside class="related-section">
        <div class="content-container">
            <h3 class="related-title">More from March of Faith</h3>
            <div class="related-grid">
                <a href="/news" class="related-card">
                    <div class="related-image-wrapper">
                        <img src="https://res.cloudinary.com/dexcw6vg0/image/upload/v1763355713/ojlomimmfvtgwzxjyptq.webp" alt="Related Article" class="related-image" loading="lazy" />
                    </div>
                    <h4 class="related-card-title">View All News & Updates</h4>
                    <p class="related-card-text">Stay updated with the latest from March of Faith Inc.</p>
                </a>
            </div>
        </div>
    </aside>

    <button class="back-to-top" onclick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6" /></svg>
    </button>
</div>

<style>
    /* --- 1. HEADER OVERRIDES (REMOVED) --- 
       The global Header component now handles this logic automatically based on the route.
    */

    /* --- 2. PAGE LAYOUT --- */
    .page-wrapper {
        background: #fff;
        /* Important: Pushes content down so it isn't hidden behind the fixed global header */
        padding-top: 90px; 
        min-height: 100vh;
    }

    .content-container {
        max-width: 700px;
        margin: 0 auto;
        padding: 0 24px;
    }

    /* Breadcrumb */
    .breadcrumb { padding: 10px 0 30px; font-size: 14px; color: #6B6B6B; }
    .breadcrumb a { color: #6B6B6B; text-decoration: none; }
    .breadcrumb a:hover { color: #333; }
    .separator { margin: 0 8px; color: #ccc; }
    .current { color: #333; }

    /* Article Header */
    .article-title-section { margin-bottom: 40px; }
    .article-meta { display: flex; align-items: center; margin-bottom: 16px; font-size: 14px; color: #6B6B6B; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; }
    .article-category { color: #981B1E; font-weight: 700; }
    .meta-separator { margin: 0 8px; }
    .article-h1 {
        font-family: 'Source Serif 4', serif;
        font-size: 42px;
        font-weight: 700;
        line-height: 1.15;
        color: #111;
        margin: 0;
    }

    /* Article Body */
    .article-body { padding-bottom: 80px; }

    /* Carousel */
    .carousel-wrapper { margin: 48px 0; }
    .carousel-container { position: relative; border-radius: 4px; overflow: hidden; }
    .carousel-track { display: flex; transition: transform 0.4s ease; }
    .carousel-slide { min-width: 100%; position: relative; padding-bottom: 60%; background: #f5f5f5; }
    .carousel-image { position: absolute; width: 100%; height: 100%; object-fit: cover; }
    .carousel-caption { position: absolute; bottom: 0; left: 0; right: 0; padding: 16px; background: rgba(0,0,0,0.7); color: white; font-size: 13px; }
    .carousel-btn { position: absolute; top: 50%; transform: translateY(-50%); width: 40px; height: 40px; border-radius: 50%; background: white; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.2); z-index: 10; }
    .prev-btn { left: 16px; }
    .next-btn { right: 16px; }
    .carousel-indicators { position: absolute; bottom: 60px; left: 0; right: 0; display: flex; justify-content: center; gap: 8px; }
    .indicator { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.5); border: none; padding: 0; cursor: pointer; }
    .indicator.active { background: white; transform: scale(1.2); }

    /* Typography */
    .paragraph {
        font-family: 'Source Serif 4', serif;
        font-size: 20px;
        line-height: 1.7;
        color: #242424;
        margin-bottom: 2rem;
    }
    .heading {
        font-family: 'Source Serif 4', serif;
        font-size: 28px;
        font-weight: 700;
        margin: 3rem 0 1rem;
        color: #111;
    }
    .quote {
        border-left: 3px solid #981B1E;
        padding-left: 24px;
        font-family: 'Source Serif 4', serif;
        font-style: italic;
        font-size: 22px;
        color: #444;
        margin: 2.5rem 0;
    }
    .list {
        padding-left: 20px;
        margin-bottom: 2rem;
        font-family: 'Source Serif 4', serif;
        font-size: 19px;
        line-height: 1.8;
    }
    .list-item { margin-bottom: 8px; }
    .image-figure { margin: 3rem 0; }
    .content-image { width: 100%; border-radius: 4px; }
    .image-caption { font-size: 14px; color: #666; text-align: center; margin-top: 8px; }

    /* Related Section */
    .related-section { background: #f9fafb; padding: 80px 0; border-top: 1px solid #eee; margin-top: 60px; }
    .related-title { font-size: 24px; font-weight: 700; margin-bottom: 32px; }
    .related-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 32px; }
    .related-card { background: white; border: 1px solid #eee; border-radius: 8px; overflow: hidden; text-decoration: none; color: inherit; transition: transform 0.2s; display: block; }
    .related-card:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
    .related-image-wrapper { padding-top: 56%; position: relative; background: #eee; }
    .related-image { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; }
    .related-card-title { padding: 16px 16px 8px; margin: 0; font-size: 18px; font-weight: 700; }
    .related-card-text { padding: 0 16px 24px; margin: 0; font-size: 14px; color: #666; }

    /* Back to Top */
    .back-to-top { position: fixed; bottom: 32px; right: 32px; width: 48px; height: 48px; border-radius: 50%; background: #111; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; z-index: 90; }
    .back-to-top:hover { background: #981B1E; }

    /* Responsive */
    @media (max-width: 768px) {
        .page-wrapper { padding-top: 80px; }
        .article-h1 { font-size: 32px; }
        .paragraph { font-size: 18px; }
        .content-container { padding: 0 1.5rem; }
    }
</style>