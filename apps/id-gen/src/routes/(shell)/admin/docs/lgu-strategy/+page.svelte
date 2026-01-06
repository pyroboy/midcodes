<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
</script>

<svelte:head>
  <title>LGU Market Penetration Strategy | Admin Docs</title>
</svelte:head>

<div class="container mx-auto py-8 max-w-5xl">
  <header class="mb-8">
    <h1 class="text-4xl font-bold mb-2">LGU MARKET PENETRATION STRATEGY</h1>
    <p class="text-muted-foreground">PWD, Senior Citizen & Barangay ID Cards | Sales Playbook & Premium Solutions</p>
    <div class="inline-block mt-3 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-semibold">
      Strategic Document | January 2026
    </div>
  </header>

  <!-- EXECUTIVE SUMMARY -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">1. Executive Summary</h2>
    <div class="grid md:grid-cols-3 gap-4">
      <Card class="border-l-4 border-l-blue-500">
        <CardContent class="pt-4">
          <p class="text-3xl font-bold text-blue-600">46M+</p>
          <p class="text-sm text-muted-foreground">Senior Citizens & PWDs in the Philippines (projected 2026)</p>
        </CardContent>
      </Card>
      <Card class="border-l-4 border-l-green-500">
        <CardContent class="pt-4">
          <p class="text-3xl font-bold text-green-600">42,000+</p>
          <p class="text-sm text-muted-foreground">Barangays requiring ID systems</p>
        </CardContent>
      </Card>
      <Card class="border-l-4 border-l-purple-500">
        <CardContent class="pt-4">
          <p class="text-3xl font-bold text-purple-600">₱150-300</p>
          <p class="text-sm text-muted-foreground">Price point per premium verified ID</p>
        </CardContent>
      </Card>
    </div>
    <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
      <h3 class="font-bold mb-2">The Opportunity</h3>
      <p class="text-sm">LGUs are mandated to issue PWD and Senior Citizen IDs but lack secure, verifiable, durable solutions. Most use flimsy laminated paper that fades within months. We provide premium PVC cards with QR/NFC verification that solve counterfeiting and durability issues—a clear upsell from their current ₱20-50 budget cards.</p>
    </div>
  </section>

  <!-- TARGET MARKETS -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">2. Target Markets</h2>
    <div class="grid md:grid-cols-3 gap-6">
      <Card>
        <CardHeader class="bg-purple-50 dark:bg-purple-900/20">
          <CardTitle class="flex items-center gap-2">
            <span>♿</span> PWD Cards
          </CardTitle>
        </CardHeader>
        <CardContent class="pt-4 text-sm">
          <p class="mb-3"><strong>Authority:</strong> NCDA (National Council on Disability Affairs)</p>
          <p class="mb-3"><strong>Mandated by:</strong> RA 7277 (Magna Carta for Disabled Persons)</p>
          <p class="mb-3"><strong>Benefits unlocked:</strong></p>
          <ul class="list-disc pl-4 space-y-1">
            <li>20% discount on medicines, food, transport</li>
            <li>VAT exemption</li>
            <li>Priority lanes</li>
          </ul>
          <div class="mt-4 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs">
            <strong>Pain Point:</strong> High counterfeiting rate. Establishments can't verify authenticity quickly.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="bg-amber-50 dark:bg-amber-900/20">
          <CardTitle class="flex items-center gap-2">
            <span>👴</span> Senior Citizen Cards
          </CardTitle>
        </CardHeader>
        <CardContent class="pt-4 text-sm">
          <p class="mb-3"><strong>Authority:</strong> OSCA (Office of Senior Citizens Affairs)</p>
          <p class="mb-3"><strong>Mandated by:</strong> RA 9994 (Expanded Senior Citizens Act)</p>
          <p class="mb-3"><strong>Benefits unlocked:</strong></p>
          <ul class="list-disc pl-4 space-y-1">
            <li>20% discount + 12% VAT exemption</li>
            <li>Free medical/dental services</li>
            <li>Priority boarding</li>
          </ul>
          <div class="mt-4 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs">
            <strong>Pain Point:</strong> Cards fade quickly. Senior citizens struggle with replacement process.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="bg-green-50 dark:bg-green-900/20">
          <CardTitle class="flex items-center gap-2">
            <span>🏘️</span> Barangay IDs
          </CardTitle>
        </CardHeader>
        <CardContent class="pt-4 text-sm">
          <p class="mb-3"><strong>Authority:</strong> Barangay Captain / LGU</p>
          <p class="mb-3"><strong>Use Cases:</strong></p>
          <ul class="list-disc pl-4 space-y-1">
            <li>Residency proof</li>
            <li>Voter registration support</li>
            <li>Ayuda/cash transfer verification</li>
            <li>Curfew/checkpoint compliance</li>
          </ul>
          <div class="mt-4 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs">
            <strong>Pain Point:</strong> No central database. Easy to fake. No way to track issued IDs.
          </div>
        </CardContent>
      </Card>
    </div>
  </section>

  <!-- THE SALES APPROACH -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">3. Sales Approach: Step-by-Step Playbook</h2>

    <div class="space-y-6">
      <!-- Step 1 -->
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Identify Entry Point (1-2 weeks)</CardTitle>
        </CardHeader>
        <CardContent class="text-sm">
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <h4 class="font-bold mb-2">🎯 Target Contacts</h4>
              <ul class="space-y-1">
                <li>• <strong>OSCA Head</strong> — Senior Citizen ID decisions</li>
                <li>• <strong>PDAO (PWD Affairs Office)</strong> — PWD ID decisions</li>
                <li>• <strong>Barangay Captain</strong> — Barangay-level IDs</li>
                <li>• <strong>Mayor's Office</strong> — Municipal-wide contracts</li>
                <li>• <strong>IT Department</strong> — Technical approval</li>
              </ul>
            </div>
            <div>
              <h4 class="font-bold mb-2">📞 Cold Approach Script</h4>
              <div class="p-3 bg-muted rounded text-xs italic">
                "Good morning po, I'm [Name] from Kanaya Identity Solutions. We specialize in durable, counterfeit-proof IDs for PWD and Senior Citizens—complete with QR verification. May I ask who handles your ID issuance program? We'd love to offer a free demo."
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Step 2 -->
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Discovery Meeting & Pain Point Mapping (30 mins)</CardTitle>
        </CardHeader>
        <CardContent class="text-sm">
          <h4 class="font-bold mb-2">🔍 Questions to Ask</h4>
          <ol class="list-decimal pl-4 space-y-2">
            <li>How do you currently produce IDs? (In-house lamination? Outsourced?)</li>
            <li>What's your annual volume? (PWDs, Seniors, Barangay residents)</li>
            <li>What's your current cost per ID?</li>
            <li>How do establishments verify the card is real? (None? Visual check?)</li>
            <li>How often do you receive complaints about faded/damaged cards?</li>
            <li>Have you encountered counterfeit IDs being used for discounts?</li>
          </ol>
          <div class="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded">
            <strong>🎯 Goal:</strong> Document their pain points. Use their own words in the proposal.
          </div>
        </CardContent>
      </Card>

      <!-- Step 3 -->
      <Card>
        <CardHeader>
          <CardTitle>Step 3: Live Demo & Sample Cards (30-45 mins)</CardTitle>
        </CardHeader>
        <CardContent class="text-sm">
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <h4 class="font-bold mb-2">📦 Demo Kit Contents</h4>
              <ul class="space-y-1">
                <li>• 5 sample cards (PWD, Senior, Barangay designs)</li>
                <li>• Phone with Kanaya verification app</li>
                <li>• UV flashlight (for UV security demo)</li>
                <li>• Competitor card comparison (faded laminated vs our PVC)</li>
              </ul>
            </div>
            <div>
              <h4 class="font-bold mb-2">🎬 Demo Flow</h4>
              <ol class="list-decimal pl-4 space-y-1">
                <li>Show competitor card (faded, peeling)</li>
                <li>Show our card (durable PVC, vibrant)</li>
                <li>Let them feel the difference</li>
                <li>Scan QR code → show verification page</li>
                <li>Tap NFC → instant data display</li>
                <li>UV flashlight → reveal hidden security mark</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Step 4 -->
      <Card>
        <CardHeader>
          <CardTitle>Step 4: Proposal & Pricing Presentation</CardTitle>
        </CardHeader>
        <CardContent class="text-sm">
          <h4 class="font-bold mb-2">💰 Pricing Tiers for LGU</h4>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b bg-muted/50">
                  <th class="text-left py-2 px-3">Package</th>
                  <th class="text-left py-2 px-3">Features</th>
                  <th class="text-right py-2 px-3">Price/Card</th>
                  <th class="text-left py-2 px-3">Best For</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b">
                  <td class="py-2 px-3 font-bold">Basic</td>
                  <td class="py-2 px-3">Laminated PVC + QR Code</td>
                  <td class="py-2 px-3 text-right">₱80-100</td>
                  <td class="py-2 px-3">Budget-conscious LGUs</td>
                </tr>
                <tr class="border-b bg-green-50 dark:bg-green-900/10">
                  <td class="py-2 px-3 font-bold">Standard ⭐</td>
                  <td class="py-2 px-3">Thermal PVC + QR + UV Security</td>
                  <td class="py-2 px-3 text-right">₱150-180</td>
                  <td class="py-2 px-3">Most municipalities</td>
                </tr>
                <tr class="border-b">
                  <td class="py-2 px-3 font-bold">Premium</td>
                  <td class="py-2 px-3">Thermal + QR + NFC + Hologram</td>
                  <td class="py-2 px-3 text-right">₱250-300</td>
                  <td class="py-2 px-3">Cities, fraud-prone areas</td>
                </tr>
                <tr class="border-b bg-purple-50 dark:bg-purple-900/10">
                  <td class="py-2 px-3 font-bold">Enterprise</td>
                  <td class="py-2 px-3">UV Print + NFC + Full System</td>
                  <td class="py-2 px-3 text-right">₱400+</td>
                  <td class="py-2 px-3">Provincial contracts</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
            <strong>💡 Upsell Strategy:</strong> Position Basic as "what they have now" and Standard as "the smart upgrade" with only ₱50-80 difference but dramatically better durability and security.
          </div>
        </CardContent>
      </Card>

      <!-- Step 5 -->
      <Card>
        <CardHeader>
          <CardTitle>Step 5: Pilot Program Offer</CardTitle>
        </CardHeader>
        <CardContent class="text-sm">
          <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h4 class="font-bold mb-2">🎁 Pilot Program Terms</h4>
            <ul class="space-y-2">
              <li>• <strong>Free 50 sample cards</strong> for initial rollout</li>
              <li>• <strong>No upfront cost</strong> — pay only after satisfaction</li>
              <li>• <strong>Free verification app access</strong> for 3 months</li>
              <li>• <strong>On-site encoding support</strong> for first batch</li>
            </ul>
            <p class="mt-3 text-xs text-muted-foreground">Condition: LGU commits to exclusive contract if pilot is successful.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  </section>

  <!-- VERIFICATION SYSTEM -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">4. Verification System: Solving Counterfeiting</h2>
    
    <div class="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader class="bg-blue-50 dark:bg-blue-900/20">
          <CardTitle>🔍 For Establishments (Merchants)</CardTitle>
        </CardHeader>
        <CardContent class="pt-4 text-sm">
          <h4 class="font-bold mb-2">Verification Methods:</h4>
          <ol class="list-decimal pl-4 space-y-2">
            <li>
              <strong>QR Code Scan</strong>
              <p class="text-muted-foreground">Any phone camera → opens verification page showing photo, name, ID#, status (ACTIVE/EXPIRED)</p>
            </li>
            <li>
              <strong>NFC Tap (Premium)</strong>
              <p class="text-muted-foreground">Tap on NFC-enabled phone → instant popup with encrypted data</p>
            </li>
            <li>
              <strong>UV Light Check</strong>
              <p class="text-muted-foreground">Hidden security mark visible only under blacklight</p>
            </li>
            <li>
              <strong>Hologram Visual</strong>
              <p class="text-muted-foreground">Tamper-evident overlay that can't be photocopied</p>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="bg-green-50 dark:bg-green-900/20">
          <CardTitle>🏛️ For LGU (Admin Portal)</CardTitle>
        </CardHeader>
        <CardContent class="pt-4 text-sm">
          <h4 class="font-bold mb-2">Admin Capabilities:</h4>
          <ul class="space-y-2">
            <li>
              <strong>• Central Database</strong>
              <p class="text-muted-foreground">All issued cards tracked with photo, ID#, issue date, expiry</p>
            </li>
            <li>
              <strong>• Real-time Deactivation</strong>
              <p class="text-muted-foreground">Lost/stolen cards can be instantly invalidated</p>
            </li>
            <li>
              <strong>• Usage Analytics</strong>
              <p class="text-muted-foreground">See where and when cards are being scanned</p>
            </li>
            <li>
              <strong>• Expiry Alerts</strong>
              <p class="text-muted-foreground">Automated reminders for renewal</p>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>

    <div class="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
      <h4 class="font-bold mb-2">⚠️ Anti-Fraud Talking Points</h4>
      <ul class="text-sm space-y-1">
        <li>• "Your current card can be photocopied in seconds. Ours cannot."</li>
        <li>• "Merchants have no way to verify. With our QR, they scan and confirm instantly."</li>
        <li>• "If a card is lost, you can deactivate it remotely—no wait for police report."</li>
        <li>• "Every scan is logged. You'll know exactly how often cards are being used."</li>
      </ul>
    </div>
  </section>

  <!-- DURABILITY & QUALITY -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">5. Durability & Premium Quality Solutions</h2>
    
    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-muted/50">
            <th class="text-left py-3 px-4">Feature</th>
            <th class="text-left py-3 px-4">Standard Laminated</th>
            <th class="text-left py-3 px-4">Kanaya PVC Card</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">Material</td>
            <td class="py-3 px-4 text-red-600">Paper + plastic pouch</td>
            <td class="py-3 px-4 text-green-600">Rigid PVC (CR80 standard)</td>
          </tr>
          <tr class="border-b bg-muted/30">
            <td class="py-3 px-4 font-bold">Lifespan</td>
            <td class="py-3 px-4 text-red-600">3-6 months before fading</td>
            <td class="py-3 px-4 text-green-600">3-5 years (ATM-grade)</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">Water Resistance</td>
            <td class="py-3 px-4 text-red-600">Seams leak, paper warps</td>
            <td class="py-3 px-4 text-green-600">Fully waterproof</td>
          </tr>
          <tr class="border-b bg-muted/30">
            <td class="py-3 px-4 font-bold">Bend Test</td>
            <td class="py-3 px-4 text-red-600">Creases permanently</td>
            <td class="py-3 px-4 text-green-600">Springs back, no damage</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">Photo Quality</td>
            <td class="py-3 px-4 text-red-600">Fades to unrecognizable</td>
            <td class="py-3 px-4 text-green-600">UV-protected, color-stable</td>
          </tr>
          <tr class="border-b bg-muted/30">
            <td class="py-3 px-4 font-bold">Security</td>
            <td class="py-3 px-4 text-red-600">Easy to photocopy</td>
            <td class="py-3 px-4 text-green-600">QR/NFC + UV + Hologram</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="grid md:grid-cols-3 gap-4">
      <Card class="border-green-300">
        <CardContent class="pt-4 text-center">
          <p class="text-4xl mb-2">💧</p>
          <p class="font-bold">Waterproof</p>
          <p class="text-sm text-muted-foreground">Can be washed, won't warp</p>
        </CardContent>
      </Card>
      <Card class="border-green-300">
        <CardContent class="pt-4 text-center">
          <p class="text-4xl mb-2">☀️</p>
          <p class="font-bold">UV Resistant</p>
          <p class="text-sm text-muted-foreground">No fading from sun exposure</p>
        </CardContent>
      </Card>
      <Card class="border-green-300">
        <CardContent class="pt-4 text-center">
          <p class="text-4xl mb-2">🔒</p>
          <p class="font-bold">Tamper-Proof</p>
          <p class="text-sm text-muted-foreground">Hologram shows if altered</p>
        </CardContent>
      </Card>
    </div>
  </section>

  <!-- OBJECTION HANDLING -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">6. Objection Handling</h2>
    <div class="space-y-4">
      <Card>
        <CardContent class="pt-4">
          <p class="font-bold text-red-600 mb-2">"It's too expensive. We only have ₱50/card budget."</p>
          <p class="text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded">
            <strong>Response:</strong> "Your current cards need replacement every 6 months—that's ₱100/year per person. Ours last 5 years, costing ₱30/year. Plus, you eliminate counterfeiting losses. It's actually cheaper long-term."
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-4">
          <p class="font-bold text-red-600 mb-2">"We already have a supplier."</p>
          <p class="text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded">
            <strong>Response:</strong> "Can they verify cards remotely? Can you deactivate a lost card instantly? We're not just a supplier—we're a verification platform. Let us show you the demo."
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-4">
          <p class="font-bold text-red-600 mb-2">"We need bidding/procurement process."</p>
          <p class="text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded">
            <strong>Response:</strong> "Understood. We can provide a pilot program first—no cost, just evaluation. If it works, we'll be ready for your PhilGEPS posting. We're accredited and compliant."
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-4">
          <p class="font-bold text-red-600 mb-2">"Our senior citizens can't use QR codes."</p>
          <p class="text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded">
            <strong>Response:</strong> "The senior doesn't need to scan—the merchant does. It takes 2 seconds. We also offer NFC tap which is even faster. And the UV mark can be checked with a simple flashlight."
          </p>
        </CardContent>
      </Card>
    </div>
  </section>

  <!-- ACTION PLAN -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">7. 90-Day Action Plan</h2>
    <div class="space-y-4">
      <div class="flex gap-4 items-start">
        <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center font-bold text-blue-600 flex-shrink-0">
          Days 1-30
        </div>
        <div class="flex-1">
          <h4 class="font-bold">Build Pipeline</h4>
          <ul class="text-sm text-muted-foreground">
            <li>• Identify 20 target LGUs within 50km radius</li>
            <li>• Cold call OSCA/PDAO offices</li>
            <li>• Schedule 10 discovery meetings</li>
            <li>• Prepare 100 sample cards (mixed designs)</li>
          </ul>
        </div>
      </div>
      <div class="flex gap-4 items-start">
        <div class="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center font-bold text-green-600 flex-shrink-0">
          Days 31-60
        </div>
        <div class="flex-1">
          <h4 class="font-bold">Close Pilots</h4>
          <ul class="text-sm text-muted-foreground">
            <li>• Convert 3 LGUs to pilot program</li>
            <li>• Deliver 50 free cards per pilot</li>
            <li>• Train their staff on verification app</li>
            <li>• Collect testimonials and photos</li>
          </ul>
        </div>
      </div>
      <div class="flex gap-4 items-start">
        <div class="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center font-bold text-purple-600 flex-shrink-0">
          Days 61-90
        </div>
        <div class="flex-1">
          <h4 class="font-bold">Scale & Contract</h4>
          <ul class="text-sm text-muted-foreground">
            <li>• Convert pilots to full contracts</li>
            <li>• Use success stories to pitch neighboring LGUs</li>
            <li>• Target provincial-level contracts</li>
            <li>• Prepare PhilGEPS accreditation if needed</li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <footer class="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
    <p>Document Status: STRATEGIC PLAYBOOK • Version 1.0</p>
    <p class="mt-2"><a href="/admin/docs" class="underline">← Back to Docs Hub</a></p>
  </footer>
</div>
