<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
</script>

<div class="container mx-auto py-8">
  <h1 class="text-4xl font-bold mb-8">SECTION: MASTER_DATA</h1>
  <p class="text-muted-foreground mb-8">Global Constants & Pricing Engine | Status: LIVE • Source: Business Plan v6.0</p>

  <div class="grid gap-6">
    <Card>
      <CardHeader>
        <CardTitle>I. Product Tiers (Nomenclature Standard)</CardTitle>
      </CardHeader>
      <CardContent class="prose dark:prose-invert max-w-none">
        <p>We strictly use Tiers 1-3 to avoid "High/Low" confusion.</p>
        
        <div class="space-y-4 mt-4">
          <div>
            <h3 class="font-bold">Tier 1: Inkjet Sandwich (The Standard)</h3>
            <ul>
              <li><strong>Tech:</strong> Epson L8050 + Laminate + PVC Core</li>
              <li><strong>Target:</strong> Schools, Employees, Bulk</li>
              <li><strong>Cost (COGS):</strong> ₱5.80 (Basic) / ₱19.80 (RFID)</li>
              <li><strong>Sell Price:</strong> ₱150.00</li>
              <li><strong>Lead Time:</strong> 3-5 Days</li>
            </ul>
          </div>

          <div>
            <h3 class="font-bold">Tier 2: Thermal DTC (The Corporate)</h3>
            <ul>
              <li><strong>Tech:</strong> IDP Smart-51S / Magicard (Ribbon)</li>
              <li><strong>Target:</strong> Banks, Government, VIP</li>
              <li><strong>Cost (COGS):</strong> ₱22.00 (Ribbon cost)</li>
              <li><strong>Sell Price:</strong> ₱250.00+</li>
              <li><strong>Lead Time:</strong> On-the-spot</li>
            </ul>
          </div>

          <div>
            <h3 class="font-bold">Tier 3: Industrial UV (The Specialist)</h3>
            <ul>
              <li><strong>Tech:</strong> Flatbed UV (Cured Ink)</li>
              <li><strong>Target:</strong> Tactile/Embossed Cards, Signage</li>
              <li><strong>Sell Price:</strong> Custom Quote</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>II. Service & SaaS Pricing</CardTitle>
      </CardHeader>
      <CardContent class="prose dark:prose-invert max-w-none">
        <ul>
          <li><strong>SaaS Subscription:</strong> ₱10.00 per student/year</li>
          <li><strong>SMS Cost (Pass-through):</strong> ₱0.60 per SMS</li>
          <li><strong>SMS Sell Price:</strong> ₱1.00 per SMS (or bundled)</li>
          <li><strong>Lost Card Insurance:</strong> ₱5.00 per head/year</li>
        </ul>
      </CardContent>
    </Card>
  </div>

  <p class="mt-8 italic text-sm text-muted-foreground text-center">Kanaya Master Data • Do Not duplicate these numbers elsewhere.</p>
</div>
