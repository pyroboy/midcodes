<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';

    // Carousel state
    let currentSlide = $state(0);
    let touchStartX = $state(0);
    let touchEndX = $state(0);

    const nextSlide = () => {
        currentSlide = (currentSlide + 1) % article.images.length;
    };

    const prevSlide = () => {
        currentSlide = (currentSlide - 1 + article.images.length) % article.images.length;
    };

    const goToSlide = (index) => {
        currentSlide = index;
    };

    const handleTouchStart = (e) => {
        touchStartX = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
        touchEndX = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        const diff = touchStartX - touchEndX;
        if (diff > 50) {
            nextSlide();
        } else if (diff < -50) {
            prevSlide();
        }
    };

    // Article data
    const article = {
        title: 'March of Faith Inc. Honors 51-Year Legacy, Celebrates Unified Mission',
        date: 'November 16, 2024',
        category: 'Announcements',
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
            {
                type: 'paragraph',
                text: 'TAGBILARAN CITY — March of Faith Inc. marked its 51st Foundation Day on November 16, 2025, with a unified celebration that spanned 12 different locations across Bohol and Negros Oriental.'
            },
            {
                type: 'paragraph',
                text: 'This anniversary honors the ministry\'s origins and the enduring legacy of its founder, the late <strong>Dr. Rev. Rudy Trigo</strong>. It was 51 years ago that he first felt the call of the Lord to start a movement in Bohol. Today, that mission is carried forward by his son and successor, <strong>Ralph Steven Dinsay Trigo</strong>, who now leads the March of Faith Inc.'
            },
            {
                type: 'heading',
                text: 'Enduring Faith, Advancing the Gospel'
            },
            {
                type: 'paragraph',
                text: 'This year\'s event centered on the theme "Endure and proclaim, advancing the gospel until the end," drawn from Matthew 24:13-14. This theme served as a direct and urgent call to action for the ministry:'
            },
            {
                type: 'quote',
                text: 'This event calls every believer to persevere in faith and remain steadfast amid trials, keeping their hearts anchored in Christ. It renews our commitment to proclaim the Good News of the Kingdom to all nations — reminding us that our mission is not complete until every soul has heard of Jesus. Together, we endure. Together, we proclaim. Until He comes.'
            },
            {
                type: 'paragraph',
                text: 'The power of the 51st anniversary was in its unity of spirit. Though separated geographically, all 12 congregations were connected by this single, focused message. Pastors at each location delivered sermons on the "Endure and proclaim" theme, creating a simultaneous wave of worship and rededication.'
            },
            {
                type: 'imageCarousel'
            },
            {
                type: 'heading',
                text: 'Celebrations Across 12 Locations'
            },
            {
                type: 'paragraph',
                text: 'The simultaneous celebrations took place in the following locations:'
            },
            {
                type: 'list',
                items: [
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
                    'Bolisong, Manjuyod, Negros Oriental'
                ]
            },
            {
                type: 'paragraph',
                text: 'The anniversary celebrations were marked by special worship services, baptisms, and community outreach programs. Each location also held fellowship meals, bringing together church members and visitors in a spirit of unity and celebration.'
            },
            {
                type: 'paragraph',
                text: 'As March of Faith Inc. looks to the future, the 51st anniversary serves as both a celebration of God\'s faithfulness and a renewed commitment to the Great Commission. The ministry continues to expand its reach, with plans for new church plants and community development initiatives in the coming year.'
            }
        ]
    };

    onMount(() => {
        // Add any client-side JavaScript here
    });
</script>

<svelte:head>
    <title>{article.title} - March of Faith News</title>
    <meta name="description" content="{article.content[0].text}" />
</svelte:head>

<nav class="breadcrumb">
    <div class="container">
        <a href="/">Home</a> / 
        <a href="/news">News</a> / 
        <span>Article</span>
    </div>
</nav>

<header class="article-header">
    <div class="container">
        <div class="article-meta">
            <span class="article-category">{article.category}</span>
            <time datetime={new Date(article.date).toISOString().split('T')[0]} class="article-date">
                {article.date}
            </time>
        </div>
        <h1 class="article-title">{article.title}</h1>
    </div>
</header>

<article class="article-content">
    <div class="container">
        <div class="article-body">
            {#each article.content as block, i}
                {#if block.type === 'paragraph'}
                    <p class="article-paragraph">{@html block.text}</p>
                {:else if block.type === 'heading'}
                    <h2 class="article-heading">{block.text}</h2>
                {:else if block.type === 'quote'}
                    <blockquote class="article-quote">
                        <p>{block.text}</p>
                    </blockquote>
                {:else if block.type === 'image'}
                    <figure class="article-figure">
                        <img 
                            src={block.src} 
                            alt={block.alt}
                            class="article-image"
                            loading="lazy"
                        />
                        <figcaption class="image-caption">{block.caption}</figcaption>
                    </figure>
                {:else if block.type === 'list'}
                    <ul class="article-list">
                        {#each block.items as item}
                            <li class="article-list-item">{item}</li>
                        {/each}
                    </ul>
                {:else if block.type === 'imageCarousel'}
                    <div class="carousel-container">
                        <div 
                            class="carousel-track" 
                            style="transform: translateX(-${currentSlide * 100}%);"
                            ontouchstart={handleTouchStart}
                            ontouchmove={handleTouchMove}
                            ontouchend={handleTouchEnd}
                        >
                            {#each article.images as image, i}
                                <div class="carousel-slide">
                                    <img 
                                        src={image.url} 
                                        alt={image.alt}
                                        class="article-featured-image"
                                        loading="lazy"
                                    />
                                    <figcaption class="image-caption">{image.caption}</figcaption>
                                </div>
                            {/each}
                        </div>
                    
                        <button 
                            class="carousel-button prev" 
                            onclick={prevSlide}
                            aria-label="Previous image"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                        </button>
                        <button 
                            class="carousel-button next" 
                            onclick={nextSlide}
                            aria-label="Next image"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M9 18l6-6-6-6" />
                            </svg>
                        </button>
                    
                        <div class="carousel-dots">
                            {#each article.images as _, i}
                                <button 
                                    class="dot {i === currentSlide ? 'active' : ''}" 
                                    onclick={() => goToSlide(i)}
                                    aria-label={`Go to slide ${i + 1}`}
                                ></button>
                            {/each}
                        </div>
                    </div>
                {/if}
            {/each}
        </div>
        
        <aside class="related-articles">
            <h3 class="related-title">More News</h3>
            <div class="related-grid">
                <a href="/news" class="related-article">
                    <div class="related-image-container">
                        <img 
                            src="https://res.cloudinary.com/dexcw6vg0/image/upload/v1763355713/ojlomimmfvtgwzxjyptq.webp" 
                            alt="Related Article"
                            class="related-image"
                            loading="lazy"
                        />
                    </div>
                    <h4>View All News & Updates</h4>
                    <p>Stay updated with the latest from March of Faith Inc.</p>
                </a>
            </div>
        </aside>
    </div>
</article>

<button 
    class="back-to-top" 
    onclick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    aria-label="Back to top"
>
    ↑
</button>

<style>
    /* Breadcrumb */
    .breadcrumb {
        background-color: #f8f9fa;
        padding: 1rem 0;
        font-size: 0.9rem;
        color: #6c757d;
    }

    .breadcrumb a {
        color: var(--primary-color);
        text-decoration: none;
        transition: color 0.2s ease;
    }

    .breadcrumb a:hover {
        text-decoration: underline;
    }

    .breadcrumb span {
        color: #6c757d;
    }

    /* Article Header */
    .article-header {
        padding: 3rem 0 2rem;
        background: white;
    }

    .article-meta {
        display: flex;
        align-items: center;
        margin-bottom: 1rem;
        font-size: 0.9rem;
    }

    .article-category {
        display: inline-block;
        background: var(--primary-color);
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.5px;
    }

    .article-date {
        color: #6b7280;
        margin-left: 1rem;
    }

    .article-title {
        font-size: 2.5rem;
        font-weight: 800;
        line-height: 1.2;
        margin: 0 0 1.5rem;
        color: #1f2937;
    }

    .carousel-container {
        position: relative;
        margin: 2rem 0;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        max-width: 1200px;
        /* This margin: auto; is fine, it will just be centered in its parent */
        margin-left: auto;
        margin-right: auto;
    }

    .carousel-track {
        display: flex;
        transition: transform 0.5s ease-in-out;
        width: 100%;
    }

    .carousel-slide {
        min-width: 100%;
        position: relative;
        height: 0;
        padding-bottom: 75%; /* 4:3 aspect ratio (taller than 16:9) */
        overflow: hidden;
    }

    .carousel-button {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(255, 255, 255, 0.8);
        border: none;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
        z-index: 10;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .carousel-button:hover {
        background: rgba(255, 255, 255, 0.9);
        transform: translateY(-50%) scale(1.1);
    }

    .carousel-button.prev {
        left: 15px;
    }

    .carousel-button.next {
        right: 15px;
    }

    .carousel-button svg {
        width: 20px;
        height: 20px;
    }

    .carousel-dots {
        position: absolute;
        bottom: 20px;
        left: 0;
        right: 0;
        display: flex;
        justify-content: center;
        gap: 8px;
        z-index: 5;
    }

    .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        border: none;
        padding: 0;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .dot.active {
        background: white;
        transform: scale(1.2);
    }

    .dot:hover:not(.active) {
        background: rgba(255, 255, 255, 0.8);
    }

    /* ============================================
    FIX 2: Removed the .article-image-container 
    style as it's no longer used.
    ============================================
    */

    /* ============================================
    FIX 3: Added position: absolute, top: 0, left: 0
    to fix the aspect ratio box.
    ============================================
    */
    .article-featured-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    .image-caption {
        text-align: center;
        font-size: 0.875rem;
        color: #6b7280;
        margin-top: 0.5rem;
        font-style: italic;
    }

    /* Article Content */
    .article-content {
        padding: 2rem 0 4rem;
        background: #f9fafb;
    }

    .article-body {
        max-width: 800px;
        margin: 0 auto 4rem;
        background: white;
        padding: 2.5rem;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .article-paragraph {
        font-size: 1.1rem;
        line-height: 1.8;
        color: #374151;
        margin-bottom: 1.5rem;
    }

    .article-heading {
        font-size: 1.75rem;
        font-weight: 700;
        margin: 2.5rem 0 1.5rem;
        color: #111827;
        line-height: 1.3;
    }

    .article-quote {
        border-left: 4px solid var(--primary-color);
        padding: 1rem 0 1rem 1.5rem;
        margin: 2rem 0;
        font-style: italic;
        color: #4b5563;
        background: #f9fafb;
        border-radius: 0 4px 4px 0;
    }

    .article-quote p {
        margin: 0;
        font-size: 1.2rem;
        line-height: 1.6;
    }

    .article-figure {
        margin: 2.5rem 0;
    }

    .article-image {
        width: 100%;
        height: auto;
        border-radius: 6px;
    }

    .article-list {
        margin: 1.5rem 0;
        padding-left: 1.5rem;
    }

    .article-list-item {
        margin-bottom: 0.75rem;
        line-height: 1.6;
        color: #374151;
    }

    /* Related Articles */
    .related-articles {
        margin-top: 4rem;
        padding-top: 3rem;
        border-top: 1px solid #e5e7eb;
    }

    .related-title {
        font-size: 1.5rem;
        margin-bottom: 1.5rem;
        color: #111827;
    }

    .related-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
    }

    .related-article {
        text-decoration: none;
        color: inherit;
        display: block;
        transition: transform 0.2s ease;
    }

    .related-article:hover {
        transform: translateY(-3px);
    }

    .related-article:hover h4 {
        color: var(--primary-color);
    }

    .related-image-container {
        position: relative;
        padding-top: 56.25%;
        border-radius: 6px;
        overflow: hidden;
        margin-bottom: 1rem;
    }

    .related-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s ease;
    }

    .related-article:hover .related-image {
        transform: scale(1.05);
    }

    .related-article h4 {
        font-size: 1.1rem;
        margin: 0.5rem 0;
        transition: color 0.2s ease;
    }

    .related-article p {
        color: #6b7280;
        margin: 0;
    }

    /* Back to Top Button */
    .back-to-top {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        background: var(--primary-color);
        color: white;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
        /* ============================================
        FIX 4: Removed the 'op: auto;' typos.
        ============================================
        */
    }

    .back-to-top:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }

    /* ============================================
    FIX 5: Merged the two @media (max-width: 768px)
    blocks into one for cleanliness.
    ============================================
    */
    /* Responsive Design */
    @media (max-width: 768px) {
        .article-title {
            font-size: 2rem;
        }

        .article-body {
            padding: 1.5rem;
        }

        .article-paragraph {
            font-size: 1rem;
        }

        .article-heading {
            font-size: 1.5rem;
        }

        .back-to-top {
            width: 2.5rem;
            height: 2.5rem;
            font-size: 1.25rem;
        }
        
        .carousel-slide {
            padding-bottom: 100%; /* Square aspect ratio on mobile */
        }

        .carousel-button {
            width: 32px;
            height: 32px;
        }

        .carousel-button svg {
            width: 16px;
            height: 16px;
        }
    }

    @media (max-width: 480px) {
        .article-title {
            font-size: 1.75rem;
        }

        .article-body {
            padding: 1.25rem;
        }

        .related-title {
            font-size: 1.25rem;
        }

        .back-to-top {
            bottom: 1rem;
            right: 1rem;
        }
    }
</style>