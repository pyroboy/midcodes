<script lang="ts">
    // Import kitchen-relevant components only
    import Chapter04 from '../04-products/+page.svelte';
    import Chapter05 from '../05-prep-guidelines/+page.svelte';

    import { chapters } from '../chapters';

    function handlePrint() {
        window.print();
    }

    // Map chapters to components (matches chapters.ts order)
    const chapterComponents = [
        { component: Chapter04, ...chapters[3] }, // Chapter 4
        { component: Chapter05, ...chapters[4] }, // Chapter 5
    ];
</script>



<div class="print-page">
    <!-- Print Controls (hidden when printing) -->
    <div class="no-print controls">
        <a href="/" class="back-link">← Back to Dashboard</a>
        <div class="print-actions">
            <button on:click={handlePrint} class="print-btn">
                🖨️ Print Kitchen Manual
            </button>
            <p class="hint">Contains Chapter 4 (Products) & Chapter 5 (Prep Logs)</p>
        </div>
    </div>

    <!-- Cover Page -->
    <section class="cover-page">
        <div class="cover-content">
            <span class="doc-type">OPERATIONAL DOCUMENT</span>
            <h1>Kitchen<br><span class="orange">Manual</span></h1>
            <p class="subtitle">Product Specs & Prep Guidelines</p>
            <div class="meta-info">
                <p><strong>For:</strong> Kitchen Staff / Cooks</p>
                <p><strong>Includes:</strong> Products & Prep</p>
                <p><strong>Date:</strong> January 2026</p>
            </div>
        </div>
    </section>

    <!-- All Chapters Embedded -->
    <div class="chapters-container">
        {#each chapterComponents as chapter, i}
            <section class="chapter-wrapper" id="chapter-{i + 4}">
                <div class="chapter-divider">
                    <span class="chapter-label">Chapter {i + 4}</span>
                </div>
                <div class="chapter-content">
                    <svelte:component this={chapter.component} />
                </div>
            </section>
        {/each}
    </div>

    <!-- End of Document -->
    <section class="doc-footer">
        <p>— End of Kitchen Manual —</p>
        <p class="small">Generated from Kuya's Silog & Lugaw Documentation System</p>
    </section>
</div>

<svelte:head>
    <title>KUYA'S SILOG | Kitchen Manual (Print Version)</title>
</svelte:head>

<style>
    /* Page Reset */
    .print-page {
        max-width: 100%;
        margin: 0 auto;
        font-family: 'Inter', -apple-system, sans-serif;
        color: #1e293b;
        background: white;
    }

    /* Controls - Hidden when printing */
    .no-print {
        display: block;
    }
    
    .controls {
        position: sticky;
        top: 0;
        z-index: 100;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 2rem;
        background: #0f172a;
        color: white;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .back-link {
        color: #94a3b8;
        text-decoration: none;
        font-weight: 500;
    }
    .back-link:hover { color: #f97316; }
    
    .print-actions { 
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    .print-btn {
        background: #f97316;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
    }
    .print-btn:hover { 
        background: #ea580c;
        transform: scale(1.02);
    }
    .hint { 
        font-size: 0.85rem; 
        color: #94a3b8; 
        margin: 0;
    }

    /* Cover Page */
    .cover-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        background: linear-gradient(135deg, #fafafa 0%, #f1f5f9 100%);
        border-bottom: 4px solid #0f172a;
        padding: 4rem 2rem;
    }
    .cover-content { 
        max-width: 600px;
    }
    .doc-type {
        display: inline-block;
        font-size: 0.8rem;
        letter-spacing: 3px;
        text-transform: uppercase;
        background: #0f172a;
        color: white;
        padding: 0.5rem 1rem;
        margin-bottom: 2rem;
    }
    .cover-page h1 {
        font-size: 5rem;
        line-height: 0.9;
        margin: 0 0 1rem 0;
        color: #0f172a;
    }
    .orange { color: #f97316; }
    .subtitle {
        font-size: 1.5rem;
        color: #64748b;
        margin-bottom: 3rem;
    }
    .meta-info {
        border-top: 2px solid #e2e8f0;
        padding-top: 2rem;
        margin-top: 2rem;
    }
    .meta-info p {
        margin: 0.5rem 0;
        font-size: 1rem;
        color: #475569;
    }

    /* Chapter Wrappers */
    .chapters-container {
        width: 100%;
    }
    
    .chapter-wrapper {
        position: relative;
        border-bottom: 4px solid #0f172a;
    }
    
    .chapter-divider {
        background: #0f172a;
        color: white;
        padding: 1rem 2rem;
        text-align: center;
    }
    .chapter-label {
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 3px;
        opacity: 0.8;
    }
    
    .chapter-content {
        position: relative;
    }
    
    /* Override nested page styles for print consistency */
    .chapter-content :global(.doc-page) {
        max-width: 100% !important;
        padding: 2rem !important;
        margin: 0 !important;
        min-height: auto !important;
    }

    /* Document Footer */
    .doc-footer {
        text-align: center;
        padding: 4rem 2rem;
        background: #f8fafc;
        border-top: 4px solid #0f172a;
    }
    .doc-footer p {
        margin: 0.5rem 0;
        color: #64748b;
        font-size: 1rem;
    }
    .doc-footer .small {
        font-size: 0.85rem;
        opacity: 0.7;
    }

    /* ===== PRINT STYLES - UNIVERSAL ===== */
    
    /* Let printer driver determine page size to avoid clipping on A4 vs Letter vs Folio */
    @page {
        size: auto; 
        margin: 0.5in;
    }
    
    /* Cover page - full bleed effect */
    @page cover {
        margin: 0;
    }
    
    /* Chapter pages */
    @page chapter {
        margin: 0.5in;
    }
    
    @media print {
        /* === GLOBAL LAYOUT RESET === */
        
        /* Universal Box Sizing to prevent padding overflow */
        *, *::before, *::after {
            box-sizing: border-box !important;
        }

        /* Hide the parent layout navigation bar */
        :global(.chapter-nav) {
            display: none !important;
        }
        
        /* Reset the parent layout wrapper */
        :global(.bp-layout) {
             min-height: 0 !important;
             background: white !important;
             display: block !important;
             width: 100% !important;
             margin: 0 !important;
             padding: 0 !important;
        }

        /* === Base Reset === */
        * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        
        :global(html), :global(body) {
            font-size: 10pt !important; /* Slightly smaller to ensure fit */
            line-height: 1.4 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow-x: hidden !important;
        }
        
        /* Hide controls */
        .no-print {
            display: none !important;
        }
        
        /* Reset page layout */
        .print-page {
            max-width: 100%;
            margin: 0;
            padding: 0;
        }

        /* Prevent Overflow clipping */
        .chapter-content :global(img),
        .chapter-content :global(table),
        .chapter-content :global(.card),
        .chapter-content :global(div),
        .chapter-content :global(pre) {
            max-width: 100% !important;
            overflow-wrap: break-word !important;
        }
        
        /* === Cover Page === */
        .cover-page {
            page: cover;
            min-height: 0;
            height: 100vh;
            page-break-after: always;
            break-after: page;
            border: none;
            padding: 1.5in 1in;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #fafafa 0%, #f1f5f9 100%);
        }
        .cover-page h1 {
            font-size: 2.8rem !important; /* Reduced from 3.5rem to fit better */
            line-height: 1.1 !important;
        }
        .cover-page .subtitle {
            font-size: 1.3rem;
        }
        .cover-page .meta-info p {
            font-size: 0.95rem;
        }
        
        /* === Chapter Styling - HEADERS PRIORITIZED === */
        .chapter-wrapper {
            page: chapter;
            page-break-before: always;
            break-before: page;
            page-break-inside: auto;
            border: none;
        }
        
        /* First chapter doesn't need extra break after TOC */
        .chapter-wrapper:first-child {
            page-break-before: avoid;
            break-before: avoid;
        }

        /* === Chapter Divider (Print) === */
        .chapter-divider {
            background: none !important;
            color: #64748b !important;
            padding: 0 !important;
            margin-bottom: 0.5rem !important;
            text-align: left !important;
            font-size: 0.85rem !important;
            font-weight: 600 !important;
            border: none;
            page-break-after: avoid !important;
            break-after: avoid !important;
        }

        
        /* Chapter content container */
        .chapter-content {
            orphans: 3;
            widows: 3;
        }
        
        /* Override nested doc-page styles for print */
        .chapter-content :global(*) {
            box-shadow: none !important;
        }
        
        .chapter-content :global(.doc-page) {
            padding: 0 !important;
            margin: 0 !important;
            min-height: auto !important;
            max-width: 100% !important;
        }
        
        /* === CHAPTER HEADER PRIORITY === */
        /* Ensure chapter titles (h1) always stay with content */
        .chapter-content :global(.doc-header) {
            page-break-after: avoid !important;
            break-after: avoid !important;
            margin-bottom: 0.75rem;
        }
        
        .chapter-content :global(.doc-header h1) {
            font-size: 1.8rem !important;
            line-height: 1.2 !important;
            margin: 0 0 0.5rem 0 !important;
            padding-top: 0.5rem;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 0.5rem;
            page-break-after: avoid !important;
            break-after: avoid !important;
        }
        
        /* Section headers - keep with content */
        .chapter-content :global(h2) {
            font-size: 1.4rem !important;
            margin-top: 1.25rem !important;
            margin-bottom: 0.5rem !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
        }
        
        .chapter-content :global(h3) {
            font-size: 1.15rem !important;
            margin-top: 1rem !important;
            margin-bottom: 0.4rem !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
        }
        
        .chapter-content :global(h4) {
            font-size: 1rem !important;
            margin-top: 0.75rem !important;
            margin-bottom: 0.3rem !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
        }
        
        /* === Tables & Cards === */
        .chapter-content :global(table) {
            font-size: 9pt !important;
            page-break-inside: avoid;
            break-inside: avoid;
            margin: 0.5rem 0 !important;
        }
        
        .chapter-content :global(th),
        .chapter-content :global(td) {
            padding: 0.35rem 0.5rem !important;
        }
        
        .chapter-content :global(.card),
        .chapter-content :global(.info-card),
        .chapter-content :global(.grid-card),
        .chapter-content :global(.stat-card) {
            page-break-inside: avoid;
            break-inside: avoid;
            margin: 0.5rem 0 !important;
            padding: 0.75rem !important;
        }
        
        /* === Lists & Paragraphs === */
        .chapter-content :global(p) {
            margin: 0.4rem 0 !important;
            font-size: 10.5pt !important;
        }
        
        .chapter-content :global(ul),
        .chapter-content :global(ol) {
            margin: 0.4rem 0 !important;
            padding-left: 1.25rem !important;
        }
        
        .chapter-content :global(li) {
            margin: 0.2rem 0 !important;
            font-size: 10.5pt !important;
        }
        
        /* Keep list items with their headers */
        .chapter-content :global(ul),
        .chapter-content :global(ol) {
            page-break-before: avoid;
            break-before: avoid;
        }
        
        /* === Grid Layouts === */
        .chapter-content :global(.grid),
        .chapter-content :global(.two-col),
        .chapter-content :global(.three-col) {
            display: grid !important;
            gap: 0.5rem !important;
            grid-template-columns: 1fr 1fr !important; /* Force 2-col print for readability */
        }
        
        /* === Links === */
        a {
            text-decoration: none !important;
            color: inherit !important;
        }
        
        /* Don't show URLs in parentheses */
        a[href]:after {
            content: none !important;
        }
        
        /* === Footer === */
        .doc-footer {
            page-break-before: always;
            break-before: page;
            border: none;
            padding: 2rem 1rem;
        }
        .doc-footer p {
            font-size: 0.9rem;
        }
        
        /* === Avoid awkward breaks === */
        :global(blockquote), :global(pre), :global(figure), :global(img) {
            page-break-inside: avoid;
            break-inside: avoid;
        }
    }

    /* Responsive */
    @media (max-width: 768px) {
        .cover-page h1 { font-size: 3rem; }
        .controls { 
            flex-direction: column; 
            gap: 1rem; 
            text-align: center;
            position: relative;
        }
        .print-actions { 
            flex-direction: column;
            width: 100%;
        }
        .print-btn { width: 100%; }
    }

    /* === KITCHEN MANUAL SPECIFIC OPTIMIZATIONS === */
    @media print {
        /* General Compaction */
        :global(html), :global(body) {
            font-size: 8pt !important; /* Hyper Small */
            line-height: 1.1 !important;
        }

        /* Chapter Layout */
        .chapter-wrapper {
            page-break-before: auto !important; /* Don't force break between chapters if not needed, or keep 'always' if user wants clear separation. keeping 'always' for cleanliness between Ch4/Ch5 */
            border-bottom: 2px solid #000 !important;
            margin-bottom: 1rem !important;
            padding-bottom: 1rem !important;
        }

        /* Tighter Headings */
        .chapter-content :global(h1) { font-size: 1.5rem !important; margin: 0 0 0.5rem 0 !important; }
        .chapter-content :global(h2) {
            font-size: 1rem !important;
            margin-top: 0.5rem !important;
            margin-bottom: 0.2rem !important;
            border-bottom: 1px solid #000 !important;
            background: #eee !important;
            padding: 2px 5px !important;
            -webkit-print-color-adjust: exact;
        }
        .chapter-content :global(h3) {
            font-size: 0.9rem !important;
            margin: 0.4rem 0 0.2rem 0 !important;
            text-transform: uppercase;
            font-weight: 800;
        }
        
        /* Hide introductory fluff */
        .chapter-content :global(.section-intro),
        .chapter-content :global(.doc-header p),
        .chapter-content :global(.prep-notes), 
        .chapter-content :global(.overhead-note), 
        .chapter-content :global(.silog-operation-note) {
            display: none !important;
        }
        
        /* === CHAPTER 4: PRODUCTS === */
        
        /* Transform Grid to "Connected Tables" Look */
        .chapter-content :global(.sku-cards) {
            display: block !important; /* Stack them or use masonry... block is safer for flow */
            column-count: 2 !important; /* 2 Column text flow */
            column-gap: 0.5rem !important;
        }
        
        /* Compact Menu Cards */
        .chapter-content :global(.sku-card) {
            break-inside: avoid !important; /* Keeep individual item together */
            border: 1px solid #000 !important;
            padding: 2px !important;
            margin-bottom: 0.4rem !important;
            box-shadow: none !important;
            background: #fff !important;
            display: inline-block !important; /* For column-count to work */
            width: 100% !important;
        }
        
        .chapter-content :global(.sku-card h4) {
            font-size: 0.9rem !important;
            margin: 0 !important;
            background: #ddd !important;
            padding: 2px 4px !important;
            -webkit-print-color-adjust: exact;
            border-bottom: 1px solid #000;
        }
        
        .chapter-content :global(.sku-card .description) {
            font-size: 0.75rem !important;
            margin: 2px 0 !important;
            display: none !important; /* Save more space? Optional: User asked to optimize height. Description might be needed? Let's keep it but small. */
            display: block !important; 
        }

        .chapter-content :global(.sku-card .metrics),
        .chapter-content :global(.sku-card .portioning) {
            display: none !important; /* Hide financial metrics and portion text to save space - table has ingredients */
        }
        
        /* Show Portioning Table (Ingredients) */
        .chapter-content :global(.ingredient-table) {
            font-size: 7.5pt !important;
            margin: 0 !important;
        }
        .chapter-content :global(.ingredient-table th),
        .chapter-content :global(.ingredient-table td) {
            padding: 1px 3px !important;
            border: none !important; /* Cleaner look? or minimal border */
            border-bottom: 1px dotted #ccc !important;
        }
        .chapter-content :global(.ingredient-table th) {
            background: #f8f8f8 !important;
        }

        /* === CHAPTER 5: PREP === */
        .chapter-content :global(table.prep-table) {
            font-size: 8pt !important;
            width: 100% !important;
        }
        .chapter-content :global(table.prep-table th),
        .chapter-content :global(table.prep-table td) {
            padding: 2px 4px !important;
            border: 1px solid #999 !important;
        }
        
        /* Hide big strategy boxes */
        .chapter-content :global(.strategy-box), 
        .chapter-content :global(.phase-desc),
        .chapter-content :global(.concurrent) {
            /* Maybe keep concurrent column but hide verbose descriptions */
             display: none !important; 
        }
        
        /* Reduce Gap between sections */
        .chapter-content :global(section) {
            margin-bottom: 0.5rem !important;
        }
    }
</style>
