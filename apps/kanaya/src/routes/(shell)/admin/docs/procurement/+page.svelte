<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
</script>

<div class="container mx-auto py-8">
  <h1 class="text-4xl font-bold mb-4">SECTION: PROCUREMENT</h1>
  <p class="text-muted-foreground mb-8">Strategic Procurement & Supply Chain | Reference: See <a href="/admin/docs/inventory_master" class="text-primary hover:underline">inventory_master</a> for live costs.</p>

  <div class="grid gap-8">
    <section>
      <h2 class="text-2xl font-bold mb-4">I. Technology Tiers & Sourcing</h2>
      <div class="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Tier 1: Inkjet Sandwich (The Revenue Engine)</CardTitle>
          </CardHeader>
          <CardContent class="prose dark:prose-invert">
            <ul>
              <li><strong>Definition:</strong> Modified Epson L8050 printing on "Inkjet Printable PVC".</li>
              <li><strong>Why we use it:</strong> Lowest COGS (₱5.80). Highest Margin.</li>
              <li><strong>Sourcing:</strong>
                <ul>
                  <li><em>Printer:</em> Shopee/Lazada (Search "L8050 CD Tray Mod").</li>
                  <li><em>Materials:</em> "Dragon Sheet" or "Quaff" PVC. STRICTLY "Inkjet Printable".</li>
                </ul>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Tier 2: Thermal DTC (The Corporate Standard)</CardTitle>
          </CardHeader>
          <CardContent class="prose dark:prose-invert">
            <ul>
              <li><strong>Definition:</strong> IDP Smart-51S or Magicard utilizing Ribbon transfer.</li>
              <li><strong>Why we use it:</strong> Instant issuance, Edge-to-Edge protection, UV Security Ribbon.</li>
              <li><strong>Sourcing:</strong>
                <ul>
                  <li><em>Primary:</em> Philcopy Corp (IDP). Best warranty.</li>
                  <li><em>Secondary:</em> CCS (Magicard). Good for HoloKote.</li>
                </ul>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Tier 3: Industrial UV (Specialist)</CardTitle>
          </CardHeader>
          <CardContent class="prose dark:prose-invert">
            <ul>
              <li><strong>Definition:</strong> XP600 Flatbed with LED Curing.</li>
              <li><strong>Why we use it:</strong> Tactile 3D effects. Durable outdoor signage.</li>
              <li><strong>Sourcing:</strong> Photolock (Cuyi) or Direct Import.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>

    <section>
      <h2 class="text-2xl font-bold mb-4">II. Raw Material Supply Chain</h2>
      <Card>
        <CardContent class="prose dark:prose-invert pt-6">
          <ul>
            <li><strong>PVC Sheets:</strong> Buy in boxes of 50 sets (500 IDs). Reorder at 5 packs.</li>
            <li><strong>Inks:</strong> Epson 057 (Genuine preferred for print head life).</li>
            <li><strong>RFID Chips:</strong> Import direct or bulk buy from CCS. Test 1pc per batch before printing.</li>
          </ul>
        </CardContent>
      </Card>
    </section>
  </div>
</div>
