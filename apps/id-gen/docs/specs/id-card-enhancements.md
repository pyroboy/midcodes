# ID Card Enhancements Specification

## Overview
This spec outlines the implementation of missing features for the ID-Gen application, focusing on individual card viewing, watermark protection, and admin-only editing with audit trails.

---

## Phase 1: Core Features

### 1. Individual Card Detail Page

**Route:** `/id/[id]`

**Purpose:** Dedicated page to view a single ID card with full details, shareable URL, and actions.

#### UI Layout
```
┌─────────────────────────────────────────────────────────┐
│  ← Back to All IDs                    [Download] [Share]│
│─────────────────────────────────────────────────────────│
│                                                         │
│     ┌───────────────────────────────────────────┐       │
│     │                                           │       │
│     │           FRONT OF CARD                   │       │
│     │         (tap to flip)                     │       │
│     │                                           │       │
│     └───────────────────────────────────────────┘       │
│              "Tap card to flip"                         │
│                                                         │
│─────────────────────────────────────────────────────────│
│  Card Details                                           │
│  ─────────────────────────────────────────────────────  │
│  Template: Student ID                                   │
│  Created: Dec 14, 2024 at 3:45 PM                       │
│  Card ID: abc123-def456                                 │
│                                                         │
│  Field Data:                                            │
│  • Name: John Doe                                       │
│  • ID Number: 2024-0001                                 │
│  • Course: Computer Science                             │
│  • Year: 3rd Year                                       │
│                                                         │
│─────────────────────────────────────────────────────────│
│  [Super Admin Only: Edit Card]                          │
└─────────────────────────────────────────────────────────┘
```

#### Files to Create
```
src/routes/id/
├── [id]/
│   ├── +page.svelte        # Card detail UI
│   ├── +page.server.ts     # Load card data, check permissions
│   └── +page.ts            # Client-side load if needed
```

#### Data Requirements
- Fetch from `idcards` table by ID
- Join with `templates` for template name
- Check `org_id` matches user's organization
- Include all `data` JSONB fields for display

#### Features
- Flip card animation (reuse existing CSS)
- Download button (front, back, or both as ZIP)
- Share button (copy URL to clipboard)
- Back navigation to `/all-ids`
- Display all form field data
- Show metadata (created date, template name, card ID)
- Edit button (super_admin only)

---

### 2. Watermark System

**Purpose:** Protect ID cards with watermarks until user has premium access or watermark removal is enabled.

#### Current Architecture (Client-Side Blob Generation)
```
┌─────────────────────────────────────────────────────────────────┐
│ CLIENT (Browser)                                                │
│  1. IdCanvas renders card                                       │
│  2. renderFullResolution() creates Blob via canvas.toBlob()     │
│  3. Blob sent to server via FormData                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ SERVER (+page.server.ts saveIdCard action)                      │
│  4. Receives Blob from FormData                                 │
│  5. Uploads to Supabase Storage                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Problem:** Client-side watermarking is NOT foolproof - users can manipulate browser code.

#### Foolproof Watermark Approach

**Solution:** Server-side watermark processing AFTER receiving blob, BEFORE storage upload.

```
┌─────────────────────────────────────────────────────────────────┐
│ CLIENT (Browser)                                                │
│  1. IdCanvas renders card (clean, no watermark)                 │
│  2. renderFullResolution() creates Blob                         │
│  3. Blob sent to server via FormData                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ SERVER (+page.server.ts saveIdCard action)                      │
│  4. Receives Blob from FormData                                 │
│  5. CHECK: profiles.remove_watermarks                           │
│     ├── true  → Upload clean blob                               │
│     └── false → Apply watermark, then upload                    │
│  6. Upload final image to Supabase Storage                      │
└─────────────────────────────────────────────────────────────────┘
```

#### Watermark Rules
| Condition | Watermark Applied |
|-----------|-------------------|
| `profiles.remove_watermarks = false` | YES - Server applies watermark |
| `profiles.remove_watermarks = true` | NO - Clean cards uploaded |
| Card created before premium upgrade | Stays watermarked (immutable) |
| Card created after premium upgrade | No watermark |

#### Server-Side Implementation

**File:** `src/routes/use-template/[id]/+page.server.ts`

```typescript
import { applyWatermark } from '$lib/utils/watermark.server';

export const actions: Actions = {
  saveIdCard: async ({ request, locals }) => {
    const { supabase, session } = locals;
    const formData = await request.formData();

    // Get user's watermark status
    const { data: profile } = await supabase
      .from('profiles')
      .select('remove_watermarks')
      .eq('id', session.user.id)
      .single();

    const shouldWatermark = !profile?.remove_watermarks;

    // Get blobs from form
    let frontBlob = formData.get('frontImage') as Blob;
    let backBlob = formData.get('backImage') as Blob;

    // Apply watermark if needed (SERVER-SIDE - FOOLPROOF)
    if (shouldWatermark) {
      frontBlob = await applyWatermark(frontBlob);
      backBlob = await applyWatermark(backBlob);
    }

    // Upload to storage
    const frontPath = await uploadToStorage(supabase, frontBlob, 'front');
    const backPath = await uploadToStorage(supabase, backBlob, 'back');

    // Save to database with watermark flag
    await supabase.from('idcards').insert({
      // ...other fields
      is_watermarked: shouldWatermark, // Track for future reference
    });
  }
};
```

#### Watermark Utility (Server-Side Only)

**File:** `src/lib/utils/watermark.server.ts`

```typescript
import sharp from 'sharp';

interface WatermarkOptions {
  text?: string;
  opacity?: number;
  fontSize?: number;
  color?: string;
  angle?: number;
}

const DEFAULT_OPTIONS: WatermarkOptions = {
  text: 'ID-GEN SAMPLE',
  opacity: 0.35,
  fontSize: 28,
  color: 'rgba(100, 100, 100, 0.5)',
  angle: -30 // Diagonal
};

export async function applyWatermark(
  imageBlob: Blob,
  options: WatermarkOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Convert Blob to Buffer
  const arrayBuffer = await imageBlob.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  // Get image dimensions
  const metadata = await sharp(inputBuffer).metadata();
  const { width = 1000, height = 600 } = metadata;

  // Create SVG watermark overlay with tiled pattern
  const watermarkSvg = createWatermarkSvg(width, height, opts);

  // Composite watermark onto image
  const outputBuffer = await sharp(inputBuffer)
    .composite([{
      input: Buffer.from(watermarkSvg),
      blend: 'over'
    }])
    .png()
    .toBuffer();

  // Convert back to Blob
  return new Blob([outputBuffer], { type: 'image/png' });
}

function createWatermarkSvg(
  width: number,
  height: number,
  opts: WatermarkOptions
): string {
  const { text, opacity, fontSize, color, angle } = opts;

  // Create tiled watermark pattern
  const patternWidth = 200;
  const patternHeight = 100;

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="watermark" patternUnits="userSpaceOnUse"
                 width="${patternWidth}" height="${patternHeight}"
                 patternTransform="rotate(${angle})">
          <text x="10" y="50"
                font-family="Arial, sans-serif"
                font-size="${fontSize}"
                font-weight="bold"
                fill="${color}"
                opacity="${opacity}">
            ${text}
          </text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#watermark)"/>
    </svg>
  `;
}
```

**Watermark Visual Style:**
```
┌─────────────────────────────────────┐
│  ID-GEN    ID-GEN    ID-GEN         │
│     SAMPLE    SAMPLE    SAMPLE      │
│  ID-GEN    ID-GEN    ID-GEN         │
│     [Card Content Underneath]       │
│  ID-GEN    ID-GEN    ID-GEN         │
│     SAMPLE    SAMPLE    SAMPLE      │
└─────────────────────────────────────┘
```

#### Database Fields
- `profiles.remove_watermarks: boolean` - User's watermark status (EXISTS)
- `idcards.is_watermarked: boolean` - Track if card was watermarked (ADD)

```sql
-- Add watermark tracking to idcards
ALTER TABLE idcards ADD COLUMN is_watermarked BOOLEAN DEFAULT true;
```

#### Alternative: Supabase Edge Function

For better isolation and performance, watermarking could be done via Edge Function:

**File:** `supabase/functions/process-id-card/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { imageBase64, shouldWatermark } = await req.json();

  if (!shouldWatermark) {
    return new Response(JSON.stringify({ image: imageBase64 }));
  }

  // Apply watermark using Deno image libraries
  const watermarkedImage = await applyWatermark(imageBase64);

  return new Response(JSON.stringify({ image: watermarkedImage }));
});
```

**Pros of Edge Function:**
- Isolated from main app
- Better scaling
- Can be reused by other services
- Deno runtime with native image support

**Cons:**
- Additional network hop
- More complex deployment
- Cold start latency

#### Recommendation
Start with **server-side in +page.server.ts** using `sharp`. Migrate to Edge Function if performance becomes an issue.

#### Dependencies
Add to `package.json`:
```json
{
  "dependencies": {
    "sharp": "^0.33.0"
  }
}
```

Note: `sharp` requires native binaries. For Vercel deployment, it works out of the box. For other platforms, may need platform-specific configuration.

---

### 3. Edit Card (Super Admin Only)

**Route:** `/id/[id]/edit`

**Access:** `role = 'super_admin'` only

#### Permission Check
```typescript
// In +page.server.ts
export const load = async ({ locals, params }) => {
  const { session, supabase } = locals;

  // Check super_admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'super_admin') {
    throw redirect(303, `/id/${params.id}`);
  }

  // Load card data for editing...
};
```

#### Edit Flow
1. Super admin clicks "Edit Card" on `/id/[id]`
2. Navigates to `/id/[id]/edit`
3. Form pre-filled with existing `data` JSONB
4. Photo/signature fields show current images with option to replace
5. On save:
   - Create audit log entry
   - Update `idcards.data` JSONB
   - Optionally re-render images if photos changed
   - Update `idcards.updated_at`

#### Files to Create
```
src/routes/id/
└── [id]/
    └── edit/
        ├── +page.svelte      # Edit form UI
        └── +page.server.ts   # Load card, save changes, create audit log
```

---

### 4. Audit Log / History System

**Purpose:** Track all changes to ID cards for accountability and compliance.

#### Database Table: `id_card_audit_logs`
```sql
CREATE TABLE id_card_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_card_id UUID REFERENCES idcards(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'created', 'edited', 'deleted', 'downloaded', 'printed'
  actor_id UUID REFERENCES profiles(id),
  actor_email TEXT,
  actor_role TEXT,
  changes JSONB, -- { field: { old: '...', new: '...' } }
  metadata JSONB, -- Additional context
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_audit_logs_card ON id_card_audit_logs(id_card_id);
CREATE INDEX idx_audit_logs_actor ON id_card_audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created ON id_card_audit_logs(created_at DESC);
```

#### Audit Log Entry Examples

**Card Created:**
```json
{
  "action": "created",
  "actor_email": "user@example.com",
  "actor_role": "id_gen_user",
  "metadata": {
    "template_id": "...",
    "template_name": "Student ID",
    "watermarked": true
  }
}
```

**Card Edited (Super Admin):**
```json
{
  "action": "edited",
  "actor_email": "admin@example.com",
  "actor_role": "super_admin",
  "changes": {
    "Name": { "old": "John Doe", "new": "John D. Smith" },
    "ID Number": { "old": "2024-0001", "new": "2024-0002" }
  },
  "metadata": {
    "reason": "Typo correction per user request"
  }
}
```

#### Audit Log Display on Card Detail Page

```
┌─────────────────────────────────────────────────────────┐
│  Activity History                                       │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  📝 Dec 14, 2024 5:30 PM                               │
│     Edited by admin@example.com (super_admin)          │
│     Changes: Name, ID Number                           │
│                                                         │
│  📥 Dec 14, 2024 4:00 PM                               │
│     Downloaded by user@example.com                     │
│                                                         │
│  ✨ Dec 14, 2024 3:45 PM                               │
│     Created by user@example.com                        │
│     Template: Student ID                               │
│     Watermarked: Yes                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Audit Log Service
**File:** `src/lib/services/auditLog.ts`

```typescript
export async function logCardAction(
  supabase: SupabaseClient,
  params: {
    idCardId: string;
    action: 'created' | 'edited' | 'deleted' | 'downloaded' | 'printed';
    actorId: string;
    actorEmail: string;
    actorRole: string;
    changes?: Record<string, { old: any; new: any }>;
    metadata?: Record<string, any>;
    request?: Request; // For IP/user-agent
  }
) {
  const { error } = await supabase
    .from('id_card_audit_logs')
    .insert({
      id_card_id: params.idCardId,
      action: params.action,
      actor_id: params.actorId,
      actor_email: params.actorEmail,
      actor_role: params.actorRole,
      changes: params.changes,
      metadata: params.metadata,
      ip_address: params.request?.headers.get('x-forwarded-for'),
      user_agent: params.request?.headers.get('user-agent')
    });

  if (error) console.error('Audit log error:', error);
}
```

---

## Phase 2: Future Features

The following features are planned for future implementation:

1. **CSV Bulk Import** - Upload CSV/Excel to create multiple cards at once
2. **Print Interface** - Print preview, batch print layout, mark as printed
3. **Download Format Options** - PDF export, resolution settings, format selection
4. **Navigation Improvements** - "Use Template Again", "View Cards from Template"
5. **Card History Page** - `/history` route showing all user activity
6. **Dashboard Overview** - Stats, recent activity, storage usage
7. **Card Duplication** - Quick "Clone this card" feature
8. **Template Search** - Find templates by name/tags
9. **QR Code on Cards** - Embed verifiable QR codes
10. **Card Expiration** - Set expiry dates, show expired status

---

## Implementation Checklist

### Phase 1 Tasks

- [ ] Create `/id/[id]` route structure
- [ ] Implement card detail page UI with flip animation
- [ ] Add download and share buttons
- [ ] Display field data from JSONB
- [ ] Create `id_card_audit_logs` database table
- [ ] Implement `auditLog.ts` service
- [ ] Add audit logging to card creation flow
- [ ] Create watermark utility function
- [ ] Apply watermark server-side in saveIdCard
- [ ] Create `/id/[id]/edit` route (super_admin only)
- [ ] Implement edit form with pre-filled data
- [ ] Add audit logging to edit flow
- [ ] Display activity history on card detail page
- [ ] Add "Edit" button visibility based on role

### Database Migrations

```sql
-- Migration: Create audit logs table
CREATE TABLE id_card_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_card_id UUID REFERENCES idcards(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor_id UUID REFERENCES profiles(id),
  actor_email TEXT,
  actor_role TEXT,
  changes JSONB,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_logs_card ON id_card_audit_logs(id_card_id);
CREATE INDEX idx_audit_logs_actor ON id_card_audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created ON id_card_audit_logs(created_at DESC);

-- RLS Policies
ALTER TABLE id_card_audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can view audit logs for cards in their org
CREATE POLICY "Users can view audit logs for their org's cards"
  ON id_card_audit_logs FOR SELECT
  USING (
    id_card_id IN (
      SELECT id FROM idcards
      WHERE org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Only super_admin can insert (via service role in server actions)
CREATE POLICY "Service role can insert audit logs"
  ON id_card_audit_logs FOR INSERT
  WITH CHECK (true);
```

---

## Dependencies

- **sharp** or **canvas** - Server-side image manipulation for watermarks
- No new UI component libraries needed (reuse existing)

---

## Notes

- Watermark is applied SERVER-SIDE before storage upload (foolproof)
- Edit functionality is restricted to `super_admin` role only
- All card actions (create, edit, delete, download) should log to audit table
- Audit logs are immutable (no UPDATE/DELETE policies for users)
- Phase 2 features are documented but not prioritized for immediate implementation
