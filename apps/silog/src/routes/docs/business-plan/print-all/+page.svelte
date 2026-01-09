<script lang="ts">
    // Import all chapter components directly
    import Chapter01 from '../01-executive-summary/+page.svelte';
    import Chapter02 from '../02-company-overview/+page.svelte';
    import Chapter03 from '../03-market-analysis/+page.svelte';
    import Chapter04 from '../04-products/+page.svelte';
    import Chapter05 from '../05-marketing/+page.svelte';
    import Chapter06 from '../06-operations/+page.svelte';
    import Chapter07 from '../07-organization/+page.svelte';
    import Chapter08 from '../08-financial-plan/+page.svelte';
    import Chapter09 from '../09-risk-management/+page.svelte';
    import Chapter10 from '../10-appendices/+page.svelte';
    import Chapter11 from '../11-initial-totex/+page.svelte';
    import Chapter13 from '../13-printable-logs/+page.svelte';
    import Chapter15 from '../15-daily-checklists/+page.svelte';
    import Chapter16 from '../16-contingency/+page.svelte';
    import Chapter17 from '../17-complaint-handling/+page.svelte';

    import { chapters } from '../chapters';

    function handlePrint() {
        window.print();
    }

    // Map chapters to components (matches chapters.ts order)
    const chapterComponents = [
        { component: Chapter01, ...chapters[0] },
        { component: Chapter02, ...chapters[1] },
        { component: Chapter03, ...chapters[2] },
        { component: Chapter04, ...chapters[3] },
        { component: Chapter05, ...chapters[4] },
        { component: Chapter06, ...chapters[5] },
        { component: Chapter07, ...chapters[6] },
        { component: Chapter08, ...chapters[7] },
        { component: Chapter09, ...chapters[8] },
        { component: Chapter10, ...chapters[9] },
        { component: Chapter11, ...chapters[10] },
        { component: Chapter13, ...chapters[11] },
        { component: Chapter15, ...chapters[12] },
        { component: Chapter16, ...chapters[13] },
        { component: Chapter17, ...chapters[14] },
    ];
</script>



<div class="print-page">
    <!-- Print Controls (hidden when printing) -->
    <div class="no-print controls">
        <a href="/" class="back-link">← Back to Dashboard</a>
        <div class="print-actions">
            <button on:click={handlePrint} class="print-btn">
                🖨️ Print / Save as PDF
            </button>
            <p class="hint">Tip: Use Ctrl+P (or Cmd+P on Mac) to print this entire document</p>
        </div>
    </div>

    <!-- Cover Page -->
    <section class="cover-page">
        <div class="cover-content">
            <span class="doc-type">COMPREHENSIVE BUSINESS PLAN</span>
            <h1>Kuya's<br><span class="orange">Silog & Lugaw</span></h1>
            <p class="subtitle">Strategic Operations & Financial Control</p>
            <div class="meta-info">
                <p><strong>Location:</strong> Maria Clara, Tagbilaran City, Bohol</p>
                <p><strong>Date:</strong> January 2026</p>
                <p><strong>Prepared by:</strong> Arjo Magno</p>
            </div>
        </div>
    </section>

    <!-- Table of Contents -->
    <section class="toc-section">
        <h2>Table of Contents</h2>
        
        <div class="toc-entry main">
            <a href="#chapter-1"><span class="title">01 Executive Summary</span><span class="dots"></span><span class="page">1</span></a>
        </div>

        <div class="toc-entry main">
            <a href="#chapter-2"><span class="title">02 Company Overview</span><span class="dots"></span><span class="page">2</span></a>
        </div>
        <div class="toc-entry sub"><span class="title">2.1 Legal Structure & Ownership</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">2.2 Management Team</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">2.3 Brand Philosophy</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">2.4 Goals & Long-Term Vision</span><span class="dots"></span></div>

        <div class="toc-entry main">
            <a href="#chapter-3"><span class="title">03 Market Analysis</span><span class="dots"></span><span class="page">3</span></a>
        </div>
        <div class="toc-entry sub"><span class="title">3.1 Target Market</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">3.2 Competitive Landscape</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">3.3 SWOT Analysis</span><span class="dots"></span></div>

        <div class="toc-entry main">
            <a href="#chapter-4"><span class="title">04 Products & Menu</span><span class="dots"></span><span class="page">4</span></a>
        </div>
        <div class="toc-entry sub"><span class="title">4.1 Product Line Overview</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">4.2 Lugaw Matrix (LUG)</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">4.3 Silog Master List (SIL)</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">4.4 Drinks & Noodles (DRK/NDL)</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">4.5 Add-ons & Modifiers</span><span class="dots"></span></div>

        <div class="toc-entry main">
            <a href="#chapter-5"><span class="title">05 Marketing Strategy</span><span class="dots"></span><span class="page">5</span></a>
        </div>
        <div class="toc-entry sub"><span class="title">5.1 Brand Identity</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">5.2 Launch Strategy (Phase 1-3)</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">5.3 Digital Presence</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">5.4 Promotions & Loyalty</span><span class="dots"></span></div>

        <div class="toc-entry main">
            <a href="#chapter-6"><span class="title">06 Operational Plan</span><span class="dots"></span><span class="page">6</span></a>
        </div>
        <div class="toc-entry sub"><span class="title">6.1 Location & Efficiency Layout</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">6.2 Tech & Equipment Stack</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">6.3 Standard Operating Procedures</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">6.4 Inventory Matrix</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">6.5 Supply Chain & Sourcing</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">6.6 Waste Management Protocols</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">6.7 Cash & Remittance Protocol</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">6.8 Financial Ops & Compliance</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">6.9 Detailed Daily SOPs (SOPs 1-7)</span><span class="dots"></span></div>

        <div class="toc-entry main">
            <a href="#chapter-7"><span class="title">07 Organization & HR</span><span class="dots"></span><span class="page">7</span></a>
        </div>
        <div class="toc-entry sub"><span class="title">7.1 Organizational Structure</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">7.2 Staffing Plan</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">7.3 Compensation & Benefits</span><span class="dots"></span></div>

        <div class="toc-entry main">
            <a href="#chapter-8"><span class="title">08 Financial Plan</span><span class="dots"></span><span class="page">8</span></a>
        </div>
        <div class="toc-entry sub"><span class="title">8.1 Initial Investment (TOTEX)</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">8.2 Revenue Projections</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">8.3 Break-Even Analysis</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">8.4 Profit & Loss Forecast</span><span class="dots"></span></div>

        <div class="toc-entry main">
            <a href="#chapter-9"><span class="title">09 Risk Management</span><span class="dots"></span><span class="page">9</span></a>
        </div>
        <div class="toc-entry sub"><span class="title">9.1 Risk Identification</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">9.2 Mitigation Strategies</span><span class="dots"></span></div>

        <div class="toc-entry main">
            <a href="#chapter-10"><span class="title">10 Appendices</span><span class="dots"></span><span class="page">10</span></a>
        </div>
        <div class="toc-entry sub"><span class="title">10.1 Legal Documents</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">10.2 Permits & Licenses</span><span class="dots"></span></div>

        <div class="toc-entry main">
            <a href="#chapter-11"><span class="title">11 Initial TOTEX Breakdown</span><span class="dots"></span><span class="page">11</span></a>
        </div>
        <div class="toc-entry sub"><span class="title">11.1 Equipment & Fixtures</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">11.2 Initial Inventory</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">11.3 Permits & Registration</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">11.4 Marketing Launch</span><span class="dots"></span></div>

        <div class="toc-entry main">
            <a href="#chapter-12"><span class="title">12 Inventory Supply</span><span class="dots"></span><span class="page">12</span></a>
        </div>
        <div class="toc-entry sub"><span class="title">12.1 SKU Ingredient Matrix</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">12.2 Supplier Directory</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">12.3 Packaging & Consumables</span><span class="dots"></span></div>

        <div class="toc-entry main">
            <a href="#chapter-13"><span class="title">13 Printable Ops Logs</span><span class="dots"></span><span class="page">13</span></a>
        </div>
        <div class="toc-entry sub"><span class="title">13.1 Daily Sales Log</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">13.2 Inventory Count Sheet</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">13.3 Incident Report Form</span><span class="dots"></span></div>

        <div class="toc-entry main">
            <a href="#chapter-14"><span class="title">14 SKU Portioning Guide</span><span class="dots"></span><span class="page">14</span></a>
        </div>
        <div class="toc-entry sub"><span class="title">14.1 Base Components</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">14.2 Lugaw Matrix</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">14.3 Drinks Matrix</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">14.4 Noodles Matrix</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">14.5 Silog Master Portions</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">14.6 Add-ons & Modifiers</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">14.7 Condiments & Sauces</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">14.8 Portioning Tools</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">14.9 Portioning SOPs</span><span class="dots"></span></div>

        <div class="toc-entry main">
            <a href="#chapter-15"><span class="title">15 Daily Checklists</span><span class="dots"></span><span class="page">15</span></a>
        </div>
        <div class="toc-entry sub"><span class="title">15.1 Opening Checklist</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">15.2 Shift Change Checklist</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">15.3 Closing Checklist</span><span class="dots"></span></div>

        <div class="toc-entry main">
            <a href="#chapter-16"><span class="title">16 Contingency Plan</span><span class="dots"></span><span class="page">16</span></a>
        </div>
        <div class="toc-entry sub"><span class="title">16.1 Power Outage Protocol</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">16.2 Equipment Failure</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">16.3 Supply Shortage</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">16.4 Staff No-Show</span><span class="dots"></span></div>

        <div class="toc-entry main">
            <a href="#chapter-17"><span class="title">17 Complaint Handling</span><span class="dots"></span><span class="page">17</span></a>
        </div>
        <div class="toc-entry sub"><span class="title">17.1 The LATTE Method</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">17.2 Common Scripts (Bisaya)</span><span class="dots"></span></div>
        <div class="toc-entry sub"><span class="title">17.3 Escalation Protocol</span><span class="dots"></span></div>
    </section>

    <!-- All Chapters Embedded -->
    <div class="chapters-container">
        {#each chapterComponents as chapter, i}
            <section class="chapter-wrapper" id="chapter-{i + 1}">
                <div class="chapter-divider">
                    <span class="chapter-label">Chapter {i + 1}</span>
                </div>
                <div class="chapter-content">
                    <svelte:component this={chapter.component} />
                </div>
            </section>
        {/each}
    </div>

    <!-- End of Document -->
    <section class="doc-footer">
        <p>— End of Business Plan Document —</p>
        <p class="small">Generated from Kuya's Silog & Lugaw Documentation System</p>
    </section>
</div>

<svelte:head>
    <title>KUYA'S SILOG & LUGAW | Complete Business Plan (Print Version)</title>
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

    /* Table of Contents */
    .toc-section {
        max-width: 800px;
        margin: 0 auto;
        padding: 4rem 2rem;
        border-bottom: 4px solid #0f172a;
    }
    .toc-section h2 {
        font-size: 2.5rem;
        margin: 0 0 2rem 0;
        padding-bottom: 1rem;
        border-bottom: 2px solid #0f172a;
    }
    
    /* Proper Book-Style TOC */
    .toc-entry {
        display: flex;
        align-items: baseline;
        line-height: 1.6;
    }
    .toc-entry a {
        display: flex;
        align-items: baseline;
        width: 100%;
        text-decoration: none;
        color: inherit;
    }
    .toc-entry a:hover .title {
        color: #f97316;
    }
    
    /* Main chapter entries */
    .toc-entry.main {
        margin-top: 1rem;
        font-weight: 700;
        font-size: 1.05rem;
        color: #0f172a;
    }
    .toc-entry.main:first-child {
        margin-top: 0;
    }
    .toc-entry.main .title {
        flex-shrink: 0;
    }
    .toc-entry.main .dots {
        flex: 1;
        border-bottom: 2px dotted #cbd5e1;
        margin: 0 0.5rem;
        height: 0.6rem;
    }
    .toc-entry.main .page {
        flex-shrink: 0;
        font-weight: 700;
        min-width: 2rem;
        text-align: right;
    }
    
    /* Subsection entries */
    .toc-entry.sub {
        padding-left: 2rem;
        font-size: 0.9rem;
        font-weight: 400;
        color: #64748b;
    }
    .toc-entry.sub .title {
        flex-shrink: 0;
    }
    .toc-entry.sub .dots {
        flex: 1;
        border-bottom: 1px dotted #e2e8f0;
        margin: 0 0.5rem;
        height: 0.5rem;
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
    
    /* TOC page */
    @page toc {
        margin: 0.5in;
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
        
        /* === Table of Contents === */
        .toc-section {
            page: toc;
            page-break-after: always;
            break-after: page;
            border: none;
            padding: 0;
            max-width: 100%;
        }
        .toc-section h2 {
            font-size: 2rem !important;
            margin-bottom: 1.5rem;
            padding-bottom: 0.75rem;
        }
        .toc-entry.main {
            font-size: 0.95rem;
            margin-top: 0.6rem;
        }
        .toc-entry.sub {
            font-size: 0.8rem;
            padding-left: 1.5rem;
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
</style>
