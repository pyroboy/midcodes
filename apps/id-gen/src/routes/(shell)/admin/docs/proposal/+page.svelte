<script lang="ts">
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
</script>

<svelte:head>
    <title>Proposal Generator Template | Kanaya Admin</title>
</svelte:head>

<div class="docs-container">
    <header class="docs-header">
        <div class="header-top">
            <h1>Formal Project Proposal Template</h1>
            <span class="badge">Sales Enablement</span>
        </div>
        <p class="meta">Usage: Copy-paste this into a PDF or Word Doc for clients.</p>
        <p class="subject">Subject: The structure required to close B2B/Government contracts.</p>
    </header>

    <nav class="toc">
        <h2>Proposal Sections</h2>
        <ol>
            <li><a href="#cover">1. Executive Summary (The "Why")</a></li>
            <li><a href="#technical">2. Technical Proposal (The "What")</a></li>
            <li><a href="#financial">3. Financial Investment (The "How Much")</a></li>
            <li><a href="#timeline">4. Rollout Timeline (The "When")</a></li>
        </ol>
    </nav>

    <section id="cover">
        <h2>1. Executive Summary</h2>
        <p class="subtext">This is likely the only page the decision-maker will read. Make it punchy.</p>

        <div class="paper-doc">
            <h3>Project: Digital Identity & Campus Safety Upgrade</h3>
            <p><strong>Prepared For:</strong> [School/Company Name]</p>
            <p><strong>Prepared By:</strong> Kanaya Identity Solutions</p>
            <br>
            <h4>The Challenge</h4>
            <p>Current identification systems at <strong>[Client Name]</strong> are static, easily counterfeited, and disconnected from modern safety protocols. A lost ID poses a security risk and requires days to replace, leaving the facility vulnerable.</p>

            <h4>The Kanaya Solution</h4>
            <p>We propose the implementation of the <strong>Kanaya Digital Identity Ecosystem</strong>. Unlike traditional PVC printing, our solution integrates physical durability with cloud-based verification. This ensures:</p>
            <ul>
                <li><strong>Instant Verification:</strong> Guards can scan IDs via NFC/QR to verify active status.</li>
                <li><strong>Anti-Fraud:</strong> Proprietary "Ghost Image" and Encrypted Data layers.</li>
                <li><strong>Rapid Issuance:</strong> Lost cards replaced in under 2 hours.</li>
            </ul>
        </div>
    </section>

    <section id="technical">
        <h2>2. Technical Specifications</h2>
        <div class="alert-box">
            <strong>Strategy:</strong> Overwhelm them with specs so they can't compare you to a cheap shop.
        </div>

        <div class="paper-doc">
            <h3>2.1 The Physical Credential</h3>
            <table class="spec-table">
                <tbody>
                    <tr>
                        <td><strong>Material Construction</strong></td>
                        <td>3-Layer Fused PVC (Sandwich Type) - Non-fading.</td>
                    </tr>
                    <tr>
                        <td><strong>Dimensions</strong></td>
                        <td>CR-80 (85.60 × 53.98 mm) - ISO Standard 7810.</td>
                    </tr>
                    <tr>
                        <td><strong>Smart Chip</strong></td>
                        <td>NXP Mifare 1K EV1 (13.56 MHz) - <em>[Optional Upsell]</em>.</td>
                    </tr>
                    <tr>
                        <td><strong>Data Encoding</strong></td>
                        <td>AES-128 Encrypted UID linked to Kanaya Cloud.</td>
                    </tr>
                </tbody>
            </table>

            <h3>2.2 The Digital Platform (SaaS)</h3>
            <p>The contract includes access to the <strong>Kanaya Admin Dashboard</strong>, allowing [Client Name] to:</p>
            <ul>
                <li>Deactivate lost/stolen cards instantly.</li>
                <li>View real-time entry logs (if scanning is enabled).</li>
                <li>Batch export student data for DepEd/CHED compliance.</li>
            </ul>
        </div>
    </section>

    <section id="financial">
        <h2>3. Financial Proposal</h2>
        <p class="subtext">Use "Investment" instead of "Cost". Frame it as a Package.</p>

        <div class="paper-doc">
            <h3>Option A: The "Secure Campus" Package (Recommended)</h3>
            <table class="finance-table">
                <thead>
                    <tr>
                        <th>Item Description</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Smart Student ID (PVC + QR)</strong><br><small>Includes: Lanyard, Case, Design, Layout</small></td>
                        <td>500</td>
                        <td>₱150.00</td>
                        <td>₱75,000.00</td>
                    </tr>
                    <tr>
                        <td><strong>On-Site Data Capture</strong><br><small>Professional photography setup for 2 days.</small></td>
                        <td>1</td>
                        <td>₱5,000.00</td>
                        <td>₱5,000.00</td>
                    </tr>
                    <tr>
                        <td><strong>Kanaya Database Setup</strong><br><small>Data migration, cleaning, and cloud setup.</small></td>
                        <td>1</td>
                        <td>₱10,000.00</td>
                        <td><span style="text-decoration: line-through; color: red;">₱10,000.00</span><br><strong>WAIVED</strong></td>
                    </tr>
                    <tr class="total-row">
                        <td colspan="3"><strong>GRAND TOTAL</strong></td>
                        <td><strong>₱80,000.00</strong></td>
                    </tr>
                </tbody>
            </table>

            <h3>Payment Terms (Strict)</h3>
            <ul>
                <li><strong>50% Downpayment</strong> (₱40,000) required upon contract signing to commence production.</li>
                <li><strong>50% Balance</strong> due upon delivery of the first batch (or Full Delivery).</li>
                <li><strong>Validity:</strong> This quote is valid for 15 days.</li>
            </ul>
        </div>
    </section>

    <section id="timeline">
        <h2>4. Execution Timeline (The "Batch" Plan)</h2>
        <p class="subtext">This reassures them that you won't disappear with the money.</p>

        <div class="timeline-box">
            <div class="event">
                <div class="day">Day 1</div>
                <div class="desc"><strong>Contract Signing & Downpayment.</strong><br>Mobilization of materials.</div>
            </div>
            <div class="event">
                <div class="day">Day 2-3</div>
                <div class="desc"><strong>Data Capture / Photo Session.</strong><br>On-site team takes student photos by section.</div>
            </div>
            <div class="event">
                <div class="day">Day 4-6</div>
                <div class="desc"><strong>Production Phase (Batch 1).</strong><br>Printing, Laminating, and Curing.</div>
            </div>
            <div class="event">
                <div class="day">Day 7</div>
                <div class="desc"><strong>Delivery & Turnover.</strong><br>Testing of QR/NFC codes with School Admin.</div>
            </div>
        </div>
    </section>

    <footer class="docs-footer">
        <p>Kanaya Sales Resources • Confidential Template</p>
    </footer>
</div>

<style>
    .docs-container { max-width: 900px; margin: 0 auto; padding: 2rem; font-family: 'Times New Roman', serif; color: #1a202c; }
    /* Note: Using Serif font to simulate formal document feel */
    
    .docs-header { font-family: 'Segoe UI', sans-serif; border-bottom: 4px solid #2b6cb0; margin-bottom: 2rem; padding-bottom: 1.5rem; }
    .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .docs-header h1 { color: #2c5282; margin: 0; font-size: 2rem; }
    .badge { background: #2b6cb0; color: white; padding: 0.3rem 0.8rem; border-radius: 4px; font-weight: bold; font-size: 0.8rem; font-family: sans-serif; text-transform: uppercase; }
    .meta { color: #718096; font-family: sans-serif; margin-top: 0.5rem; }

    .toc { background: #ebf8ff; padding: 1.5rem; border-radius: 8px; margin-bottom: 3rem; border: 1px solid #bee3f8; font-family: 'Segoe UI', sans-serif; }
    .toc h2 { margin: 0 0 1rem; font-size: 1.2rem; color: #2c5282; }
    .toc ol { padding-left: 1.5rem; }
    .toc a { text-decoration: none; color: #2b6cb0; font-weight: 600; }

    /* Paper Document Look */
    .paper-doc { background: white; padding: 3rem; border: 1px solid #d1d5db; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 2rem; }
    .paper-doc h3 { margin-top: 0; border-bottom: 2px solid #000; padding-bottom: 0.5rem; margin-bottom: 1.5rem; text-transform: uppercase; letter-spacing: 1px; }
    .paper-doc h4 { margin-bottom: 0.5rem; font-size: 1.1rem; color: #444; text-transform: uppercase; }
    .paper-doc p { font-size: 1.05rem; line-height: 1.6; margin-bottom: 1rem; }
    .paper-doc ul { margin-bottom: 1rem; }

    /* Spec Table */
    .spec-table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
    .spec-table td { border: 1px solid #000; padding: 10px; vertical-align: top; }
    .spec-table td:first-child { background: #f3f4f6; font-weight: bold; width: 30%; }

    /* Finance Table */
    .finance-table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
    .finance-table th { background: #1f2937; color: white; padding: 10px; text-align: left; text-transform: uppercase; font-size: 0.9rem; }
    .finance-table td { border: 1px solid #d1d5db; padding: 10px; }
    .total-row { background: #f3f4f6; font-size: 1.1rem; }

    /* Timeline */
    .timeline-box { border-left: 4px solid #2b6cb0; padding-left: 2rem; margin-left: 1rem; }
    .event { margin-bottom: 1.5rem; position: relative; }
    .event::before { content: ''; width: 16px; height: 16px; background: #2b6cb0; border-radius: 50%; position: absolute; left: -42px; top: 4px; border: 3px solid white; box-shadow: 0 0 0 1px #2b6cb0; }
    .day { font-weight: bold; color: #2b6cb0; margin-bottom: 0.3rem; font-family: 'Segoe UI', sans-serif; }
    .desc { font-size: 1rem; color: #333; }

    .alert-box { font-family: 'Segoe UI', sans-serif; background: #fffaf0; border-left: 4px solid #ed8936; padding: 1rem; color: #9c4221; margin-bottom: 2rem; }

    section { margin-bottom: 4rem; }
    h2 { font-family: 'Segoe UI', sans-serif; font-size: 1.6rem; color: #2d3748; border-left: 5px solid #2b6cb0; padding-left: 1rem; margin-bottom: 1.5rem; }

    .docs-footer { font-family: 'Segoe UI', sans-serif; margin-top: 4rem; text-align: center; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 2rem; }
</style>
