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
      <Tabs defaultValue="tier1" class="w-full">
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
                <li><strong>Write:</strong> Kanaya App > Admin > Write Card.</li>
                <li><strong>Tap:</strong> Hold at top-back of phone. Wait for "Locked" beep.</li>
                <li><strong>Verify:</strong> Scan with secondary device.</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>

    <div class="grid md:grid-cols-2 gap-8">
      <section>
        <h2 class="text-2xl font-bold mb-4">II. Throughput & Limits (Epson L8050)</h2>
        <Card>
          <CardContent class="prose dark:prose-invert pt-6">
            <ul>
              <li><strong>The Batching Protocol:</strong> Maximum 100 cards per continuous run.</li>
              <li><strong>Cooling Break:</strong> 15 minutes OFF after every 100 cards.</li>
              <li><strong>Reality Check:</strong> 500 IDs = 10-12 hours manual labor. Do not promise same-day bulk.</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 class="text-2xl font-bold mb-4">III. Equipment Maintenance</h2>
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
      <h2 class="text-2xl font-bold mb-4">IV. Troubleshooting</h2>
      <Card>
        <CardContent class="prose dark:prose-invert pt-6 grid md:grid-cols-2 gap-4">
          <div>
            <h4 class="font-bold text-red-500">Delamination</h4>
            <p>Laminator too cold (&#60;120°C).</p>
          </div>
          <div>
            <h4 class="font-bold text-red-500">Bubbles</h4>
            <p>Laminator too hot (&#62;160°C) or Ink not dry.</p>
          </div>
          <div>
            <h4 class="font-bold text-red-500">Warping</h4>
            <p>Cooling process skipped. Weight down immediately after heat.</p>
          </div>
          <div>
            <h4 class="font-bold text-red-500">Wrong Colors</h4>
            <p>Printed on wrong side of PVC sheet (Glossy peeling side vs Sticky side).</p>
          </div>
        </CardContent>
      </Card>
    </section>
  </div>
</div>
