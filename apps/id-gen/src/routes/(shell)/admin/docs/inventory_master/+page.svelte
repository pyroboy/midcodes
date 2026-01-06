<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "$lib/components/ui/table";
</script>

<div class="container mx-auto py-8">
  <h1 class="text-4xl font-bold mb-4">SECTION: INVENTORY_MASTER</h1>
  <p class="text-muted-foreground mb-8">📊 Master Inventory & Financial Table | Status: ACTIVE • Currency: PHP (₱) • Updated: Jan 2026</p>

  <div class="space-y-8">
    <section>
      <h2 class="text-2xl font-bold mb-4">1. CAPEX: Hardware & Terminals (One-Time Buy)</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item Name</TableHead>
            <TableHead>Spec / Model</TableHead>
            <TableHead>Unit Cost (Est.)</TableHead>
            <TableHead>Sell Price (Client)</TableHead>
            <TableHead>Margin</TableHead>
            <TableHead>Supplier</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell class="font-bold">Attendance Tablet</TableCell>
            <TableCell>Samsung Galaxy Tab A9+ (Wi-Fi, 4GB/64GB)</TableCell>
            <TableCell>₱ 13,500.00</TableCell>
            <TableCell>₱ 16,500.00</TableCell>
            <TableCell>18%</TableCell>
            <TableCell>Samsung Auth. Store</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-bold">Rugged Tablet</TableCell>
            <TableCell>Samsung Galaxy Tab Active4 Pro (IP68)</TableCell>
            <TableCell>₱ 38,200.00</TableCell>
            <TableCell>₱ 45,000.00</TableCell>
            <TableCell>15%</TableCell>
            <TableCell>Import / B2B Order</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-bold">QR Scanner</TableCell>
            <TableCell>NETUM Wireless 2D Scanner (Bluetooth)</TableCell>
            <TableCell>₱ 2,100.00</TableCell>
            <TableCell>₱ 3,500.00</TableCell>
            <TableCell>40%</TableCell>
            <TableCell>Shopee (Official)</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-bold">ID Printer (Tier 1)</TableCell>
            <TableCell>Epson L8050 (Modified for ID Tray)</TableCell>
            <TableCell>₱ 16,000.00</TableCell>
            <TableCell>N/A (Internal)</TableCell>
            <TableCell>—</TableCell>
            <TableCell>Shopee / Lazada</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-bold">ID Printer (Tier 2)</TableCell>
            <TableCell>IDP Smart-51S (Direct-to-Card)</TableCell>
            <TableCell>₱ 61,000.00</TableCell>
            <TableCell>N/A (Internal)</TableCell>
            <TableCell>—</TableCell>
            <TableCell>Philcopy Corp.</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-bold">Laminator</TableCell>
            <TableCell>Heavy Duty A3 Laminator (Temperature Ctr)</TableCell>
            <TableCell>₱ 3,500.00</TableCell>
            <TableCell>N/A (Internal)</TableCell>
            <TableCell>—</TableCell>
            <TableCell>Shopee / Local</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </section>

    <section>
      <h2 class="text-2xl font-bold mb-4">2. OPEX: Consumables (Per Unit Costs)</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU / Item</TableHead>
            <TableHead>Unit Size</TableHead>
            <TableHead>Purchase Price</TableHead>
            <TableHead>Yield (Est.)</TableHead>
            <TableHead>Cost Per ID</TableHead>
            <TableHead>Min. Stock</TableHead>
            <TableHead>Vendor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell class="font-bold">PVC Sheet (Dragon)</TableCell>
            <TableCell>Box (50 Sets)</TableCell>
            <TableCell>₱ 1,250.00</TableCell>
            <TableCell>500 IDs</TableCell>
            <TableCell class="font-bold">₱ 2.50</TableCell>
            <TableCell>5 Boxes</TableCell>
            <TableCell>Shopee (Quaff)</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-bold">Ink (Epson 057)</TableCell>
            <TableCell>Set (6 Bottles)</TableCell>
            <TableCell>₱ 1,800.00</TableCell>
            <TableCell>~3,000 IDs</TableCell>
            <TableCell class="font-bold">₱ 0.60</TableCell>
            <TableCell>1 Set</TableCell>
            <TableCell>Official Store</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-bold">Laminate Pouch</TableCell>
            <TableCell>Pack (100pcs)</TableCell>
            <TableCell>₱ 300.00</TableCell>
            <TableCell>100 IDs</TableCell>
            <TableCell class="font-bold">₱ 3.00</TableCell>
            <TableCell>5 Packs</TableCell>
            <TableCell>Shopee</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-bold">RFID Chip</TableCell>
            <TableCell>13.56MHz (Sticker)</TableCell>
            <TableCell>₱ 12.00 / pc</TableCell>
            <TableCell>1 ID</TableCell>
            <TableCell class="font-bold">₱ 12.00</TableCell>
            <TableCell>500 pcs</TableCell>
            <TableCell>Import / Lazada</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-bold">Lanyard (Outsourced)</TableCell>
            <TableCell>Finished Piece</TableCell>
            <TableCell>₱ 40.00 / pc</TableCell>
            <TableCell>1 ID</TableCell>
            <TableCell class="font-bold">₱ 40.00</TableCell>
            <TableCell>—</TableCell>
            <TableCell>Cebu Supplier</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-bold">ID Case</TableCell>
            <TableCell>Hard Plastic</TableCell>
            <TableCell>₱ 5.00 / pc</TableCell>
            <TableCell>1 ID</TableCell>
            <TableCell class="font-bold">₱ 5.00</TableCell>
            <TableCell>500 pcs</TableCell>
            <TableCell>Divisoria / Bulk</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </section>

    <section>
      <h2 class="text-2xl font-bold mb-4">3. Product Pricing (What We Charge)</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service / Product</TableHead>
            <TableHead>Target Client</TableHead>
            <TableHead>Unit Price (PHP)</TableHead>
            <TableHead>COGS (Est.)</TableHead>
            <TableHead>Gross Profit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell class="font-bold">Tier 1 ID (Standard)</TableCell>
            <TableCell>Schools / Bulk</TableCell>
            <TableCell class="font-bold">₱ 150.00</TableCell>
            <TableCell>₱ 15.00</TableCell>
            <TableCell>₱ 135.00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-bold">Tier 1 + RFID</TableCell>
            <TableCell>Private Schools</TableCell>
            <TableCell class="font-bold">₱ 250.00</TableCell>
            <TableCell>₱ 27.00</TableCell>
            <TableCell>₱ 223.00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-bold">Tier 2 ID (Thermal)</TableCell>
            <TableCell>Corporate / Rush</TableCell>
            <TableCell class="font-bold">₱ 350.00</TableCell>
            <TableCell>₱ 45.00</TableCell>
            <TableCell>₱ 305.00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-bold">Lanyard (Custom)</TableCell>
            <TableCell>Add-on</TableCell>
            <TableCell class="font-bold">₱ 75.00</TableCell>
            <TableCell>₱ 40.00</TableCell>
            <TableCell>₱ 35.00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-bold">SaaS Subscription</TableCell>
            <TableCell>School Admin</TableCell>
            <TableCell class="font-bold">₱ 10.00 /yr</TableCell>
            <TableCell>₱ 0.00</TableCell>
            <TableCell>₱ 10.00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-bold">SMS Notification</TableCell>
            <TableCell>Parent Alert</TableCell>
            <TableCell class="font-bold">₱ 1.00 /sms</TableCell>
            <TableCell>₱ 0.60</TableCell>
            <TableCell>₱ 0.40</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-bold">Lost Card Replace</TableCell>
            <TableCell>Student</TableCell>
            <TableCell class="font-bold">₱ 150.00</TableCell>
            <TableCell>₱ 15.00</TableCell>
            <TableCell>₱ 135.00</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </section>

    <Card>
      <CardHeader>
        <CardTitle>4. Supplier Speed Dial (Restricted)</CardTitle>
      </CardHeader>
      <CardContent class="prose dark:prose-invert max-w-none">
        <ul>
          <li><strong>Supplier 1 (Rush/PVC):</strong> 0917-XXX-XXXX [Manila Source]</li>
          <li><strong>Supplier 2 (Lanyards):</strong> 0922-XXX-XXXX [Cebu Source]</li>
          <li><strong>Printer Technician:</strong> 09XX-XXX-XXXX [Local Tagbilaran]</li>
        </ul>
      </CardContent>
    </Card>
  </div>
</div>
