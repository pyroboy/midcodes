<script lang="ts">
    import { page } from '$app/stores';
</script>

<svelte:head>
    <title>Appendices — FoodHub</title>
</svelte:head>

<div class="page-wrapper">
    <a href="/" class="back-link">← Back to Dashboard</a>
    
    <header class="chapter-header">
        <span class="chapter-number">13</span>
        <h1>Appendices</h1>
    </header>

    <main class="content">
        <section class="section">
            <h2>Printable Forms & Templates</h2>
            <p>The following documents are available for printing and use in daily operations.</p>
            
            <div class="forms-grid">
                <div class="form-card">
                    <div class="form-icon">📄</div>
                    <h4>Stall Lease Agreement</h4>
                    <p>Standard contract for vendor leasing</p>
                    <span class="print-status">🖨️ Ready to print</span>
                </div>
                <div class="form-card">
                    <div class="form-icon">📋</div>
                    <h4>Vendor Application Form</h4>
                    <p>New tenant application and screening</p>
                    <span class="print-status">🖨️ Ready to print</span>
                </div>
                <div class="form-card">
                    <div class="form-icon">✅</div>
                    <h4>Move-In Checklist</h4>
                    <p>Stall condition documentation</p>
                    <span class="print-status">🖨️ Ready to print</span>
                </div>
                <div class="form-card">
                    <div class="form-icon">✅</div>
                    <h4>Move-Out Checklist</h4>
                    <p>Stall inspection upon termination</p>
                    <span class="print-status">🖨️ Ready to print</span>
                </div>
                <div class="form-card">
                    <div class="form-icon">💰</div>
                    <h4>Monthly Rent Receipt</h4>
                    <p>Official payment acknowledgment</p>
                    <span class="print-status">🖨️ Ready to print</span>
                </div>
                <div class="form-card">
                    <div class="form-icon">⚡</div>
                    <h4>Utility Reading Log</h4>
                    <p>Sub-meter reading documentation</p>
                    <span class="print-status">🖨️ Ready to print</span>
                </div>
                <div class="form-card">
                    <div class="form-icon">🔧</div>
                    <h4>Maintenance Request Form</h4>
                    <p>Vendor repair/issue reporting</p>
                    <span class="print-status">🖨️ Ready to print</span>
                </div>
                <div class="form-card">
                    <div class="form-icon">⚠️</div>
                    <h4>Violation Notice</h4>
                    <p>Official warning documentation</p>
                    <span class="print-status">🖨️ Ready to print</span>
                </div>
                <div class="form-card">
                    <div class="form-icon">📊</div>
                    <h4>Daily Collection Log</h4>
                    <p>Cash tracking for rent collection</p>
                    <span class="print-status">🖨️ Ready to print</span>
                </div>
                <div class="form-card">
                    <div class="form-icon">🧹</div>
                    <h4>Hygiene Inspection Checklist</h4>
                    <p>Vendor cleanliness audit form</p>
                    <span class="print-status">🖨️ Ready to print</span>
                </div>
            </div>
        </section>

        <section class="section">
            <h2>Reference Documents</h2>
            <ul>
                <li>Floor Plan Layout</li>
                <li>Stall Specifications & Dimensions</li>
                <li>Utility Sub-Meter Map</li>
                <li>Emergency Evacuation Map</li>
                <li>Fire Safety Equipment Locations</li>
                <li>Vendor Contact List</li>
            </ul>
        </section>

        <section class="section">
            <h2>Sample Lease Agreement</h2>
            <div class="sample-doc">
                <h4>STALL LEASE AGREEMENT</h4>
                <p class="doc-meta">FoodHub Commercial Leasing</p>
                
                <div class="doc-section">
                    <h5>PARTIES</h5>
                    <p><strong>LESSOR:</strong> [FoodHub / Owner Name]</p>
                    <p><strong>LESSEE:</strong> ____________________</p>
                </div>
                
                <div class="doc-section">
                    <h5>PROPERTY</h5>
                    <p>Stall No: _____ | Type: _____ | Size: _____ sqm</p>
                </div>
                
                <div class="doc-section">
                    <h5>TERM</h5>
                    <p>Start Date: _____ | End Date: _____</p>
                    <p>Duration: _____ months</p>
                </div>
                
                <div class="doc-section">
                    <h5>RENT</h5>
                    <p>Monthly Rate: ₱_____</p>
                    <p>Security Deposit: ₱_____ (2 months)</p>
                    <p>Due Date: 5th of each month</p>
                </div>
                
                <div class="doc-section">
                    <h5>SIGNATURES</h5>
                    <div class="signature-grid">
                        <div class="signature-box">
                            <p>LESSOR</p>
                            <div class="signature-line"></div>
                            <p>Date: _____________</p>
                        </div>
                        <div class="signature-box">
                            <p>LESSEE</p>
                            <div class="signature-line"></div>
                            <p>Date: _____________</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="section">
            <h2>Checklists</h2>
            
            <div class="checklist-section">
                <h4>📋 Move-In Inspection Checklist</h4>
                <div class="checklist-grid">
                    <div class="checklist-item">☐ Stall walls condition</div>
                    <div class="checklist-item">☐ Counter/work surface</div>
                    <div class="checklist-item">☐ Electrical outlets working</div>
                    <div class="checklist-item">☐ Water supply functional</div>
                    <div class="checklist-item">☐ Drainage clear</div>
                    <div class="checklist-item">☐ Ventilation working</div>
                    <div class="checklist-item">☐ Lighting functional</div>
                    <div class="checklist-item">☐ Floor condition</div>
                    <div class="checklist-item">☐ Keys/access cards issued</div>
                    <div class="checklist-item">☐ Sub-meter reading noted</div>
                </div>
            </div>

            <div class="checklist-section">
                <h4>📋 Monthly Hygiene Inspection</h4>
                <div class="checklist-grid">
                    <div class="checklist-item">☐ Food storage proper</div>
                    <div class="checklist-item">☐ Work surfaces clean</div>
                    <div class="checklist-item">☐ Waste bins covered</div>
                    <div class="checklist-item">☐ No pest evidence</div>
                    <div class="checklist-item">☐ Staff wearing proper attire</div>
                    <div class="checklist-item">☐ Health certificates displayed</div>
                </div>
            </div>
        </section>
    </main>

    <nav class="chapter-nav">
        <a href="/docs/business-plan/12-policies-guidelines" class="prev">← Policies & Guidelines</a>
        <a href="/" class="next">Back to Dashboard →</a>
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
    .section > p {
        color: #52525b;
        margin-bottom: 1.5rem;
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

    .forms-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
    }
    .form-card {
        background: white;
        border: 2px solid var(--color-black);
        padding: 1.5rem;
        transition: all 0.2s;
    }
    .form-card:hover {
        box-shadow: 4px 4px 0px var(--color-green);
        transform: translate(-2px, -2px);
    }
    .form-icon {
        font-size: 2rem;
        margin-bottom: 0.75rem;
    }
    .form-card h4 {
        font-size: 1rem;
        margin-bottom: 0.5rem;
    }
    .form-card p {
        font-size: 0.85rem;
        color: #71717a;
        margin-bottom: 0.75rem;
    }
    .print-status {
        font-size: 0.75rem;
        color: var(--color-green);
        font-weight: 600;
    }

    .sample-doc {
        background: white;
        border: 2px solid var(--color-black);
        padding: 2rem;
        font-family: 'Georgia', serif;
    }
    .sample-doc h4 {
        text-align: center;
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
    }
    .doc-meta {
        text-align: center;
        color: #71717a;
        margin-bottom: 2rem;
    }
    .doc-section {
        margin-bottom: 1.5rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px dashed #e4e4e7;
    }
    .doc-section:last-child {
        border-bottom: none;
    }
    .doc-section h5 {
        font-family: var(--font-header);
        font-size: 0.9rem;
        text-transform: uppercase;
        color: #71717a;
        margin-bottom: 0.75rem;
    }
    .doc-section p {
        margin: 0.25rem 0;
    }
    .signature-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin-top: 1rem;
    }
    .signature-box {
        text-align: center;
    }
    .signature-line {
        height: 1px;
        background: var(--color-black);
        margin: 2rem 0 0.5rem 0;
    }

    .checklist-section {
        background: white;
        border: 1px solid #e4e4e7;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
    }
    .checklist-section h4 {
        margin-bottom: 1rem;
        font-size: 1.1rem;
    }
    .checklist-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.5rem;
    }
    .checklist-item {
        padding: 0.5rem;
        background: #fafafa;
        font-size: 0.9rem;
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
