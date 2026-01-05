<script lang="ts">
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
</script>

<svelte:head>
    <title>Affiliate & Partnership Program | Kanaya Admin</title>
</svelte:head>

<div class="docs-container">
    <header class="docs-header">
        <div class="header-top">
            <h1>Partnership & Affiliate Protocols</h1>
            <span class="badge">Channel Sales</span>
        </div>
        <p class="meta">Status: ACTIVE • Model: Commission & Wholesale</p>
        <p class="subject">Subject: Commission Structures for Resellers, Agents, and Student Bodies</p>
    </header>

    <nav class="toc">
        <h2>Partner Tiers</h2>
        <ol>
            <li><a href="#scouts">1. Tier 1: The "Scouts" (Student Gov / PTA)</a></li>
            <li><a href="#pros">2. Tier 2: The "Pros" (Photographers/Designers)</a></li>
            <li><a href="#saas">3. Tier 3: SaaS Affiliates (The "Tech" Referrals)</a></li>
            <li><a href="#agreement">4. Partner Agreement (Terms)</a></li>
            <li><a href="#assets">5. Marketing Assets (Downloadable)</a></li>
        </ol>
    </nav>

    <section id="scouts">
        <h2>1. Tier 1: The "Scouts" (Community Leaders)</h2>
        <p class="subtext">Ideal for: SSG Officers, PTA Presidents, Teachers.</p>
        
        <div class="card bg-green">
            <h3>🤝 The Deal: "Fundraising Mode"</h3>
            <p>We do not call it a "Commission" (which sounds corrupt). We call it a <strong>"Fundraising Rebate"</strong>.</p>
            
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Role</th>
                        <th>Action</th>
                        <th>Reward</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>SSG / Student Council</strong></td>
                        <td>Mandates Kanaya ID as the "Official School ID"</td>
                        <td><strong>₱5.00 per student</strong> goes to the SSG Project Fund. (e.g., 1,000 students = ₱5,000 fund).</td>
                    </tr>
                    <tr>
                        <td><strong>PTA Officers</strong></td>
                        <td>Organizes the "Batch Order"</td>
                        <td><strong>Free ID System</strong> for all PTA Officers + 5% Rebate to PTA Fund.</td>
                    </tr>
                    <tr>
                        <td><strong>Tricycle Assn. Pres.</strong></td>
                        <td>Consolidates Driver List</td>
                        <td><strong>₱10.00 per driver</strong> (Admin Fee).</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>

    <section id="pros">
        <h2>2. Tier 2: The "Pros" (B2B Resellers)</h2>
        <p class="subtext">Ideal for: Portrait Photographers, Event Organizers, Graphic Designers.</p>
        <div class="alert-box">
            <strong>Insight:</strong> Photographers love taking photos but hate cutting PVC cards. Be their "Backend Factory."
        </div>

        <div class="grid-2">
            <div class="tier-card">
                <h3>📸 The Photographer Package</h3>
                <p><strong>The Problem:</strong> They shoot the grad pic, but outsourcing the ID printing is a hassle.</p>
                <p><strong>The Offer:</strong> "You shoot. Send me the files. I print/laminate/pack. You deliver."</p>
                <p><strong>Wholesale Price:</strong> <strong>₱40.00 / card</strong> (They sell to students for ₱150+).</p>
            </div>
            
            <div class="tier-card">
                <h3>🎉 The Event Planner Package</h3>
                <p><strong>The Problem:</strong> Cheap paper badges look bad at weddings/conferences.</p>
                <p><strong>The Offer:</strong> "Premium PVC Guest Passes with NFC Check-in."</p>
                <p><strong>Commission:</strong> <strong>15% of the Total Contract.</strong> (e.g., ₱20k contract = ₱3,000 commission).</p>
            </div>
        </div>
    </section>

    <section id="saas">
        <h2>3. Tier 3: SaaS Affiliates (Software)</h2>
        <p class="subtext">Ideal for: Tech Bloggers, Computer Shop Owners, "Side Hustlers".</p>

        <div class="card bg-blue">
            <h3>💻 The "Kanaya Studio" Referral</h3>
            <p>Get other print shops to use our software.</p>
            
            <div class="commission-structure">
                <div class="row">
                    <span class="label">Product:</span>
                    <span class="val">Kanaya Layout Automation (₱1,500/mo)</span>
                </div>
                <div class="row highlight">
                    <span class="label">Commission:</span>
                    <span class="val"><strong>20% Recurring</strong> (₱300/mo per active user)</span>
                </div>
                <div class="row">
                    <span class="label">Tracking:</span>
                    <span class="val">Unique Coupon Code (e.g., <code>TAGBILARAN_PRINT</code> gets the user 10% off).</span>
                </div>
            </div>
        </div>
    </section>

    <section id="agreement">
        <h2>4. Partner Agreement Terms</h2>
        <p class="subtext">Simple rules to prevent conflict.</p>

        <div class="legal-box">
            <h4>Simple Partnership Terms</h4>
            <ol>
                <li><strong>Non-Compete:</strong> Partners cannot start their own ID production facility using Kanaya's specific templates while active.</li>
                <li><strong>Payment Schedule:</strong> Commissions are paid out <strong>Net-15</strong> (15 days after the client pays Kanaya in full). We do not advance commissions.</li>
                <li><strong>Quality of Leads:</strong> Kanaya reserves the right to reject clients that do not meet minimum ethical standards (e.g., Fake ID requests).</li>
                <li><strong>Branding:</strong> Resellers may "White Label" (sell under their own name) only for Tier 2 (Pros). Tier 1 and 3 must use the Kanaya Brand.</li>
            </ol>
        </div>
    </section>

    <section id="assets">
        <h2>5. Marketing Assets (Downloadable)</h2>
        <p>Give these to your partners so they can sell for you.</p>
        <ul class="asset-list">
            <li>📄 <strong>Pricing_Sheet_Reseller.pdf</strong> (Hidden prices, high margin for them).</li>
            <li>🖼️ <strong>Social_Media_Kit.zip</strong> (Photos of our machines, "Certified Partner" badge).</li>
            <li>📹 <strong>Demo_Video_Unbranded.mp4</strong> (Video of scanner working, no logo).</li>
        </ul>
    </section>

    <footer class="docs-footer">
        <p>Kanaya Partnership Network • Confidential Internal Docs</p>
    </footer>
</div>

<style>
    .docs-container { max-width: 900px; margin: 0 auto; padding: 2rem; font-family: 'Segoe UI', system-ui, sans-serif; color: #1a202c; }
    
    .docs-header { border-bottom: 4px solid #805ad5; margin-bottom: 2rem; padding-bottom: 1.5rem; }
    .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .docs-header h1 { color: #553c9a; margin: 0; font-size: 2rem; }
    .badge { background: #805ad5; color: white; padding: 0.3rem 0.8rem; border-radius: 4px; font-weight: bold; font-size: 0.8rem; text-transform: uppercase; }
    .meta { color: #718096; margin-top: 0.5rem; }

    .toc { background: #faf5ff; padding: 1.5rem; border-radius: 8px; margin-bottom: 3rem; border: 1px solid #e9d8fd; }
    .toc h2 { margin: 0 0 1rem; color: #553c9a; font-size: 1.2rem; }
    .toc ol { padding-left: 1.5rem; }
    .toc a { text-decoration: none; color: #6b46c1; font-weight: 600; }

    /* Tables */
    .data-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    .data-table th { background: #6b46c1; color: white; padding: 12px; text-align: left; }
    .data-table td { border: 1px solid #e2e8f0; padding: 12px; vertical-align: top; }
    .data-table tr:nth-child(even) { background: #f7fafc; }

    /* Cards */
    .card { padding: 2rem; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 2rem; }
    .card.bg-green { background: #f0fff4; border-left: 5px solid #48bb78; }
    .card.bg-blue { background: #ebf8ff; border-left: 5px solid #4299e1; }
    .card h3 { margin-top: 0; color: #2d3748; }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem; }
    @media (max-width: 768px) { .grid-2 { grid-template-columns: 1fr; } }
    
    .tier-card { background: white; border: 1px solid #e2e8f0; padding: 1.5rem; border-radius: 8px; border-top: 4px solid #d53f8c; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .tier-card h3 { margin-top: 0; color: #2d3748; }

    /* SaaS Structure */
    .commission-structure { background: white; padding: 1.5rem; border-radius: 6px; border: 1px dashed #4299e1; }
    .commission-structure .row { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 1.1rem; }
    .commission-structure .highlight { color: #2b6cb0; font-weight: bold; font-size: 1.2rem; border-top: 1px solid #e2e8f0; padding-top: 0.5rem; }
    .commission-structure code { background: #2d3748; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.9rem; }

    /* Legal */
    .legal-box { background: #f7fafc; padding: 1.5rem; border-radius: 8px; border: 1px solid #cbd5e0; }
    .legal-box h4 { margin-top: 0; }
    .legal-box li { margin-bottom: 0.8rem; }

    /* Assets */
    .asset-list { list-style: none; padding: 0; }
    .asset-list li { background: #fff; border: 1px solid #e2e8f0; padding: 1rem; margin-bottom: 0.5rem; border-radius: 4px; display: flex; align-items: center; gap: 10px; font-weight: 500; color: #4a5568; cursor: pointer; transition: background 0.2s; }
    .asset-list li:hover { background: #edf2f7; color: #2b6cb0; }

    .alert-box { background: #fffaf0; border-left: 4px solid #ed8936; padding: 1rem; color: #9c4221; margin-bottom: 2rem; }

    section { margin-bottom: 4rem; }
    h2 { font-size: 1.6rem; color: #2d3748; border-left: 5px solid #805ad5; padding-left: 1rem; margin-bottom: 1.5rem; }

    .docs-footer { margin-top: 4rem; text-align: center; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 2rem; }
</style>
