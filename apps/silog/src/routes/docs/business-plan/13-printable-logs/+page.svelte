<svelte:head>
    <title>Printable Logs | SILOG HUB</title>
</svelte:head>

<section class="doc-page">
    <header class="doc-header no-print">
        <h1>13 Ops<br><span class="highlight">Logs</span></h1>
        <button class="print-btn" onclick={() => window.print()}>🖨️ Print Log Sheets</button>
    </header>

    <!-- INVENTORY SHEET -->
    <div class="sheet-page">
        <div class="sheet-header">
            <h2>📦 DAILY INVENTORY COUNT</h2>
            <div class="meta">
                <div class="line">Date: ____________________</div>
                <div class="line">Shift: ____________________</div>
            </div>
        </div>

        <p class="sheet-instruction"><strong>INSTRUCTION:</strong> Count items at CLOSING. Loss = (Start + Deliveries) - Sales - End.</p>

        <table class="log-table">
            <thead>
                <tr>
                    <th style="width: 25%">ITEM</th>
                    <th style="width: 15%">UNIT</th>
                    <th style="width: 15%">START (A)</th>
                    <th style="width: 15%">ADD (B)</th>
                    <th style="width: 15%">END (C)</th>
                    <th style="width: 15%">SOLD/USED</th>
                </tr>
            </thead>
            <tbody>
                <tr><td>Eggs</td><td>Tray</td><td></td><td></td><td></td><td></td></tr>
                <tr><td>Rice (Jasmine)</td><td>Kg</td><td></td><td></td><td></td><td></td></tr>
                <tr><td>Rice (Malagkit)</td><td>Kg</td><td></td><td></td><td></td><td></td></tr>
                <tr><td>Pork (Tapa/Chop)</td><td>Kg</td><td></td><td></td><td></td><td></td></tr>
                <tr><td>Chicken</td><td>Kg</td><td></td><td></td><td></td><td></td></tr>
                <tr><td>Frozen (Toci/Hotdog)</td><td>Pack</td><td></td><td></td><td></td><td></td></tr>
                <tr><td>Cooking Oil</td><td>Liters</td><td></td><td></td><td></td><td></td></tr>
                <tr><td>LPG Tank</td><td>Level</td><td></td><td></td><td></td><td></td></tr>
                <tr><td>Takeout Boxes</td><td>Pcs</td><td></td><td></td><td></td><td></td></tr>
                <!-- Blank Rows -->
                <tr><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                <tr><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                <tr><td></td><td></td><td></td><td></td><td></td><td></td></tr>
            </tbody>
        </table>

        <div class="sign-off">
            <div class="box">
                <small>Counted By (Name/Sig)</small>
            </div>
            <div class="box">
                <small>Verified By (Name/Sig)</small>
            </div>
        </div>
    </div>

    <div class="page-break"></div>

    <!-- WASTAGE LOG -->
    <div class="sheet-page">
        <div class="sheet-header">
            <h2>🗑️ WASTAGE & SPOILAGE LOG</h2>
            <div class="meta">
                <div class="line">Date: ____________________</div>
            </div>
        </div>

        <p class="sheet-instruction"><strong>5% RULE:</strong> If waste is high for 3 days, explain why. <strong>Types:</strong> SPOILAGE (Raw), WASTAGE (Cooked/Leftover).</p>

        <table class="log-table">
            <thead>
                <tr>
                    <th style="width: 20%">TIME</th>
                    <th style="width: 25%">ITEM NAME</th>
                    <th style="width: 15%">QTY/WT</th>
                    <th style="width: 25%">REASON (Burnt, Spilled, Expired)</th>
                    <th style="width: 15%">INITIALS</th>
                </tr>
            </thead>
            <tbody>
                <!-- Generate 15 blank rows -->
                {#each Array(15) as _}
                <tr>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>
                {/each}
            </tbody>
        </table>

        <div class="notes-section">
            <p><strong>Manager's Notes / Incident Report:</strong></p>
            <div class="lines">
                <div class="guide-line"></div>
                <div class="guide-line"></div>
                <div class="guide-line"></div>
            </div>
        </div>
    </div>

</section>

<style>
    /* GLOBAL */
    :global(body) { background-color: #f8fafc; font-family: 'Inter', sans-serif; color: #0f172a; }
    .doc-page { max-width: 800px; margin: 0 auto; padding: 2rem; background: white; min-height: 100vh; }
    
    .doc-header h1 { font-size: 4rem; line-height: 0.9; margin-bottom: 2rem; color: #0f172a; }
    .highlight { color: white; background: #0f172a; padding: 0 1rem; }
    .print-btn { background: #0f172a; color: white; border: none; padding: 0.75rem 1.5rem; font-weight: bold; cursor: pointer; border-radius: 6px; font-size: 1rem; }
    .print-btn:hover { background: #334155; }

    /* SHEET STYLES */
    .sheet-page { border: 2px solid #0f172a; padding: 1.5rem; margin-bottom: 2rem; background: white; page-break-inside: avoid; }
    .sheet-header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 4px solid #0f172a; padding-bottom: 1rem; margin-bottom: 1rem; }
    .sheet-header h2 { margin: 0; font-size: 1.5rem; text-transform: uppercase; letter-spacing: 1px; }
    .meta .line { margin-top: 0.5rem; font-weight: 600; min-width: 200px; text-align: right; }
    
    .sheet-instruction { background: #f1f5f9; padding: 0.5rem; border-left: 4px solid #f97316; font-size: 0.85rem; margin-bottom: 1.5rem; }

    /* TABLES */
    .log-table { width: 100%; border-collapse: collapse; border: 2px solid #0f172a; }
    .log-table th { background: #0f172a; color: white; padding: 0.5rem; font-size: 0.8rem; text-align: left; text-transform: uppercase; border: 1px solid #0f172a; }
    .log-table td { border: 1px solid #cbd5e1; padding: 0.75rem; color: #334155; }
    /* Fix row height for writing */
    .log-table tbody tr { height: 2.5rem; } 

    /* SIGN OFF */
    .sign-off { display: flex; justify-content: space-between; margin-top: 2rem; }
    .sign-off .box { width: 45%; border-top: 1px solid #000; padding-top: 0.5rem; margin-top: 2rem; }
    
    .notes-section { margin-top: 2rem; }
    .guide-line { border-bottom: 1px solid #cbd5e1; margin-top: 2rem; }

    /* PRINT */
    @media print {
        :global(body) { background: white; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        .doc-page { margin: 0; padding: 0; width: 100%; max-width: none; border: none; }
        .no-print { display: none; }
        .sheet-page { border: 2px solid #000; margin: 0; height: 100vh; page-break-after: always; padding: 1cm; box-sizing: border-box; }
        .page-break { display: block; page-break-before: always; }
        /* Reset heights for print */
        .log-table tbody tr { height: 3rem; }
    }
</style>
