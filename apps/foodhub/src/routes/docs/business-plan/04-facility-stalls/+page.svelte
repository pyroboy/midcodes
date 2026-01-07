<script lang="ts">
    import { page } from '$app/stores';
</script>

<svelte:head>
    <title>Facility & Stalls — FoodHub</title>
</svelte:head>

<div class="page-wrapper">
    <a href="/" class="back-link">← Back to Dashboard</a>
    
    <header class="chapter-header">
        <span class="chapter-number">04</span>
        <h1>Facility & Stalls</h1>
    </header>

    <main class="content">
        <section class="section">
            <h2>Facility Overview</h2>
            <table class="info-table">
                <tbody>
                    <tr>
                        <td>Total Floor Area</td>
                        <td>[XXX] sqm</td>
                    </tr>
                    <tr>
                        <td>Dining Area</td>
                        <td>[XXX] sqm — [XX] seating capacity</td>
                    </tr>
                    <tr>
                        <td>Number of Stalls</td>
                        <td>12 units</td>
                    </tr>
                    <tr>
                        <td>Operating Hours</td>
                        <td>6:00 AM — 10:00 PM Daily</td>
                    </tr>
                </tbody>
            </table>
        </section>

        <section class="section">
            <h2>Current Tenants</h2>
            <div class="stalls-grid">
                <div class="stall-card">
                    <span class="stall-number">01</span>
                    <h3>Jjangcook</h3>
                    <p>Korean Food</p>
                </div>
                <div class="stall-card">
                    <span class="stall-number">02</span>
                    <h3>Grub-a-Box</h3>
                    <p>Rice Meals</p>
                </div>
                <div class="stall-card">
                    <span class="stall-number">03</span>
                    <h3>Kuya's Lugaw ATBP</h3>
                    <p>Comfort Food</p>
                </div>
                <div class="stall-card">
                    <span class="stall-number">04</span>
                    <h3>Swakto Meals</h3>
                    <p>Budget Meals</p>
                </div>
                <div class="stall-card">
                    <span class="stall-number">05</span>
                    <h3>FoodTrapp</h3>
                    <p>Specialty Food</p>
                </div>
                <div class="stall-card">
                    <span class="stall-number">06</span>
                    <h3>Isla Bites</h3>
                    <p>Island Flavors</p>
                </div>
                <div class="stall-card">
                    <span class="stall-number">07</span>
                    <h3>Quick Bites</h3>
                    <p>Snacks</p>
                </div>
                <div class="stall-card">
                    <span class="stall-number">08</span>
                    <h3>May30 Cafe</h3>
                    <p>Vietnamese / Cafe</p>
                </div>
                <div class="stall-card">
                    <span class="stall-number">09</span>
                    <h3>Shrimpyy</h3>
                    <p>Seafood</p>
                </div>
                 <div class="stall-card">
                    <span class="stall-number">10</span>
                    <h3>Shawkaws</h3>
                    <p>Shawarma</p>
                </div>
            </div>
        </section>

        <section class="section">
            <h2>Facility Specifications</h2>
            <ul>
                <li><strong>Security:</strong> Rolling shutters for each unit; CCTV surveillance installed.</li>
                <li><strong>Safety:</strong> Fire extinguisher required per unit (fixed area, visible).</li>
                <li><strong>Access:</strong> Controlled access for the second floor.</li>
                <li><strong>Connectivity:</strong> Centralized Wi-Fi management (Unit 1 voucher system).</li>
            </ul>
        </section>

        <section class="section">
            <h2>Stall Configurations</h2>
            <div class="stall-grid">
                <div class="stall-card premium">
                    <div class="stall-badge">PREMIUM</div>
                    <h4>Corner Stall</h4>
                    <ul>
                        <li>Size: 3m × 3m (9 sqm)</li>
                        <li>Double frontage visibility</li>
                        <li>Corner location advantage</li>
                        <li>Extra storage space</li>
                    </ul>
                    <div class="stall-rate">₱12,000/mo</div>
                </div>
                <div class="stall-card standard">
                    <div class="stall-badge">STANDARD</div>
                    <h4>Regular Stall</h4>
                    <ul>
                        <li>Size: 2.5m × 3m (7.5 sqm)</li>
                        <li>Single frontage</li>
                        <li>Standard utilities</li>
                        <li>Sink and prep area</li>
                    </ul>
                    <div class="stall-rate">₱8,000/mo</div>
                </div>
                <div class="stall-card compact">
                    <div class="stall-badge">COMPACT</div>
                    <h4>Kiosk Stall</h4>
                    <ul>
                        <li>Size: 2m × 2m (4 sqm)</li>
                        <li>Counter-service style</li>
                        <li>Ideal for beverages/snacks</li>
                        <li>Basic utilities</li>
                    </ul>
                    <div class="stall-rate">₱5,000/mo</div>
                </div>
            </div>
        </section>

        <section class="section">
            <h2>Included Amenities</h2>
            <div class="amenity-grid">
                <div class="amenity-item">💡 Electricity (sub-metered)</div>
                <div class="amenity-item">💧 Water Supply</div>
                <div class="amenity-item">🚽 Shared Restrooms</div>
                <div class="amenity-item">🗑️ Waste Management</div>
                <div class="amenity-item">🧹 Common Area Cleaning</div>
                <div class="amenity-item">🛡️ Security (CCTV)</div>
                <div class="amenity-item">🅿️ Customer Parking</div>
                <div class="amenity-item">📶 WiFi Access</div>
            </div>
        </section>

        <section class="section">
            <h2>Floor Plan</h2>
            <div class="floorplan-placeholder">
                <p>📐 Floor Plan Diagram</p>
                <small>[Insert floor plan image or diagram showing stall layout, dining area, restrooms, and common areas]</small>
            </div>
        </section>

        <section class="section">
            <h2>Stall Inventory</h2>
            <table class="inventory-table">
                <thead>
                    <tr>
                        <th>Stall #</th>
                        <th>Type</th>
                        <th>Size</th>
                        <th>Rate</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>S-01</td><td>Premium</td><td>9 sqm</td><td>₱12,000</td><td class="status vacant">Vacant</td></tr>
                    <tr><td>S-02</td><td>Standard</td><td>7.5 sqm</td><td>₱8,000</td><td class="status vacant">Vacant</td></tr>
                    <tr><td>S-03</td><td>Standard</td><td>7.5 sqm</td><td>₱8,000</td><td class="status vacant">Vacant</td></tr>
                    <tr><td>S-04</td><td>Standard</td><td>7.5 sqm</td><td>₱8,000</td><td class="status vacant">Vacant</td></tr>
                    <tr><td>S-05</td><td>Standard</td><td>7.5 sqm</td><td>₱8,000</td><td class="status vacant">Vacant</td></tr>
                    <tr><td>S-06</td><td>Standard</td><td>7.5 sqm</td><td>₱8,000</td><td class="status vacant">Vacant</td></tr>
                    <tr><td>S-07</td><td>Standard</td><td>7.5 sqm</td><td>₱8,000</td><td class="status vacant">Vacant</td></tr>
                    <tr><td>S-08</td><td>Standard</td><td>7.5 sqm</td><td>₱8,000</td><td class="status vacant">Vacant</td></tr>
                    <tr><td>S-09</td><td>Compact</td><td>4 sqm</td><td>₱5,000</td><td class="status vacant">Vacant</td></tr>
                    <tr><td>S-10</td><td>Compact</td><td>4 sqm</td><td>₱5,000</td><td class="status vacant">Vacant</td></tr>
                    <tr><td>S-11</td><td>Compact</td><td>4 sqm</td><td>₱5,000</td><td class="status vacant">Vacant</td></tr>
                    <tr><td>S-12</td><td>Premium</td><td>9 sqm</td><td>₱12,000</td><td class="status vacant">Vacant</td></tr>
                </tbody>
            </table>
        </section>
    </main>

    <nav class="chapter-nav">
        <a href="/docs/business-plan/03-market-analysis" class="prev">← Market Analysis</a>
        <a href="/docs/business-plan/05-lease-structure" class="next">Lease Structure →</a>
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

    .info-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
    }
    .info-table td {
        padding: 1rem;
        border: 1px solid #e4e4e7;
    }
    .info-table tr td:first-child {
        font-weight: 700;
        width: 40%;
        background: #fafafa;
    }

    .stall-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1.5rem;
    }
    .stall-card {
        background: white;
        border: 2px solid var(--color-black);
        padding: 1.5rem;
        position: relative;
    }
    .stall-badge {
        position: absolute;
        top: -10px;
        right: 10px;
        padding: 0.25rem 0.5rem;
        font-size: 0.7rem;
        font-weight: 700;
        font-family: var(--font-header);
        color: white;
    }
    .stall-card.premium { box-shadow: 4px 4px 0px var(--color-pink); }
    .stall-card.premium .stall-badge { background: var(--color-pink); }
    .stall-card.standard { box-shadow: 4px 4px 0px var(--color-green); }
    .stall-card.standard .stall-badge { background: var(--color-green); }
    .stall-card.compact { box-shadow: 4px 4px 0px #3b82f6; }
    .stall-card.compact .stall-badge { background: #3b82f6; }
    .stall-card h4 {
        margin-bottom: 1rem;
        font-size: 1.2rem;
    }
    .stall-card ul {
        list-style: disc;
        padding-left: 1.5rem;
        margin: 0 0 1rem 0;
        font-size: 0.9rem;
    }
    .stall-rate {
        font-family: var(--font-header);
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--color-black);
        padding-top: 1rem;
        border-top: 2px dashed #e4e4e7;
    }

    .amenity-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 0.75rem;
    }
    .amenity-item {
        background: white;
        padding: 0.75rem 1rem;
        border: 1px solid #e4e4e7;
        font-weight: 500;
        font-size: 0.95rem;
    }

    .floorplan-placeholder {
        background: white;
        border: 2px dashed var(--color-pink);
        padding: 3rem;
        text-align: center;
        color: #71717a;
    }
    .floorplan-placeholder p {
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
    }

    .inventory-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        font-size: 0.9rem;
    }
    .inventory-table th,
    .inventory-table td {
        padding: 0.75rem;
        border: 1px solid #e4e4e7;
        text-align: left;
    }
    .inventory-table th {
        background: var(--color-black);
        color: white;
        font-family: var(--font-header);
        text-transform: uppercase;
    }
    .inventory-table tr:nth-child(even) {
        background: #fafafa;
    }
    .status {
        font-weight: 700;
        font-size: 0.8rem;
    }
    .status.vacant { color: var(--color-green); }
    .status.occupied { color: var(--color-pink); }

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
