<script lang="ts">
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
</script>

<svelte:head>
    <title>Technical Architecture & Security | Kanaya Admin</title>
</svelte:head>

<div class="docs-container">
    <header class="docs-header">
        <div class="header-top">
            <h1>System Architecture & Security Protocols</h1>
            <span class="badge">Developer Docs</span>
        </div>
        <p class="meta">Stack: Svelte 5 • Cloudflare Workers • PostgreSQL • NFC</p>
        <p class="subject">Subject: Database Schema, Encryption Keys, and API Documentation</p>
    </header>

    <nav class="toc">
        <h2>System Blueprints</h2>
        <ol>
            <li><a href="#stack">1. The Tech Stack</a></li>
            <li><a href="#security">2. NFC Security & Encryption</a></li>
            <li><a href="#database">3. Database Schema (PostgreSQL)</a></li>
            <li><a href="#canvas">4. Image Rendering Engine (The SaaS Core)</a></li>
            <li><a href="#offline">5. Offline/PWA Protocols</a></li>
        </ol>
    </nav>

    <section id="stack">
        <h2>1. The Technology Stack</h2>
        <p class="subtext">We run on the Edge for speed and low latency in Philippines/SE Asia.</p>
        
        <div class="grid-3">
            <div class="tech-card">
                <h3>Frontend</h3>
                <div class="highlight">Svelte 5 + Tailwind</div>
                <p><strong>Why:</strong> We need fine-grained reactivity for the ID Card Canvas editor. React is too heavy.</p>
            </div>
            <div class="tech-card">
                <h3>Backend / API</h3>
                <div class="highlight">Cloudflare Workers</div>
                <p><strong>Why:</strong> Zero cold-start. Essential for "Scan & Verify" speed at school gates.</p>
            </div>
            <div class="tech-card">
                <h3>Database</h3>
                <div class="highlight">PostgreSQL (Supabase/Neon)</div>
                <p><strong>Why:</strong> Relational data. We need strict foreign keys between Students and Logs.</p>
            </div>
        </div>
    </section>

    <section id="security">
        <h2>2. NFC Security Architecture</h2>
        <div class="alert-box critical">
            <strong>TOP SECRET:</strong> Do not commit actual keys to GitHub. Use ENV variables.
        </div>

        <h3>Card Data Structure (Mifare 1K)</h3>
        <p>We do not store the student name on the card (GDPR/Privacy). We store a <strong>Signed Token</strong>.</p>
        
        <table class="code-table">
            <thead>
                <tr>
                    <th>Sector</th>
                    <th>Data Content</th>
                    <th>Access Key</th>
                    <th>Notes</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Sector 0</strong></td>
                    <td>Manufacturer UID</td>
                    <td>Read-Only</td>
                    <td>Unique hardware ID. Cannot be changed.</td>
                </tr>
                <tr>
                    <td><strong>Sector 1</strong></td>
                    <td><code>kanaya_uuid</code></td>
                    <td>Key A (Public)</td>
                    <td>Points to DB record.</td>
                </tr>
                <tr>
                    <td><strong>Sector 2</strong></td>
                    <td><code>HMAC_Signature</code></td>
                    <td>Key B (Private)</td>
                    <td>Cryptographic proof that WE wrote the card.</td>
                </tr>
            </tbody>
        </table>

        <div class="code-block">
            <h4>Validation Logic (Pseudocode)</h4>
            <pre>
if (VerifyHMAC(card.uuid, card.signature, SECRET_KEY)) &#123;
    return "Valid Card";
&#125; else &#123;
    return "CLONE DETECTED - ALERT ADMIN";
&#125;</pre>
        </div>
    </section>

    <section id="database">
        <h2>3. Database Schema (Core Tables)</h2>
        
        <div class="schema-box">
            <h3>Table: <code>profiles</code></h3>
            <ul>
                <li><code>id</code> (uuid, pk)</li>
                <li><code>school_id</code> (fk -&gt; organizations)</li>
                <li><code>role</code> (enum: 'student', 'staff', 'admin')</li>
                <li><code>nfc_uid</code> (text, unique, nullable) - <em>The Hardware ID</em></li>
                <li><code>is_active</code> (bool) - <em>Killswitch for lost cards</em></li>
                <li><code>emergency_contact</code> (jsonb)</li>
            </ul>

            <h3>Table: <code>access_logs</code></h3>
            <ul>
                <li><code>id</code> (bigint, pk)</li>
                <li><code>profile_id</code> (fk)</li>
                <li><code>scanner_id</code> (fk)</li>
                <li><code>timestamp</code> (timestamptz)</li>
                <li><code>direction</code> (enum: 'in', 'out')</li>
            </ul>
        </div>
    </section>

    <section id="canvas">
        <h2>4. The "Kanaya Studio" Engine</h2>
        <p>This is the core of our SaaS offering. It runs 100% Client-Side (Browser).</p>

        <div class="process-flow">
            <div class="step">
                <h4>1. Template Load</h4>
                <p>Loads <code>base_image</code> (PNG) and <code>layout_config</code> (JSON) from R2 Storage.</p>
            </div>
            <div class="step">
                <h4>2. Data Merge</h4>
                <p>Iterates through CSV rows. Injects Text and Profile Photo (Base64).</p>
            </div>
            <div class="step">
                <h4>3. Render &amp; Mirror</h4>
                <p>Draws to HTML5 Canvas. Applies <code>scale(-1, 1)</code> for Mirror Printing.</p>
            </div>
            <div class="step">
                <h4>4. PDF Generation</h4>
                <p>Compiles 10 Canvas elements into a single A4 PDF using <code>jspdf</code>.</p>
            </div>
        </div>
    </section>

    <section id="offline">
        <h2>5. Offline &amp; Disaster Recovery</h2>
        
        <div class="scenario-card">
            <h3>Scenario: No Internet at School Gate</h3>
            <p><strong>Solution: Local First Sync (PWA)</strong></p>
            <ol>
                <li><strong>Morning Sync:</strong> The Scanner Tablet downloads the <code>whitelist.json</code> (Text only: UID + Name + Status). Photos are not preloaded—fetch on demand or show a placeholder if offline.</li>
                <li><strong>Offline Scan:</strong> Tablet checks scanned UID against local Storage. Logs are saved locally.</li>
                <li><strong>Re-Sync:</strong> Logs are pushed to Cloudflare DB once internet is restored.</li>
            </ol>
        </div>
    </section>

    <footer class="docs-footer">
        <p>Kanaya Engineering • Authorized Developers Only</p>
    </footer>
</div>

<style>
    .docs-container { max-width: 950px; margin: 0 auto; padding: 2rem; font-family: 'Fira Code', 'Segoe UI', monospace; color: #c9d1d9; background: #0d1117; }
    
    .docs-header { border-bottom: 2px solid #30363d; margin-bottom: 2rem; padding-bottom: 1rem; }
    .header-top { display: flex; justify-content: space-between; align-items: center; }
    .docs-header h1 { color: #58a6ff; margin: 0; font-size: 1.8rem; font-family: 'Segoe UI', sans-serif; font-weight: 700; }
    .badge { background: #1f6feb; color: white; padding: 0.3rem 0.6rem; border-radius: 4px; font-size: 0.8rem; }
    .meta { color: #8b949e; margin-top: 0.5rem; }

    .toc { background: #161b22; border: 1px solid #30363d; padding: 1.5rem; border-radius: 6px; margin-bottom: 2rem; }
    .toc h2 { margin: 0 0 1rem; color: #c9d1d9; }
    .toc ol { margin: 0; padding-left: 1.5rem; color: #8b949e; }
    .toc a { color: #58a6ff; text-decoration: none; }

    section { margin-bottom: 3rem; }
    h2 { color: #c9d1d9; border-bottom: 1px solid #30363d; padding-bottom: 0.5rem; margin-bottom: 1.5rem; }
    .subtext { color: #8b949e; font-style: italic; margin-bottom: 1.5rem; }

    /* Tech Stack Grid */
    .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
    .tech-card { background: #161b22; border: 1px solid #30363d; padding: 1.5rem; border-radius: 6px; }
    .tech-card h3 { color: #fff; margin-top: 0; font-size: 1rem; }
    .highlight { color: #7ee787; font-weight: bold; margin: 0.5rem 0; font-size: 1.1rem; }
    .tech-card p { color: #8b949e; font-size: 0.9rem; }

    /* Tables */
    .code-table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: 0.9rem; }
    .code-table th { text-align: left; border-bottom: 1px solid #30363d; padding: 10px; color: #8b949e; }
    .code-table td { border-bottom: 1px solid #21262d; padding: 10px; color: #c9d1d9; }
    .code-table code { background: rgba(110,118,129,0.4); padding: 2px 4px; border-radius: 3px; }

    /* Code Blocks */
    .code-block { background: #161b22; padding: 1rem; border-radius: 6px; border: 1px solid #30363d; margin-bottom: 2rem; }
    .code-block pre { margin: 0; color: #a5d6ff; overflow-x: auto; }

    /* Schema */
    .schema-box { background: #161b22; padding: 1.5rem; border-left: 4px solid #d2a8ff; margin-bottom: 2rem; }
    .schema-box h3 { color: #d2a8ff; margin-top: 0; }
    .schema-box ul { color: #8b949e; }
    .schema-box code { color: #ff7b72; }

    /* Process Flow */
    .process-flow { display: grid; gap: 1rem; margin-bottom: 2rem; }
    .step { background: #21262d; padding: 1rem; border-radius: 6px; border-left: 3px solid #58a6ff; }
    .step h4 { margin: 0; color: #58a6ff; }
    .step p { margin: 0.5rem 0 0; color: #c9d1d9; font-size: 0.9rem; }

    .alert-box { background: #3e1f1f; border: 1px solid #ff7b72; color: #ff7b72; padding: 1rem; margin-bottom: 1.5rem; border-radius: 6px; }

    .scenario-card { background: #161b22; border: 1px dashed #8b949e; padding: 1.5rem; border-radius: 6px; }
    .scenario-card h3 { margin-top: 0; color: #f2cc60; }

    .docs-footer { margin-top: 4rem; text-align: center; color: #484f58; border-top: 1px solid #21262d; padding-top: 2rem; font-size: 0.8rem; }
</style>
