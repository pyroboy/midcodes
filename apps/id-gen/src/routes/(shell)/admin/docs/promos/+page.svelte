<script lang="ts">
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
</script>

<svelte:head>
    <title>Promo Campaigns & Offers | Kanaya Admin</title>
</svelte:head>

<div class="docs-container">
    <header class="docs-header">
        <div class="header-top">
            <h1>Active Promo Campaigns & Offers</h1>
            <span class="badge">Marketing</span>
        </div>
        <p class="meta">Status: CAMPAIGN READY • Updated: January 2026</p>
        <p class="subject">Subject: Limited Time Offers to Drive Urgency and Cash Flow</p>
    </header>

    <nav class="toc">
        <h2>Campaign Menu</h2>
        <ol>
            <li><a href="#launch">1. The "Tech Upgrade" (New Client Acquisition)</a></li>
            <li><a href="#switcher">2. The "Switcher" (Stealing Competitors)</a></li>
            <li><a href="#bulk">3. The "Early Bird" (Cash Flow Generator)</a></li>
            <li><a href="#referral">4. Referral Program (Commission)</a></li>
        </ol>
    </nav>

    <section id="launch">
        <h2>1. The "Tech Upgrade" Launch Promo</h2>
        <div class="alert-box">
            <strong>Goal:</strong> Get your first 5 School Clients. <br />
            <strong>The Hook:</strong> "Why pay for dumb plastic when you can get Smart IDs for the same price?"
        </div>

        <div class="ticket-container">
            <div class="ticket">
                <div class="stub">
                    <h3>FREE QR</h3>
                    <div class="value">Value: ₱20/card</div>
                </div>
                <div class="body">
                    <h4>🚀 The "Smart Campus" Starter</h4>
                    <p>
                        Order 100+ PVC IDs at regular price (₱150), and we will include the
                        <strong>QR Code Database Integration</strong> for FREE.
                    </p>
                    <p class="terms"><em>*Valid for first-time school clients only.</em></p>
                </div>
            </div>
        </div>

        <div class="script-box">
            <h4>Sales Script:</h4>
            <p>
                "Ma'am Principal, other shops charge ₱150 just for the printing. I charge the same ₱150, but I
                include a <strong>Digital Student Profile</strong> linked to a QR code. It's a free upgrade if you
                sign this week."
            </p>
        </div>
    </section>

    <section id="switcher">
        <h2>2. The "Switcher" Campaign</h2>
        <p class="subtext">Target: Schools using cheap laminated paper IDs that peel off.</p>

        <div class="ticket-container">
            <div class="ticket">
                <div class="stub">
                    <h3>TRADE-IN</h3>
                    <div class="value">10% OFF</div>
                </div>
                <div class="body">
                    <h4>♻️ The "Fading ID" Trade-In</h4>
                    <p>
                        Unhappy with your current supplier? Show us a faded/broken ID from your current provider,
                        and we will give you <strong>10% OFF</strong> your first Kanaya order.
                    </p>
                    <p class="terms"><em>*Min. order 50 pcs. Must surrender 1 old sample.</em></p>
                </div>
            </div>
        </div>

        <div class="script-box">
            <h4>Sales Script:</h4>
            <p>
                "Sir, I see your students' IDs are already fading and it's only October. That's direct-print
                thermal. My IDs are 'Sandwich Type'—the ink is inside the plastic. It never fades. Switch to us
                and I'll knock 10% off to prove the quality."
            </p>
        </div>
    </section>

    <section id="bulk">
        <h2>3. The "Early Bird" (Cash Flow Hack)</h2>
        <div class="alert-box critical">
            <strong>Strategy:</strong> Use this in April/May to get cash <em>before</em> classes start in August. Use the
            cash to buy equipment.
        </div>

        <div class="ticket-container">
            <div class="ticket gold">
                <div class="stub">
                    <h3>PRE-PAY</h3>
                    <div class="value">FREE LANYARDS</div>
                </div>
                <div class="body">
                    <h4>☀️ Summer Pre-Order Special</h4>
                    <p>
                        Secure your slot for the School Year Opening! Pay a <strong>50% Downpayment</strong> before
                        May 30, and get <strong>Custom Printed Lanyards (₱35 value) for FREE</strong>.
                    </p>
                    <p class="terms"><em>*Locks in the production schedule. Avoid the August rush.</em></p>
                </div>
            </div>
        </div>

        <table class="data-table">
            <thead>
                <tr>
                    <th>Scenario</th>
                    <th>Standard Deal</th>
                    <th>Early Bird Deal</th>
                    <th>Your Benefit</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>500 Students</strong></td>
                    <td>₱150 per set<br />(Client pays later)</td>
                    <td>₱150 per set<br />+ Free Lanyard</td>
                    <td><strong>₱37,500 Cash Upfront</strong><br />(Used to buy materials)</td>
                </tr>
            </tbody>
        </table>
    </section>

    <section id="referral">
        <h2>4. "Agent K" Referral Program</h2>
        <p class="subtext">Turn Student Government (SSG) officers or PTA Moms into your sales force.</p>

        <div class="card">
            <h3>🤝 The Commission Structure</h3>
            <p>We do not hire sales staff. We pay commissions.</p>
            
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Referrer</th>
                        <th>Target</th>
                        <th>Commission / Reward</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>PTA President</strong></td>
                        <td>Whole School</td>
                        <td><strong>Free ID System</strong> for Officers + ₱2,000 Donation to PTA Fund.</td>
                    </tr>
                    <tr>
                        <td><strong>Student Leader</strong></td>
                        <td>Org / Club</td>
                        <td><strong>₱5.00 per paid ID</strong>. (e.g., 100 members = ₱500 cash).</td>
                    </tr>
                    <tr>
                        <td><strong>Freelance Agent</strong></td>
                        <td>Corporate</td>
                        <td><strong>10% of Net Profit</strong> on the first order.</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>

    <footer class="docs-footer">
        <p>Kanaya Marketing • Offers subject to margin review</p>
    </footer>
</div>

<style>
    .docs-container { max-width: 900px; margin: 0 auto; padding: 2rem; font-family: 'Segoe UI', sans-serif; color: #1a202c; }
    
    .docs-header { border-bottom: 4px solid #dd6b20; margin-bottom: 2rem; padding-bottom: 1.5rem; }
    .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .docs-header h1 { color: #c05621; margin: 0; font-size: 2rem; }
    .badge { background: #dd6b20; color: white; padding: 0.3rem 0.8rem; border-radius: 4px; font-weight: bold; font-size: 0.8rem; text-transform: uppercase; }
    .meta { color: #718096; margin-top: 0.5rem; }

    .toc { background: #fffaf0; padding: 1.5rem; border-radius: 8px; margin-bottom: 3rem; border: 1px solid #fbd38d; }
    .toc h2 { margin: 0 0 1rem; color: #c05621; font-size: 1.2rem; }
    .toc ol { padding-left: 1.5rem; }
    .toc a { text-decoration: none; color: #9c4221; font-weight: 600; }

    /* VOUCHER STYLES */
    .ticket-container { margin-bottom: 2rem; }
    .ticket { display: flex; border: 2px dashed #cbd5e0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .ticket.gold { border-color: #ecc94b; background: #fffff0; }
    
    .stub { background: #2d3748; color: white; padding: 1.5rem; display: flex; flex-direction: column; justify-content: center; align-items: center; min-width: 120px; text-align: center; border-right: 2px dashed #fff; }
    .ticket.gold .stub { background: #d69e2e; }
    
    .stub h3 { margin: 0; font-size: 1.2rem; line-height: 1.2; }
    .stub .value { margin-top: 0.5rem; font-size: 0.8rem; font-weight: bold; background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px; }
    
    .body { padding: 1.5rem; flex-grow: 1; }
    .body h4 { margin: 0 0 0.5rem; color: #2d3748; font-size: 1.2rem; }
    .body p { margin: 0 0 0.5rem; color: #4a5568; }
    .terms { font-size: 0.85rem; color: #a0aec0; margin-top: 1rem; }

    /* SCRIPTS */
    .script-box { background: #edf2f7; padding: 1.5rem; border-left: 5px solid #718096; margin-bottom: 1.5rem; border-radius: 0 8px 8px 0; }
    .script-box h4 { margin: 0 0 0.5rem; color: #2d3748; }
    .script-box p { font-style: italic; color: #4a5568; font-size: 1.1rem; line-height: 1.6; }

    /* TABLES */
    .data-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    .data-table th { background: #c05621; color: white; padding: 12px; text-align: left; }
    .data-table td { border: 1px solid #e2e8f0; padding: 12px; }
    
    .alert-box { background: #fffaf0; border-left: 4px solid #ed8936; padding: 1rem; color: #9c4221; margin-bottom: 2rem; }
    .alert-box.critical { background: #ebf8ff; border-left-color: #4299e1; color: #2b6cb0; }

    .card { background: white; border: 1px solid #e2e8f0; padding: 1.5rem; border-radius: 8px; }

    section { margin-bottom: 4rem; }
    h2 { font-size: 1.6rem; color: #2d3748; border-left: 5px solid #dd6b20; padding-left: 1rem; margin-bottom: 1.5rem; }

    .docs-footer { margin-top: 4rem; text-align: center; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 2rem; }
</style>
