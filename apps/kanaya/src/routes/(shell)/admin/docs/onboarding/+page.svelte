<script lang="ts">
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
</script>

<svelte:head>
    <title>Client Onboarding & Support | Kanaya Admin</title>
</svelte:head>

<div class="docs-container">
    <header class="docs-header">
        <div class="header-top">
            <h1>Client Success & Onboarding Protocols</h1>
            <span class="badge">Operations</span>
        </div>
        <p class="meta">Department: Customer Success • Updated: January 2026</p>
        <p class="subject">Subject: Implementation Guidelines, Data Ingestion, and Support Scripts</p>
    </header>

    <nav class="toc">
        <h2>The "Go-Live" Roadmap</h2>
        <ol>
            <li><a href="#intake">1. Data Intake (The Excel Nightmare)</a></li>
            <li><a href="#training">2. User Training (Guards & Admins)</a></li>
            <li><a href="#support">3. Support Scripts (Troubleshooting)</a></li>
            <li><a href="#crisis">4. Crisis Communication (Server Down)</a></li>
        </ol>
    </nav>

    <section id="intake">
        <h2>1. Data Ingestion Standards</h2>
        <div class="alert-box">
            <strong>The Golden Rule:</strong> Garbage In, Garbage Out. Do not accept handwritten lists. Do not accept photos sent via Messenger.
        </div>

        <div class="step-card">
            <h3>Step 1: The "Kanaya Master Template"</h3>
            <p>Send this Excel file to the School Admin immediately after signing.</p>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Column A</th>
                        <th>Column B</th>
                        <th>Column C</th>
                        <th>Column D</th>
                        <th>Column E</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Student_ID</strong></td>
                        <td><strong>Last_Name</strong></td>
                        <td><strong>First_Name</strong></td>
                        <td><strong>Grade_Level</strong></td>
                        <td><strong>Guardian_Mobile</strong></td>
                    </tr>
                    <tr>
                        <td><em>10234</em></td>
                        <td><em>Dela Cruz</em></td>
                        <td><em>Juan</em></td>
                        <td><em>Grade 7 - Diamond</em></td>
                        <td><em>0917xxxxxxx</em></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="step-card">
            <h3>Step 2: Photo Standards</h3>
            <p><strong>Option A (School Provides):</strong> Filenames must match Student ID (e.g., <code>10234.jpg</code>). No selfies.</p>
            <p><strong>Option B (We Shoot):</strong> We charge ₱50/head. We organize files by Section.</p>
        </div>
    </section>

    <section id="training">
        <h2>2. Training Modules</h2>
        <p class="subtext">You must train the users, or they will blame the "System" for their mistakes.</p>

        <div class="grid-2">
            <div class="card">
                <h3>👮 For the Guard (The Scanner)</h3>
                <p><strong>Goal:</strong> Speed. Scan in under 2 seconds.</p>
                <ul>
                    <li><strong>Training 1:</strong> How to hold the phone (NFC Sweet Spot).</li>
                    <li><strong>Training 2:</strong> What to do if "Red Screen" (Invalid/Expired).</li>
                    <li><strong>Training 3:</strong> How to use "Offline Mode" when Wi-Fi dies.</li>
                </ul>
            </div>
            <div class="card">
                <h3>👩‍💼 For the Admin (The Dashboard)</h3>
                <p><strong>Goal:</strong> Data Management.</p>
                <ul>
                    <li><strong>Training 1:</strong> How to "Deactivate" a lost card.</li>
                    <li><strong>Training 2:</strong> How to export the Attendance Report for the Principal.</li>
                    <li><strong>Training 3:</strong> How to issue a "Guest Pass".</li>
                </ul>
            </div>
        </div>
    </section>

    <section id="support">
        <h2>3. Support Scripts (The "Cheat Sheet")</h2>
        <p class="subtext">Copy-paste answers for common complaints.</p>

        <div class="script-box">
            <h4>Ticket: "The ID is not scanning!"</h4>
            <p class="answer">
                "Please hold the card against the <strong>top-back</strong> of the phone for 1 full second. Metal cases interfere with the signal. Please remove the phone case and try again. If it still fails, the chip may be damaged. We can reprint a replacement for ₱150."
            </p>
        </div>

        <div class="script-box">
            <h4>Ticket: "Wrong spelling on the printed card!"</h4>
            <p class="answer">
                "We print exactly what is in the Excel file provided. I can pull up the original file you sent to verify. If the error is in the file, a reprint fee applies. If the error is ours, we replace it for free immediately."
            </p>
        </div>

        <div class="script-box">
            <h4>Ticket: "I forgot my Admin Password."</h4>
            <p class="answer">
                "For security, I cannot see your password. I have sent a 'Reset Link' to the official school email address on file. Please check your Spam folder."
            </p>
        </div>
    </section>

    <section id="crisis">
        <h2>4. Crisis Communication Protocol</h2>
        <div class="alert-box critical">
            <strong>Use Case:</strong> Server Down / Cloudflare Outage / App Crash.
        </div>

        <div class="crisis-card">
            <h3>⚠️ Defcon 1: The "System Down" Broadcast</h3>
            <p><strong>To:</strong> All School Principals</p>
            <p><strong>Subject:</strong> Urgent: Maintenance Mode / Offline Protocols</p>
            <p class="email-body">
                "Good morning. We are currently experiencing a connectivity issue with our cloud servers.<br><br>
                <strong>The App is designed for this.</strong> Please instruct your guards to continue scanning. The data is being saved locally on their devices and will automatically sync once the connection is restored.<br><br>
                Security is NOT compromised. We will update you in 1 hour."
            </p>
        </div>
    </section>

    <footer class="docs-footer">
        <p>Kanaya Customer Success Unit • Internal Use Only</p>
    </footer>
</div>

<style>
    .docs-container { max-width: 900px; margin: 0 auto; padding: 2rem; font-family: 'Segoe UI', system-ui, sans-serif; color: #1a202c; }
    
    .docs-header { border-bottom: 4px solid #d53f8c; margin-bottom: 2rem; padding-bottom: 1.5rem; }
    .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .docs-header h1 { color: #97266d; margin: 0; font-size: 2rem; }
    .badge { background: #d53f8c; color: white; padding: 0.3rem 0.8rem; border-radius: 4px; font-weight: bold; font-size: 0.8rem; text-transform: uppercase; }
    .meta { color: #718096; margin-top: 0.5rem; }

    /* TOC */
    .toc { background: #fff5f7; padding: 1.5rem; border-radius: 8px; margin-bottom: 3rem; border: 1px solid #fed7e2; }
    .toc h2 { margin: 0 0 1rem; color: #97266d; font-size: 1.2rem; }
    .toc ol { padding-left: 1.5rem; }
    .toc a { text-decoration: none; color: #b83280; font-weight: 600; }

    /* Steps & Tables */
    .step-card { background: white; border: 1px solid #e2e8f0; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; }
    .step-card h3 { margin-top: 0; color: #702459; }

    .data-table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.9rem; }
    .data-table th { background: #97266d; color: white; padding: 10px; text-align: left; }
    .data-table td { border: 1px solid #e2e8f0; padding: 10px; }

    /* Grid */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    @media (max-width: 768px) { .grid-2 { grid-template-columns: 1fr; } }
    .card { background: #fff; border: 1px solid #e2e8f0; padding: 1.5rem; border-radius: 8px; border-top: 4px solid #d53f8c; }
    .card h3 { margin-top: 0; }

    /* Scripts */
    .script-box { background: #f7fafc; padding: 1.5rem; border-left: 5px solid #4a5568; margin-bottom: 1.5rem; }
    .script-box h4 { margin: 0 0 0.5rem; color: #2d3748; }
    .answer { font-style: italic; color: #4a5568; margin: 0; font-size: 1.05rem; line-height: 1.6; }

    /* Crisis */
    .alert-box { background: #fff5f5; border-left: 4px solid #fc8181; padding: 1rem; color: #c53030; margin-bottom: 1.5rem; }
    .alert-box.critical { background: #1a202c; color: #feb2b2; border-color: #f56565; }

    .crisis-card { background: #fff; border: 2px solid #fc8181; padding: 2rem; border-radius: 8px; }
    .email-body { background: #edf2f7; padding: 1.5rem; border-radius: 4px; font-family: serif; color: #2d3748; }

    section { margin-bottom: 4rem; }
    h2 { font-size: 1.6rem; color: #2d3748; border-left: 5px solid #d53f8c; padding-left: 1rem; margin-bottom: 1.5rem; }

    .docs-footer { margin-top: 4rem; text-align: center; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 2rem; }
</style>
