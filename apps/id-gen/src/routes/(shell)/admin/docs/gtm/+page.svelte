<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
</script>

<svelte:head>
  <title>Go-to-Market Plan | Kanaya Admin</title>
</svelte:head>

<div class="container mx-auto py-8 max-w-6xl">
  <header class="mb-8">
    <h1 class="text-4xl font-bold mb-2">GO-TO-MARKET PLAN</h1>
    <p class="text-muted-foreground">90-Day Launch Roadmap | Zero Capital to Recurring Revenue</p>
    <div class="inline-block mt-3 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold">
      Execution Plan | January 2026
    </div>
  </header>

  <!-- EXECUTIVE SUMMARY -->
  <section class="mb-10">
    <div class="p-6 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg">
      <h2 class="text-xl font-bold mb-4">📊 Revenue Targets Summary</h2>
      <div class="grid md:grid-cols-4 gap-4">
        <div class="text-center">
          <p class="text-3xl font-bold text-blue-600">₱100k+</p>
          <p class="text-sm text-muted-foreground">90-Day Revenue Target</p>
        </div>
        <div class="text-center">
          <p class="text-3xl font-bold text-green-600">5</p>
          <p class="text-sm text-muted-foreground">Pilot Clients</p>
        </div>
        <div class="text-center">
          <p class="text-3xl font-bold text-purple-600">3</p>
          <p class="text-sm text-muted-foreground">Full Contracts</p>
        </div>
        <div class="text-center">
          <p class="text-3xl font-bold text-amber-600">₱60k+</p>
          <p class="text-sm text-muted-foreground">Annual Recurring (ARR)</p>
        </div>
      </div>
    </div>
  </section>

  <!-- TARGET MARKET SEGMENTS -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">1. Target Market Segments</h2>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-muted/50">
            <th class="text-left py-3 px-4">Segment</th>
            <th class="text-left py-3 px-4">Primary Product</th>
            <th class="text-right py-3 px-4">Avg. Deal Size</th>
            <th class="text-right py-3 px-4">SaaS/User/Yr</th>
            <th class="text-left py-3 px-4">Priority</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b bg-amber-50 dark:bg-amber-900/10">
            <td class="py-3 px-4 font-bold">🎓 Schools</td>
            <td class="py-3 px-4">Student IDs + Attendance</td>
            <td class="py-3 px-4 text-right">₱50,000-150,000</td>
            <td class="py-3 px-4 text-right">₱10-20</td>
            <td class="py-3 px-4"><span class="px-2 py-1 bg-amber-200 dark:bg-amber-800 rounded text-xs font-bold">HIGH</span></td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">🏢 HR / Offices</td>
            <td class="py-3 px-4">Employee IDs + Time Tracking</td>
            <td class="py-3 px-4 text-right">₱25,000-80,000</td>
            <td class="py-3 px-4 text-right">₱25-50</td>
            <td class="py-3 px-4"><span class="px-2 py-1 bg-amber-200 dark:bg-amber-800 rounded text-xs font-bold">HIGH</span></td>
          </tr>
          <tr class="border-b bg-green-50 dark:bg-green-900/10">
            <td class="py-3 px-4 font-bold">💪 Gyms</td>
            <td class="py-3 px-4">Membership Cards + Check-in</td>
            <td class="py-3 px-4 text-right">₱20,000-40,000</td>
            <td class="py-3 px-4 text-right">₱15-30</td>
            <td class="py-3 px-4"><span class="px-2 py-1 bg-green-200 dark:bg-green-800 rounded text-xs font-bold">MEDIUM</span></td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">🏭 Construction</td>
            <td class="py-3 px-4">Worker IDs + Gate Access</td>
            <td class="py-3 px-4 text-right">₱30,000-100,000</td>
            <td class="py-3 px-4 text-right">₱18-35</td>
            <td class="py-3 px-4"><span class="px-2 py-1 bg-green-200 dark:bg-green-800 rounded text-xs font-bold">MEDIUM</span></td>
          </tr>
          <tr class="border-b bg-purple-50 dark:bg-purple-900/10">
            <td class="py-3 px-4 font-bold">🏛️ LGU / Gov</td>
            <td class="py-3 px-4">PWD/Senior/Barangay IDs</td>
            <td class="py-3 px-4 text-right">₱50,000-500,000</td>
            <td class="py-3 px-4 text-right">₱5-30</td>
            <td class="py-3 px-4"><span class="px-2 py-1 bg-blue-200 dark:bg-blue-800 rounded text-xs font-bold">LONG-TERM</span></td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">🎪 Events</td>
            <td class="py-3 px-4">Event Passes + Visitor Management</td>
            <td class="py-3 px-4 text-right">₱5,000-20,000</td>
            <td class="py-3 px-4 text-right">₱2-5/event</td>
            <td class="py-3 px-4"><span class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-bold">OPPORTUNISTIC</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- PHASE 1: FOUNDATION -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">2. Phase 1: Foundation (Days 1-30)</h2>
    <p class="text-muted-foreground mb-6">Goal: Build pipeline, secure first paying client, acquire production capability</p>
    
    <div class="grid md:grid-cols-3 gap-6 mb-6">
      <Card>
        <CardHeader class="bg-blue-50 dark:bg-blue-900/20">
          <CardTitle class="text-lg">🔍 Market Research</CardTitle>
        </CardHeader>
        <CardContent class="pt-4 text-sm">
          <ul class="space-y-2">
            <li class="flex items-center gap-2">
              <span class="text-green-500">✓</span> Identify 20 target clients within 50km
            </li>
            <li class="flex items-center gap-2">
              <span class="text-green-500">✓</span> Research OSCA/PDAO contacts per LGU
            </li>
            <li class="flex items-center gap-2">
              <span class="text-green-500">✓</span> Map competitor pricing in area
            </li>
            <li class="flex items-center gap-2">
              <span class="text-amber-500">○</span> Build prospect list by segment
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="bg-green-50 dark:bg-green-900/20">
          <CardTitle class="text-lg">📞 Outreach</CardTitle>
        </CardHeader>
        <CardContent class="pt-4 text-sm">
          <ul class="space-y-2">
            <li class="flex items-center gap-2">
              <span class="text-amber-500">○</span> Cold call 20 prospects
            </li>
            <li class="flex items-center gap-2">
              <span class="text-amber-500">○</span> Schedule 10 discovery meetings
            </li>
            <li class="flex items-center gap-2">
              <span class="text-amber-500">○</span> Conduct 5 demos with sample cards
            </li>
            <li class="flex items-center gap-2">
              <span class="text-red-500">○</span> Close 1 paying client (300+ IDs)
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="bg-purple-50 dark:bg-purple-900/20">
          <CardTitle class="text-lg">🛠️ Infrastructure</CardTitle>
        </CardHeader>
        <CardContent class="pt-4 text-sm">
          <ul class="space-y-2">
            <li class="flex items-center gap-2">
              <span class="text-green-500">✓</span> Kanaya app production-ready
            </li>
            <li class="flex items-center gap-2">
              <span class="text-amber-500">○</span> Prepare 100 sample cards
            </li>
            <li class="flex items-center gap-2">
              <span class="text-amber-500">○</span> Execute "The Flip" to get printer
            </li>
            <li class="flex items-center gap-2">
              <span class="text-amber-500">○</span> Set up outsourcing partner backup
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>

    <!-- The Flip Strategy Box -->
    <Card class="border-2 border-green-300 dark:border-green-700 mb-6">
      <CardHeader class="bg-green-50 dark:bg-green-900/20">
        <CardTitle>💰 "The Flip" Strategy - Zero Capital Printer Acquisition</CardTitle>
      </CardHeader>
      <CardContent class="pt-4">
        <div class="grid md:grid-cols-5 gap-4 text-center text-sm">
          <div class="p-3 bg-muted rounded-lg">
            <p class="font-bold text-lg">1</p>
            <p>Close deal: 300 IDs @ ₱120</p>
            <p class="text-muted-foreground">(Total: ₱36,000)</p>
          </div>
          <div class="p-3 bg-muted rounded-lg">
            <p class="font-bold text-lg">2</p>
            <p>Collect 50% downpayment</p>
            <p class="text-green-600 font-bold">₱18,000 cash</p>
          </div>
          <div class="p-3 bg-muted rounded-lg">
            <p class="font-bold text-lg">3</p>
            <p>Outsource first 100 cards</p>
            <p class="text-muted-foreground">(Bridge while waiting)</p>
          </div>
          <div class="p-3 bg-muted rounded-lg">
            <p class="font-bold text-lg">4</p>
            <p>Buy printer + supplies</p>
            <p class="text-muted-foreground">₱16k + ₱2k = ₱18k</p>
          </div>
          <div class="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <p class="font-bold text-lg">5</p>
            <p>Remaining ₱18k payment</p>
            <p class="text-green-600 font-bold">= Pure Profit</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- KPIs -->
    <h3 class="font-bold text-lg mb-3">Phase 1 Success Metrics</h3>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-muted/50">
            <th class="text-left py-2 px-4">KPI</th>
            <th class="text-right py-2 px-4">Target</th>
            <th class="text-right py-2 px-4">Current</th>
            <th class="text-left py-2 px-4">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b">
            <td class="py-2 px-4">Prospects Contacted</td>
            <td class="py-2 px-4 text-right">20</td>
            <td class="py-2 px-4 text-right">0</td>
            <td class="py-2 px-4"><span class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Not Started</span></td>
          </tr>
          <tr class="border-b">
            <td class="py-2 px-4">Discovery Meetings</td>
            <td class="py-2 px-4 text-right">10</td>
            <td class="py-2 px-4 text-right">0</td>
            <td class="py-2 px-4"><span class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Not Started</span></td>
          </tr>
          <tr class="border-b">
            <td class="py-2 px-4">Demos Conducted</td>
            <td class="py-2 px-4 text-right">5</td>
            <td class="py-2 px-4 text-right">0</td>
            <td class="py-2 px-4"><span class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Not Started</span></td>
          </tr>
          <tr class="border-b bg-green-50 dark:bg-green-900/10">
            <td class="py-2 px-4 font-bold">Paying Clients</td>
            <td class="py-2 px-4 text-right font-bold">1</td>
            <td class="py-2 px-4 text-right">0</td>
            <td class="py-2 px-4"><span class="px-2 py-1 bg-red-200 dark:bg-red-800 rounded text-xs">Critical</span></td>
          </tr>
          <tr class="border-b bg-green-50 dark:bg-green-900/10">
            <td class="py-2 px-4 font-bold">Revenue (Cash)</td>
            <td class="py-2 px-4 text-right font-bold">₱36,000</td>
            <td class="py-2 px-4 text-right">₱0</td>
            <td class="py-2 px-4"><span class="px-2 py-1 bg-red-200 dark:bg-red-800 rounded text-xs">Critical</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- PHASE 2: PILOT -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">3. Phase 2: Pilot & Validate (Days 31-60)</h2>
    <p class="text-muted-foreground mb-6">Goal: Convert 3 pilots, validate SaaS model, build case studies</p>
    
    <div class="grid md:grid-cols-2 gap-6 mb-6">
      <Card>
        <CardHeader class="bg-blue-50 dark:bg-blue-900/20">
          <CardTitle class="text-lg">🎯 Pilot Program Execution</CardTitle>
        </CardHeader>
        <CardContent class="pt-4 text-sm">
          <ul class="space-y-3">
            <li><strong>Offer:</strong> 50 free cards + 3-month SaaS trial</li>
            <li><strong>Condition:</strong> Exclusive contract if pilot succeeds</li>
            <li><strong>Support:</strong> On-site encoding for first batch</li>
            <li><strong>Goal:</strong> 3 pilots running by Day 45</li>
          </ul>
          <div class="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded text-xs">
            <strong>⚠️ Cost Control:</strong> Free cards = ~₱1,500 per pilot. Budget ₱4,500 total.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="bg-green-50 dark:bg-green-900/20">
          <CardTitle class="text-lg">📸 Case Study Collection</CardTitle>
        </CardHeader>
        <CardContent class="pt-4 text-sm">
          <ul class="space-y-3">
            <li>✓ Photo documentation of installations</li>
            <li>✓ Video testimonials from decision makers</li>
            <li>✓ Before/after comparison (old ID vs Kanaya)</li>
            <li>✓ Usage statistics from attendance system</li>
          </ul>
          <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
            <strong>💡 Use For:</strong> Social proof in next sales pitches
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Pilot Targets by Segment -->
    <h3 class="font-bold text-lg mb-3">Pilot Targets by Segment</h3>
    <div class="grid md:grid-cols-3 gap-4">
      <Card class="border-l-4 border-l-blue-500">
        <CardContent class="pt-4">
          <p class="font-bold">🎓 1 Private School</p>
          <p class="text-sm text-muted-foreground">100-300 students</p>
          <p class="text-sm">Target: DML Montessori or VDT ALC</p>
        </CardContent>
      </Card>
      <Card class="border-l-4 border-l-green-500">
        <CardContent class="pt-4">
          <p class="font-bold">🏢 1 SME Office</p>
          <p class="text-sm text-muted-foreground">20-50 employees</p>
          <p class="text-sm">Target: Any local BPO or retail</p>
        </CardContent>
      </Card>
      <Card class="border-l-4 border-l-purple-500">
        <CardContent class="pt-4">
          <p class="font-bold">💪 1 Gym/Fitness</p>
          <p class="text-sm text-muted-foreground">50-200 members</p>
          <p class="text-sm">Target: Local gym or martial arts studio</p>
        </CardContent>
      </Card>
    </div>
  </section>

  <!-- PHASE 3: SCALE -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">4. Phase 3: Scale (Days 61-90)</h2>
    <p class="text-muted-foreground mb-6">Goal: Convert pilots to contracts, begin LGU outreach, establish recurring revenue</p>
    
    <div class="grid md:grid-cols-3 gap-6 mb-6">
      <Card>
        <CardHeader class="bg-green-50 dark:bg-green-900/20">
          <CardTitle class="text-lg">💰 Contract Conversion</CardTitle>
        </CardHeader>
        <CardContent class="pt-4 text-sm">
          <ul class="space-y-2">
            <li>• Convert 3 pilots to full contracts</li>
            <li>• Upsell hardware bundles (₱16k-40k)</li>
            <li>• Lock in annual SaaS subscriptions</li>
            <li>• Collect testimonials and referrals</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="bg-purple-50 dark:bg-purple-900/20">
          <CardTitle class="text-lg">🏛️ LGU Expansion</CardTitle>
        </CardHeader>
        <CardContent class="pt-4 text-sm">
          <ul class="space-y-2">
            <li>• Start OSCA/PDAO outreach</li>
            <li>• Prepare demo kits for LGU pitches</li>
            <li>• Offer pilot programs to 2 LGUs</li>
            <li>• Begin PhilGEPS accreditation if needed</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="bg-blue-50 dark:bg-blue-900/20">
          <CardTitle class="text-lg">📈 Process & Systems</CardTitle>
        </CardHeader>
        <CardContent class="pt-4 text-sm">
          <ul class="space-y-2">
            <li>• Document successful sales process</li>
            <li>• Create repeatable demo script</li>
            <li>• Build proposal templates per segment</li>
            <li>• Establish production workflow</li>
          </ul>
        </CardContent>
      </Card>
    </div>

    <!-- Revenue Projections -->
    <Card class="border-2 border-blue-300 dark:border-blue-700">
      <CardHeader class="bg-blue-50 dark:bg-blue-900/20">
        <CardTitle>💵 90-Day Revenue Projection</CardTitle>
      </CardHeader>
      <CardContent class="pt-4">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b bg-muted/50">
                <th class="text-left py-2 px-4">Revenue Stream</th>
                <th class="text-right py-2 px-4">Conservative</th>
                <th class="text-right py-2 px-4">Target</th>
                <th class="text-right py-2 px-4">Stretch</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b">
                <td class="py-2 px-4">ID Card Sales (one-time)</td>
                <td class="py-2 px-4 text-right">₱50,000</td>
                <td class="py-2 px-4 text-right">₱80,000</td>
                <td class="py-2 px-4 text-right">₱120,000</td>
              </tr>
              <tr class="border-b">
                <td class="py-2 px-4">Hardware Bundles (one-time)</td>
                <td class="py-2 px-4 text-right">₱16,500</td>
                <td class="py-2 px-4 text-right">₱35,000</td>
                <td class="py-2 px-4 text-right">₱60,000</td>
              </tr>
              <tr class="border-b">
                <td class="py-2 px-4">SaaS Subscriptions (annual)</td>
                <td class="py-2 px-4 text-right">₱8,000</td>
                <td class="py-2 px-4 text-right">₱15,000</td>
                <td class="py-2 px-4 text-right">₱25,000</td>
              </tr>
              <tr class="border-b bg-green-50 dark:bg-green-900/10">
                <td class="py-2 px-4 font-bold">90-Day Total Revenue</td>
                <td class="py-2 px-4 text-right font-bold text-green-600">₱74,500</td>
                <td class="py-2 px-4 text-right font-bold text-green-600">₱130,000</td>
                <td class="py-2 px-4 text-right font-bold text-green-600">₱205,000</td>
              </tr>
              <tr class="border-b bg-blue-50 dark:bg-blue-900/10">
                <td class="py-2 px-4 font-bold">Projected ARR (Annual Recurring)</td>
                <td class="py-2 px-4 text-right font-bold text-blue-600">₱40,000</td>
                <td class="py-2 px-4 text-right font-bold text-blue-600">₱75,000</td>
                <td class="py-2 px-4 text-right font-bold text-blue-600">₱150,000</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-4 text-xs text-muted-foreground">* ARR includes SaaS subscriptions + estimated SMS revenue from parent-paid model</p>
      </CardContent>
    </Card>
  </section>

  <!-- SALES PIPELINE -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">5. Sales Pipeline & Conversion Targets</h2>
    
    <div class="grid md:grid-cols-5 gap-2 mb-6 text-center">
      <div class="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p class="text-2xl font-bold">20</p>
        <p class="text-sm">Prospects</p>
        <p class="text-xs text-muted-foreground">Cold contacts</p>
      </div>
      <div class="flex items-center justify-center">→</div>
      <div class="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
        <p class="text-2xl font-bold">10</p>
        <p class="text-sm">Meetings</p>
        <p class="text-xs text-muted-foreground">50% response</p>
      </div>
      <div class="flex items-center justify-center">→</div>
      <div class="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
        <p class="text-2xl font-bold">5</p>
        <p class="text-sm">Demos</p>
        <p class="text-xs text-muted-foreground">50% interest</p>
      </div>
    </div>
    <div class="grid md:grid-cols-5 gap-2 text-center">
      <div></div>
      <div></div>
      <div class="flex items-center justify-center">↓</div>
      <div></div>
      <div></div>
    </div>
    <div class="grid md:grid-cols-5 gap-2 mt-2 text-center">
      <div class="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
        <p class="text-2xl font-bold">3</p>
        <p class="text-sm">Pilots</p>
        <p class="text-xs text-muted-foreground">60% trial</p>
      </div>
      <div class="flex items-center justify-center">→</div>
      <div class="p-4 bg-green-200 dark:bg-green-800 rounded-lg">
        <p class="text-2xl font-bold text-green-700 dark:text-green-300">3</p>
        <p class="text-sm font-bold">Contracts</p>
        <p class="text-xs text-muted-foreground">100% convert</p>
      </div>
      <div class="flex items-center justify-center">→</div>
      <div class="p-4 bg-purple-200 dark:bg-purple-800 rounded-lg">
        <p class="text-2xl font-bold text-purple-700 dark:text-purple-300">₱130k+</p>
        <p class="text-sm font-bold">Revenue</p>
        <p class="text-xs text-muted-foreground">Target</p>
      </div>
    </div>
  </section>

  <!-- COLD CALL SCRIPTS -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">6. Cold Call Scripts by Segment</h2>
    
    <div class="grid gap-4">
      <Card class="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle class="text-lg">🎓 Schools & PTA</CardTitle>
        </CardHeader>
        <CardContent class="text-sm italic">
          "Good morning po, I'm [Name] from Kanaya Identity Solutions. We specialize in durable student IDs with 
          <strong>parent SMS notifications</strong> when their child enters or leaves school. May I ask who handles 
          your ID program? We'd love to offer a <strong>free 50-card pilot</strong> to show you how it works."
        </CardContent>
      </Card>

      <Card class="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle class="text-lg">🏢 HR Managers</CardTitle>
        </CardHeader>
        <CardContent class="text-sm italic">
          "Hi, I'm reaching out to HR managers about <strong>employee attendance tracking</strong>. We offer ID cards 
          that automatically log time-in/out—no more buddy-punching or manual logbooks. For just ₱25 per employee per year, 
          you get full attendance reports. Can I send you a quick demo video?"
        </CardContent>
      </Card>

      <Card class="border-l-4 border-l-purple-500">
        <CardHeader>
          <CardTitle class="text-lg">💪 Gym Owners</CardTitle>
        </CardHeader>
        <CardContent class="text-sm italic">
          "Hey, I noticed [Gym Name] and wanted to ask—do you currently have a membership card system? 
          We offer <strong>QR or RFID cards</strong> that automatically track member check-ins and 
          <strong>block expired memberships</strong>. Terminal bundle is ₱16,500. Can I show you a quick demo?"
        </CardContent>
      </Card>

      <Card class="border-l-4 border-l-red-500">
        <CardHeader>
          <CardTitle class="text-lg">🏛️ LGU / Government</CardTitle>
        </CardHeader>
        <CardContent class="text-sm italic">
          "Good morning po, I'm [Name] from Kanaya. We provide <strong>counterfeit-proof IDs</strong> for PWD and 
          Senior Citizens—with QR verification that any establishment can scan. May I speak with your OSCA or PDAO head? 
          We're offering <strong>free pilot programs</strong> to municipalities."
        </CardContent>
      </Card>
    </div>
  </section>

  <!-- PRICING QUICK REFERENCE -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">7. Pricing Quick Reference</h2>
    
    <div class="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>💳 ID Cards (per card)</CardTitle>
        </CardHeader>
        <CardContent>
          <table class="w-full text-sm">
            <tbody>
              <tr class="border-b">
                <td class="py-2">Basic (Laminated + QR)</td>
                <td class="py-2 text-right font-bold">₱80-100</td>
              </tr>
              <tr class="border-b">
                <td class="py-2">Standard (Thermal + QR)</td>
                <td class="py-2 text-right font-bold">₱120-150</td>
              </tr>
              <tr class="border-b">
                <td class="py-2">Premium (Thermal + NFC)</td>
                <td class="py-2 text-right font-bold">₱180-220</td>
              </tr>
              <tr class="border-b">
                <td class="py-2">Enterprise (UV + NFC + Hologram)</td>
                <td class="py-2 text-right font-bold">₱300-400</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📱 Hardware Bundles</CardTitle>
        </CardHeader>
        <CardContent>
          <table class="w-full text-sm">
            <tbody>
              <tr class="border-b">
                <td class="py-2">Lite (Tablet only)</td>
                <td class="py-2 text-right font-bold">₱12,000</td>
              </tr>
              <tr class="border-b bg-green-50 dark:bg-green-900/10">
                <td class="py-2">QR Standard ⭐</td>
                <td class="py-2 text-right font-bold">₱16,500</td>
              </tr>
              <tr class="border-b">
                <td class="py-2">RFID Bundle</td>
                <td class="py-2 text-right font-bold">₱19,000</td>
              </tr>
              <tr class="border-b">
                <td class="py-2">Biometric (Fingerprint)</td>
                <td class="py-2 text-right font-bold">₱30,000</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>

    <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
      <h3 class="font-bold mb-2">📊 SaaS Subscription Pricing</h3>
      <div class="grid md:grid-cols-4 gap-4 text-center text-sm">
        <div>
          <p class="font-bold">Schools</p>
          <p>₱10-20/student/yr</p>
        </div>
        <div>
          <p class="font-bold">Offices</p>
          <p>₱25-50/staff/yr</p>
        </div>
        <div>
          <p class="font-bold">Factories</p>
          <p>₱18-35/worker/yr</p>
        </div>
        <div>
          <p class="font-bold">LGU</p>
          <p>₱5-30/user/yr</p>
        </div>
      </div>
      <p class="mt-3 text-xs text-muted-foreground">⚠️ SMS is ALWAYS a separate add-on at ₱1.00/SMS. Never include in base SaaS.</p>
    </div>
  </section>

  <!-- RISK ASSESSMENT -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">8. Risk Assessment & Mitigation</h2>
    
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-muted/50">
            <th class="text-left py-3 px-4">Risk</th>
            <th class="text-center py-3 px-4">Impact</th>
            <th class="text-center py-3 px-4">Likelihood</th>
            <th class="text-left py-3 px-4">Mitigation Strategy</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">No paying client in Day 30</td>
            <td class="py-3 px-4 text-center"><span class="text-red-600">High</span></td>
            <td class="py-3 px-4 text-center"><span class="text-amber-600">Medium</span></td>
            <td class="py-3 px-4">Increase cold call volume to 30+; offer steeper pilot incentives</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">Check clearance delays</td>
            <td class="py-3 px-4 text-center"><span class="text-amber-600">Medium</span></td>
            <td class="py-3 px-4 text-center"><span class="text-amber-600">Medium</span></td>
            <td class="py-3 px-4">Bridge Protocol: Outsource first 100 cards immediately</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">Price objections</td>
            <td class="py-3 px-4 text-center"><span class="text-amber-600">Medium</span></td>
            <td class="py-3 px-4 text-center"><span class="text-green-600">High</span></td>
            <td class="py-3 px-4">Use TCO argument (5-year durability vs 6-month replacements)</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">LGU procurement delays</td>
            <td class="py-3 px-4 text-center"><span class="text-amber-600">Medium</span></td>
            <td class="py-3 px-4 text-center"><span class="text-red-600">High</span></td>
            <td class="py-3 px-4">Focus on private sector first; LGU is Phase 3+ priority</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">SMS cost overruns</td>
            <td class="py-3 px-4 text-center"><span class="text-red-600">High</span></td>
            <td class="py-3 px-4 text-center"><span class="text-green-600">Low</span></td>
            <td class="py-3 px-4">NEVER include unlimited SMS; always parent-paid or separate add-on</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <footer class="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
    <p>Kanaya GTM Execution Plan • Confidential</p>
    <p class="mt-2"><a href="/admin/docs" class="underline">← Back to Docs Hub</a></p>
  </footer>
</div>
