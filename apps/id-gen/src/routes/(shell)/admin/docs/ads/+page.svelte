<script lang="ts">
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
</script>

<svelte:head>
    <title>Paid Ads & Social Strategy | Kanaya Admin</title>
</svelte:head>

<div class="docs-container">
    <header class="docs-header">
        <div class="header-top">
            <h1>Paid Advertising & Social Media Strategy</h1>
            <span class="badge">Growth Marketing</span>
        </div>
        <p class="meta">Platform Focus: Meta (Facebook/Instagram) & Google Maps</p>
        <p class="subject">Subject: Tactical Ad Buying, Audience Targeting, and ROAS Calculation</p>
    </header>

    <nav class="toc">
        <h2>Campaign Menu</h2>
        <ol>
            <li><a href="#philosophy">1. The "Anti-Burn" Philosophy</a></li>
            <li><a href="#local">2. Campaign A: The "Local Domination" (Tagbilaran)</a></li>
            <li><a href="#b2b">3. Campaign B: The "Decision Maker" (Schools/Corps)</a></li>
            <li><a href="#saas">4. Campaign C: The "Printer SaaS" (National)</a></li>
            <li><a href="#budget">5. Budgeting & ROAS Math</a></li>
        </ol>
    </nav>

    <section id="philosophy">
        <h2>1. The "Anti-Burn" Philosophy</h2>
        <div class="alert-box critical">
            <strong>WARNING:</strong> Never click the blue "Boost Post" button. It is a trap.
        </div>
        <p>We use <strong>Meta Ads Manager</strong> (business.facebook.com) for surgical targeting. Our goal is not "Likes." Our goal is <strong>"Messages"</strong> or <strong>"Leads"</strong>.</p>
        <p><strong>The 3-Day Rule:</strong> If an ad spends ₱300 and gets zero inquiries, KILL IT immediately.</p>
    </section>

    <section id="local">
        <h2>2. Campaign A: Local Domination (Retail)</h2>
        <p class="subtext">Target: Walk-in clients, Rush IDs, Small shops.</p>

        <div class="campaign-box">
            <div class="settings">
                <h4>⚙️ Ad Settings</h4>
                <ul>
                    <li><strong>Objective:</strong> Messages (Messenger).</li>
                    <li><strong>Location:</strong> Tagbilaran City (+5km radius only).</li>
                    <li><strong>Age:</strong> 18 - 45.</li>
                    <li><strong>Interest Targeting:</strong> "Small Business Owners", "Freelancer", "Civil Service Commission".</li>
                </ul>
            </div>

            <div class="ad-mockup">
                <div class="ad-header">
                    <span class="avatar">K</span> Kanaya ID Solutions <span class="sponsored">Sponsored</span>
                </div>
                <div class="ad-copy">
                    ❌ Still using paper IDs that fade in 1 month?<br /><br />
                    ✅ Upgrade to <strong>Kanaya Fused PVC</strong>. Waterproof. Alcohol-proof. Non-fading.<br /><br />
                    📍 Located in Tagbilaran. Rush orders accepted.<br /><br />
                    <strong>Promo:</strong> Mention this ad for FREE Lanyards on bulk orders!
                </div>
                <div class="ad-image">
                    [IMAGE: A hand scrubbing a Kanaya ID with steel wool. Text overlay: "IT WON'T FADE"]
                </div>
                <div class="ad-cta">Send Message</div>
            </div>
        </div>
    </section>

    <section id="b2b">
        <h2>3. Campaign B: The "Decision Maker" (High Ticket)</h2>
        <p class="subtext">Target: Principals, HR Managers, Gym Owners.</p>

        <div class="campaign-box b2b">
            <div class="settings">
                <h4>⚙️ Ad Settings</h4>
                <ul>
                    <li><strong>Objective:</strong> Lead Generation (Instant Form).</li>
                    <li><strong>Location:</strong> Bohol (Province-wide).</li>
                    <li><strong>Age:</strong> 30 - 60.</li>
                    <li><strong>Detailed Targeting:</strong> "School Principal", "Human Resources", "Administrator", "Business Owner".</li>
                </ul>
            </div>

            <div class="ad-mockup">
                <div class="ad-header">
                    <span class="avatar">K</span> Kanaya Security Systems <span class="sponsored">Sponsored</span>
                </div>
                <div class="ad-copy">
                    <strong>Is your campus actually safe?</strong><br /><br />
                    Traditional IDs are easy to fake. The <strong>Kanaya Smart ID System</strong> lets your guards verify students and fetchers instantly via QR Scan.<br /><br />
                    🔒 Anti-Fake Technology<br />
                    ⚡ Instant "Lost Card" Deactivation<br />
                    📱 SMS Notifications for Parents<br /><br />
                    <strong>Download our School Safety Proposal PDF 👇</strong>
                </div>
                <div class="ad-image">
                    [IMAGE: A security guard scanning a student ID with a phone. Green checkmark on screen.]
                </div>
                <div class="ad-cta">Download & Apply</div>
            </div>
        </div>
    </section>

    <section id="saas">
        <h2>4. Campaign C: The "Printer SaaS" (National)</h2>
        <p class="subtext">Target: Other Print Shops (selling the software).</p>

        <div class="campaign-box saas">
            <div class="settings">
                <h4>⚙️ Ad Settings</h4>
                <ul>
                    <li><strong>Objective:</strong> Website Conversion (Free Trial Signup).</li>
                    <li><strong>Location:</strong> Philippines (Exclude Visayas Region - protect our logistics hub).</li>
                    <li><strong>Interests:</strong> "Epson L-Series", "Photoshop", "Heat Press", "Sublimation Printing".</li>
                    <li><strong>Behavior:</strong> "Facebook Page Admins (Business Page)".</li>
                </ul>
            </div>

            <div class="ad-mockup">
                <div class="ad-header">
                    <span class="avatar">K</span> Kanaya Studio <span class="sponsored">Sponsored</span>
                </div>
                <div class="ad-copy">
                    <strong>Stop layouting IDs in Photoshop manually. 🛑</strong><br /><br />
                    Meet the tool that generates 500 IDs in 5 minutes.<br />
                    1. Upload Excel File.<br />
                    2. Upload Photos.<br />
                    3. Download Print-Ready PDF (Mirror Mode).<br /><br />
                    Compatible with Epson L8050. Try it free today.
                </div>
                <div class="ad-image">
                    [VIDEO: Screen recording of dragging an Excel file and seeing 500 IDs appear instantly.]
                </div>
                <div class="ad-cta">Start Free Trial</div>
            </div>
        </div>
    </section>

    <section id="budget">
        <h2>5. Budgeting & The Math</h2>
        
        <div class="grid-2">
            <div class="card">
                <h3>The "Testing" Budget</h3>
                <p><strong>Daily Spend:</strong> ₱150.00</p>
                <p><strong>Duration:</strong> 3 Days</p>
                <p><strong>Total Risk:</strong> ₱450.00</p>
                <p><em>If you get 0 inquiries in 3 days, change the image.</em></p>
            </div>
            
            <div class="card">
                <h3>ROAS Calculator (Return on Ad Spend)</h3>
                <table class="data-table">
                    <tbody>
                        <tr>
                            <td>Ad Spend</td>
                            <td>₱ 1,000</td>
                        </tr>
                        <tr>
                            <td>Leads Generated</td>
                            <td>20 Messages</td>
                        </tr>
                        <tr>
                            <td>Cost Per Lead</td>
                            <td>₱ 50 / lead</td>
                        </tr>
                        <tr>
                            <td>Closed Deals</td>
                            <td>1 Client (5% Conv)</td>
                        </tr>
                        <tr>
                            <td>Revenue</td>
                            <td>₱ 15,000 (100 IDs)</td>
                        </tr>
                        <tr class="highlight">
                            <td><strong>ROAS</strong></td>
                            <td><strong>15x (For every ₱1 spent, you made ₱15)</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </section>

    <footer class="docs-footer">
        <p>Kanaya Growth Team • Monitor Daily</p>
    </footer>
</div>

<style>
    .docs-container { max-width: 900px; margin: 0 auto; padding: 2rem; font-family: 'Segoe UI', system-ui, sans-serif; color: #1a202c; }
    
    .docs-header { border-bottom: 4px solid #3182ce; margin-bottom: 2rem; padding-bottom: 1.5rem; }
    .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .docs-header h1 { color: #2c5282; margin: 0; font-size: 2rem; }
    .badge { background: #3182ce; color: white; padding: 0.3rem 0.8rem; border-radius: 4px; font-weight: bold; font-size: 0.8rem; text-transform: uppercase; }
    .meta { color: #718096; margin-top: 0.5rem; }

    .toc { background: #ebf8ff; padding: 1.5rem; border-radius: 8px; margin-bottom: 3rem; border: 1px solid #bee3f8; }
    .toc h2 { margin: 0 0 1rem; color: #2c5282; font-size: 1.2rem; }
    .toc ol { padding-left: 1.5rem; }
    .toc a { text-decoration: none; color: #2b6cb0; font-weight: 600; }

    /* Campaign Box */
    .campaign-box { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 3rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    @media (max-width: 768px) { .campaign-box { grid-template-columns: 1fr; } }
    
    .settings { padding: 1.5rem; background: #f7fafc; border-right: 1px solid #e2e8f0; }
    .settings h4 { margin-top: 0; color: #4a5568; }
    .settings ul { padding-left: 1.2rem; }
    .settings li { margin-bottom: 0.5rem; font-size: 0.9rem; color: #2d3748; }

    /* Ad Mockup (Facebook Style) */
    .ad-mockup { padding: 1.5rem; font-family: Helvetica, Arial, sans-serif; }
    .ad-header { display: flex; align-items: center; font-weight: bold; font-size: 0.9rem; margin-bottom: 0.5rem; }
    .avatar { width: 32px; height: 32px; background: #2d3748; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 1.2rem; }
    .sponsored { color: #718096; font-weight: normal; font-size: 0.8rem; margin-left: 8px; }
    
    .ad-copy { font-size: 0.9rem; margin-bottom: 1rem; line-height: 1.4; white-space: pre-wrap; }
    .ad-image { background: #cbd5e0; height: 180px; display: flex; align-items: center; justify-content: center; color: #4a5568; font-weight: bold; font-size: 0.9rem; margin-bottom: 0.5rem; border: 1px solid #a0aec0; }
    .ad-cta { background: #e2e8f0; padding: 0.8rem; text-align: center; font-weight: bold; color: #2d3748; font-size: 0.9rem; border-radius: 4px; text-transform: uppercase; }

    /* Specific Border Colors for Campaigns */
    .campaign-box.b2b { border-top: 4px solid #805ad5; }
    .campaign-box.saas { border-top: 4px solid #38a169; }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .card { background: white; border: 1px solid #e2e8f0; padding: 1.5rem; border-radius: 8px; }
    .card h3 { margin-top: 0; color: #2b6cb0; }

    .data-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    .data-table td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
    .highlight { background: #f0fff4; font-weight: bold; color: #2f855a; }

    .alert-box { background: #fff5f5; border-left: 4px solid #fc8181; padding: 1rem; color: #c53030; margin-bottom: 1.5rem; }

    section { margin-bottom: 4rem; }
    h2 { font-size: 1.6rem; color: #2d3748; border-left: 5px solid #3182ce; padding-left: 1rem; margin-bottom: 1.5rem; }

    .docs-footer { margin-top: 4rem; text-align: center; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 2rem; }
</style>
