<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
</script>

<svelte:head>
  <title>Product Catalog | Source of Truth</title>
</svelte:head>

<div class="container mx-auto py-8 max-w-5xl">
  <header class="mb-8">
    <h1 class="text-4xl font-bold mb-2">PRODUCT CATALOG</h1>
    <p class="text-muted-foreground">Source of Truth | Card Types, Printing Methods, Hardware & Pricing</p>
    <div class="inline-block mt-3 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold">
      Last Updated: January 2026
    </div>
  </header>

  <!-- SECTION 1: CARD TYPES -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">1. Card Types</h2>
    <div class="grid md:grid-cols-4 gap-4">
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-lg">Basic</CardTitle>
        </CardHeader>
        <CardContent class="text-sm text-muted-foreground">
          <p>Standard printed PVC card. No encoding.</p>
          <p class="mt-2 font-semibold">Use: Visual ID only</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-lg">QR</CardTitle>
        </CardHeader>
        <CardContent class="text-sm text-muted-foreground">
          <p>Printed card with unique QR code for scanning.</p>
          <p class="mt-2 font-semibold">Use: Attendance, verification</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-lg">NFC</CardTitle>
        </CardHeader>
        <CardContent class="text-sm text-muted-foreground">
          <p>Embedded NFC chip. Tap-to-verify with phone.</p>
          <p class="mt-2 font-semibold">Use: Premium ID, access control</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-lg">RFID</CardTitle>
        </CardHeader>
        <CardContent class="text-sm text-muted-foreground">
          <p>Long-range RFID chip. Reader-based scanning.</p>
          <p class="mt-2 font-semibold">Use: Gates, terminals</p>
        </CardContent>
      </Card>
    </div>
  </section>

  <!-- SECTION 2: PRINTING STYLES -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">2. Printing Styles</h2>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-muted/50">
            <th class="text-left py-3 px-4">Style</th>
            <th class="text-left py-3 px-4">Description</th>
            <th class="text-left py-3 px-4">Card Types Supported</th>
            <th class="text-left py-3 px-4">Quality</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">Sandwich (Laminated)</td>
            <td class="py-3 px-4">Inkjet print + heat lamination</td>
            <td class="py-3 px-4">Basic, QR only</td>
            <td class="py-3 px-4">⭐⭐⭐</td>
          </tr>
          <tr class="border-b bg-muted/30">
            <td class="py-3 px-4 font-bold">Thermal (Cheap)</td>
            <td class="py-3 px-4">Entry-level direct-to-card printer</td>
            <td class="py-3 px-4">Basic, QR, NFC, RFID</td>
            <td class="py-3 px-4">⭐⭐⭐</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">Thermal (Premium)</td>
            <td class="py-3 px-4">High-end retransfer printer (IDP Smart-51S)</td>
            <td class="py-3 px-4">Basic, QR, NFC, RFID</td>
            <td class="py-3 px-4">⭐⭐⭐⭐</td>
          </tr>
          <tr class="border-b bg-muted/30">
            <td class="py-3 px-4 font-bold">UV (Cheap)</td>
            <td class="py-3 px-4">Entry-level UV flatbed printer</td>
            <td class="py-3 px-4">Basic, QR, NFC, RFID</td>
            <td class="py-3 px-4">⭐⭐⭐⭐</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">UV (Premium)</td>
            <td class="py-3 px-4">High-end UV with white ink + varnish</td>
            <td class="py-3 px-4">Basic, QR, NFC, RFID</td>
            <td class="py-3 px-4">⭐⭐⭐⭐⭐</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm">
      <strong>⚠️ Note:</strong> Sandwich method CANNOT print on pre-embedded NFC/RFID cards. Those require Thermal or UV printers.
    </div>
  </section>

  <!-- SECTION 3: ADD-ONS -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">3. Add-Ons</h2>
    <div class="grid md:grid-cols-3 gap-4">
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-lg">Lanyard</CardTitle>
        </CardHeader>
        <CardContent class="text-sm">
          <ul class="space-y-1">
            <li>• Plain color lanyards</li>
            <li>• Sublimation printed (custom logo)</li>
            <li>• Retractable badge reels</li>
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-lg">Security Overlays</CardTitle>
        </CardHeader>
        <CardContent class="text-sm">
          <ul class="space-y-1">
            <li>• UV fluorescent ink (invisible under normal light)</li>
            <li>• Holographic overlay (tamper-evident)</li>
            <li>• Micro-text patterns</li>
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-lg">Card Accessories</CardTitle>
        </CardHeader>
        <CardContent class="text-sm">
          <ul class="space-y-1">
            <li>• Card holders (rigid/soft)</li>
            <li>• ID clips & pins</li>
            <li>• Card sleeves (RFID blocking)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  </section>

  <!-- SECTION 4: HARDWARE -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">4. Hardware Ecosystem</h2>
    <div class="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>📱 Input Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <table class="w-full text-sm">
            <tbody>
              <tr class="border-b">
                <td class="py-2 font-bold">Phone</td>
                <td class="py-2">
                  <ul>
                    <li>• Mobile input for Kanaya App (photo capture)</li>
                    <li>• NFC writer/reader (compatible models)</li>
                    <li>• QR scanner via camera</li>
                  </ul>
                </td>
              </tr>
              <tr class="border-b">
                <td class="py-2 font-bold">Tablet</td>
                <td class="py-2">
                  <ul>
                    <li>• Display kiosk for attendance terminals</li>
                    <li>• Samsung Tab A9+ / Tab Active4 Pro</li>
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>🔌 Readers & Encoders</CardTitle>
        </CardHeader>
        <CardContent>
          <table class="w-full text-sm">
            <tbody>
              <tr class="border-b">
                <td class="py-2 font-bold">QR Reader</td>
                <td class="py-2">NETUM Wireless QR Scanner</td>
              </tr>
              <tr class="border-b">
                <td class="py-2 font-bold">RFID Reader</td>
                <td class="py-2">Long-range 125kHz/13.56MHz readers</td>
              </tr>
              <tr class="border-b">
                <td class="py-2 font-bold">NFC Encoder</td>
                <td class="py-2">ACR122U USB NFC Reader/Writer</td>
              </tr>
              <tr class="border-b">
                <td class="py-2 font-bold">Fingerprint</td>
                <td class="py-2">Hamster Plus (optional biometric)</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  </section>

  <!-- SECTION 5: PRICING CATEGORIES -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">5. Pricing Categories (Main Product Lines)</h2>
    
    <div class="grid md:grid-cols-2 gap-6 mb-6">
      <div>
        <h3 class="font-bold text-lg mb-3">Primary Categories</h3>
        <div class="space-y-2">
          <div class="p-3 bg-muted rounded-lg">
            <span class="font-bold">1. Basic Cards</span> — Laminated, no tech
          </div>
          <div class="p-3 bg-muted rounded-lg">
            <span class="font-bold">2. Thermal Cards</span> — ATM-quality direct print
          </div>
          <div class="p-3 bg-muted rounded-lg">
            <span class="font-bold">3. UV Printed Cards</span> — Premium finish
          </div>
          <div class="p-3 bg-muted rounded-lg">
            <span class="font-bold">4. Digital Business Cards</span> — NFC smart cards
          </div>
          <div class="p-3 bg-muted rounded-lg">
            <span class="font-bold">5. Lanyards</span> — Printed & accessories
          </div>
          <div class="p-3 bg-muted rounded-lg">
            <span class="font-bold">6. Attendance Systems</span> — Hardware bundles
          </div>
        </div>
      </div>
      
      <div>
        <h3 class="font-bold text-lg mb-3">Derivative SKUs (Examples)</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b">
                <th class="text-left py-2">SKU</th>
                <th class="text-left py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b"><td class="py-2">BASIC</td><td class="py-2">Laminated card only</td></tr>
              <tr class="border-b"><td class="py-2">BASIC-QR</td><td class="py-2">Laminated + QR code</td></tr>
              <tr class="border-b"><td class="py-2">THERM-QR</td><td class="py-2">Thermal + QR</td></tr>
              <tr class="border-b"><td class="py-2">THERM-QR-RFID</td><td class="py-2">Thermal + QR + RFID</td></tr>
              <tr class="border-b"><td class="py-2">THERM-NFC</td><td class="py-2">Thermal + NFC chip</td></tr>
              <tr class="border-b"><td class="py-2">UV-NFC</td><td class="py-2">UV premium + NFC</td></tr>
              <tr class="border-b"><td class="py-2">UV-NFC-HOLO</td><td class="py-2">UV + NFC + Hologram</td></tr>
              <tr class="border-b bg-purple-50 dark:bg-purple-900/10"><td class="py-2">DBC-BASIC</td><td class="py-2">Digital Business Card (basic)</td></tr>
              <tr class="border-b bg-purple-50 dark:bg-purple-900/10"><td class="py-2">DBC-PREM</td><td class="py-2">Digital Business Card (premium UV)</td></tr>
              <tr class="border-b bg-amber-50 dark:bg-amber-900/10"><td class="py-2">LAN-1/2</td><td class="py-2">Lanyard - 1/2 inch width</td></tr>
              <tr class="border-b bg-amber-50 dark:bg-amber-900/10"><td class="py-2">LAN-3/4</td><td class="py-2">Lanyard - 3/4 inch width</td></tr>
              <tr class="border-b bg-amber-50 dark:bg-amber-900/10"><td class="py-2">LAN-1</td><td class="py-2">Lanyard - 1 inch width</td></tr>
              <tr class="border-b bg-amber-50 dark:bg-amber-900/10"><td class="py-2">LAN-1-PRINT</td><td class="py-2">Lanyard - 1 inch sublimation printed</td></tr>
              <tr class="border-b bg-amber-50 dark:bg-amber-900/10"><td class="py-2">LAN-REEL</td><td class="py-2">Lanyard - Retractable badge reel add-on</td></tr>
              <tr class="border-b bg-green-50 dark:bg-green-900/10"><td class="py-2">ATT-CORE</td><td class="py-2">Attendance System - Core (Tablet + QR)</td></tr>
              <tr class="border-b bg-green-50 dark:bg-green-900/10"><td class="py-2">ATT-RFID</td><td class="py-2">Attendance System - RFID Reader Bundle</td></tr>
              <tr class="border-b bg-green-50 dark:bg-green-900/10"><td class="py-2">ATT-NFC</td><td class="py-2">Attendance System - NFC Bundle</td></tr>
              <tr class="border-b bg-green-50 dark:bg-green-900/10"><td class="py-2">ATT-BIO</td><td class="py-2">Attendance System - Biometric (Fingerprint)</td></tr>
              <tr class="border-b bg-green-50 dark:bg-green-900/10"><td class="py-2">ATT-SMS</td><td class="py-2">Attendance - SMS Subscription Add-on</td></tr>
              <tr class="border-b bg-slate-50 dark:bg-slate-900/10"><td class="py-2">ACC-HOLDER-SOFT</td><td class="py-2">Add-on: ID Holder (Soft/Vinyl)</td></tr>
              <tr class="border-b bg-slate-50 dark:bg-slate-900/10"><td class="py-2">ACC-HOLDER-HARD</td><td class="py-2">Add-on: ID Holder (Hard/Rigid)</td></tr>
              <tr class="border-b bg-slate-50 dark:bg-slate-900/10"><td class="py-2">ACC-CLIP</td><td class="py-2">Add-on: ID Clip (Metal)</td></tr>
              <tr class="border-b bg-slate-50 dark:bg-slate-900/10"><td class="py-2">ACC-PIN</td><td class="py-2">Add-on: ID Pin (Safety/Brooch)</td></tr>
              <tr class="border-b bg-slate-50 dark:bg-slate-900/10"><td class="py-2">ACC-SLEEVE-RFID</td><td class="py-2">Add-on: RFID Blocking Sleeve</td></tr>
              <tr class="border-b bg-slate-50 dark:bg-slate-900/10"><td class="py-2">ACC-YOYO</td><td class="py-2">Add-on: Yoyo/Retractable Reel (clip-on)</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>

  <!-- SECTION 6: INVESTMENT ROUTES -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">6. Investment Routes (Business Expansion)</h2>
    
    <div class="grid md:grid-cols-3 gap-6">
      <Card class="border-2 border-blue-300 dark:border-blue-700">
        <CardHeader class="bg-blue-50 dark:bg-blue-900/20">
          <CardTitle>🚀 Route A: App Development</CardTitle>
        </CardHeader>
        <CardContent class="pt-4">
          <p class="text-sm mb-3">Enhance core Kanaya App features for encoding and management.</p>
          <ul class="text-sm space-y-1">
            <li>• Template builder improvements</li>
            <li>• AI decomposition enhancements</li>
            <li>• Multi-org management</li>
            <li>• Payment/credits system</li>
          </ul>
          <div class="mt-4 p-2 bg-muted rounded text-xs">
            <strong>Investment:</strong> Development time
          </div>
        </CardContent>
      </Card>

      <Card class="border-2 border-green-300 dark:border-green-700">
        <CardHeader class="bg-green-50 dark:bg-green-900/20">
          <CardTitle>📊 Route B: Attendance Features</CardTitle>
        </CardHeader>
        <CardContent class="pt-4">
          <p class="text-sm mb-3">Attendance system hardware & subscription revenue.</p>
          <ul class="text-sm space-y-1">
            <li>• Tablet terminals (kiosk mode)</li>
            <li>• QR/RFID/NFC readers</li>
            <li>• SMS notifications</li>
            <li>• Recurring SaaS subscriptions</li>
          </ul>
          <div class="mt-4 p-2 bg-muted rounded text-xs">
            <strong>Investment:</strong> ₱16,500+ per terminal
          </div>
        </CardContent>
      </Card>

      <Card class="border-2 border-purple-300 dark:border-purple-700">
        <CardHeader class="bg-purple-50 dark:bg-purple-900/20">
          <CardTitle>💼 Route C: Digital Business Cards</CardTitle>
        </CardHeader>
        <CardContent class="pt-4">
          <p class="text-sm mb-3">Premium NFC business cards with digital profiles.</p>
          <ul class="text-sm space-y-1">
            <li>• NFC smart cards</li>
            <li>• Digital profile landing pages</li>
            <li>• Analytics & lead tracking</li>
            <li>• Corporate branding</li>
          </ul>
          <div class="mt-4 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs border border-red-200 dark:border-red-800">
            <strong>⚠️ Requirement:</strong> UV Printer for premium NFC cards
          </div>
        </CardContent>
      </Card>
    </div>
  </section>

  <!-- SECTION 7: COMPATIBILITY MATRIX -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">7. Compatibility Matrix</h2>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-muted/50">
            <th class="text-left py-3 px-4">Printing Style</th>
            <th class="text-center py-3 px-4">Basic</th>
            <th class="text-center py-3 px-4">QR</th>
            <th class="text-center py-3 px-4">NFC</th>
            <th class="text-center py-3 px-4">RFID</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">Sandwich (Laminated)</td>
            <td class="py-3 px-4 text-center text-green-600">✅</td>
            <td class="py-3 px-4 text-center text-green-600">✅</td>
            <td class="py-3 px-4 text-center text-red-600">❌</td>
            <td class="py-3 px-4 text-center text-red-600">❌</td>
          </tr>
          <tr class="border-b bg-muted/30">
            <td class="py-3 px-4 font-bold">Thermal (Cheap/Premium)</td>
            <td class="py-3 px-4 text-center text-green-600">✅</td>
            <td class="py-3 px-4 text-center text-green-600">✅</td>
            <td class="py-3 px-4 text-center text-green-600">✅</td>
            <td class="py-3 px-4 text-center text-green-600">✅</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">UV (Cheap/Premium)</td>
            <td class="py-3 px-4 text-center text-green-600">✅</td>
            <td class="py-3 px-4 text-center text-green-600">✅</td>
            <td class="py-3 px-4 text-center text-green-600">✅</td>
            <td class="py-3 px-4 text-center text-green-600">✅</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <footer class="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
    <p>Document Status: SOURCE OF TRUTH • Version 1.0</p>
    <p class="mt-2"><a href="/admin/docs" class="underline">← Back to Docs Hub</a></p>
  </footer>
</div>
