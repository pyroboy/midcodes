<script lang="ts">
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
</script>

<svelte:head>
    <title>Organic Social Media Playbook | Kanaya Admin</title>
</svelte:head>

<div class="docs-container">
    <header class="docs-header">
        <div class="header-top">
            <h1>Organic Social Media Playbook</h1>
            <span class="badge">Brand Building</span>
        </div>
        <p class="meta">Platforms: Facebook Page, TikTok, LinkedIn</p>
        <p class="subject">Subject: Content Calendar, Viral Scripts, and Community Management</p>
    </header>

    <nav class="toc">
        <h2>The Playbook</h2>
        <ol>
            <li><a href="#platforms">1. The "Big Three" Strategy</a></li>
            <li><a href="#calendar">2. Weekly Content Calendar (3-3-1 Rule)</a></li>
            <li><a href="#viral">3. Viral Video Concepts (Reels/TikTok)</a></li>
            <li><a href="#community">4. Community Management ("HM?" Police)</a></li>
        </ol>
    </nav>

    <section id="platforms">
        <h2>1. The "Big Three" Strategy</h2>
        <p class="subtext">Do not try to be everywhere. Win where your clients are.</p>

        <div class="grid-3">
            <div class="card fb">
                <h3>🔵 Facebook Page</h3>
                <p><strong>Role:</strong> The "Official Office".</p>
                <p><strong>Audience:</strong> PTA Moms, Teachers, Principals.</p>
                <p><strong>Goal:</strong> Trust. If your last post was in 2023, they think you are closed.</p>
            </div>
            <div class="card tiktok">
                <h3>⚫ TikTok / Reels</h3>
                <p><strong>Role:</strong> The "Discovery Engine".</p>
                <p><strong>Audience:</strong> Print Shop Owners (SaaS Users), Students.</p>
                <p><strong>Goal:</strong> Virality. Show "Satisfying" process videos.</p>
            </div>
            <div class="card linkedin">
                <h3>🔵 LinkedIn</h3>
                <p><strong>Role:</strong> The "Boardroom".</p>
                <p><strong>Audience:</strong> HR Managers, CEOs, Mayors.</p>
                <p><strong>Goal:</strong> Authority. Post about "Security" and "Data Privacy".</p>
            </div>
        </div>
    </section>

    <section id="calendar">
        <h2>2. Weekly Content Calendar</h2>
        <div class="alert-box">
            <strong>The 3-3-1 Rule:</strong> 3 Educational Posts, 3 Social Proof Posts, 1 Hard Sell per week.
        </div>

        <table class="calendar-table">
            <thead>
                <tr>
                    <th>Day</th>
                    <th>Theme</th>
                    <th>Post Idea</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Monday</strong></td>
                    <td>🛠️ Process / BTS</td>
                    <td>Video: "Packing 500 IDs for [School Name]." (Shows you are busy/in-demand).</td>
                </tr>
                <tr>
                    <td><strong>Wednesday</strong></td>
                    <td>🎓 Education</td>
                    <td>Graphic: "Why PVC IDs fade vs. Kanaya Fused IDs." (Comparative Marketing).</td>
                </tr>
                <tr>
                    <td><strong>Friday</strong></td>
                    <td>⭐ Social Proof</td>
                    <td>Photo: You shaking hands with a Principal or holding a finished batch. Caption: "Thank you [Client] for trusting us!"</td>
                </tr>
                <tr>
                    <td><strong>Saturday</strong></td>
                    <td>🔥 Hard Sell</td>
                    <td>"We have 2 slots left for October production. DM us to reserve."</td>
                </tr>
            </tbody>
        </table>
    </section>

    <section id="viral">
        <h2>3. Viral Video Concepts (Short Form)</h2>
        <p class="subtext">Low effort, high visual impact. Record with phone.</p>

        <div class="script-card">
            <h3>Concept A: The "Scratch Test" (ASMR)</h3>
            <p><strong>Visual:</strong> Close up of a coin scratching a standard thermal ID (ink comes off). Then scratching a Kanaya ID (nothing happens).</p>
            <p><strong>Audio:</strong> "Stop buying cheap IDs. Listen to this." *Scratch noise*. "Now watch this." *Silence*.</p>
            <p><strong>Caption:</strong> Quality you can hear. #KanayaID #SchoolSupplies</p>
        </div>

        <div class="script-card">
            <h3>Concept B: The "Magic Scan"</h3>
            <p><strong>Visual:</strong> Quick cuts. Scan Card -> Phone Screen shows Photo. Scan Card -> Phone shows "ACCESS DENIED".</p>
            <p><strong>Audio:</strong> Trending audio or "This is how we stop outsiders from entering your campus."</p>
            <p><strong>Caption:</strong> 100% Security. 0% Delay.</p>
        </div>

        <div class="script-card">
            <h3>Concept C: The "SaaS Flex" (For Print Shops)</h3>
            <p><strong>Visual:</strong> Screen recording. Dragging Excel file -> PDF Generated instantly.</p>
            <p><strong>Audio:</strong> "If you're still using Photoshop for IDs, you are wasting your life. Link in bio."</p>
        </div>
    </section>

    <section id="community">
        <h2>4. Community Management ("HM?" Police)</h2>
        <p class="subtext">How to convert "How Much?" comments into contracts.</p>

        <div class="chat-flow">
            <div class="bubble user">
                <strong>Commenter:</strong> "Hm po?" (How much?)
            </div>
            <div class="bubble system bad">
                <strong>❌ Bad Reply:</strong> "PM sent." (Looks sketchy).
            </div>
            <div class="bubble system good">
                <strong>✅ Good Reply:</strong> "Hi! Our basic package starts at ₱50, but we have a promo for bulk school orders. I'll send you the full pricelist via DM now! 📩"
            </div>
            <div class="bubble note">
                <em>*Always reply publicly first to boost algorithm engagement, THEN message privately.*</em>
            </div>
        </div>

        <div class="chat-flow">
            <div class="bubble user">
                <strong>Client DM:</strong> "Can you do 50 pesos per card?"
            </div>
            <div class="bubble system good">
                <strong>✅ The Pivot:</strong> "For 50 pesos, I can give you the standard PVC. But for ₱150, I can give you the <strong>Smart QR System</strong> that tracks attendance. Most schools prefer the Smart System because parents love the SMS notification. Would you like to see a demo?"
            </div>
        </div>
    </section>

    <footer class="docs-footer">
        <p>Kanaya Social Media Team • Post Consistently</p>
    </footer>
</div>

<style>
    .docs-container { max-width: 900px; margin: 0 auto; padding: 2rem; font-family: 'Segoe UI', system-ui, sans-serif; color: #1a202c; }
    
    .docs-header { border-bottom: 4px solid #667eea; margin-bottom: 2rem; padding-bottom: 1.5rem; }
    .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .docs-header h1 { color: #4c51bf; margin: 0; font-size: 2rem; }
    .badge { background: #667eea; color: white; padding: 0.3rem 0.8rem; border-radius: 4px; font-weight: bold; font-size: 0.8rem; text-transform: uppercase; }
    .meta { color: #718096; margin-top: 0.5rem; }

    .toc { background: #ebf4ff; padding: 1.5rem; border-radius: 8px; margin-bottom: 3rem; border: 1px solid #c3dafe; }
    .toc h2 { margin: 0 0 1rem; color: #4c51bf; font-size: 1.2rem; }
    .toc ol { padding-left: 1.5rem; }
    .toc a { text-decoration: none; color: #434190; font-weight: 600; }

    /* Platform Cards */
    .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; }
    .card { padding: 1.5rem; border-radius: 8px; border: 1px solid #e2e8f0; background: white; }
    .card.fb { border-top: 5px solid #1877f2; }
    .card.tiktok { border-top: 5px solid #000000; }
    .card.linkedin { border-top: 5px solid #0077b5; }
    .card h3 { margin-top: 0; }

    /* Calendar Table */
    .calendar-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    .calendar-table th { background: #5a67d8; color: white; padding: 12px; text-align: left; }
    .calendar-table td { border: 1px solid #e2e8f0; padding: 12px; vertical-align: top; }
    .calendar-table tr:nth-child(even) { background: #f7fafc; }

    /* Scripts */
    .script-card { background: #fff; border: 1px solid #e2e8f0; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 5px solid #d53f8c; }
    .script-card h3 { margin-top: 0; color: #97266d; }

    /* Chat Flow */
    .chat-flow { background: #f7fafc; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; border: 1px solid #e2e8f0; }
    .bubble { padding: 1rem; border-radius: 8px; margin-bottom: 1rem; position: relative; max-width: 80%; }
    .bubble.user { background: #e2e8f0; color: #2d3748; border-bottom-left-radius: 0; }
    .bubble.system { background: white; border: 1px solid #cbd5e0; margin-left: auto; border-bottom-right-radius: 0; }
    .bubble.system.bad { border-left: 4px solid #fc8181; }
    .bubble.system.good { border-left: 4px solid #48bb78; background: #f0fff4; }
    .bubble.note { background: transparent; padding: 0; font-style: italic; color: #718096; font-size: 0.9rem; margin-top: 0.5rem; text-align: right; width: 100%; max-width: 100%; }

    .alert-box { background: #ebf8ff; border-left: 4px solid #4299e1; padding: 1rem; color: #2b6cb0; margin-bottom: 2rem; }

    section { margin-bottom: 4rem; }
    h2 { font-size: 1.6rem; color: #2d3748; border-left: 5px solid #667eea; padding-left: 1rem; margin-bottom: 1.5rem; }

    .docs-footer { margin-top: 4rem; text-align: center; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 2rem; }
</style>
