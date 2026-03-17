<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
</script>

<svelte:head>
  <title>Attendance System Pricing | Admin Docs</title>
</svelte:head>

<div class="container mx-auto py-8 max-w-6xl">
  <header class="mb-8">
    <h1 class="text-4xl font-bold mb-2">ATTENDANCE SYSTEM PRICING</h1>
    <p class="text-muted-foreground">SaaS Subscriptions, Hardware Bundles & SMS Economics</p>
    <div class="inline-block mt-3 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-semibold">
      Source of Truth | January 2026
    </div>
  </header>

  <!-- QUICK REFERENCE -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">Quick Reference Pricing</h2>
    <div class="grid md:grid-cols-4 gap-4">
      <Card class="border-l-4 border-l-blue-500">
        <CardContent class="pt-4 text-center">
          <p class="text-sm text-muted-foreground">QR Attendance</p>
          <p class="text-3xl font-bold text-blue-600">₱10-15</p>
          <p class="text-xs">/user/year</p>
        </CardContent>
      </Card>
      <Card class="border-l-4 border-l-green-500">
        <CardContent class="pt-4 text-center">
          <p class="text-sm text-muted-foreground">RFID Attendance</p>
          <p class="text-3xl font-bold text-green-600">₱15-25</p>
          <p class="text-xs">/user/year</p>
        </CardContent>
      </Card>
      <Card class="border-l-4 border-l-purple-500">
        <CardContent class="pt-4 text-center">
          <p class="text-sm text-muted-foreground">Biometric</p>
          <p class="text-3xl font-bold text-purple-600">₱25-50</p>
          <p class="text-xs">/user/year</p>
        </CardContent>
      </Card>
      <Card class="border-l-4 border-l-amber-500">
        <CardContent class="pt-4 text-center">
          <p class="text-sm text-muted-foreground">SMS Add-on</p>
          <p class="text-3xl font-bold text-amber-600">₱1.00</p>
          <p class="text-xs">/SMS or bundled</p>
        </CardContent>
      </Card>
    </div>
  </section>

  <!-- SAAS PRICING BY READER -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">1. SaaS Pricing by Reader Type</h2>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-muted/50">
            <th class="text-left py-3 px-4">Reader Type</th>
            <th class="text-right py-3 px-4">Schools</th>
            <th class="text-right py-3 px-4">Offices</th>
            <th class="text-right py-3 px-4">Factories</th>
            <th class="text-right py-3 px-4">Events</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">QR Code Only</td>
            <td class="py-3 px-4 text-right">₱10/user/yr</td>
            <td class="py-3 px-4 text-right">₱15/user/yr</td>
            <td class="py-3 px-4 text-right">₱12/user/yr</td>
            <td class="py-3 px-4 text-right">₱5/event</td>
          </tr>
          <tr class="border-b bg-muted/30">
            <td class="py-3 px-4 font-bold">RFID Card</td>
            <td class="py-3 px-4 text-right">₱15/user/yr</td>
            <td class="py-3 px-4 text-right">₱20/user/yr</td>
            <td class="py-3 px-4 text-right">₱18/user/yr</td>
            <td class="py-3 px-4 text-right">₱8/event</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">NFC Tap</td>
            <td class="py-3 px-4 text-right">₱15/user/yr</td>
            <td class="py-3 px-4 text-right">₱25/user/yr</td>
            <td class="py-3 px-4 text-right">₱18/user/yr</td>
            <td class="py-3 px-4 text-right">₱10/event</td>
          </tr>
          <tr class="border-b bg-muted/30">
            <td class="py-3 px-4 font-bold">QR + RFID</td>
            <td class="py-3 px-4 text-right">₱20/user/yr</td>
            <td class="py-3 px-4 text-right">₱30/user/yr</td>
            <td class="py-3 px-4 text-right">₱25/user/yr</td>
            <td class="py-3 px-4 text-right">₱12/event</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">Biometric (Fingerprint)</td>
            <td class="py-3 px-4 text-right">₱25/user/yr</td>
            <td class="py-3 px-4 text-right">₱40/user/yr</td>
            <td class="py-3 px-4 text-right">₱35/user/yr</td>
            <td class="py-3 px-4 text-right text-muted-foreground">N/A</td>
          </tr>
          <tr class="border-b bg-purple-50 dark:bg-purple-900/10">
            <td class="py-3 px-4 font-bold">Full Suite (All Readers)</td>
            <td class="py-3 px-4 text-right font-bold">₱40/user/yr</td>
            <td class="py-3 px-4 text-right font-bold">₱60/user/yr</td>
            <td class="py-3 px-4 text-right font-bold">₱50/user/yr</td>
            <td class="py-3 px-4 text-right text-muted-foreground">N/A</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded text-sm">
      <strong>⚠️ Note:</strong> SMS is NOT included in any tier. SMS is always a separate add-on (see Section 3).
    </div>
  </section>

  <!-- SECTOR PACKAGES -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">2. Sector-Specific Packages</h2>
    
    <div class="grid md:grid-cols-2 gap-6">
      <!-- Schools -->
      <Card>
        <CardHeader class="bg-blue-50 dark:bg-blue-900/20">
          <CardTitle>🎓 Schools & Universities</CardTitle>
        </CardHeader>
        <CardContent class="pt-4">
          <table class="w-full text-sm">
            <tbody>
              <tr class="border-b">
                <td class="py-2 font-bold">Student QR Basic</td>
                <td class="py-2 text-right">₱10/student/yr</td>
              </tr>
              <tr class="border-b">
                <td class="py-2 font-bold">Student Standard (QR+RFID)</td>
                <td class="py-2 text-right">₱20/student/yr</td>
              </tr>
              <tr class="border-b">
                <td class="py-2 font-bold">Student + Staff Bundle</td>
                <td class="py-2 text-right">₱25/user avg</td>
              </tr>
              <tr class="border-b bg-green-50 dark:bg-green-900/10">
                <td class="py-2 font-bold">Minimum Annual</td>
                <td class="py-2 text-right font-bold">₱5,000 or 50+ users</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <!-- Offices -->
      <Card>
        <CardHeader class="bg-green-50 dark:bg-green-900/20">
          <CardTitle>🏢 Offices & Businesses</CardTitle>
        </CardHeader>
        <CardContent class="pt-4">
          <table class="w-full text-sm">
            <tbody>
              <tr class="border-b">
                <td class="py-2 font-bold">Staff QR</td>
                <td class="py-2 text-right">₱15/staff/yr</td>
              </tr>
              <tr class="border-b">
                <td class="py-2 font-bold">Staff RFID</td>
                <td class="py-2 text-right">₱25/staff/yr</td>
              </tr>
              <tr class="border-b">
                <td class="py-2 font-bold">Staff Biometric</td>
                <td class="py-2 text-right">₱50/staff/yr</td>
              </tr>
              <tr class="border-b bg-green-50 dark:bg-green-900/10">
                <td class="py-2 font-bold">Minimum Annual</td>
                <td class="py-2 text-right font-bold">₱3,000 or 20+ users</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <!-- Factories -->
      <Card>
        <CardHeader class="bg-amber-50 dark:bg-amber-900/20">
          <CardTitle>🏭 Factories & Warehouses</CardTitle>
        </CardHeader>
        <CardContent class="pt-4">
          <table class="w-full text-sm">
            <tbody>
              <tr class="border-b">
                <td class="py-2 font-bold">Worker RFID</td>
                <td class="py-2 text-right">₱18/worker/yr</td>
              </tr>
              <tr class="border-b">
                <td class="py-2 font-bold">Worker Biometric</td>
                <td class="py-2 text-right">₱40/worker/yr</td>
              </tr>
              <tr class="border-b">
                <td class="py-2 font-bold">Multi-Gate System</td>
                <td class="py-2 text-right">₱50/worker/yr</td>
              </tr>
              <tr class="border-b bg-green-50 dark:bg-green-900/10">
                <td class="py-2 font-bold">Minimum Annual</td>
                <td class="py-2 text-right font-bold">₱5,000 or 50+ users</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <!-- LGU -->
      <Card>
        <CardHeader class="bg-purple-50 dark:bg-purple-900/20">
          <CardTitle>🏛️ LGU & Government</CardTitle>
        </CardHeader>
        <CardContent class="pt-4">
          <table class="w-full text-sm">
            <tbody>
              <tr class="border-b">
                <td class="py-2 font-bold">Barangay Attendance</td>
                <td class="py-2 text-right">₱8/user/yr</td>
              </tr>
              <tr class="border-b">
                <td class="py-2 font-bold">PWD/Senior Check-in</td>
                <td class="py-2 text-right">₱5/user/yr</td>
              </tr>
              <tr class="border-b">
                <td class="py-2 font-bold">Government Office</td>
                <td class="py-2 text-right">₱30/user/yr</td>
              </tr>
              <tr class="border-b bg-green-50 dark:bg-green-900/10">
                <td class="py-2 font-bold">Agency Contract</td>
                <td class="py-2 text-right font-bold">Custom quote</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>

    <!-- Events -->
    <Card class="mt-6">
      <CardHeader class="bg-red-50 dark:bg-red-900/20">
        <CardTitle>🎪 Events & Visitor Management</CardTitle>
      </CardHeader>
      <CardContent class="pt-4">
        <div class="grid md:grid-cols-3 gap-4">
          <div class="p-4 bg-muted rounded-lg text-center">
            <p class="font-bold">Per Event</p>
            <p class="text-2xl font-bold text-red-600">₱500 + ₱2/visitor</p>
            <p class="text-xs text-muted-foreground">Conferences, seminars</p>
          </div>
          <div class="p-4 bg-muted rounded-lg text-center">
            <p class="font-bold">Monthly Visitor</p>
            <p class="text-2xl font-bold text-red-600">₱5/visitor/mo</p>
            <p class="text-xs text-muted-foreground">Building lobbies</p>
          </div>
          <div class="p-4 bg-muted rounded-lg text-center">
            <p class="font-bold">Annual System</p>
            <p class="text-2xl font-bold text-red-600">₱10,000 + ₱3/visitor</p>
            <p class="text-xs text-muted-foreground">Corporate buildings</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </section>

  <!-- SMS ECONOMICS -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">3. SMS Economics (Critical Pricing)</h2>
    
    <div class="grid md:grid-cols-2 gap-6 mb-6">
      <Card class="border-2 border-red-300 dark:border-red-700">
        <CardHeader class="bg-red-50 dark:bg-red-900/20">
          <CardTitle>⚠️ SMS Cost Reality</CardTitle>
        </CardHeader>
        <CardContent class="pt-4">
          <table class="w-full text-sm">
            <tbody>
              <tr class="border-b">
                <td class="py-2">Our SMS Cost</td>
                <td class="py-2 text-right font-bold">₱0.60/SMS</td>
              </tr>
              <tr class="border-b">
                <td class="py-2">Our Sell Price</td>
                <td class="py-2 text-right font-bold">₱1.00/SMS</td>
              </tr>
              <tr class="border-b bg-green-50 dark:bg-green-900/10">
                <td class="py-2">Profit per SMS</td>
                <td class="py-2 text-right font-bold text-green-600">₱0.40 (40%)</td>
              </tr>
            </tbody>
          </table>
          <div class="mt-4 p-3 bg-red-100 dark:bg-red-900/30 rounded text-xs">
            <strong>⚠️ Never include "unlimited SMS" in SaaS!</strong><br/>
            440 SMS/student/year × ₱0.60 = ₱264 cost. This would destroy margins.
          </div>
        </CardContent>
      </Card>

      <Card class="border-2 border-green-300 dark:border-green-700">
        <CardHeader class="bg-green-50 dark:bg-green-900/20">
          <CardTitle>💰 SMS Revenue Potential</CardTitle>
        </CardHeader>
        <CardContent class="pt-4">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b">
                <th class="text-left py-2">School Size</th>
                <th class="text-right py-2">SMS/Year</th>
                <th class="text-right py-2">Profit</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b">
                <td class="py-2">100 students</td>
                <td class="py-2 text-right">44,000</td>
                <td class="py-2 text-right font-bold text-green-600">₱17,600</td>
              </tr>
              <tr class="border-b">
                <td class="py-2">300 students</td>
                <td class="py-2 text-right">132,000</td>
                <td class="py-2 text-right font-bold text-green-600">₱52,800</td>
              </tr>
              <tr class="border-b">
                <td class="py-2">500 students</td>
                <td class="py-2 text-right">220,000</td>
                <td class="py-2 text-right font-bold text-green-600">₱88,000</td>
              </tr>
            </tbody>
          </table>
          <p class="mt-3 text-xs text-muted-foreground">Based on 2 SMS/day × 22 days × 10 months</p>
        </CardContent>
      </Card>
    </div>

    <!-- SMS Packages -->
    <h3 class="font-bold text-lg mb-3">SMS Packages (Sold Separately)</h3>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-muted/50">
            <th class="text-left py-3 px-4">Package</th>
            <th class="text-right py-3 px-4">Price</th>
            <th class="text-right py-3 px-4">SMS Count</th>
            <th class="text-right py-3 px-4">Cost/SMS</th>
            <th class="text-right py-3 px-4">Our Profit</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">Pay-as-you-go</td>
            <td class="py-3 px-4 text-right">₱1.00/SMS</td>
            <td class="py-3 px-4 text-right">1</td>
            <td class="py-3 px-4 text-right">₱1.00</td>
            <td class="py-3 px-4 text-right text-green-600">₱0.40</td>
          </tr>
          <tr class="border-b bg-muted/30">
            <td class="py-3 px-4 font-bold">Starter (50)</td>
            <td class="py-3 px-4 text-right">₱45</td>
            <td class="py-3 px-4 text-right">50</td>
            <td class="py-3 px-4 text-right">₱0.90</td>
            <td class="py-3 px-4 text-right text-green-600">₱15</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">Standard (100)</td>
            <td class="py-3 px-4 text-right">₱80</td>
            <td class="py-3 px-4 text-right">100</td>
            <td class="py-3 px-4 text-right">₱0.80</td>
            <td class="py-3 px-4 text-right text-green-600">₱20</td>
          </tr>
          <tr class="border-b bg-muted/30">
            <td class="py-3 px-4 font-bold">Value (300)</td>
            <td class="py-3 px-4 text-right">₱210</td>
            <td class="py-3 px-4 text-right">300</td>
            <td class="py-3 px-4 text-right">₱0.70</td>
            <td class="py-3 px-4 text-right text-green-600">₱30</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">Bulk (500)</td>
            <td class="py-3 px-4 text-right">₱300</td>
            <td class="py-3 px-4 text-right">500</td>
            <td class="py-3 px-4 text-right">₱0.60</td>
            <td class="py-3 px-4 text-right text-amber-600">₱0 (loyalty)</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
      <h4 class="font-bold mb-2">💡 Parent-Paid SMS Model (Recommended)</h4>
      <p class="text-sm">Let parents pay SMS directly: ₱20-30/month per student. School pays only for SaaS (₱10-20/student/year). This separates revenue streams and avoids SMS cost liability.</p>
    </div>
  </section>

  <!-- HARDWARE BUNDLES -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">4. Hardware Bundles (One-Time Sale)</h2>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-muted/50">
            <th class="text-left py-3 px-4">Bundle</th>
            <th class="text-left py-3 px-4">Contents</th>
            <th class="text-right py-3 px-4">Our Cost</th>
            <th class="text-right py-3 px-4">Sell Price</th>
            <th class="text-right py-3 px-4">Profit</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">Lite</td>
            <td class="py-3 px-4">Tablet only (phone used as scanner)</td>
            <td class="py-3 px-4 text-right">~₱9,000</td>
            <td class="py-3 px-4 text-right">₱12,000</td>
            <td class="py-3 px-4 text-right text-green-600">₱3,000</td>
          </tr>
          <tr class="border-b bg-muted/30">
            <td class="py-3 px-4 font-bold">QR Standard ⭐</td>
            <td class="py-3 px-4">Tablet + QR Scanner + Stand</td>
            <td class="py-3 px-4 text-right">~₱11,500</td>
            <td class="py-3 px-4 text-right">₱16,500</td>
            <td class="py-3 px-4 text-right text-green-600">₱5,000</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">RFID Standard</td>
            <td class="py-3 px-4">Tablet + RFID Reader</td>
            <td class="py-3 px-4 text-right">~₱14,000</td>
            <td class="py-3 px-4 text-right">₱19,000</td>
            <td class="py-3 px-4 text-right text-green-600">₱5,000</td>
          </tr>
          <tr class="border-b bg-muted/30">
            <td class="py-3 px-4 font-bold">Dual Reader</td>
            <td class="py-3 px-4">Tablet + QR + RFID</td>
            <td class="py-3 px-4 text-right">~₱17,000</td>
            <td class="py-3 px-4 text-right">₱22,000</td>
            <td class="py-3 px-4 text-right text-green-600">₱5,000</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">Biometric</td>
            <td class="py-3 px-4">Tablet + Fingerprint Scanner</td>
            <td class="py-3 px-4 text-right">~₱22,000</td>
            <td class="py-3 px-4 text-right">₱30,000</td>
            <td class="py-3 px-4 text-right text-green-600">₱8,000</td>
          </tr>
          <tr class="border-b bg-purple-50 dark:bg-purple-900/10">
            <td class="py-3 px-4 font-bold">Full Suite</td>
            <td class="py-3 px-4">Tablet + QR + RFID + Biometric</td>
            <td class="py-3 px-4 text-right">~₱28,000</td>
            <td class="py-3 px-4 text-right">₱40,000</td>
            <td class="py-3 px-4 text-right text-green-600">₱12,000</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">Gate Turnstile</td>
            <td class="py-3 px-4">Turnstile + RFID + Controller</td>
            <td class="py-3 px-4 text-right">~₱60,000</td>
            <td class="py-3 px-4 text-right">₱80,000+</td>
            <td class="py-3 px-4 text-right text-green-600">₱20,000+</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- ADD-ONS -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">5. Add-Ons & Insurance</h2>
    <div class="grid md:grid-cols-3 gap-4">
      <Card>
        <CardContent class="pt-4 text-center">
          <p class="text-3xl mb-2">🛡️</p>
          <p class="font-bold">Lost Card Insurance</p>
          <p class="text-2xl font-bold text-blue-600">₱5/head/year</p>
          <p class="text-xs text-muted-foreground">1 free replacement per year</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-4 text-center">
          <p class="text-3xl mb-2">⚡</p>
          <p class="font-bold">Priority Support</p>
          <p class="text-2xl font-bold text-green-600">₱500/month</p>
          <p class="text-xs text-muted-foreground">24hr response SLA</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-4 text-center">
          <p class="text-3xl mb-2">🔗</p>
          <p class="font-bold">API Access</p>
          <p class="text-2xl font-bold text-purple-600">₱2,000/month</p>
          <p class="text-xs text-muted-foreground">Integration with existing systems</p>
        </CardContent>
      </Card>
    </div>
  </section>

  <!-- REVENUE CALCULATOR -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">6. Revenue Calculator (Per Client)</h2>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-muted/50">
            <th class="text-left py-3 px-4">Component</th>
            <th class="text-right py-3 px-4">100 Users (Small)</th>
            <th class="text-right py-3 px-4">300 Users (Medium)</th>
            <th class="text-right py-3 px-4">500 Users (Large)</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">Hardware (one-time)</td>
            <td class="py-3 px-4 text-right">₱16,500</td>
            <td class="py-3 px-4 text-right">₱22,000</td>
            <td class="py-3 px-4 text-right">₱40,000</td>
          </tr>
          <tr class="border-b bg-muted/30">
            <td class="py-3 px-4 font-bold">SaaS (₱20/user/yr)</td>
            <td class="py-3 px-4 text-right">₱2,000</td>
            <td class="py-3 px-4 text-right">₱6,000</td>
            <td class="py-3 px-4 text-right">₱10,000</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">SMS Profit (if parent-paid)</td>
            <td class="py-3 px-4 text-right">₱17,600</td>
            <td class="py-3 px-4 text-right">₱52,800</td>
            <td class="py-3 px-4 text-right">₱88,000</td>
          </tr>
          <tr class="border-b bg-muted/30">
            <td class="py-3 px-4 font-bold">Insurance (₱5/head)</td>
            <td class="py-3 px-4 text-right">₱500</td>
            <td class="py-3 px-4 text-right">₱1,500</td>
            <td class="py-3 px-4 text-right">₱2,500</td>
          </tr>
          <tr class="border-b bg-green-100 dark:bg-green-900/20">
            <td class="py-3 px-4 font-bold">Year 1 Total</td>
            <td class="py-3 px-4 text-right font-bold text-green-600">₱36,600</td>
            <td class="py-3 px-4 text-right font-bold text-green-600">₱82,300</td>
            <td class="py-3 px-4 text-right font-bold text-green-600">₱140,500</td>
          </tr>
          <tr class="border-b bg-blue-100 dark:bg-blue-900/20">
            <td class="py-3 px-4 font-bold">Year 2+ Recurring</td>
            <td class="py-3 px-4 text-right font-bold text-blue-600">₱20,100</td>
            <td class="py-3 px-4 text-right font-bold text-blue-600">₱60,300</td>
            <td class="py-3 px-4 text-right font-bold text-blue-600">₱100,500</td>
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
