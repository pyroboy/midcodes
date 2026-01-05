<script lang="ts">
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
</script>

<svelte:head>
    <title>YouTube Marketing Strategy | Kanaya Admin</title>
</svelte:head>

<div class="docs-container">
    <header class="docs-header">
        <div class="header-top">
            <h1>YouTube Marketing & Content Strategy</h1>
            <span class="badge">Growth Engine</span>
        </div>
        <p class="meta">Channel Goal: B2B Trust & SaaS User Acquisition</p>
        <p class="subject">Subject: Video Scripts, Channel Structure, and Distribution</p>
    </header>

    <nav class="toc">
        <h2>Broadcast Plan</h2>
        <ol>
            <li><a href="#strategy">1. The "Two-Audience" Strategy</a></li>
            <li><a href="#playlists">2. Playlist Architecture</a></li>
            <li><a href="#scripts">3. The "Golden" Video Scripts</a></li>
            <li><a href="#distribution">4. Distribution (How to get Views)</a></li>
        </ol>
    </nav>

    <section id="strategy">
        <h2>1. The "Two-Audience" Strategy</h2>
        <div class="alert-box">
            <strong>Critical Insight:</strong> Your channel serves two masters. Do not mix them in the same video.
        </div>

        <div class="grid-2">
            <div class="card school">
                <h3>Target A: The Client (Principals/Mayors)</h3>
                <p><strong>Goal:</strong> Prove Stability & Safety.</p>
                <p><strong>Vibe:</strong> Professional, Clean, High-Tech.</p>
                <p><strong>Key Message:</strong> "We are not a fly-by-night print shop. We are a Safety Platform."</p>
            </div>
            <div class="card printer">
                <h3>Target B: The User (Print Shops)</h3>
                <p><strong>Goal:</strong> Prove Speed & Ease.</p>
                <p><strong>Vibe:</strong> "Hacker", Fast, No-BS.</p>
                <p><strong>Key Message:</strong> "Stop using Photoshop. Use my software to print 500 IDs in 5 minutes."</p>
            </div>
        </div>
    </section>

    <section id="playlists">
        <h2>2. Playlist Architecture</h2>
        <p class="subtext">Organize your channel so visitors find their specific solution immediately.</p>

        <table class="data-table">
            <thead>
                <tr>
                    <th>Playlist Name</th>
                    <th>Target Audience</th>
                    <th>Video Ideas</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>🛑 Campus Safety Series</strong></td>
                    <td>School Principals</td>
                    <td>
                        • "The Fetcher Card: Stopping Kidnappings"<br />
                        • "No Internet? No Problem. Offline Scanning Demo"<br />
                        • "Why PVC IDs Fade (And Why Ours Don't)"
                    </td>
                </tr>
                <tr>
                    <td><strong>⚡ Kanaya Studio Tutorials</strong></td>
                    <td>Print Shops (SaaS)</td>
                    <td>
                        • "Excel to PDF in 30 Seconds"<br />
                        • "How to clean messy client data"<br />
                        • "Mirror Printing Setting for L8050"
                    </td>
                </tr>
                <tr>
                    <td><strong>🏭 Behind The Scenes</strong></td>
                    <td>Both (Trust Building)</td>
                    <td>
                        • "Printing 1,000 IDs for [School Name]"<br />
                        • "Waterproof Test: We boiled our ID card"
                    </td>
                </tr>
            </tbody>
        </table>
    </section>

    <section id="scripts">
        <h2>3. The "Golden" Video Scripts</h2>
        <p class="subtext">Record these with your phone. No fancy studio needed. Good audio is required.</p>

        <div class="script-card">
            <h3>Script A: The "Fetcher Card" (For Schools)</h3>
            <p><strong>Hook (0:00):</strong> "If a stranger walked into your school and asked to fetch a Grade 1 student, would your guard know?"</p>
            <p><strong>Problem (0:15):</strong> "Logbooks are slow. Calling parents takes time. And standard IDs are easy to fake."</p>
            <p><strong>Solution (0:45):</strong> <em>[Show the Kanaya App scanning a card]</em> "This is the Kanaya Guardian Card. When the guard scans it, the student's photo AND the authorized fetcher's photo appear instantly. Green means GO. Red means STOP."</p>
            <p><strong>CTA (1:30):</strong> "Don't guess with safety. Click the link below to request a free demo for your school."</p>
        </div>

        <div class="script-card">
            <h3>Script B: The "Photoshop Killer" (For SaaS)</h3>
            <p><strong>Hook (0:00):</strong> "Stop. Layouting. IDs. In. Photoshop."</p>
            <p><strong>Agitate (0:10):</strong> "You have a list of 500 students in Excel. Copy-paste name. Copy-paste photo. Resize. Export. It takes 3 days, right?"</p>
            <p><strong>Solution (0:30):</strong> <em>[Screen record Kanaya Studio]</em> "Watch this. I drag the Excel file here. I drag the Zip file of photos here. Click Generate. Boom. 500 IDs, arranged 10-per-sheet, Mirror Mode, Ready to Print. 3 days of work done in 3 minutes."</p>
            <p><strong>CTA (1:00):</strong> "I built this for my own shop, now you can use it. Sign up for the free trial at Kanaya.app."</p>
        </div>
        
        <div class="script-card">
            <h3>Script C: The "Torture Test" (Trust)</h3>
            <p><strong>Action:</strong> Take a generic thermal ID (from a competitor) and a Kanaya ID.</p>
            <p><strong>The Test:</strong> Scrub both with steel wool or dip them in acetone/water.</p>
            <p><strong>The Payoff:</strong> "The other guy's ink wiped off. Ours is fused inside the plastic. Which one do you want your students wearing for 365 days?"</p>
        </div>
    </section>

    <section id="distribution">
        <h2>4. Distribution (How to Get Views)</h2>
        <div class="alert-box">
            <strong>Rule:</strong> Do not wait for the algorithm. You must force the views.
        </div>

        <div class="dist-grid">
            <div class="dist-item">
                <h4>📧 The "Video Reply"</h4>
                <p>When a Principal asks for a quote via email, do not just attach the PDF.</p>
                <p><strong>Action:</strong> "Hi Ma'am, attached is the quote. Also, I made a 60-second video showing exactly how the 'Anti-Fake' feature works. Watch it here: [YouTube Link]"</p>
            </div>

            <div class="dist-item">
                <h4>📲 The "QR Sticker"</h4>
                <p>Put a QR code on the back of every sample ID you hand out.</p>
                <p><strong>Action:</strong> Label it "Scan to see how it works." Link it to the <strong>Script A</strong> video.</p>
            </div>

            <div class="dist-item">
                <h4>👥 The "Group Infiltration"</h4>
                <p>Join Facebook Groups: "Printing Business Philippines", "DepEd Teachers Support".</p>
                <p><strong>Action:</strong> Do not spam. Post the <strong>Script B</strong> video with the caption: "Finally found a way to stop using Photoshop for IDs."</p>
            </div>
        </div>
    </section>

    <footer class="docs-footer">
        <p>Kanaya Media Production • Internal Use Only</p>
    </footer>
</div>

<style>
    .docs-container { max-width: 900px; margin: 0 auto; padding: 2rem; font-family: 'Segoe UI', system-ui, sans-serif; color: #1a202c; }
    
    .docs-header { border-bottom: 4px solid #e53e3e; margin-bottom: 2rem; padding-bottom: 1.5rem; }
    .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .docs-header h1 { color: #c53030; margin: 0; font-size: 2rem; }
    .badge { background: #e53e3e; color: white; padding: 0.3rem 0.8rem; border-radius: 4px; font-weight: bold; font-size: 0.8rem; text-transform: uppercase; }
    .meta { color: #718096; margin-top: 0.5rem; }

    .toc { background: #fff5f5; padding: 1.5rem; border-radius: 8px; margin-bottom: 3rem; border: 1px solid #feb2b2; }
    .toc h2 { margin: 0 0 1rem; color: #c53030; font-size: 1.2rem; }
    .toc ol { padding-left: 1.5rem; }
    .toc a { text-decoration: none; color: #9b2c2c; font-weight: 600; }

    /* Grid */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    @media (max-width: 768px) { .grid-2 { grid-template-columns: 1fr; } }
    
    .card { padding: 1.5rem; border-radius: 8px; border: 1px solid #e2e8f0; }
    .card.school { border-top: 4px solid #2b6cb0; background: #ebf8ff; }
    .card.printer { border-top: 4px solid #d69e2e; background: #fffff0; }
    .card h3 { margin-top: 0; }

    /* Tables */
    .data-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    .data-table th { background: #c53030; color: white; padding: 12px; text-align: left; }
    .data-table td { border: 1px solid #e2e8f0; padding: 12px; vertical-align: top; }

    /* Scripts */
    .script-card { background: white; border: 1px solid #e2e8f0; padding: 2rem; border-radius: 8px; margin-bottom: 2rem; border-left: 5px solid #e53e3e; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .script-card h3 { margin-top: 0; color: #c53030; }
    .script-card p { margin-bottom: 0.8rem; line-height: 1.6; }

    /* Distribution */
    .dist-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; }
    .dist-item { background: #f7fafc; padding: 1.5rem; border-radius: 8px; }
    .dist-item h4 { margin-top: 0; color: #2d3748; }

    .alert-box { background: #fff5f5; border-left: 4px solid #fc8181; padding: 1rem; color: #c53030; margin-bottom: 2rem; }

    section { margin-bottom: 4rem; }
    h2 { font-size: 1.6rem; color: #2d3748; border-left: 5px solid #e53e3e; padding-left: 1rem; margin-bottom: 1.5rem; }

    .docs-footer { margin-top: 4rem; text-align: center; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 2rem; }
</style>
