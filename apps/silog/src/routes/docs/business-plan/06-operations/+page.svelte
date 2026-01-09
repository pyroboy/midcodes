<svelte:head>
	<title>Operations Blueprint | KUYA'S SILOG & LUGAW</title>
</svelte:head>

<section class="doc-page">

    
    <header class="doc-header">
        <h1>06 Operational<br><span class="highlight">Blueprint</span></h1>
    </header>

    <article class="content">
        <h2>6.1 Location & Efficiency Layout</h2>
        <p>
            <strong>Site:</strong> Mama Maly's Food Hub (3m x 3m). <strong>Hours:</strong> 6:00 AM - 10:00 PM (16 Hours).
        </p>

        <div class="highlight-box">
             <h3>The "Cockpit" Layout</h3>
             <div class="layout-grid">
                 <div class="zone">
                     <span class="zone-badge">ZONE A</span>
                     <h4>Prep & Assembly</h4>
                     <ul>
                         <li>Mise en place station</li>
                         <li>Industrial Rice Cooker</li>
                         <li>Garnish storage</li>
                     </ul>
                 </div>
                 <div class="zone dark">
                     <span class="zone-badge hot">ZONE B</span>
                     <h4>The Hot Line</h4>
                     <ul>
                         <li>High-BTU Gas Burner (Lugaw)</li>
                         <li>Flat Top Griddle (Silog)</li>
                         <li>Heavy-duty Exhaust</li>
                     </ul>
                 </div>
                 <div class="zone">
                     <span class="zone-badge">ZONE C</span>
                     <h4>Service & POS</h4>
                     <ul>
                         <li>Dispatch Counter</li>
                         <li>POS Tablet Terminal</li>
                         <li>Beverage Station</li>
                     </ul>
                 </div>
                 <div class="zone">
                     <span class="zone-badge">ZONE D</span>
                     <h4>Sanitation</h4>
                     <ul>
                         <li>Single Basin Sink</li>
                         <li>Grease Trap System</li>
                     </ul>
                 </div>
             </div>
        </div>
        <div class="divider"></div>

        <h2>6.2 Tech & Equipment Stack</h2>
        <div class="market-grid">
            <div class="market-card">
                 <h4>🔥 Production Hardware</h4>
                 <ul>
                     <li><strong>Cooking:</strong> Heavy-duty Gas Burner, 2x Stock Pots (20L), Cast Iron & Non-stick Pans.</li>
                     <li><strong>Rice Tech:</strong> 10L Industrial Rice Cooker (The workhorse).</li>
                 </ul>
            </div>
            <div class="market-card dark">
                 <h4>⚡ Ops Systems</h4>
                 <ul>
                    <li><strong>POS:</strong> Tablet-based cloud POS for real-time inventory tracking.</li>
                    <li><strong>Printing:</strong> Thermal receipt printer for kitchen tickets.</li>
                 </ul>
            </div>
        </div>
        <div class="divider"></div>

        <h2>6.3 Standard Operating Procedures (SOP)</h2>
        <p>Consistency is our product. Every bowl, every plate, identical every time.</p>
        
        <div class="sop-container">
            <div class="sop-card">
                <h3>🍲 Lugaw Protocol</h3>
                <ol>
                    <li><strong>The Base:</strong> Boil bone broth with aromatics (ginger, onion, garlic) for 3 hours.</li>
                    <li><strong>The Rice:</strong> Sauté aromatics in oil. Add glutinous + jasmine rice mix. Toast lightly.</li>
                    <li><strong>The Merge:</strong> Pour hot broth. Simmer low-med. Stir constantly (45m).</li>
                    <li><strong>The Finish:</strong> Season with patis/salt. Top with egg, garlic, spring onions, and meat.</li>
                </ol>
            </div>
            
            <div class="sop-card">
                <h3>🍳 Silog Protocol</h3>
                <ol>
                    <li><strong>Sinangag:</strong> Brown minced garlic. High heat toss with day-old rice + salt + secret sugar pinch.</li>
                    <li><strong>Itlog:</strong> Sunny-side up (Malasado) by default. Crispy edges, runny yolk.</li>
                    <li><strong>Ulam:</strong> Pan-fry protein to caramelization. Drain oil.</li>
                    <li><strong>Assembly:</strong> Rice cup mold. Egg on top/side. Protein side. Atchara garnish.</li>
                </ol>
            </div>
        </div>

        <div class="divider"></div>

        <h2>6.4 Inventory Matrix</h2>
        <p>Critical par levels to ensure 0% stockouts during peak shifts.</p>
        
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>CATEGORY</th>
                        <th>ITEM</th>
                        <th>UNIT</th>
                        <th>PAR LEVEL</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><span class="tag grain">Grains</span></td>
                        <td><strong>Jasmine Rice</strong></td>
                        <td>25kg Sack</td>
                        <td>2 Sacks</td>
                    </tr>
                    <tr>
                        <td><span class="tag grain">Grains</span></td>
                        <td><strong>Glutinous Rice</strong></td>
                        <td>25kg Sack</td>
                        <td>1 Sack</td>
                    </tr>
                    <tr class="highlight-row">
                        <td><span class="tag protein">Protein</span></td>
                        <td><strong>Eggs (CRITICAL)</strong></td>
                        <td>Tray (30s)</td>
                        <td>10 Trays</td>
                    </tr>
                    <tr>
                        <td><span class="tag protein">Protein</span></td>
                        <td><strong>Marinated Tapa</strong></td>
                        <td>Kg</td>
                        <td>10 kg</td>
                    </tr>
                     <tr>
                        <td><span class="tag essential">Essential</span></td>
                        <td><strong>Aromatics Mix</strong></td>
                        <td>Kg</td>
                        <td>2 kg each</td>
                    </tr>
                      <tr>
                        <td><span class="tag essential">Essential</span></td>
                        <td><strong>Oil & Condiments</strong></td>
                        <td>Gallon</td>
                        <td>3 Tins / 2 Gals</td>
                    </tr>
                     <tr>
                        <td><span class="tag pack">Packaging</span></td>
                        <td><strong>Bowls & Utensils</strong></td>
                        <td>Pack (100s)</td>
                        <td>10 Packs</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="divider"></div>

        <h2>6.5 Supply Chain & Sourcing</h2>
        <div class="highlight-box">
             <h3>Strategic Sourcing</h3>
             <ul>
                 <li><strong>Rice Strategy:</strong> Do not buy from groceries. Partner with a local "Bigasan" or wholesaler in the Tagbilaran Public Market for 25kg sacks.
                    <br><em>Trigger: Re-order when stock hits 1.5 sacks.</em>
                 </li>
                 <li><strong>Meat Sourcing (Fresh):</strong> Cogon or Dao Market (Early morning run: 5:00 AM) for best prices (Pork/Chicken).</li>
                 <li><strong>Processed Meat:</strong> Direct from distributor (e.g., CDO/Purefoods distributor in Bohol) or bulk buying at Alturas/BQ when on sale.</li>
             </ul>
             
             <h3>LPG Logistics</h3>
             <ul>
                 <li><strong>Setup:</strong> 1 Active Tank + 1 Standby Tank on-site.</li>
                 <li><strong>Protocol:</strong> When Active Tank empties and is swapped to Standby, <strong>immediately</strong> order a replacement. Never operate without a full standby tank.</li>
             </ul>
        </div>
        <div class="divider"></div>

        <h2>6.6 Waste Management Protocols</h2>
        <div class="grid-2col">
            <div class="warning-box">
                <h3>Grease Trap (The 50% Rule)</h3>
                <ul>
                    <li>Do not pour oil down the sink. Scrape plates into the trash bin first.</li>
                    <li><strong>Cleaning:</strong> Kitchen Helper must scoop out solid grease/sludge from the trap <strong>daily</strong> at closing.</li>
                    <li><strong>Disposal:</strong> Solid grease goes into a double-bagged trash bag, not the drain.</li>
                </ul>
            </div>
            <div class="info-box">
                <h3>Spoilage & Leftovers</h3>
                <ul>
                    <li><strong>Lugaw:</strong> Cannot be reused. Any leftover Lugaw at closing is weighed, recorded in the "Wastage Log," and discarded.</li>
                    <li><strong>Rice:</strong> Leftover steamed rice is cooled and stored for "Sinangag" the next day.</li>
                    <li><strong>Audit:</strong> If wastage exceeds 5% of production for 3 consecutive days, the Head Cook must adjust prep par levels.</li>
                </ul>
            </div>
        </div>
        <div class="divider"></div>

        <h2>6.7 Cash & Remittance Protocol (Manual System)</h2>
        <p>Since there is no POS yet, we rely on a strict manual ticketing and remittance process.</p>
        
        <div class="highlight-box">
            <h3>The Workflow</h3>
            <ol>
                <li><strong>The Ticketing System:</strong> Use a Duplicate Carbon Receipt Booklet.
                    <ul>
                        <li><em>White Copy:</em> Customer.</li>
                        <li><em>Pink Copy:</em> Spindle (Kitchen/Cashier File).</li>
                    </ul>
                </li>
                <li><strong>The Change Fund:</strong> Start every day with <strong>₱1,000</strong> in small bills (20s, 50s, 100s) and coins. This is NOT revenue.</li>
            </ol>
            
            <h3>End-of-Shift Remittance</h3>
            <ol start="3">
                <li>Count Total Cash in Box.</li>
                <li>Subtract Change Fund (₱1,000) = <strong>Net Sales</strong>.</li>
                <li>Match Net Sales vs. Total of Pink Receipt Copies.</li>
                <li><strong>Discrepancy Rule:</strong> Shortages are deducted from the Cashier's tips/salary. Overages are declared as sales.</li>
                <li><strong>Turnover:</strong> Cash is placed in the <strong>Drop Box</strong> or remitted to <strong>Owner/Admin</strong> the following morning.</li>
            </ol>
        </div>


        <div class="divider"></div>

        <h2>6.8 Financial Ops & Compliance</h2>
        <p>Strict protocols for money handling, safety, and hygiene logistics.</p>

        <div class="layout-grid">
            <div class="zone">
                <h4>💧 Clean Water Protocol</h4>
                <p><strong>Critical Rule:</strong> NEVER cook Lugaw or Steam Rice with tap water.</p>
                <ul>
                     <li><strong>Source:</strong> Subscription with local refilling station ("Blue Jug").</li>
                     <li><strong>Volume:</strong> 2-3 Jugs/day (Cooking + Unli Drinks).</li>
                     <li><strong>Cost:</strong> ~₱25/jug (Add ₱1,500/mo to OPEX).</li>
                </ul>
            </div>
             <div class="zone dark">
                <span class="zone-badge hot">MANDATORY</span>
                <h4>🔥 Fire Safety (FSIC)</h4>
                <p>Required for Mayor's Permit.</p>
                <ul>
                     <li><strong>Requirement:</strong> 10lb ABC Dry Chemical Extinguisher (Red).</li>
                     <li><strong>Placement:</strong> Mounting hook visible near the exit.</li>
                     <li><strong>Security:</strong> Dummy CCTV Camera + Drop Box for cash safety.</li>
                </ul>
            </div>
            <div class="zone">
                <h4>💳 Cashless Payment</h4>
                <p>Targeting Students/BPO (50% adoption).</p>
                <ul>
                     <li><strong>Setup:</strong> Laminated GCash/Maya QR Standee.</li>
                     <li><strong>Rule:</strong> "Payment First." Staff must view confirmation screen. No screenshots allowed.</li>
                </ul>
            </div>
             <div class="zone">
                <h4>🪙 The "Barya" Fund</h4>
                <p><strong>Problem:</strong> High volume of ₱85/₱99 transactions.</p>
                <ul>
                     <li><strong>Protocol:</strong> Secure ₱1,000 worth of coins (₱1, ₱5, ₱10) before Opening Day.</li>
                     <li><strong>Refill:</strong> Weekly bank exchange via Admin.</li>
                </ul>
            </div>
        </div>

        <div class="divider"></div>

        <h2>6.9 Detailed Daily SOPs (Manual)</h2>
        <p>Execution protocols for the manual operating system.</p>

        <div class="sop-container vertical">
            <!-- SOP 1 -->
            <div class="sop-card detailed">
                <h3>📜 SOP 1: Inventory Management</h3>
                <p><strong>Objective:</strong> Never run out of "Winners" and prevent theft.</p>
                <ol>
                    <li><strong>FIFO Rule:</strong> New stock goes BEHIND old stock. Always use oldest first.</li>
                    <li><strong>Daily Par Level Check (1 Hr before Open):</strong> 
                        <ul>
                            <li>Eggs: 10 Trays</li>
                            <li>Rice (Jasmine): 2 Sacks</li>
                            <li>Rice (Malagkit): 1 Sack</li>
                            <li>LPG: 1 Active + 1 Standby</li>
                            <li>Takeout Boxes: 50 pcs</li>
                            <li><em>Action:</em> If below Par, alert Manager immediately.</li>
                        </ul>
                    </li>
                    <li><strong>End-of-Day Count:</strong> 
                        <ul>
                            <li>Formula: <code>Beginning + Purchases - Sale Receipts = Ending Stock</code>.</li>
                            <li>Discrepancies are recorded as "Loss" (Charageable to staff if negligence).</li>
                        </ul>
                    </li>
                </ol>
                
                <div class="freezer-map">
                    <h4>❄️ The 4-Zone Freezer Rule</h4>
                    <p class="warning-text">CRITICAL: Do not just throw bags in the freezer. Use 4 plastic baskets/dividers:</p>
                    <div class="zone-grid">
                        <div class="freezer-zone zone-1">
                            <span class="zone-label">ZONE 1</span>
                            <strong>Top / Easy Access</strong>
                            <p>The "Winners" — Longga, Shanghai, Tapa. <em>These move fast.</em></p>
                        </div>
                        <div class="freezer-zone zone-2">
                            <span class="zone-label">ZONE 2</span>
                            <strong>Middle</strong>
                            <p>Volume Drivers — Hotdogs, Burgers, Tocino.</p>
                        </div>
                        <div class="freezer-zone zone-3">
                            <span class="zone-label">ZONE 3</span>
                            <strong>Bottom</strong>
                            <p>Raw Meat — Chicken/Pork cuts for Lugaw/Adobo.</p>
                        </div>
                        <div class="freezer-zone zone-4">
                            <span class="zone-label">ZONE 4</span>
                            <strong>Side / Separate</strong>
                            <p>Seafood — Bangus. <em class="warning-text">MUST be separated to prevent fishy smell.</em></p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SOP 2 -->
            <div class="sop-card detailed">
                <h3>🥣 SOP 2: Lugaw Operations</h3>
                <p><strong>Objective:</strong> Consistent texture, zero scorching.</p>
                <ol>
                    <li><strong>The 1:6 Ratio:</strong> 1 Cup Rice Mix : 6 Cups Liquid.</li>
                    <li><strong>Prep:</strong> Sauté ginger/onion/garlic. Toast rice mix (1 min). Add water/broth. Boil then Simmer.</li>
                    <li><strong>Maintenance:</strong> Stir every 15-20 mins. PREVENT SCORCHING ("Tutong" smell = Total Wastage).</li>
                    <li><strong>Consistency Fix:</strong> If too thick, add hot broth. NEVER use cold tap water.</li>
                    <li><strong>Unli-Promo Rule:</strong> Refill plain Lugaw/Broth ONLY. Toppings are extra.</li>
                </ol>
            </div>

            <!-- SOP 3 -->
            <div class="sop-card detailed">
                <h3>🗑️ SOP 3: Spoilage & Wastage</h3>
                <p><strong>Objective:</strong> Track every peso thrown away.</p>
                <ol>
                    <li><strong>Definitions:</strong>
                        <ul>
                            <li><em>Spoilage:</em> Raw ingredients went bad.</li>
                            <li><em>Wastage:</em> Cooked food thrown away (burnt, spilled, leftovers).</li>
                        </ul>
                    </li>
                    <li><strong>The Logbook:</strong> Record Date, Item, Weight, Reason, Signature.</li>
                    <li><strong>The 5% Rule:</strong> Wastage > 5% for 3 days requires written explanation.</li>
                    <li><strong>Grease Trap:</strong> NO OIL IN SINK. Scrape plates to trash. Scoop sludge nightly.</li>
                </ol>
            </div>

            <!-- SOP 4 -->
            <div class="sop-card detailed">
                <h3>❄️ SOP 4: Leftovers "Save or Toss"</h3>
                <table class="simple-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Action</th>
                            <th>Procedure</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Steamed Rice</strong></td>
                            <td><span class="tag save">SAVE</span></td>
                            <td>Cool down. Refrigerate. Use for Sinangag next day.</td>
                        </tr>
                        <tr>
                            <td><strong>Lugaw</strong></td>
                            <td><span class="tag toss">TOSS</span></td>
                            <td>Cannot be reheated. Discard and record.</td>
                        </tr>
                        <tr>
                            <td><strong>Fried Viands</strong></td>
                            <td><span class="tag save">SAVE</span></td>
                            <td>Cool. Freeze/Chill. Re-fry briefly.</td>
                        </tr>
                        <tr>
                            <td><strong>Sunny Side Eggs</strong></td>
                            <td><span class="tag staff">STAFF</span></td>
                            <td>Staff meal allowance or discard.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- SOP 5 -->
            <div class="sop-card detailed critical">
                <h3>📦 SOP 5: Freezer Repacking (The "Grab-and-Go" System)</h3>
                <p><strong>Objective:</strong> Zero weighing during service. Inventory = "counting bags" not "weighing kilos."</p>
                <p class="warning-text">⚡ This is the SINGLE MOST EFFECTIVE operational change. In a 3x3m kitchen, you cannot afford to use a weighing scale during service hours.</p>
                
                <h4>1. The "Delivery Day" Rule</h4>
                <p>Raw meat deliveries (Tapa, Tocino, Chicken) must be processed <strong>IMMEDIATELY</strong> upon arrival. Never put a bulk 1kg bag straight into the freezer.</p>
                
                <h4>2. Portioning Protocol (The "Ice Candy" Method)</h4>
                <p>Use cheap, small plastic bags (ice candy size or sandwich size) to create single-serving portions.</p>
                
                <div class="portion-grid">
                    <div class="portion-card">
                        <h5>🥩 Loose Meats</h5>
                        <p class="portion-label">Tapa, Tocino, Bagnet, Chicken Cuts</p>
                        <ol>
                            <li><strong>Weigh</strong> exact serving size (e.g., 100g for Tapa)</li>
                            <li><strong>Bag</strong> in small plastic. Flat pack (press air out)</li>
                            <li><strong>Tie</strong> or fold shut</li>
                        </ol>
                        <p class="result"><strong>Result:</strong> 1 Bag = 1 Order. Cook grabs ONE bag.</p>
                    </div>
                    <div class="portion-card">
                        <h5>🌭 Sticky Items</h5>
                        <p class="portion-label">Longganisa, Shanghai</p>
                        <ul>
                            <li>Do NOT freeze in a clump</li>
                            <li>Lay flat on tray with wax paper between layers</li>
                            <li>Freeze THEN bag</li>
                            <li><em>Prevents fusing into a rock-hard ball</em></li>
                        </ul>
                    </div>
                    <div class="portion-card">
                        <h5>🍔 Counting Items</h5>
                        <p class="portion-label">Hotdogs, Burger Patties</p>
                        <ul>
                            <li>Repack into sets of <strong>5 or 10</strong></li>
                            <li>Do NOT leave original packaging open (causes freezer burn)</li>
                        </ul>
                    </div>
                </div>

                <h4>3. The "Slacking" Procedure (Thawing for Speed)</h4>
                <p>Cooking rock-hard frozen Tapa = <strong>8 minutes</strong>. Semi-thawed = <strong>3 minutes</strong>.</p>
                <div class="info-callout">
                    <strong>⏰ The 24-Hour Rule:</strong> Before closing, check par level for tomorrow. Move required portion bags from <strong>Freezer → Chiller/Ref</strong>.
                    <br><em>Example: Expect 20 Tapsilogs tomorrow? Move 20 portion bags to chiller tonight. Ready to fry instantly in the morning.</em>
                </div>
            </div>

            <!-- SOP 6 -->
            <div class="sop-card detailed">
                <h3>🧽 SOP 6: Dish & Sanitation (The "Anti-Sebo" Protocol)</h3>
                <p><strong>Objective:</strong> Silog plates are extremely oily (<em>sebo</em>). If not washed correctly, they feel greasy even when dry. This SOP protects your plumbing and ensures customer satisfaction.</p>
                
                <h4>1. The "Grease Separation" Rule (CRITICAL)</h4>
                <p class="warning-text">⚠️ NEVER rinse a plate directly into the sink.</p>
                <ol>
                    <li><strong>SCRAPE:</strong> Use rubber spatula to scrape ALL leftovers (rice, bones) and ALL visible oil/sauce into Trash Bin.</li>
                    <li><strong>WIPE:</strong> If very oily (Sisig, Tapa), wipe with used paper towel BEFORE touching water.</li>
                </ol>
                <p><em>Why? Prevents grease trap filling in 2 days and pipe clogs.</em></p>

                <h4>2. The 3-Basin Method (Modified for Small Space)</h4>
                <p>If you only have one sink, use two plastic basins (<em>palanggana</em>) to simulate a 3-step process.</p>
                
                <div class="basin-flow">
                    <div class="basin-step">
                        <span class="basin-num">1</span>
                        <strong>Basin 1: SOAK (Degreasing)</strong>
                        <p>Water + Dishwashing Liquid + <strong>Degreaser</strong> (or Calamansi/Vinegar). Soak 2+ minutes.</p>
                    </div>
                    <div class="basin-step">
                        <span class="basin-num">2</span>
                        <strong>THE SCRUB</strong>
                        <p><strong>Sponge Coding:</strong><br>
                        🟨 YELLOW sponge = Oily plates/bowls<br>
                        🟦 BLUE sponge = Glasses/cups ONLY<br>
                        <em>Never mix or water tastes like pork fat!</em></p>
                    </div>
                    <div class="basin-step">
                        <span class="basin-num">3</span>
                        <strong>Basin 2 / Sink: RINSE</strong>
                        <p>Running water rinse. <strong>"Squeak Test"</strong>: If thumb slides = still oily. If squeaks = clean.</p>
                    </div>
                    <div class="basin-step">
                        <span class="basin-num">4</span>
                        <strong>AIR DRY</strong>
                        <p>Rack dry only. Do NOT towel dry (towels spread bacteria).</p>
                    </div>
                </div>

                <h4>3. The "Glass First" Rule</h4>
                <p>Always wash in this order (cleanest to oiliest):</p>
                <ol class="wash-order">
                    <li>Glasses/Cups</li>
                    <li>Spoons/Forks</li>
                    <li>Lugaw Bowls</li>
                    <li>Silog Plates (Most oily)</li>
                    <li>Cookware (Pans/Pots)</li>
                </ol>

                <h4>4. Closing Shift: The Grease Trap</h4>
                <p><strong>You own the building = plumbing repairs are YOUR expense.</strong></p>
                <ul>
                    <li><strong>Every Night:</strong> Open grease trap. Scoop top layer of solid oil ("sludge") into double-bagged trash.</li>
                    <li class="warning-text"><strong>NEVER</strong> flush sludge down drain or toilet.</li>
                </ul>
            </div>

            <!-- SOP 7 -->
            <div class="sop-card detailed">
                <h3>🚶 SOP 7: UB Foot Patrol (Walking Delivery)</h3>
                <p><strong>Objective:</strong> Zero-cost logistical advantage. Beat FoodPanda with <strong>Zero Delivery Fee</strong> and <strong>Zero Gas Cost</strong> by maximizing proximity to University of Bohol (UB).</p>

                <h4>1. The Strategy: "Drop Points" (Not Room Service)</h4>
                <p>Schools don't allow outsiders to wander hallways. Establish 3 specific "Meet-Up Spots":</p>
                <ul class="equipment-list">
                    <li><strong>Drop Point A:</strong> Main Gate (Guardhouse)</li>
                    <li><strong>Drop Point B:</strong> Back Gate / Side Gate</li>
                    <li><strong>Drop Point C:</strong> Faculty Lounge/Admin Lobby (if allowed)</li>
                </ul>

                <h4>2. Operational Rules (Protect The Store)</h4>
                <div class="grid-2col">
                    <div class="info-box">
                        <strong>Rule #1: Buddy System</strong>
                        <p><strong>Min. 2 Orders</strong> to walk. Walking for one ₱45 Silog isn't worth the server leaving the store. Batching orders makes the trip profitable.</p>
                    </div>
                    <div class="info-box">
                        <strong>Rule #2: The 11:30 Run</strong>
                        <p>Depart strictly at <strong>11:30 AM</strong> and <strong>12:15 PM</strong>. Encourages students to <em>pre-order</em> by 11:00 AM.</p>
                    </div>
                </div>
                <p class="warning-text">⚠️ <strong>Payment First:</strong> GCash preferred. If COD, require "Exact Change Only" to avoid coin purse hassle at the gate.</p>

                <h4>3. Packaging: The "Anti-Tapon Seal"</h4>
                <p>Walking is bouncy. Protect the product.</p>
                <div class="portion-grid">
                    <div class="portion-card">
                        <h5>🍱 Silog</h5>
                        <p class="portion-label">Standard Box</p>
                        <p>Stack carefully in plastic bag. Stable.</p>
                    </div>
                    <div class="portion-card critical">
                        <h5>🥣 Lugaw (RISK)</h5>
                        <p class="portion-label">Double Knot</p>
                        <p>If not separating broth: Put bowl inside clear 8x11 bag. <strong>Tie tight</strong> before putting in carrier bag.</p>
                    </div>
                </div>

                <h4>4. Marketing & Contingency</h4>
                <p><strong>Who watches the store?</strong></p>
                <ul>
                    <li><strong>Scenario A:</strong> Cook watches counter (Slows kitchen).</li>
                    <li><strong>Scenario B:</strong> Owner covers the shift.</li>
                    <li><strong>Scenario C (Best):</strong> <strong>Student Runner.</strong> Give a trusted student a FREE MEAL to pickup & distribute 5+ orders.</li>
                </ul>

                <div class="highlight-box" style="margin-top: 1.5rem; padding: 1.5rem;">
                    <strong>📢 MARKETING PITCH:</strong><br>
                    "Nasa UB ka ba? Stuck in class? <strong>WE WALK TO YOU.</strong><br>
                    ✅ No Delivery Fee. ✅ No Min Amount (just 2 orders). ✅ Faster than Motor."
                </div>
            </div>
        </div>
    </article>
</section>

<style>
	:global(body) { background-color: #f8fafc; font-family: 'Inter', sans-serif; color: #334155; }
    .doc-page { max-width: 800px; margin: 0 auto; padding: 3rem 2rem; background: white; min-height: 100vh; }

    
    /* HEADER */
    .doc-header h1 {
        font-size: 5rem;
        line-height: 0.9;
        margin-bottom: 4rem;
        color: #0f172a;
    }
    .highlight { color: white; background: #0f172a; padding: 0 1rem; }
    @media(max-width:600px) { .doc-header h1 { font-size: 3.5rem; }}

    h2 { margin-top: 2.5rem; color: #1e293b; font-size: 1.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; }
    h3 { margin-top: 1.5rem; color: #334155; font-size: 1.125rem; }
    h4 { margin-top: 0.5rem; color: #475569; font-size: 1rem; font-weight: 600; }
    
    p, li { line-height: 1.6; color: #475569; margin-bottom: 0.75rem; }
    strong { color: #0f172a; }

    .layout-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-top: 1rem; }
    .zone { background: #f8fafc; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0; }
    .zone ul { list-style-type: disc; padding-left: 1.25rem; margin: 0.5rem 0 0 0; }
    
    .sop-container { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .sop-container.vertical { grid-template-columns: 1fr; }
    .sop-card { background: #f0f9ff; padding: 1.5rem; border-radius: 8px; border: 1px solid #bae6fd; }
    .sop-card.detailed { background: #fff; border: 1px solid #cbd5e1; box-shadow: 4px 4px 0 #cbd5e1; }
    .sop-card h3 { margin-top: 0; color: #0284c7; font-size: 1.25rem; }
    .sop-card.detailed h3 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; margin-bottom: 1rem; }

    .tag { font-size: 0.75rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; color: white; }
    .tag.save { background: #22c55e; }
    .tag.toss { background: #ef4444; }
    .tag.staff { background: #f59e0b; }
    .tag.grain { background: #f59e0b; }
    .tag.protein { background: #ef4444; }
    .tag.essential { background: #3b82f6; }
    .tag.pack { background: #64748b; }
    
    .simple-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    .simple-table th { text-align: left; background: #f1f5f9; padding: 0.5rem; font-size: 0.85rem; color: #64748b; }
    .simple-table td { border-bottom: 1px solid #e2e8f0; padding: 0.5rem; font-size: 0.95rem; }
    
    .equipment-list { list-style-type: disc; padding-left: 1.5rem; margin-top: 1rem; }

    /* Removed unused .sop-section selectors */
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.95rem; }
    th { background: #f1f5f9; padding: 0.75rem; font-weight: 600; color: #334155; border-bottom: 2px solid #e2e8f0; }
    td { padding: 0.75rem; border-bottom: 1px solid #e2e8f0; color: #475569; }
    tr:last-child td { border-bottom: none; }

    .grid-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
    @media (max-width: 650px) { .grid-2col { grid-template-columns: 1fr; } }
    
    .warning-box { background: #fff7ed; padding: 1.5rem; border: 1px solid #fdba74; border-radius: 8px; }
    .warning-box h3 { color: #c2410c; margin-top: 0; }
    
    .info-box { background: #eff6ff; padding: 1.5rem; border: 1px solid #bfdbfe; border-radius: 8px; }
    .info-box h3 { color: #1d4ed8; margin-top: 0; }
    
    .highlight-box { border: 2px solid #0f172a; padding: 2rem; background: white; box-shadow: 6px 6px 0px #f97316; margin: 2rem 0; }
    .divider { height: 2px; background: #e4e4e7; margin: 3rem 0; }

    /* Freezer Zone Map */
    .freezer-map { margin-top: 1.5rem; padding: 1rem; background: #f0f9ff; border-radius: 8px; border: 2px dashed #0284c7; }
    .freezer-map h4 { margin: 0 0 0.5rem 0; color: #0369a1; }
    .zone-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 1rem; }
    @media (max-width: 500px) { .zone-grid { grid-template-columns: 1fr; } }
    .freezer-zone { padding: 0.75rem; border-radius: 6px; border: 1px solid; }
    .freezer-zone strong { display: block; margin-bottom: 0.25rem; font-size: 0.9rem; }
    .freezer-zone p { margin: 0; font-size: 0.85rem; }
    .zone-label { font-size: 0.65rem; font-weight: 800; padding: 2px 5px; border-radius: 3px; display: inline-block; margin-bottom: 0.5rem; color: white; }
    .zone-1 { background: #dcfce7; border-color: #22c55e; }
    .zone-1 .zone-label { background: #22c55e; }
    .zone-2 { background: #dbeafe; border-color: #3b82f6; }
    .zone-2 .zone-label { background: #3b82f6; }
    .zone-3 { background: #fef3c7; border-color: #f59e0b; }
    .zone-3 .zone-label { background: #f59e0b; }
    .zone-4 { background: #fee2e2; border-color: #ef4444; }
    .zone-4 .zone-label { background: #ef4444; }
    .warning-text { color: #dc2626; font-weight: 600; }

    /* SOP 5 & 6 Styles */
    .sop-card.critical { border: 2px solid #f59e0b; box-shadow: 4px 4px 0 #fcd34d; background: #fffbeb; }
    .sop-card.critical h3 { color: #b45309; }
    
    .portion-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin: 1rem 0; }
    .portion-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; }
    .portion-card h5 { margin: 0 0 0.5rem 0; font-size: 1rem; color: #1e293b; }
    .portion-label { font-size: 0.8rem; color: #64748b; margin-bottom: 0.75rem; font-style: italic; }
    .portion-card ol, .portion-card ul { margin: 0; padding-left: 1.25rem; font-size: 0.9rem; }
    .portion-card li { margin-bottom: 0.35rem; }
    .portion-card .result { margin-top: 0.75rem; padding: 0.5rem; background: #dcfce7; border-radius: 4px; font-size: 0.85rem; color: #166534; }
    
    .info-callout { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 1rem; margin: 1rem 0; border-radius: 0 8px 8px 0; font-size: 0.9rem; }
    .info-callout strong { color: #1e40af; }
    
    .basin-flow { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; margin: 1rem 0; }
    .basin-step { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; position: relative; }
    .basin-num { position: absolute; top: -0.5rem; left: -0.5rem; background: #0f172a; color: white; width: 1.5rem; height: 1.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; }
    .basin-step strong { display: block; margin-bottom: 0.5rem; color: #1e293b; font-size: 0.9rem; }
    .basin-step p { margin: 0; font-size: 0.85rem; color: #475569; }
    
    .wash-order { background: #f1f5f9; padding: 1rem 1rem 1rem 2.5rem; border-radius: 8px; margin: 0.5rem 0; }
    .wash-order li { margin-bottom: 0.35rem; font-size: 0.9rem; }
    .wash-order li:last-child { font-weight: 700; color: #dc2626; }
</style>
