<script lang="ts">
    import { onMount } from 'svelte';

    // --- PROPS ---
    interface ArticleImage {
        url: string;
        alt: string;
        caption: string;
    }

    interface ParagraphBlock { type: 'paragraph'; text: string; }
    interface HeadingBlock { type: 'heading'; text: string; }
    interface QuoteBlock { type: 'quote'; text: string; }
    interface ImageBlock { type: 'image'; src: string; alt: string; caption: string; }
    interface ListBlock { type: 'list'; items: string[]; }
    interface CarouselBlock { type: 'imageCarousel'; }
    interface SocialBlock { type: 'social'; platform: string; url: string; label: string; }

    type ContentBlock = ParagraphBlock | HeadingBlock | QuoteBlock | ImageBlock | ListBlock | CarouselBlock | SocialBlock;

    interface ArticleData {
        title: string;
        date: string;
        category: string;
        description: string;
        images: ArticleImage[];
        content: ContentBlock[];
    }

    let { article }: { article: ArticleData } = $props();

    // --- CAROUSEL STATE ---
    let currentSlide = $state(0);
    let touchStartX = $state(0);
    let touchEndX = $state(0);

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
</script>

<svelte:head>
    <title>{article.title} | March of Faith Inc.</title>
    <meta name="description" content={article.description} />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
    <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
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
                                        {#if image.caption}
                                            <figcaption class="carousel-caption">{image.caption}</figcaption>
                                        {/if}
                                    </figure>
                                {/each}
                            </div>
                            <button class="carousel-btn prev-btn" onclick={prevSlide} aria-label="Previous">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                            </button>
                            <button class="carousel-btn next-btn" onclick={nextSlide} aria-label="Next">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                            </button>
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
                        {#if block.caption}
                            <figcaption class="image-caption">{block.caption}</figcaption>
                        {/if}
                    </figure>
                {:else if block.type === 'list'}
                    <ul class="list">
                        {#each block.items as item}<li class="list-item">{item}</li>{/each}
                    </ul>
                {:else if block.type === 'social'}
                    <div class="social-block">
                        <a href={block.url} target="_blank" rel="noopener noreferrer" class="social-link">
                            {#if block.platform === 'facebook'}
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                            {/if}
                            <span>{block.label}</span>
                        </a>
                    </div>
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
    /* --- PAGE LAYOUT --- */
    .page-wrapper {
        background: #fff;
        padding-top: 90px;
        min-height: 100vh;
    }

    .content-container {
        max-width: 700px;
        margin: 0 auto;
        padding: 0 24px;
    }

    /* Breadcrumb */
    .breadcrumb {
        padding: 10px 0 30px;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        color: #6B6B6B;
    }
    .breadcrumb a { color: #6B6B6B; text-decoration: none; transition: color 0.2s; }
    .breadcrumb a:hover { color: #981B1E; }
    .separator { margin: 0 8px; color: #ccc; }
    .current { color: #333; }

    /* Article Header */
    .article-title-section { margin-bottom: 40px; }
    .article-meta {
        display: flex;
        align-items: center;
        margin-bottom: 16px;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        color: #6B6B6B;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
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
    .carousel-container {
        position: relative;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }
    .carousel-track { display: flex; transition: transform 0.4s ease; }
    .carousel-slide {
        min-width: 100%;
        position: relative;
        padding-bottom: 66.67%; /* 3:2 aspect ratio */
        background: #f5f5f5;
    }
    .carousel-image {
        position: absolute;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .carousel-caption {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 20px 24px;
        background: linear-gradient(transparent, rgba(0,0,0,0.8));
        color: white;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        line-height: 1.5;
    }
    .carousel-btn {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: white;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        z-index: 10;
        transition: all 0.2s;
    }
    .carousel-btn:hover {
        background: #981B1E;
        color: white;
    }
    .prev-btn { left: 16px; }
    .next-btn { right: 16px; }
    .carousel-indicators {
        position: absolute;
        bottom: 20px;
        left: 0;
        right: 0;
        display: flex;
        justify-content: center;
        gap: 10px;
    }
    .indicator {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: rgba(255,255,255,0.5);
        border: none;
        padding: 0;
        cursor: pointer;
        transition: all 0.2s;
    }
    .indicator.active {
        background: white;
        transform: scale(1.3);
    }

    /* Typography */
    .paragraph {
        font-family: 'Source Serif 4', serif;
        font-size: 20px;
        line-height: 1.75;
        color: #242424;
        margin-bottom: 1.75rem;
    }
    .heading {
        font-family: 'Source Serif 4', serif;
        font-size: 28px;
        font-weight: 700;
        margin: 3rem 0 1.25rem;
        color: #111;
    }
    .quote {
        border-left: 4px solid #981B1E;
        padding: 1.5rem 0 1.5rem 1.75rem;
        font-family: 'Source Serif 4', serif;
        font-style: italic;
        font-size: 22px;
        color: #444;
        margin: 2.5rem 0;
        background: linear-gradient(90deg, rgba(152, 27, 30, 0.05), transparent);
        border-radius: 0 8px 8px 0;
    }
    .quote p { margin: 0; }
    .list {
        padding-left: 24px;
        margin-bottom: 2rem;
        font-family: 'Source Serif 4', serif;
        font-size: 19px;
        line-height: 1.8;
    }
    .list-item { margin-bottom: 10px; }
    .image-figure { margin: 3rem 0; }
    .content-image { width: 100%; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
    .image-caption {
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        color: #666;
        text-align: center;
        margin-top: 12px;
    }

    /* Social Block */
    .social-block {
        margin: 2.5rem 0;
        padding: 1.5rem;
        background: #f8fafc;
        border-radius: 12px;
        text-align: center;
    }
    .social-link {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 12px 24px;
        background: #1877f2;
        color: white;
        text-decoration: none;
        border-radius: 8px;
        font-family: 'Inter', sans-serif;
        font-weight: 600;
        font-size: 15px;
        transition: all 0.2s;
    }
    .social-link:hover {
        background: #166fe5;
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(24, 119, 242, 0.3);
    }

    /* Related Section */
    .related-section {
        background: #f9fafb;
        padding: 80px 0;
        border-top: 1px solid #eee;
        margin-top: 60px;
    }
    .related-title {
        font-family: 'Source Serif 4', serif;
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 32px;
        color: #111;
    }
    .related-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 32px;
    }
    .related-card {
        background: white;
        border: 1px solid #eee;
        border-radius: 16px;
        overflow: hidden;
        text-decoration: none;
        color: inherit;
        transition: all 0.3s;
        display: block;
    }
    .related-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 30px rgba(0,0,0,0.08);
    }
    .related-image-wrapper { padding-top: 56%; position: relative; background: #eee; }
    .related-image { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; }
    .related-card-title {
        padding: 20px 20px 10px;
        margin: 0;
        font-family: 'Source Serif 4', serif;
        font-size: 18px;
        font-weight: 700;
    }
    .related-card-text {
        padding: 0 20px 24px;
        margin: 0;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        color: #666;
        line-height: 1.5;
    }

    /* Back to Top */
    .back-to-top {
        position: fixed;
        bottom: 32px;
        right: 32px;
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: #111;
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s;
        z-index: 90;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    .back-to-top:hover {
        background: #981B1E;
        transform: translateY(-3px);
    }

    /* Responsive */
    @media (max-width: 768px) {
        .page-wrapper { padding-top: 80px; }
        .article-h1 { font-size: 32px; }
        .paragraph { font-size: 18px; }
        .heading { font-size: 24px; }
        .quote { font-size: 18px; padding-left: 1.25rem; }
        .content-container { padding: 0 1.25rem; }
        .carousel-btn { width: 36px; height: 36px; }
        .prev-btn { left: 10px; }
        .next-btn { right: 10px; }
    }
</style>
