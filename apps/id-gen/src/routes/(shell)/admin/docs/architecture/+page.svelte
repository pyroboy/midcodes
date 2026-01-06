<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
</script>

<svelte:head>
  <title>System Architecture | Kanaya Admin</title>
</svelte:head>

<div class="container mx-auto py-8 max-w-5xl">
  <header class="mb-8">
    <h1 class="text-4xl font-bold mb-2">SYSTEM ARCHITECTURE</h1>
    <p class="text-muted-foreground">Technical Documentation | Stack, Security, Database & API</p>
    <div class="inline-block mt-3 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-semibold">
      Developer Reference | January 2026
    </div>
  </header>

  <!-- TABLE OF CONTENTS -->
  <nav class="mb-10 p-4 bg-muted rounded-lg">
    <h2 class="text-lg font-bold mb-3">System Blueprints</h2>
    <ol class="grid md:grid-cols-2 gap-2 text-sm">
      <li><a href="#stack" class="text-blue-600 hover:underline">1. Technology Stack</a></li>
      <li><a href="#auth" class="text-blue-600 hover:underline">2. Authentication & RBAC</a></li>
      <li><a href="#database" class="text-blue-600 hover:underline">3. Database Schema</a></li>
      <li><a href="#storage" class="text-blue-600 hover:underline">4. Asset Storage (R2)</a></li>
      <li><a href="#canvas" class="text-blue-600 hover:underline">5. ID Card Canvas Engine</a></li>
      <li><a href="#security" class="text-blue-600 hover:underline">6. NFC/QR Security</a></li>
      <li><a href="#api" class="text-blue-600 hover:underline">7. API & Remote Functions</a></li>
      <li><a href="#offline" class="text-blue-600 hover:underline">8. Offline/PWA Mode</a></li>
      <li><a href="#attendance" class="text-blue-600 hover:underline">9. Attendance System + SMS</a></li>
    </ol>
  </nav>

  <!-- 1. TECHNOLOGY STACK -->
  <section id="stack" class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">1. Technology Stack</h2>
    <p class="text-muted-foreground mb-6">Edge-first architecture for low latency in Philippines/SE Asia.</p>
    
    <div class="grid md:grid-cols-3 gap-4 mb-6">
      <Card class="border-l-4 border-l-orange-500">
        <CardHeader class="pb-2">
          <CardTitle class="text-lg">🎨 Frontend</CardTitle>
        </CardHeader>
        <CardContent class="text-sm">
          <p class="font-bold text-orange-600 mb-2">SvelteKit 2.x + Tailwind 4.x</p>
          <ul class="space-y-1 text-muted-foreground">
            <li>• Svelte 5 runes for reactivity</li>
            <li>• shadcn-svelte + bits-ui components</li>
            <li>• Threlte (Three.js) for 3D previews</li>
            <li>• sveltekit-superforms + Zod</li>
          </ul>
        </CardContent>
      </Card>

      <Card class="border-l-4 border-l-blue-500">
        <CardHeader class="pb-2">
          <CardTitle class="text-lg">⚡ Backend</CardTitle>
        </CardHeader>
        <CardContent class="text-sm">
          <p class="font-bold text-blue-600 mb-2">Cloudflare Pages + Workers</p>
          <ul class="space-y-1 text-muted-foreground">
            <li>• Zero cold-start for scan verification</li>
            <li>• Edge deployment (global)</li>
            <li>• Node.js 20.x runtime</li>
            <li>• Vercel alternative deployment</li>
          </ul>
        </CardContent>
      </Card>

      <Card class="border-l-4 border-l-green-500">
        <CardHeader class="pb-2">
          <CardTitle class="text-lg">🗄️ Database</CardTitle>
        </CardHeader>
        <CardContent class="text-sm">
          <p class="font-bold text-green-600 mb-2">Neon PostgreSQL + Drizzle ORM</p>
          <ul class="space-y-1 text-muted-foreground">
            <li>• Serverless Postgres (auto-scaling)</li>
            <li>• Drizzle for type-safe queries</li>
            <li>• Strict foreign key relationships</li>
            <li>• JSONB for flexible data</li>
          </ul>
        </CardContent>
      </Card>
    </div>

    <div class="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-lg">🔐 Authentication</CardTitle>
        </CardHeader>
        <CardContent class="text-sm">
          <p class="font-bold text-purple-600 mb-2">Better Auth</p>
          <ul class="space-y-1 text-muted-foreground">
            <li>• Email/password + OAuth providers</li>
            <li>• Lazy initialization for Workers</li>
            <li>• Session-based auth</li>
            <li>• Located: <code class="text-xs bg-muted px-1 rounded">src/lib/server/auth.ts</code></li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-lg">☁️ Storage</CardTitle>
        </CardHeader>
        <CardContent class="text-sm">
          <p class="font-bold text-amber-600 mb-2">Cloudflare R2 (S3-compatible)</p>
          <ul class="space-y-1 text-muted-foreground">
            <li>• Template images & assets</li>
            <li>• Profile photos (per org)</li>
            <li>• AI decomposition outputs</li>
            <li>• Image proxy for CORS handling</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  </section>

  <!-- 2. AUTHENTICATION & RBAC -->
  <section id="auth" class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">2. Authentication & RBAC</h2>
    
    <div class="grid md:grid-cols-2 gap-6 mb-6">
      <Card>
        <CardHeader>
          <CardTitle>🔑 Auth Flow</CardTitle>
        </CardHeader>
        <CardContent class="text-sm">
          <ol class="list-decimal pl-4 space-y-2">
            <li>Request hits <code class="text-xs bg-muted px-1 rounded">src/hooks.server.ts</code></li>
            <li>Better Auth validates session cookie</li>
            <li>User + org data attached to <code class="text-xs bg-muted px-1 rounded">event.locals</code></li>
            <li>Page/form actions check permissions</li>
            <li>All data scoped by <code class="text-xs bg-muted px-1 rounded">org_id</code></li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>👥 Role-Based Access Control</CardTitle>
        </CardHeader>
        <CardContent class="text-sm">
          <table class="w-full">
            <thead>
              <tr class="border-b">
                <th class="text-left py-2">Role</th>
                <th class="text-left py-2">Permissions</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b">
                <td class="py-2 font-bold">super_admin</td>
                <td class="py-2 text-muted-foreground">All orgs, system settings</td>
              </tr>
              <tr class="border-b">
                <td class="py-2 font-bold">org_admin</td>
                <td class="py-2 text-muted-foreground">Manage org users, billing</td>
              </tr>
              <tr class="border-b">
                <td class="py-2 font-bold">id_gen_admin</td>
                <td class="py-2 text-muted-foreground">Templates, encoding, members</td>
              </tr>
              <tr>
                <td class="py-2 font-bold">id_gen_user</td>
                <td class="py-2 text-muted-foreground">View, scan, basic encoding</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>

    <div class="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm">
      <strong>⚠️ Important:</strong> All database queries MUST filter by <code class="bg-muted px-1 rounded">org_id</code> to prevent cross-tenant data access.
    </div>
  </section>

  <!-- 3. DATABASE SCHEMA -->
  <section id="database" class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">3. Database Schema (Core Tables)</h2>
    <p class="text-muted-foreground mb-4">Schema source: <code class="text-xs bg-muted px-1 rounded">src/lib/server/schema.ts</code></p>
    
    <div class="grid md:grid-cols-2 gap-4 mb-6">
      <Card class="border-l-4 border-l-purple-500">
        <CardHeader class="pb-2">
          <CardTitle class="text-lg font-mono">organizations</CardTitle>
        </CardHeader>
        <CardContent class="text-sm font-mono">
          <ul class="space-y-1">
            <li><span class="text-purple-600">id</span> (uuid, pk)</li>
            <li><span class="text-muted-foreground">name</span> (text)</li>
            <li><span class="text-muted-foreground">slug</span> (text, unique)</li>
            <li><span class="text-muted-foreground">settings</span> (jsonb)</li>
            <li><span class="text-muted-foreground">created_at</span> (timestamptz)</li>
          </ul>
        </CardContent>
      </Card>

      <Card class="border-l-4 border-l-blue-500">
        <CardHeader class="pb-2">
          <CardTitle class="text-lg font-mono">members</CardTitle>
        </CardHeader>
        <CardContent class="text-sm font-mono">
          <ul class="space-y-1">
            <li><span class="text-blue-600">id</span> (uuid, pk)</li>
            <li><span class="text-amber-600">org_id</span> (fk → organizations)</li>
            <li><span class="text-muted-foreground">full_name</span> (text)</li>
            <li><span class="text-muted-foreground">photo_url</span> (text, nullable)</li>
            <li><span class="text-muted-foreground">qr_code</span> (text, unique)</li>
            <li><span class="text-muted-foreground">nfc_uid</span> (text, unique, nullable)</li>
            <li><span class="text-muted-foreground">is_active</span> (bool)</li>
            <li><span class="text-muted-foreground">custom_fields</span> (jsonb)</li>
          </ul>
        </CardContent>
      </Card>

      <Card class="border-l-4 border-l-green-500">
        <CardHeader class="pb-2">
          <CardTitle class="text-lg font-mono">templates</CardTitle>
        </CardHeader>
        <CardContent class="text-sm font-mono">
          <ul class="space-y-1">
            <li><span class="text-green-600">id</span> (uuid, pk)</li>
            <li><span class="text-amber-600">org_id</span> (fk → organizations)</li>
            <li><span class="text-muted-foreground">name</span> (text)</li>
            <li><span class="text-muted-foreground">width_px, height_px, dpi</span> (int)</li>
            <li><span class="text-muted-foreground">background_url</span> (text)</li>
            <li><span class="text-red-600">template_elements</span> (jsonb) ← The Canvas Config</li>
          </ul>
        </CardContent>
      </Card>

      <Card class="border-l-4 border-l-amber-500">
        <CardHeader class="pb-2">
          <CardTitle class="text-lg font-mono">access_logs</CardTitle>
        </CardHeader>
        <CardContent class="text-sm font-mono">
          <ul class="space-y-1">
            <li><span class="text-amber-600">id</span> (bigint, pk)</li>
            <li><span class="text-muted-foreground">member_id</span> (fk → members)</li>
            <li><span class="text-muted-foreground">scanner_id</span> (text)</li>
            <li><span class="text-muted-foreground">timestamp</span> (timestamptz)</li>
            <li><span class="text-muted-foreground">direction</span> (enum: 'in'|'out')</li>
            <li><span class="text-muted-foreground">verification_method</span> (enum: 'qr'|'nfc'|'rfid')</li>
          </ul>
        </CardContent>
      </Card>
    </div>

    <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
      <strong>💡 Template Elements:</strong> The <code class="bg-muted px-1 rounded">template_elements</code> JSONB column stores an array of element definitions 
      (text, image, qr, barcode, shape) with position, size, styling, and data binding info.
    </div>
  </section>

  <!-- 4. ASSET STORAGE -->
  <section id="storage" class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">4. Asset Storage (Cloudflare R2)</h2>
    
    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-muted/50">
            <th class="text-left py-3 px-4">Path Pattern</th>
            <th class="text-left py-3 px-4">Content</th>
            <th class="text-left py-3 px-4">Access</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b">
            <td class="py-3 px-4 font-mono text-sm">/orgs/{'{org_id}'}/templates/{'{id}'}/</td>
            <td class="py-3 px-4">Template backgrounds, layers</td>
            <td class="py-3 px-4">Org-scoped</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4 font-mono text-sm">/orgs/{'{org_id}'}/members/{'{id}'}/</td>
            <td class="py-3 px-4">Profile photos</td>
            <td class="py-3 px-4">Org-scoped</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4 font-mono text-sm">/orgs/{'{org_id}'}/decomposed/</td>
            <td class="py-3 px-4">AI layer outputs</td>
            <td class="py-3 px-4">Org-scoped</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4 font-mono text-sm">/public/</td>
            <td class="py-3 px-4">Marketing assets</td>
            <td class="py-3 px-4">Public</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-lg">Image Access Patterns</CardTitle>
        </CardHeader>
        <CardContent class="text-sm">
          <ul class="space-y-2">
            <li><strong>Direct R2:</strong> Use <code class="text-xs bg-muted px-1 rounded">getStorageUrl()</code> for &lt;img&gt; tags</li>
            <li><strong>Canvas/3D:</strong> Use <code class="text-xs bg-muted px-1 rounded">getProxiedUrl()</code> via <code class="text-xs bg-muted px-1 rounded">/api/image-proxy</code></li>
          </ul>
          <p class="mt-3 text-muted-foreground text-xs">Path utils: <code class="bg-muted px-1 rounded">src/lib/utils/storagePath.ts</code></p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-lg">CORS Handling</CardTitle>
        </CardHeader>
        <CardContent class="text-sm">
          <p class="text-muted-foreground mb-2">Canvas/Three.js requires same-origin images. We proxy through:</p>
          <code class="text-xs bg-muted px-2 py-1 rounded block">/api/image-proxy?url={'{encoded_r2_url}'}</code>
          <p class="mt-2 text-muted-foreground text-xs">This adds proper CORS headers for canvas drawing.</p>
        </CardContent>
      </Card>
    </div>
  </section>

  <!-- 5. CANVAS ENGINE -->
  <section id="canvas" class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">5. ID Card Canvas Engine ("Kanaya Studio")</h2>
    <p class="text-muted-foreground mb-6">100% client-side rendering for privacy and speed.</p>
    
    <div class="grid md:grid-cols-4 gap-4 mb-6">
      <Card class="text-center">
        <CardContent class="pt-4">
          <p class="text-2xl mb-2">1️⃣</p>
          <p class="font-bold">Template Load</p>
          <p class="text-xs text-muted-foreground">Fetch background (PNG) + elements config (JSON) from R2</p>
        </CardContent>
      </Card>
      <Card class="text-center">
        <CardContent class="pt-4">
          <p class="text-2xl mb-2">2️⃣</p>
          <p class="font-bold">Data Merge</p>
          <p class="text-xs text-muted-foreground">Inject member data: name, photo, QR code, custom fields</p>
        </CardContent>
      </Card>
      <Card class="text-center">
        <CardContent class="pt-4">
          <p class="text-2xl mb-2">3️⃣</p>
          <p class="font-bold">Canvas Render</p>
          <p class="text-xs text-muted-foreground">HTML5 Canvas with scale(-1,1) for mirror printing</p>
        </CardContent>
      </Card>
      <Card class="text-center">
        <CardContent class="pt-4">
          <p class="text-2xl mb-2">4️⃣</p>
          <p class="font-bold">Export</p>
          <p class="text-xs text-muted-foreground">PDF (jspdf) or PNG batch export</p>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>🎨 AI Decomposition (fal.ai)</CardTitle>
      </CardHeader>
      <CardContent class="text-sm">
        <p class="mb-3">Uses <strong>Qwen-Image-Layered</strong> to decompose uploaded images into separate layers:</p>
        <ul class="space-y-1 text-muted-foreground">
          <li>• Background layer (school logo, design)</li>
          <li>• Text regions (for variable data placement)</li>
          <li>• Photo placeholders (auto-detected)</li>
        </ul>
        <p class="mt-3 text-xs">Code: <code class="bg-muted px-1 rounded">src/lib/server/fal-layers.ts</code>, <code class="bg-muted px-1 rounded">src/lib/remote/decompose.remote.ts</code></p>
      </CardContent>
    </Card>
  </section>

  <!-- 6. NFC/QR SECURITY -->
  <section id="security" class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">6. NFC/QR Security Architecture</h2>
    
    <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg mb-6 text-sm">
      <strong>🔒 TOP SECRET:</strong> Never commit actual keys to GitHub. Use environment variables only.
    </div>

    <div class="grid md:grid-cols-2 gap-6 mb-6">
      <Card>
        <CardHeader>
          <CardTitle>📱 QR Code Verification</CardTitle>
        </CardHeader>
        <CardContent class="text-sm">
          <ol class="list-decimal pl-4 space-y-2">
            <li>QR contains <code class="text-xs bg-muted px-1 rounded">member_uuid</code> + <code class="text-xs bg-muted px-1 rounded">HMAC signature</code></li>
            <li>Scanner app sends to <code class="text-xs bg-muted px-1 rounded">/api/verify</code></li>
            <li>Server validates HMAC with secret key</li>
            <li>Returns member status (ACTIVE/EXPIRED/BLOCKED)</li>
            <li>Logs access to <code class="text-xs bg-muted px-1 rounded">access_logs</code> table</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>💳 NFC Card Structure (Mifare 1K)</CardTitle>
        </CardHeader>
        <CardContent class="text-sm">
          <table class="w-full text-xs">
            <thead>
              <tr class="border-b">
                <th class="text-left py-2">Sector</th>
                <th class="text-left py-2">Data</th>
                <th class="text-left py-2">Access</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b">
                <td class="py-2">0</td>
                <td class="py-2">Manufacturer UID</td>
                <td class="py-2 text-muted-foreground">Read-only (hardware)</td>
              </tr>
              <tr class="border-b">
                <td class="py-2">1</td>
                <td class="py-2 font-mono">kanaya_uuid</td>
                <td class="py-2 text-muted-foreground">Key A (public)</td>
              </tr>
              <tr>
                <td class="py-2">2</td>
                <td class="py-2 font-mono">HMAC_Signature</td>
                <td class="py-2 text-muted-foreground">Key B (private)</td>
              </tr>
            </tbody>
          </table>
          <p class="mt-3 text-xs text-muted-foreground">No PII stored on card. Only UUID + crypto proof we wrote it.</p>
        </CardContent>
      </Card>
    </div>

    <Card class="bg-muted/30">
      <CardHeader class="pb-2">
        <CardTitle class="text-lg font-mono">Validation Pseudocode</CardTitle>
      </CardHeader>
      <CardContent>
        <pre class="text-sm overflow-x-auto"><code>if (VerifyHMAC(card.uuid, card.signature, SECRET_KEY)) {'{'} 
  member = db.query("SELECT * FROM members WHERE id = ?", card.uuid);
  if (member.is_active) return "✅ Valid - Access Granted";
  else return "⚠️ Card Deactivated";
{'}'} else {'{'}
  alertAdmin("🚨 CLONE DETECTED", card);
  return "❌ Invalid Card";
{'}'}</code></pre>
      </CardContent>
    </Card>
  </section>

  <!-- 7. API & REMOTE FUNCTIONS -->
  <section id="api" class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">7. API & Remote Functions</h2>
    
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-muted/50">
            <th class="text-left py-3 px-4">Endpoint</th>
            <th class="text-left py-3 px-4">Method</th>
            <th class="text-left py-3 px-4">Purpose</th>
            <th class="text-left py-3 px-4">Auth</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b">
            <td class="py-3 px-4 font-mono text-xs">/api/verify</td>
            <td class="py-3 px-4">POST</td>
            <td class="py-3 px-4">QR/NFC verification (scanner app)</td>
            <td class="py-3 px-4">API Key</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4 font-mono text-xs">/api/image-proxy</td>
            <td class="py-3 px-4">GET</td>
            <td class="py-3 px-4">CORS proxy for canvas images</td>
            <td class="py-3 px-4">Public</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4 font-mono text-xs">/api/decompose</td>
            <td class="py-3 px-4">POST</td>
            <td class="py-3 px-4">AI layer decomposition (fal.ai)</td>
            <td class="py-3 px-4">Session</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4 font-mono text-xs">/llms.txt</td>
            <td class="py-3 px-4">GET</td>
            <td class="py-3 px-4">LLM context bundle (docs)</td>
            <td class="py-3 px-4">Public</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
      <strong>💡 Remote Functions:</strong> Heavy operations use Remote Functions pattern for progressive loading. 
      See <code class="bg-muted px-1 rounded">src/lib/remote/*.remote.ts</code>
    </div>
  </section>

  <!-- 8. OFFLINE/PWA -->
  <section id="offline" class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">8. Offline Mode & Disaster Recovery</h2>
    
    <Card class="border-l-4 border-l-amber-500">
      <CardHeader>
        <CardTitle>📴 Scenario: No Internet at School Gate</CardTitle>
      </CardHeader>
      <CardContent class="text-sm">
        <h4 class="font-bold mb-2">Solution: Local-First Sync (PWA)</h4>
        <ol class="list-decimal pl-4 space-y-2">
          <li>
            <strong>Morning Sync:</strong> Scanner tablet downloads <code class="text-xs bg-muted px-1 rounded">whitelist.json</code> 
            (UID + Name + Status only—no photos to save bandwidth)
          </li>
          <li>
            <strong>Offline Scan:</strong> Tablet validates scanned UID against local IndexedDB. 
            Logs saved locally with timestamp.
          </li>
          <li>
            <strong>Re-Sync:</strong> When internet restored, local logs pushed to server with 
            conflict resolution (server wins for member status, merge for logs).
          </li>
        </ol>
        <div class="mt-4 p-3 bg-amber-100 dark:bg-amber-900/30 rounded text-xs">
          <strong>⚠️ Limitation:</strong> New members added during offline period won't be recognized until sync.
        </div>
      </CardContent>
    </Card>
  </section>

  <!-- 9. ATTENDANCE SYSTEM ARCHITECTURE -->
  <section id="attendance" class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">9. Attendance System + SMS Architecture</h2>
    <p class="text-muted-foreground mb-6">Multi-variant attendance with optional SMS notifications to parents/guardians.</p>
    
    <!-- Scanner Types -->
    <h3 class="font-bold text-lg mb-3">Reader Support Matrix</h3>
    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-muted/50">
            <th class="text-left py-2 px-4">Reader</th>
            <th class="text-left py-2 px-4">Hardware</th>
            <th class="text-right py-2 px-4">Cost</th>
            <th class="text-left py-2 px-4">Use Case</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b">
            <td class="py-2 px-4 font-bold">QR</td>
            <td class="py-2 px-4">Phone camera / USB scanner</td>
            <td class="py-2 px-4 text-right">₱0-2,000</td>
            <td class="py-2 px-4">Budget, any org</td>
          </tr>
          <tr class="border-b">
            <td class="py-2 px-4 font-bold">RFID</td>
            <td class="py-2 px-4">125kHz/13.56MHz reader</td>
            <td class="py-2 px-4 text-right">₱2,000-5,000</td>
            <td class="py-2 px-4">High volume, gates</td>
          </tr>
          <tr class="border-b">
            <td class="py-2 px-4 font-bold">NFC</td>
            <td class="py-2 px-4">Phone NFC / ACR122U</td>
            <td class="py-2 px-4 text-right">₱0-3,000</td>
            <td class="py-2 px-4">Premium, access control</td>
          </tr>
          <tr class="border-b">
            <td class="py-2 px-4 font-bold">Biometric</td>
            <td class="py-2 px-4">USB fingerprint scanner</td>
            <td class="py-2 px-4 text-right">₱5,000-15,000</td>
            <td class="py-2 px-4">High security</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Additional Tables -->
    <h3 class="font-bold text-lg mb-3">Additional Database Tables</h3>
    <div class="grid md:grid-cols-2 gap-4 mb-6">
      <Card class="border-l-4 border-l-green-500">
        <CardHeader class="pb-2">
          <CardTitle class="text-lg font-mono">scanners</CardTitle>
        </CardHeader>
        <CardContent class="text-sm font-mono">
          <ul class="space-y-1">
            <li><span class="text-green-600">id</span> (uuid, pk)</li>
            <li><span class="text-amber-600">org_id</span> (fk → organizations)</li>
            <li><span class="text-muted-foreground">name</span> (text) — "Main Gate"</li>
            <li><span class="text-muted-foreground">device_type</span> (text)</li>
            <li><span class="text-muted-foreground">reader_types</span> (jsonb) — ['qr','rfid']</li>
            <li><span class="text-muted-foreground">is_active</span> (bool)</li>
          </ul>
        </CardContent>
      </Card>

      <Card class="border-l-4 border-l-amber-500">
        <CardHeader class="pb-2">
          <CardTitle class="text-lg font-mono">sms_subscriptions</CardTitle>
        </CardHeader>
        <CardContent class="text-sm font-mono">
          <ul class="space-y-1">
            <li><span class="text-amber-600">id</span> (uuid, pk)</li>
            <li><span class="text-muted-foreground">member_id</span> (fk → members)</li>
            <li><span class="text-muted-foreground">phone_number</span> (text)</li>
            <li><span class="text-muted-foreground">credits_remaining</span> (int)</li>
            <li><span class="text-muted-foreground">is_active</span> (bool)</li>
            <li><span class="text-muted-foreground">expires_at</span> (timestamptz)</li>
          </ul>
        </CardContent>
      </Card>

      <Card class="border-l-4 border-l-blue-500">
        <CardHeader class="pb-2">
          <CardTitle class="text-lg font-mono">sms_logs</CardTitle>
        </CardHeader>
        <CardContent class="text-sm font-mono">
          <ul class="space-y-1">
            <li><span class="text-blue-600">id</span> (bigserial, pk)</li>
            <li><span class="text-muted-foreground">subscription_id</span> (fk)</li>
            <li><span class="text-muted-foreground">access_log_id</span> (fk)</li>
            <li><span class="text-muted-foreground">message_content</span> (text)</li>
            <li><span class="text-muted-foreground">status</span> (enum: pending|sent|delivered|failed)</li>
            <li><span class="text-muted-foreground">cost</span> (decimal)</li>
          </ul>
        </CardContent>
      </Card>

      <Card class="border-l-4 border-l-purple-500">
        <CardHeader class="pb-2">
          <CardTitle class="text-lg font-mono">sms_packages</CardTitle>
        </CardHeader>
        <CardContent class="text-sm font-mono">
          <ul class="space-y-1">
            <li><span class="text-purple-600">id</span> (uuid, pk)</li>
            <li><span class="text-muted-foreground">name</span> (text) — "Starter 50"</li>
            <li><span class="text-muted-foreground">sms_count</span> (int)</li>
            <li><span class="text-muted-foreground">price</span> (decimal)</li>
            <li><span class="text-muted-foreground">is_active</span> (bool)</li>
          </ul>
        </CardContent>
      </Card>
    </div>

    <!-- SMS Flow -->
    <h3 class="font-bold text-lg mb-3">SMS Notification Flow</h3>
    <div class="grid md:grid-cols-5 gap-2 mb-6 text-center text-sm">
      <Card class="p-3">
        <p class="text-xl mb-1">📱</p>
        <p class="font-bold">Scanner</p>
        <p class="text-xs text-muted-foreground">Tablet/Terminal</p>
      </Card>
      <div class="flex items-center justify-center">→</div>
      <Card class="p-3">
        <p class="text-xl mb-1">⚡</p>
        <p class="font-bold">/api/scan</p>
        <p class="text-xs text-muted-foreground">Log + Queue SMS</p>
      </Card>
      <div class="flex items-center justify-center">→</div>
      <Card class="p-3">
        <p class="text-xl mb-1">📨</p>
        <p class="font-bold">Semaphore</p>
        <p class="text-xs text-muted-foreground">SMS Gateway</p>
      </Card>
    </div>

    <!-- SMS Cost -->
    <div class="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm">
      <strong>💰 SMS Economics:</strong> Cost ₱0.50-0.60/SMS, sell at ₱1.00 = 40-50% margin. 
      <strong>⚠️ Never offer unlimited SMS</strong> — it destroys margins. Use prepaid credit packages.
    </div>
  </section>

  <!-- KEY FILES REFERENCE -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold mb-4 border-b pb-2">📁 Key File Locations</h2>
    
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-muted/50">
            <th class="text-left py-2 px-4">Purpose</th>
            <th class="text-left py-2 px-4">Path</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b">
            <td class="py-2 px-4">Database Schema</td>
            <td class="py-2 px-4 font-mono text-xs">src/lib/server/schema.ts</td>
          </tr>
          <tr class="border-b">
            <td class="py-2 px-4">Auth Configuration</td>
            <td class="py-2 px-4 font-mono text-xs">src/lib/server/auth.ts</td>
          </tr>
          <tr class="border-b">
            <td class="py-2 px-4">DB Connection</td>
            <td class="py-2 px-4 font-mono text-xs">src/lib/server/db.ts</td>
          </tr>
          <tr class="border-b">
            <td class="py-2 px-4">Zod Schemas</td>
            <td class="py-2 px-4 font-mono text-xs">src/lib/schemas/*.ts</td>
          </tr>
          <tr class="border-b">
            <td class="py-2 px-4">Storage Utils</td>
            <td class="py-2 px-4 font-mono text-xs">src/lib/utils/storagePath.ts</td>
          </tr>
          <tr class="border-b">
            <td class="py-2 px-4">Request Hooks</td>
            <td class="py-2 px-4 font-mono text-xs">src/hooks.server.ts</td>
          </tr>
          <tr>
            <td class="py-2 px-4">AI Decomposition</td>
            <td class="py-2 px-4 font-mono text-xs">src/lib/server/fal-layers.ts</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <footer class="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
    <p>Kanaya Engineering • Developer Documentation</p>
    <p class="mt-2"><a href="/admin/docs" class="underline">← Back to Docs Hub</a></p>
  </footer>
</div>
