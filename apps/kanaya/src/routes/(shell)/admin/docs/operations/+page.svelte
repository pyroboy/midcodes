<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/components/ui/tabs";
</script>

<div class="container mx-auto py-8">
  <h1 class="text-4xl font-bold mb-4">SECTION: OPERATIONS</h1>
  <p class="text-muted-foreground mb-8">Production Operations Manual | Standard Operating Procedures (SOP)</p>

  <div class="grid gap-8">
    <section>
      <h2 class="text-2xl font-bold mb-4">I. Production Workflows</h2>
      <Tabs value="tier1" class="w-full">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="tier1">Workflow A: Tier 1 (Sandwich Method)</TabsTrigger>
          <TabsTrigger value="encoding">Workflow B: Encoding (The "Smart" Layer)</TabsTrigger>
        </TabsList>
        <TabsContent value="tier1">
          <Card>
            <CardContent class="prose dark:prose-invert pt-6 max-w-none">
              <ol>
                <li><strong>Print:</strong> Mirror Image on "Sticky" side of Sheet A and C. Settings: High Quality, Adobe RGB.</li>
                <li><strong>Dry:</strong> Wait 10-15 minutes. (Critical to prevent bubbling).</li>
                <li><strong>Assembly:</strong> Stack Sheet A + Core + Sheet C.</li>
                <li><strong>Laminate:</strong> Temp 130°C - 145°C. Feed straight.</li>
                <li><strong>Cure:</strong> Place under heavy weight (books) for 30 mins to flatten.</li>
                <li><strong>Cut:</strong> Manual Die Cutter. Check alignment.</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="encoding">
          <Card>
            <CardContent class="prose dark:prose-invert pt-6 max-w-none">
              <ol>
                <li><strong>Inspect:</strong> Visual check of printed name vs. App data.</li>
                <li><strong>Write:</strong> Kanaya App &gt; Admin &gt; Write Card.</li>
                <li><strong>Tap:</strong> Hold at top-back of phone. Wait for "Locked" beep.</li>
                <li><strong>Verify:</strong> Scan with secondary device.</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>

    <!-- NEW SECTION: App-Based Encoding Workflow -->
    <section class="encoding-moat">
      <h2 class="text-2xl font-bold mb-4">II. App-Based Encoding Workflow (Software Advantage)</h2>
      <p class="text-muted-foreground mb-4">Our software advantage: batch encoding that dramatically reduces manual data entry time and eliminates human errors.</p>
      
      <div class="grid md:grid-cols-2 gap-6 mb-6">
        <Card class="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle class="text-red-600 dark:text-red-400">❌ Manual Encoding (Competitors)</CardTitle>
          </CardHeader>
          <CardContent class="prose dark:prose-invert">
            <ol class="text-sm">
              <li>Manually type each name into encoding software</li>
              <li>Copy-paste ID numbers one by one</li>
              <li>Manually crop and resize each photo</li>
              <li>Check spelling for each entry</li>
              <li>Export file-by-file to print queue</li>
            </ol>
            <div class="bg-red-50 dark:bg-red-900/20 p-3 rounded mt-4">
              <strong>Time per card:</strong> ~2-3 minutes<br/>
              <strong>Error rate:</strong> 5-10% (typos, wrong photos)<br/>
              <strong>100 cards:</strong> ~3-5 hours of manual labor<br/>
              <strong>500 cards:</strong> ~16-25 hours (2-3 full work days)
            </div>
          </CardContent>
        </Card>

        <Card class="border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle class="text-green-600 dark:text-green-400">✅ Kanaya App Encoding</CardTitle>
          </CardHeader>
          <CardContent class="prose dark:prose-invert">
            <ol class="text-sm">
              <li>Upload CSV with all names + ID numbers</li>
              <li>Upload ZIP of photos (auto-matched by filename)</li>
              <li>AI auto-fits names, enhances photos, removes backgrounds</li>
              <li>3D Preview for client approval</li>
              <li>One-click batch export to print queue</li>
            </ol>
            <div class="bg-green-50 dark:bg-green-900/20 p-3 rounded mt-4">
              <strong>Time per batch:</strong> 15-30 minutes (any size up to 500)<br/>
              <strong>Error rate:</strong> ~0% (what you upload is what you get)<br/>
              <strong>100 cards:</strong> ~15-20 minutes<br/>
              <strong>500 cards:</strong> ~25-40 minutes total encoding
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>📋 Data Input Routes</CardTitle>
        </CardHeader>
        <CardContent class="prose dark:prose-invert">
          <div class="grid md:grid-cols-3 gap-4 mb-6">
            <div class="p-4 bg-muted rounded-lg">
              <h4 class="font-bold mb-2">Route A: CSV + ZIP Upload</h4>
              <p class="text-sm">Best for bulk orders. Client provides:</p>
              <ul class="text-sm">
                <li><code>students.csv</code> (Name, ID#, Section)</li>
                <li><code>photos.zip</code> (named by ID#)</li>
              </ul>
              <p class="text-sm font-semibold text-green-600 mt-2">→ Fastest: 8 mins for 500 cards</p>
            </div>
            <div class="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-lg border-2 border-amber-300 dark:border-amber-700">
              <h4 class="font-bold mb-2">Route B: Mobile Capture ⭐</h4>
              <p class="text-sm">Best for on-site enrollment (see detailed process below)</p>
              <ul class="text-sm">
                <li>Staff travels to location</li>
                <li>Sets up photo station</li>
                <li>Captures + encodes per person</li>
              </ul>
              <p class="text-sm font-semibold text-amber-600 mt-2">→ ~1 min per person + travel</p>
            </div>
            <div class="p-4 bg-muted rounded-lg">
              <h4 class="font-bold mb-2">Route C: API Integration</h4>
              <p class="text-sm">Best for schools with existing SIS:</p>
              <ul class="text-sm">
                <li>Connect to school database</li>
                <li>Auto-sync student records</li>
                <li>Trigger encoding on enrollment</li>
              </ul>
              <p class="text-sm font-semibold text-blue-600 mt-2">→ Automated: Zero manual input</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Route B Detailed Process -->
      <Card class="border-2 border-amber-300 dark:border-amber-700">
        <CardHeader class="bg-amber-50 dark:bg-amber-900/20">
          <CardTitle>📍 Route B: Mobile Capture — Step-by-Step Process</CardTitle>
        </CardHeader>
        <CardContent class="prose dark:prose-invert pt-6">
          
          <!-- Phase 1: Pre-Visit -->
          <div class="mb-6">
            <h4 class="font-bold text-lg border-b pb-2 mb-3">Phase 1: Pre-Visit Preparation (30 mins before departure)</h4>
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <h5 class="font-semibold">Equipment Checklist:</h5>
                <ul class="text-sm">
                  <li>📱 Phone with Kanaya App (fully charged)</li>
                  <li>🔌 Power bank (20,000mAh minimum)</li>
                  <li>📶 Pocket WiFi or confirm site has internet</li>
                  <li>🎨 Portable backdrop (white/blue cloth)</li>
                  <li>💡 Ring light / portable LED light</li>
                  <li>📋 Student list (printed or digital)</li>
                </ul>
              </div>
              <div>
                <h5 class="font-semibold">App Preparation:</h5>
                <ul class="text-sm">
                  <li>✅ Login to Kanaya App</li>
                  <li>✅ Select target template</li>
                  <li>✅ Enable "Offline Mode" if needed</li>
                  <li>✅ Clear app cache (prevent slowdown)</li>
                  <li>✅ Test camera and AI background removal</li>
                </ul>
              </div>
            </div>
            <div class="bg-muted p-3 rounded mt-3 text-sm">
              <strong>⏱️ Time:</strong> 30 minutes | <strong>Travel:</strong> Variable (budget 30-60 mins)
            </div>
          </div>

          <!-- Phase 2: On-Site Setup -->
          <div class="mb-6">
            <h4 class="font-bold text-lg border-b pb-2 mb-3">Phase 2: On-Site Setup (15-20 mins)</h4>
            <ol class="text-sm">
              <li><strong>Arrive & Coordinate:</strong> Meet with school admin, confirm location (classroom/hallway).</li>
              <li><strong>Set Up Backdrop:</strong> Hang/mount white or blue cloth in well-lit area. Avoid direct sunlight (causes shadows).</li>
              <li><strong>Position Light:</strong> Ring light at face level, 45° angle. Test for even lighting on face.</li>
              <li><strong>Mark Standing Spot:</strong> Use tape on floor for consistent subject distance (approx. 1 meter from camera).</li>
              <li><strong>Test Shot:</strong> Take 2-3 test photos, verify AI background removal works cleanly.</li>
              <li><strong>Organize Queue:</strong> Coordinate with teachers to line up students by section/class.</li>
            </ol>
            <div class="bg-muted p-3 rounded mt-3 text-sm">
              <strong>⏱️ Time:</strong> 15-20 minutes (one-time per visit)
            </div>
          </div>

          <!-- Phase 3: Photo Session -->
          <div class="mb-6">
            <h4 class="font-bold text-lg border-b pb-2 mb-3">Phase 3: Photo Session & Data Entry (Per Person)</h4>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b">
                    <th class="text-left py-2 px-3">Step</th>
                    <th class="text-left py-2 px-3">Action</th>
                    <th class="text-right py-2 px-3">Basic</th>
                    <th class="text-right py-2 px-3">Extended</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="border-b">
                    <td class="py-2 px-3 font-bold">1</td>
                    <td class="py-2 px-3">Student approaches, states name + ID number</td>
                    <td class="py-2 px-3 text-right">5 sec</td>
                    <td class="py-2 px-3 text-right">5 sec</td>
                  </tr>
                  <tr class="border-b bg-muted/50">
                    <td class="py-2 px-3 font-bold">2</td>
                    <td class="py-2 px-3">Position at mark, adjust posture/hair</td>
                    <td class="py-2 px-3 text-right">10 sec</td>
                    <td class="py-2 px-3 text-right">10 sec</td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 px-3 font-bold">3</td>
                    <td class="py-2 px-3">📸 Capture photo (app auto-removes background)</td>
                    <td class="py-2 px-3 text-right">3 sec</td>
                    <td class="py-2 px-3 text-right">3 sec</td>
                  </tr>
                  <tr class="border-b bg-muted/50">
                    <td class="py-2 px-3 font-bold">4</td>
                    <td class="py-2 px-3">Review photo, retake if needed</td>
                    <td class="py-2 px-3 text-right">5 sec</td>
                    <td class="py-2 px-3 text-right">10 sec</td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 px-3 font-bold">5</td>
                    <td class="py-2 px-3">⌨️ Type full name (or select from pre-loaded list)</td>
                    <td class="py-2 px-3 text-right">15 sec</td>
                    <td class="py-2 px-3 text-right">15 sec</td>
                  </tr>
                  <tr class="border-b bg-muted/50">
                    <td class="py-2 px-3 font-bold">6</td>
                    <td class="py-2 px-3">⌨️ Type ID number, section, position</td>
                    <td class="py-2 px-3 text-right">10 sec</td>
                    <td class="py-2 px-3 text-right">10 sec</td>
                  </tr>
                  <tr class="border-b bg-amber-50 dark:bg-amber-900/10">
                    <td class="py-2 px-3 font-bold">7</td>
                    <td class="py-2 px-3">⌨️ Emergency Contact Name</td>
                    <td class="py-2 px-3 text-right text-muted-foreground">—</td>
                    <td class="py-2 px-3 text-right">10 sec</td>
                  </tr>
                  <tr class="border-b bg-amber-50 dark:bg-amber-900/10">
                    <td class="py-2 px-3 font-bold">8</td>
                    <td class="py-2 px-3">⌨️ Emergency Contact Phone</td>
                    <td class="py-2 px-3 text-right text-muted-foreground">—</td>
                    <td class="py-2 px-3 text-right">8 sec</td>
                  </tr>
                  <tr class="border-b bg-amber-50 dark:bg-amber-900/10">
                    <td class="py-2 px-3 font-bold">9</td>
                    <td class="py-2 px-3">⌨️ Address / Barangay</td>
                    <td class="py-2 px-3 text-right text-muted-foreground">—</td>
                    <td class="py-2 px-3 text-right">15 sec</td>
                  </tr>
                  <tr class="border-b bg-amber-50 dark:bg-amber-900/10">
                    <td class="py-2 px-3 font-bold">10</td>
                    <td class="py-2 px-3">⌨️ Birthdate (DD/MM/YYYY)</td>
                    <td class="py-2 px-3 text-right text-muted-foreground">—</td>
                    <td class="py-2 px-3 text-right">6 sec</td>
                  </tr>
                  <tr class="border-b bg-amber-50 dark:bg-amber-900/10">
                    <td class="py-2 px-3 font-bold">11</td>
                    <td class="py-2 px-3">⌨️ Blood Type / Medical Notes</td>
                    <td class="py-2 px-3 text-right text-muted-foreground">—</td>
                    <td class="py-2 px-3 text-right">8 sec</td>
                  </tr>
                  <tr class="border-b bg-amber-50 dark:bg-amber-900/10">
                    <td class="py-2 px-3 font-bold">12</td>
                    <td class="py-2 px-3">⌨️ Guardian Relationship (dropdown)</td>
                    <td class="py-2 px-3 text-right text-muted-foreground">—</td>
                    <td class="py-2 px-3 text-right">3 sec</td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 px-3 font-bold">13</td>
                    <td class="py-2 px-3">👀 Final review with student/guardian</td>
                    <td class="py-2 px-3 text-right">—</td>
                    <td class="py-2 px-3 text-right">15 sec</td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 px-3 font-bold">14</td>
                    <td class="py-2 px-3">✅ Tap "Save" — syncs to cloud</td>
                    <td class="py-2 px-3 text-right">2 sec</td>
                    <td class="py-2 px-3 text-right">2 sec</td>
                  </tr>
                  <tr class="border-b bg-green-50 dark:bg-green-900/20">
                    <td class="py-2 px-3 font-bold" colspan="2">TOTAL PER PERSON (Basic)</td>
                    <td class="py-2 px-3 text-right font-bold text-green-600">~50-60 sec</td>
                    <td class="py-2 px-3 text-right text-muted-foreground">—</td>
                  </tr>
                  <tr class="border-b bg-amber-100 dark:bg-amber-800/30">
                    <td class="py-2 px-3 font-bold" colspan="2">TOTAL PER PERSON (Extended + Review)</td>
                    <td class="py-2 px-3 text-right text-muted-foreground">—</td>
                    <td class="py-2 px-3 text-right font-bold text-amber-600">~2-2.5 mins</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="grid md:grid-cols-2 gap-4 mt-4">
              <div class="bg-green-50 dark:bg-green-900/20 p-3 rounded text-sm">
                <h5 class="font-bold text-green-700 dark:text-green-400 mb-2">✅ Basic Mode (ID Only)</h5>
                <p><strong>Fields:</strong> Name, ID#, Section, Photo</p>
                <p><strong>Time:</strong> ~1 min/person</p>
                <p><strong>Best for:</strong> Simple school IDs, event badges</p>
              </div>
              <div class="bg-amber-50 dark:bg-amber-900/20 p-3 rounded text-sm">
                <h5 class="font-bold text-amber-700 dark:text-amber-400 mb-2">⚠️ Extended Mode (Full Profile)</h5>
                <p><strong>Fields:</strong> +Emergency, Address, Birthdate, Medical, Guardian</p>
                <p><strong>Time:</strong> ~2-2.5 min/person</p>
                <p><strong>Best for:</strong> Schools with SMS alerts, LGU benefits, medical requirements</p>
              </div>
            </div>

            <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded mt-4 text-sm">
              <strong>💡 Pro Tips to Speed Up Extended Mode:</strong>
              <ul class="mt-1">
                <li><strong>Pre-fill:</strong> Have parents complete a Google Form beforehand → import to app</li>
                <li><strong>Dropdown fields:</strong> Use pre-set options (Barangay list, blood types) instead of typing</li>
                <li><strong>Skip review:</strong> If guardian can't attend, skip final review (add disclaimer)</li>
                <li><strong>Two-person team:</strong> One shoots, one types = reduces to ~1.5 min/person</li>
              </ul>
            </div>
          </div>

          <!-- Batch Session Estimates -->
          <div class="mb-6">
            <h4 class="font-bold text-lg border-b pb-2 mb-3">Phase 4: Batch Session Time Estimates</h4>
            <p class="text-sm text-muted-foreground mb-3">Times shown are for <strong>on-site photo session</strong> only (excludes travel and post-processing).</p>
            
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b">
                    <th class="text-left py-2 px-3" rowspan="2">Batch Size</th>
                    <th class="text-left py-2 px-3" rowspan="2">Setup</th>
                    <th class="text-center py-2 px-3 bg-green-50 dark:bg-green-900/20" colspan="2">✅ Basic Mode (~1 min/person)</th>
                    <th class="text-center py-2 px-3 bg-amber-50 dark:bg-amber-900/20" colspan="2">⚠️ Extended Mode (~2.5 min/person)</th>
                  </tr>
                  <tr class="border-b">
                    <th class="text-left py-2 px-3 bg-green-50 dark:bg-green-900/20">Total</th>
                    <th class="text-left py-2 px-3 bg-green-50 dark:bg-green-900/20">Visits</th>
                    <th class="text-left py-2 px-3 bg-amber-50 dark:bg-amber-900/20">Total</th>
                    <th class="text-left py-2 px-3 bg-amber-50 dark:bg-amber-900/20">Visits</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="border-b">
                    <td class="py-2 px-3 font-bold">50 students</td>
                    <td class="py-2 px-3">20 mins</td>
                    <td class="py-2 px-3 bg-green-50/50 dark:bg-green-900/10 font-bold text-green-600">~1.5 hrs</td>
                    <td class="py-2 px-3 bg-green-50/50 dark:bg-green-900/10">1 visit</td>
                    <td class="py-2 px-3 bg-amber-50/50 dark:bg-amber-900/10 font-bold text-amber-600">~2.5 hrs</td>
                    <td class="py-2 px-3 bg-amber-50/50 dark:bg-amber-900/10">1 visit</td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 px-3 font-bold">100 students</td>
                    <td class="py-2 px-3">20 mins</td>
                    <td class="py-2 px-3 bg-green-50/50 dark:bg-green-900/10 font-bold text-green-600">~2.5 hrs</td>
                    <td class="py-2 px-3 bg-green-50/50 dark:bg-green-900/10">1 visit</td>
                    <td class="py-2 px-3 bg-amber-50/50 dark:bg-amber-900/10 font-bold text-amber-600">~4.5 hrs</td>
                    <td class="py-2 px-3 bg-amber-50/50 dark:bg-amber-900/10">1 visit (long)</td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 px-3 font-bold">200 students</td>
                    <td class="py-2 px-3">20 mins</td>
                    <td class="py-2 px-3 bg-green-50/50 dark:bg-green-900/10 font-bold text-green-600">~4.5 hrs</td>
                    <td class="py-2 px-3 bg-green-50/50 dark:bg-green-900/10">1 visit</td>
                    <td class="py-2 px-3 bg-amber-50/50 dark:bg-amber-900/10 font-bold text-amber-600">~9 hrs</td>
                    <td class="py-2 px-3 bg-amber-50/50 dark:bg-amber-900/10">2 visits</td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 px-3 font-bold">500 students</td>
                    <td class="py-2 px-3">20 mins × 2</td>
                    <td class="py-2 px-3 bg-green-50/50 dark:bg-green-900/10 font-bold text-green-600">~10-11 hrs</td>
                    <td class="py-2 px-3 bg-green-50/50 dark:bg-green-900/10">2 visits</td>
                    <td class="py-2 px-3 bg-amber-50/50 dark:bg-amber-900/10 font-bold text-amber-600">~22 hrs</td>
                    <td class="py-2 px-3 bg-amber-50/50 dark:bg-amber-900/10">4-5 visits</td>
                  </tr>
                  <tr class="border-b bg-red-50/30 dark:bg-red-900/10">
                    <td class="py-2 px-3 font-bold">1,000 students</td>
                    <td class="py-2 px-3">20 mins × 4</td>
                    <td class="py-2 px-3 font-bold text-red-600">~21-22 hrs</td>
                    <td class="py-2 px-3">4 visits</td>
                    <td class="py-2 px-3 font-bold text-red-600">~44 hrs</td>
                    <td class="py-2 px-3">8-9 visits</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="grid md:grid-cols-2 gap-4 mt-4">
              <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-sm">
                <strong>📋 Scheduling (Basic Mode):</strong>
                <ul class="mt-1">
                  <li>Max ~250 students/day (5-6 hours on-site)</li>
                  <li>Schedule AM (8-12) and PM (1-5) batches</li>
                </ul>
              </div>
              <div class="bg-purple-50 dark:bg-purple-900/20 p-3 rounded text-sm">
                <strong>📋 Scheduling (Extended Mode):</strong>
                <ul class="mt-1">
                  <li>Max ~100-120 students/day (5-6 hours on-site)</li>
                  <li>Guardian availability required = harder to schedule</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Post-Visit -->
          <div>
            <h4 class="font-bold text-lg border-b pb-2 mb-3">Phase 5: Post-Visit (Back at Office)</h4>
            <ol class="text-sm">
              <li><strong>Sync Verification:</strong> Confirm all records uploaded to cloud (check count).</li>
              <li><strong>Quality Review:</strong> Browse photos in admin panel, flag any needing retakes.</li>
              <li><strong>Generate Print Queue:</strong> One-click batch export to production.</li>
              <li><strong>Schedule Next Visit:</strong> If retakes needed or remaining students.</li>
            </ol>
            <div class="bg-muted p-3 rounded mt-3 text-sm">
              <strong>⏱️ Time:</strong> 15-30 minutes | <strong>Note:</strong> This can be done same-day if internet was stable on-site.
            </div>
          </div>

        </CardContent>
      </Card>
    </section>

    <!-- NEW SECTION: Batch Timing Analysis -->
    <section>
      <h2 class="text-2xl font-bold mb-4">III. Batch Timing Analysis (Full Production Cycle)</h2>
      <p class="text-muted-foreground mb-4">Accurate time estimates for complete ID card production from data input to finished cards.</p>

      <Card>
        <CardContent class="pt-6">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-3 px-4 font-bold">Batch Size</th>
                  <th class="text-left py-3 px-4 font-bold">Encoding (App)</th>
                  <th class="text-left py-3 px-4 font-bold">Printing</th>
                  <th class="text-left py-3 px-4 font-bold">Lamination</th>
                  <th class="text-left py-3 px-4 font-bold">Cutting</th>
                  <th class="text-left py-3 px-4 font-bold">Total Time</th>
                  <th class="text-left py-3 px-4 font-bold">Sessions</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b bg-green-50 dark:bg-green-900/10">
                  <td class="py-3 px-4 font-bold">50 cards</td>
                  <td class="py-3 px-4">8 mins</td>
                  <td class="py-3 px-4">1.5 hrs</td>
                  <td class="py-3 px-4">45 mins</td>
                  <td class="py-3 px-4">30 mins</td>
                  <td class="py-3 px-4 font-bold text-green-600">~3 hours</td>
                  <td class="py-3 px-4">1 visit</td>
                </tr>
                <tr class="border-b">
                  <td class="py-3 px-4 font-bold">100 cards</td>
                  <td class="py-3 px-4">8 mins</td>
                  <td class="py-3 px-4">3 hrs</td>
                  <td class="py-3 px-4">1.5 hrs</td>
                  <td class="py-3 px-4">1 hr</td>
                  <td class="py-3 px-4 font-bold">~6 hours</td>
                  <td class="py-3 px-4">1 visit</td>
                </tr>
                <tr class="border-b bg-amber-50 dark:bg-amber-900/10">
                  <td class="py-3 px-4 font-bold">200 cards</td>
                  <td class="py-3 px-4">8 mins</td>
                  <td class="py-3 px-4">6 hrs + 30min break</td>
                  <td class="py-3 px-4">3 hrs</td>
                  <td class="py-3 px-4">2 hrs</td>
                  <td class="py-3 px-4 font-bold text-amber-600">~12 hours (1.5 days)</td>
                  <td class="py-3 px-4">2 visits</td>
                </tr>
                <tr class="border-b">
                  <td class="py-3 px-4 font-bold">500 cards</td>
                  <td class="py-3 px-4">8 mins</td>
                  <td class="py-3 px-4">15 hrs + breaks</td>
                  <td class="py-3 px-4">7.5 hrs</td>
                  <td class="py-3 px-4">5 hrs</td>
                  <td class="py-3 px-4 font-bold">~3-4 days</td>
                  <td class="py-3 px-4">4 visits</td>
                </tr>
                <tr class="border-b bg-red-50 dark:bg-red-900/10">
                  <td class="py-3 px-4 font-bold">1,000 cards</td>
                  <td class="py-3 px-4">8 mins</td>
                  <td class="py-3 px-4">30 hrs + breaks</td>
                  <td class="py-3 px-4">15 hrs</td>
                  <td class="py-3 px-4">10 hrs</td>
                  <td class="py-3 px-4 font-bold text-red-600">~7-8 days</td>
                  <td class="py-3 px-4">8 visits</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="mt-6 grid md:grid-cols-2 gap-4">
            <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 class="font-bold mb-2">📊 Time Breakdown Assumptions</h4>
              <ul class="text-sm space-y-1">
                <li><strong>Printing:</strong> 2 cards/tray × 2.5 mins/batch = ~1.25 mins/card</li>
                <li><strong>Lamination:</strong> 130°C, 30 secs/card + cooling</li>
                <li><strong>Cutting:</strong> Manual die cutter, ~30 secs/card</li>
                <li><strong>Cooling Break:</strong> 15 mins after every 100 cards (printer protection)</li>
              </ul>
            </div>
            <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h4 class="font-bold mb-2">🚀 Why Encoding is NOT the Bottleneck</h4>
              <ul class="text-sm space-y-1">
                <li><strong>Encoding:</strong> 8 mins regardless of batch size (1-500)</li>
                <li><strong>Printing:</strong> Always the bottleneck (hardware-limited)</li>
                <li><strong>Advantage:</strong> Accept rush orders without extra encoding staff</li>
                <li><strong>Moat:</strong> Competitors need 8 HOURS; we need 8 MINUTES</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>

    <!-- NEW SECTION: Encoding Fee Structure -->
    <section>
      <h2 class="text-2xl font-bold mb-4">IV. Encoding Fee Structure</h2>
      <p class="text-muted-foreground mb-4">Pricing for data processing and encoding services (separate from printing).</p>

      <div class="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>💳 Per-Card Encoding Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-2">Service</th>
                  <th class="text-right py-2">Fee</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b">
                  <td class="py-2">Base Encoding (CSV + Photo Match)</td>
                  <td class="py-2 text-right font-bold">₱5/card</td>
                </tr>
                <tr class="border-b">
                  <td class="py-2">AI Photo Enhancement (Background Removal)</td>
                  <td class="py-2 text-right font-bold">₱3/card</td>
                </tr>
                <tr class="border-b">
                  <td class="py-2">QR Code Generation</td>
                  <td class="py-2 text-right font-bold">Included</td>
                </tr>
                <tr class="border-b">
                  <td class="py-2">NFC Chip Writing (if applicable)</td>
                  <td class="py-2 text-right font-bold">₱15/card</td>
                </tr>
                <tr class="border-b bg-green-50 dark:bg-green-900/20">
                  <td class="py-2 font-bold">Standard Bundle (Encoding + AI + QR)</td>
                  <td class="py-2 text-right font-bold text-green-600">₱8/card</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📦 Volume Discounts</CardTitle>
          </CardHeader>
          <CardContent>
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-2">Volume</th>
                  <th class="text-right py-2">Encoding Rate</th>
                  <th class="text-right py-2">Savings</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b">
                  <td class="py-2">1-49 cards</td>
                  <td class="py-2 text-right">₱8/card</td>
                  <td class="py-2 text-right text-muted-foreground">—</td>
                </tr>
                <tr class="border-b">
                  <td class="py-2">50-99 cards</td>
                  <td class="py-2 text-right">₱7/card</td>
                  <td class="py-2 text-right text-green-600">12% off</td>
                </tr>
                <tr class="border-b">
                  <td class="py-2">100-199 cards</td>
                  <td class="py-2 text-right">₱6/card</td>
                  <td class="py-2 text-right text-green-600">25% off</td>
                </tr>
                <tr class="border-b">
                  <td class="py-2">200-499 cards</td>
                  <td class="py-2 text-right">₱5/card</td>
                  <td class="py-2 text-right text-green-600">37% off</td>
                </tr>
                <tr class="border-b bg-green-50 dark:bg-green-900/20">
                  <td class="py-2 font-bold">500+ cards</td>
                  <td class="py-2 text-right font-bold">₱4/card</td>
                  <td class="py-2 text-right font-bold text-green-600">50% off</td>
                </tr>
              </tbody>
            </table>
            <p class="text-xs text-muted-foreground mt-4">* Encoding fees are in addition to card production costs (₱150/card standard).</p>
          </CardContent>
        </Card>
      </div>

      <Card class="mt-6">
        <CardHeader>
          <CardTitle>📁 Data Submission Requirements</CardTitle>
        </CardHeader>
        <CardContent class="prose dark:prose-invert">
          <div class="grid md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-bold">CSV File Format</h4>
              <pre class="text-xs bg-muted p-3 rounded overflow-x-auto">
id,full_name,section,position
2024-0001,Juan Dela Cruz,Grade 7 - A,Student
2024-0002,Maria Santos,Grade 7 - A,Student
2024-0003,Pedro Reyes,N/A,Teacher</pre>
              <p class="text-sm mt-2">Required columns: <code>id</code>, <code>full_name</code><br/>Optional: section, position, email, contact</p>
            </div>
            <div>
              <h4 class="font-bold">Photo Requirements</h4>
              <ul class="text-sm">
                <li><strong>Format:</strong> JPG or PNG</li>
                <li><strong>Size:</strong> Min 400×500px (portrait)</li>
                <li><strong>Naming:</strong> Match ID column (e.g., <code>2024-0001.jpg</code>)</li>
                <li><strong>Packaging:</strong> All photos in single ZIP file</li>
              </ul>
              <p class="text-sm mt-2 text-amber-600">⚠️ Misnamed photos will not be matched automatically.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>

    <div class="grid md:grid-cols-2 gap-8">
      <section>
        <h2 class="text-2xl font-bold mb-4">V. Throughput & Limits (Epson L8050)</h2>
        <Card>
          <CardContent class="prose dark:prose-invert pt-6">
            <ul>
              <li><strong>The Batching Protocol:</strong> Maximum 100 cards per continuous run.</li>
              <li><strong>Cooling Break:</strong> 15 minutes OFF after every 100 cards.</li>
              <li><strong>Reality Check:</strong> 500 IDs = 3-4 days total production. Do not promise same-day bulk.</li>
              <li><strong>Rush Surcharge:</strong> +30% for orders requiring overtime or weekend work.</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 class="text-2xl font-bold mb-4">VI. Equipment Maintenance</h2>
        <Card>
          <CardContent class="prose dark:prose-invert pt-6">
            <ul>
              <li><strong>Daily:</strong> Nozzle Check (Epson) before first print.</li>
              <li><strong>Weekly:</strong> Wipe laminator rollers with alcohol (remove glue).</li>
              <li><strong>Monthly:</strong> Tighten Die Cutter blade bolts.</li>
              <li><strong>Quarterly:</strong> Reset Waste Ink Pad Counter.</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>

    <section>
      <h2 class="text-2xl font-bold mb-4">VII. Troubleshooting</h2>
      <Card>
        <CardContent class="prose dark:prose-invert pt-6 grid md:grid-cols-2 gap-4">
          <div>
            <h4 class="font-bold text-red-500">Delamination</h4>
            <p>Laminator too cold (&lt;120°C).</p>
          </div>
          <div>
            <h4 class="font-bold text-red-500">Bubbles</h4>
            <p>Laminator too hot (&gt;160°C) or Ink not dry.</p>
          </div>
          <div>
            <h4 class="font-bold text-red-500">Warping</h4>
            <p>Cooling process skipped. Weight down immediately after heat.</p>
          </div>
          <div>
            <h4 class="font-bold text-red-500">Wrong Colors</h4>
            <p>Printed on wrong side of PVC sheet (Glossy peeling side vs Sticky side).</p>
          </div>
          <div>
            <h4 class="font-bold text-red-500">Photo Mismatch</h4>
            <p>Photo filename doesn't match CSV ID. Re-check naming convention.</p>
          </div>
          <div>
            <h4 class="font-bold text-red-500">CSV Parse Error</h4>
            <p>Special characters in names. Use UTF-8 encoding when saving CSV.</p>
          </div>
        </CardContent>
      </Card>
    </section>
  </div>
</div>
