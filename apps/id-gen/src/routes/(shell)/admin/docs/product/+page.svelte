<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
</script>

<svelte:head>
  <title>Product & Technology Overview | Kanaya Admin</title>
</svelte:head>

<div class="container mx-auto py-8 max-w-5xl">
  <header class="mb-8">
    <h1 class="text-4xl font-bold mb-2">PRODUCT & TECHNOLOGY</h1>
    <p class="text-muted-foreground">Software Features, Competitive Advantages & System Capabilities</p>
    <div class="inline-block mt-3 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold">
      Core Document | January 2026
    </div>
  </header>

  <!-- MISSION -->
  <section class="mb-10 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border-l-4 border-l-blue-500">
    <p class="text-lg leading-relaxed">
      <strong>Kanaya</strong> is the Philippines' most advanced ID card ecosystem. We combine industrial-grade hardware 
      reliability with modern AI-powered software to eliminate the manual bottlenecks of traditional ID production.
    </p>
  </section>

  <!-- QUICK LINKS -->
  <section class="mb-10">
    <h2 class="text-xl font-bold mb-4">📖 Related Documentation</h2>
    <div class="grid md:grid-cols-3 gap-4 text-sm">
      <a href="/admin/docs/product-catalog" class="p-4 bg-muted rounded-lg hover:bg-muted/80 transition">
        <p class="font-bold">📦 Product Catalog</p>
        <p class="text-muted-foreground">Card types, printing, hardware & pricing</p>
      </a>
      <a href="/admin/docs/architecture" class="p-4 bg-muted rounded-lg hover:bg-muted/80 transition">
        <p class="font-bold">🏗️ System Architecture</p>
        <p class="text-muted-foreground">Tech stack, database, API, security</p>
      </a>
      <a href="/admin/docs/attendance-pricing" class="p-4 bg-muted rounded-lg hover:bg-muted/80 transition">
        <p class="font-bold">📊 Attendance Pricing</p>
        <p class="text-muted-foreground">SaaS tiers, hardware bundles, SMS</p>
      </a>
    </div>
  </section>

  <!-- UNIQUE SELLING POINTS -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">🚀 The "Kanaya Advantage"</h2>
    <p class="text-muted-foreground mb-6">What makes us different from traditional ID shops.</p>
    
    <div class="grid md:grid-cols-2 gap-6">
      <Card class="border-l-4 border-l-purple-500">
        <CardHeader class="pb-2">
          <CardTitle class="flex items-center gap-2">🤖 AI Layer Decomposition</CardTitle>
        </CardHeader>
        <CardContent class="text-sm">
          <p class="mb-3">Using <strong>Qwen-Image-Layered</strong> via fal.ai, we instantly separate flat ID designs into editable RGBA layers.</p>
          <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
            <strong>Result:</strong> Hours of manual Photoshop work → 10 seconds of automated processing.
          </div>
        </CardContent>
      </Card>

      <Card class="border-l-4 border-l-green-500">
        <CardHeader class="pb-2">
          <CardTitle class="flex items-center gap-2">📦 Mobile-First Enrollment</CardTitle>
        </CardHeader>
        <CardContent class="text-sm">
          <p class="mb-3">Enroll students via mobile app, capture AI-cleaned photos, and generate batches for production in real-time.</p>
          <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded">
            <strong>Result:</strong> No more desktop cables, SD cards, or manual data entry.
          </div>
        </CardContent>
      </Card>

      <Card class="border-l-4 border-l-blue-500">
        <CardHeader class="pb-2">
          <CardTitle class="flex items-center gap-2">🔐 Cryptographic Security</CardTitle>
        </CardHeader>
        <CardContent class="text-sm">
          <p class="mb-3">Every Kanaya ID is cryptographically signed. We use multi-sector NFC with HMAC to prevent cloning.</p>
          <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
            <strong>Result:</strong> Instant clone detection. Unhackable verification.
          </div>
        </CardContent>
      </Card>

      <Card class="border-l-4 border-l-amber-500">
        <CardHeader class="pb-2">
          <CardTitle class="flex items-center gap-2">🧊 3D Real-Time Previews</CardTitle>
        </CardHeader>
        <CardContent class="text-sm">
          <p class="mb-3">Using <strong>Threlte (Three.js)</strong>, users see their ID cards in a high-fidelity 3D environment before printing.</p>
          <div class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded">
            <strong>Result:</strong> WYSIWYG — What You See Is What You Get.
          </div>
        </CardContent>
      </Card>
    </div>
  </section>

  <!-- SYSTEM CAPABILITIES -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">⚡ System Capabilities</h2>
    
    <div class="grid md:grid-cols-4 gap-4 mb-6">
      <Card class="text-center">
        <CardContent class="pt-6">
          <p class="text-3xl font-bold text-green-600">&lt;200ms</p>
          <p class="text-sm text-muted-foreground">Mobile Verification</p>
        </CardContent>
      </Card>
      <Card class="text-center">
        <CardContent class="pt-6">
          <p class="text-3xl font-bold text-blue-600">0ms</p>
          <p class="text-sm text-muted-foreground">Cold Start (Edge)</p>
        </CardContent>
      </Card>
      <Card class="text-center">
        <CardContent class="pt-6">
          <p class="text-3xl font-bold text-purple-600">100%</p>
          <p class="text-sm text-muted-foreground">Data Ownership</p>
        </CardContent>
      </Card>
      <Card class="text-center">
        <CardContent class="pt-6">
          <p class="text-3xl font-bold text-amber-600">99.9%</p>
          <p class="text-sm text-muted-foreground">Uptime SLA</p>
        </CardContent>
      </Card>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-muted/50">
            <th class="text-left py-3 px-4">Feature</th>
            <th class="text-center py-3 px-4">Traditional ID Shop</th>
            <th class="text-center py-3 px-4">Kanaya</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b">
            <td class="py-3 px-4">Template Design</td>
            <td class="py-3 px-4 text-center text-muted-foreground">Manual Photoshop (2-4 hrs)</td>
            <td class="py-3 px-4 text-center font-bold text-green-600">AI Decomposition (10 sec)</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4">Data Entry</td>
            <td class="py-3 px-4 text-center text-muted-foreground">Excel → Manual Copy</td>
            <td class="py-3 px-4 text-center font-bold text-green-600">Mobile Enrollment → Auto</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4">Photo Processing</td>
            <td class="py-3 px-4 text-center text-muted-foreground">SD Card + Manual Edit</td>
            <td class="py-3 px-4 text-center font-bold text-green-600">Phone Camera + AI Cleanup</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4">Lost Card Replacement</td>
            <td class="py-3 px-4 text-center text-muted-foreground">Re-shoot, Re-design (1-2 weeks)</td>
            <td class="py-3 px-4 text-center font-bold text-green-600">1-Click Reprint (1 hour)</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4">Verification</td>
            <td class="py-3 px-4 text-center text-muted-foreground">Visual Check Only</td>
            <td class="py-3 px-4 text-center font-bold text-green-600">QR/NFC + Cloud Verify</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4">Clone Protection</td>
            <td class="py-3 px-4 text-center text-muted-foreground">None (Easy to Photocopy)</td>
            <td class="py-3 px-4 text-center font-bold text-green-600">HMAC Crypto Signature</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4">Attendance Tracking</td>
            <td class="py-3 px-4 text-center text-muted-foreground">Not Offered</td>
            <td class="py-3 px-4 text-center font-bold text-green-600">Built-in SaaS + SMS</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- PRODUCT LINES AT A GLANCE -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">📦 Product Lines (Quick View)</h2>
    <p class="text-muted-foreground mb-4">Full details in <a href="/admin/docs/product-catalog" class="text-blue-600 underline">Product Catalog</a></p>
    
    <div class="grid md:grid-cols-3 gap-4">
      <Card>
        <CardHeader class="bg-blue-50 dark:bg-blue-900/20 pb-2">
          <CardTitle class="text-lg">💳 ID Cards</CardTitle>
        </CardHeader>
        <CardContent class="pt-4 text-sm">
          <ul class="space-y-1">
            <li>• Basic (Laminated) — ₱50-80</li>
            <li>• QR Encoded — ₱80-120</li>
            <li>• NFC Smart — ₱150-200</li>
            <li>• RFID Access — ₱180-250</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="bg-green-50 dark:bg-green-900/20 pb-2">
          <CardTitle class="text-lg">📊 Attendance SaaS</CardTitle>
        </CardHeader>
        <CardContent class="pt-4 text-sm">
          <ul class="space-y-1">
            <li>• QR System — ₱10-15/user/yr</li>
            <li>• RFID System — ₱15-25/user/yr</li>
            <li>• Biometric — ₱25-50/user/yr</li>
            <li>• SMS Add-on — ₱1.00/SMS</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="bg-purple-50 dark:bg-purple-900/20 pb-2">
          <CardTitle class="text-lg">🖥️ Hardware Bundles</CardTitle>
        </CardHeader>
        <CardContent class="pt-4 text-sm">
          <ul class="space-y-1">
            <li>• Tablet (Lite) — ₱12,000</li>
            <li>• QR Standard — ₱16,500</li>
            <li>• RFID Bundle — ₱19,000</li>
            <li>• Biometric — ₱30,000</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  </section>

  <!-- USE CASES -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">🎯 Target Markets</h2>
    <p class="text-muted-foreground mb-4">Full strategy in <a href="/admin/docs/strategy" class="text-blue-600 underline">Growth Strategy</a></p>
    
    <div class="grid md:grid-cols-6 gap-3 text-center text-sm">
      <div class="p-4 bg-muted rounded-lg">
        <p class="text-2xl mb-1">🎓</p>
        <p class="font-bold">Schools</p>
      </div>
      <div class="p-4 bg-muted rounded-lg">
        <p class="text-2xl mb-1">🏢</p>
        <p class="font-bold">Offices</p>
      </div>
      <div class="p-4 bg-muted rounded-lg">
        <p class="text-2xl mb-1">💪</p>
        <p class="font-bold">Gyms</p>
      </div>
      <div class="p-4 bg-muted rounded-lg">
        <p class="text-2xl mb-1">🏭</p>
        <p class="font-bold">Factories</p>
      </div>
      <div class="p-4 bg-muted rounded-lg">
        <p class="text-2xl mb-1">🏛️</p>
        <p class="font-bold">Government</p>
      </div>
      <div class="p-4 bg-muted rounded-lg">
        <p class="text-2xl mb-1">🎪</p>
        <p class="font-bold">Events</p>
      </div>
    </div>
  </section>

  <footer class="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
    <p>© 2026 Kanaya Identity Solutions • Product Overview</p>
    <p class="mt-2"><a href="/admin/docs" class="underline">← Back to Docs Hub</a></p>
  </footer>
</div>
