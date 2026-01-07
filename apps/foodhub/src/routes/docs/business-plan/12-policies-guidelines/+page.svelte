<script lang="ts">
    import { page } from '$app/stores';
</script>

<svelte:head>
    <title>Policies & Guidelines — FoodHub</title>
</svelte:head>

<div class="page-wrapper">
    <a href="/" class="back-link">← Back to Dashboard</a>
    
    <header class="chapter-header">
        <span class="chapter-number">12</span>
        <h1>Policies & Guidelines</h1>
    </header>

    <main class="content">
        <section class="section">
            <h2>Vendor House Rules</h2>
            <div class="policy-list">
                <div class="policy-item">
                    <span class="policy-num">1</span>
                    <div class="policy-content">
                        <h4>Operating Hours Compliance</h4>
                        <p>All vendors must operate during minimum required hours. Early closures require management approval. Repeated violations may result in lease termination.</p>
                    </div>
                </div>
                <div class="policy-item">
                    <span class="policy-num">2</span>
                    <div class="policy-content">
                        <h4>Cleanliness & Hygiene</h4>
                        <p>Vendors must maintain their stalls in clean and sanitary condition at all times. Proper food handling and storage required. Health certificates must be current.</p>
                    </div>
                </div>
                <div class="policy-item">
                    <span class="policy-num">3</span>
                    <div class="policy-content">
                        <h4>Waste Disposal</h4>
                        <p>Proper waste segregation required. Grease and oil must be disposed of properly. No dumping in common area drains.</p>
                    </div>
                </div>
                <div class="policy-item">
                    <span class="policy-num">4</span>
                    <div class="policy-content">
                        <h4>Fire Safety</h4>
                        <p>No blocking of fire exits. Proper use of cooking equipment only. LPG tanks must comply with safety standards. Annual fire safety inspection required.</p>
                    </div>
                </div>
                <div class="policy-item">
                    <span class="policy-num">5</span>
                    <div class="policy-content">
                        <h4>Payment Terms</h4>
                        <p>Rent due on the 5th of each month. 5-day grace period. Late payments subject to ₱500 fee plus 2% daily interest. 30-day default may result in eviction.</p>
                    </div>
                </div>
                <div class="policy-item">
                    <span class="policy-num">6</span>
                    <div class="policy-content">
                        <h4>Alterations & Modifications</h4>
                        <p>No structural modifications without written approval. Signage must follow brand guidelines. All improvements become property of lessor upon lease termination.</p>
                    </div>
                </div>
                <div class="policy-item">
                    <span class="policy-num">7</span>
                    <div class="policy-content">
                        <h4>Noise & Conduct</h4>
                        <p>Maintain professional conduct. No loud music or disruptive behavior. Customer complaints will be addressed formally.</p>
                    </div>
                </div>
                <div class="policy-item">
                    <span class="policy-num">8</span>
                    <div class="policy-content">
                        <h4>Personnel</h4>
                        <p>Vendors are responsible for their own staff. Proper uniforms or identification required. Background checks recommended for all employees.</p>
                    </div>
                </div>
            </div>
        </section>

        <section class="section">
            <h2>House Rules</h2>
            <div class="policy-card">
                <h3>Customer Policies</h3>
                <ul>
                    <li><strong>Cleanliness:</strong> strictly separate non-biodegradable trash (Management only collects plastics/non-bio).</li>
                    <li><strong>Loitering:</strong> No street kids / no solicitations allowed within premises.</li>
                    <li><strong>No Outside Food:</strong> Customers must purchase from hub tenants.</li>
                    <li><strong>Parking:</strong> Strictly for Food Hub customers only. Unauthorized parking subject to ₱100/hr fee or clamping.</li>
                </ul>
            </div>
        </section>

        <section class="section">
            <h2>Tenant Guidelines</h2>
             <div class="policy-card">
                <h3>Operational Rules</h3>
                <ul>
                    <li><strong>Waste Disposal:</strong> Tenants must Segregate trash. Fines imposed for violators (City collects MWF 6:00-7:30).</li>
                    <li><strong>Safety:</strong> "As used stoves, install fire extinguisher in fixed, elevated, visible area."</li>
                    <li><strong>Hours:</strong> flexible opening (6 AM default), but must notify management. Strict adherence to agreed operating slots.</li>
                    <li><strong>Collaboration:</strong> Participation in "Collaboration Day" and submitting menu/photos for FB page required.</li>
                </ul>
            </div>
        </section>

        <section class="section">
             <h2>Logistics & Access</h2>
             <ul>
                 <li><strong>Deliveries:</strong> Specific time slots to avoid congestion.</li>
                 <li><strong>CR Access:</strong> "Vendo door" or kept locked (key management required).</li>
             </ul>
        </section>

        <section class="section">
            <h2>Food Safety Standards</h2>
            <ul>
                <li>All food handlers must have valid Health Certificates</li>
                <li>Proper food storage temperatures must be maintained</li>
                <li>Raw and cooked foods must be stored separately</li>
                <li>First-In-First-Out (FIFO) rotation for ingredients</li>
                <li>Handwashing facilities must be accessible</li>
                <li>Pest control measures must be in place</li>
            </ul>
        </section>

        <section class="section">
            <h2>Violation Penalties</h2>
            <table class="penalty-table">
                <thead>
                    <tr>
                        <th>Violation Type</th>
                        <th>1st Offense</th>
                        <th>2nd Offense</th>
                        <th>3rd Offense</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Minor (cleanliness, noise)</td>
                        <td>Verbal warning</td>
                        <td>Written warning</td>
                        <td>₱1,000 fine</td>
                    </tr>
                    <tr>
                        <td>Moderate (early closure, alterations)</td>
                        <td>Written warning</td>
                        <td>₱2,000 fine</td>
                        <td>₱5,000 fine</td>
                    </tr>
                    <tr>
                        <td>Major (safety, non-payment)</td>
                        <td>₱5,000 fine</td>
                        <td>Suspension</td>
                        <td>Lease termination</td>
                    </tr>
                </tbody>
            </table>
        </section>

        <section class="section">
            <h2>Common Area Guidelines</h2>
            <ul>
                <li>Dining area is shared — vendors may not reserve tables</li>
                <li>Keep pathways clear and accessible</li>
                <li>Restrooms are for customer use — maintain cleanliness</li>
                <li>No storage of items in common areas</li>
                <li>Report maintenance issues immediately</li>
            </ul>
        </section>

        <section class="section">
            <h2>Emergency Procedures</h2>
            <div class="emergency-grid">
                <div class="emergency-card">
                    <h4>🔥 Fire</h4>
                    <ol>
                        <li>Alert others and call 911</li>
                        <li>Use fire extinguisher if safe</li>
                        <li>Evacuate via nearest exit</li>
                        <li>Gather at assembly point</li>
                    </ol>
                </div>
                <div class="emergency-card">
                    <h4>🏥 Medical Emergency</h4>
                    <ol>
                        <li>Call emergency services</li>
                        <li>Notify management</li>
                        <li>Provide first aid if trained</li>
                        <li>Keep area clear for responders</li>
                    </ol>
                </div>
                <div class="emergency-card">
                    <h4>🌪️ Natural Disaster</h4>
                    <ol>
                        <li>Follow evacuation announcements</li>
                        <li>Secure cash and valuables</li>
                        <li>Turn off gas and electrical</li>
                        <li>Proceed to safe area</li>
                    </ol>
                </div>
            </div>
        </section>

        <section class="section">
            <h2>Contact Information</h2>
            <table class="contact-table">
                <tbody>
                    <tr><td>Management Hotline</td><td>[Phone Number]</td></tr>
                    <tr><td>Emergency Services</td><td>911</td></tr>
                    <tr><td>Fire Department</td><td>[Local Fire Dept Number]</td></tr>
                    <tr><td>Building Maintenance</td><td>[Phone Number]</td></tr>
                </tbody>
            </table>
        </section>
    </main>

    <nav class="chapter-nav">
        <a href="/docs/business-plan/11-initial-totex" class="prev">← Initial TOTEX</a>
        <a href="/docs/business-plan/13-appendices" class="next">Appendices →</a>
    </nav>
</div>

<style>
    .page-wrapper {
        max-width: 900px;
        margin: 0 auto;
        padding: 3rem 2rem;
    }

    .back-link {
        display: inline-block;
        margin-bottom: 2rem;
        color: var(--color-pink);
        font-weight: 600;
        transition: all 0.2s;
    }
    .back-link:hover { padding-left: 0.5rem; }

    .chapter-header {
        margin-bottom: 3rem;
        border-bottom: 4px solid var(--color-black);
        padding-bottom: 1.5rem;
    }
    .chapter-number {
        display: inline-block;
        background: linear-gradient(135deg, var(--color-pink) 0%, var(--color-green) 100%);
        color: white;
        padding: 0.25rem 0.75rem;
        font-family: var(--font-header);
        font-size: 1rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        border-radius: 2px;
    }
    h1 { font-size: 3.5rem; line-height: 1; }

    .content { margin-bottom: 4rem; }

    .section { margin-bottom: 3rem; }
    .section h2 {
        font-size: 1.5rem;
        border-left: 4px solid var(--color-green);
        padding-left: 1rem;
        margin-bottom: 1rem;
    }
    .section > ul {
        list-style: none;
        padding: 0;
    }
    .section > ul > li {
        padding: 0.75rem 1rem;
        background: white;
        border-left: 3px solid var(--color-pink);
        margin-bottom: 0.5rem;
    }

    .policy-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    .policy-item {
        background: white;
        border: 1px solid #e4e4e7;
        padding: 1.5rem;
        display: flex;
        gap: 1.5rem;
    }
    .policy-num {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, var(--color-pink) 0%, var(--color-green) 100%);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font-header);
        font-weight: 700;
        font-size: 1.2rem;
    }
    .policy-content h4 {
        margin-bottom: 0.5rem;
        font-size: 1.1rem;
    }
    .policy-content p {
        margin: 0;
        color: #52525b;
        line-height: 1.6;
    }

    .penalty-table, .contact-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        font-size: 0.9rem;
    }
    .penalty-table th,
    .penalty-table td,
    .contact-table td {
        padding: 0.75rem 1rem;
        border: 1px solid #e4e4e7;
        text-align: left;
    }
    .penalty-table th {
        background: var(--color-black);
        color: white;
        font-family: var(--font-header);
        text-transform: uppercase;
    }
    .contact-table tr td:first-child {
        font-weight: 700;
        width: 40%;
        background: #fafafa;
    }

    .emergency-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
    }
    .emergency-card {
        background: white;
        border: 2px solid var(--color-black);
        padding: 1.5rem;
        box-shadow: 4px 4px 0px var(--color-pink);
    }
    .emergency-card h4 {
        margin-bottom: 1rem;
        font-size: 1.2rem;
    }
    .emergency-card ol {
        padding-left: 1.5rem;
        margin: 0;
    }
    .emergency-card li {
        margin-bottom: 0.5rem;
        font-size: 0.95rem;
    }

    .chapter-nav {
        display: flex;
        justify-content: space-between;
        padding-top: 2rem;
        border-top: 2px solid #e4e4e7;
    }
    .chapter-nav a {
        padding: 0.75rem 1.5rem;
        background: var(--color-black);
        color: white;
        font-weight: 700;
        font-family: var(--font-header);
        text-transform: uppercase;
        transition: all 0.2s;
    }
    .chapter-nav a:hover { background: var(--color-pink); }
</style>
