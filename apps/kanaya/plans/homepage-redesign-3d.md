Homepage Redesign: Scroll-Triggered 3D Marketing Page

     Status: READY FOR APPROVAL

     ---
     Decisions Summary

     | Decision         | Choice                                                   |
     |------------------|----------------------------------------------------------|
     | Route Strategy   | Public / for marketing, /dashboard for authenticated app |
     | Mobile Strategy  | Full 3D experience on all devices                        |
     | Assets           | Create all (Baybayin normal map, textures, lanyard)      |
     | Scroll Library   | Lenis + custom IntersectionObservers                     |
     | Grid (Section 5) | THREE.InstancedMesh (50 cards, 1 draw call)              |
     | Exploded View    | 3 separate plane meshes with Z animation                 |
     | Emboss Effect    | Normal map + MeshStandardMaterial                        |
     | Lanyard          | Implement now with physics-based swing                   |

     ---
     Phase 1: Backup Existing Components

     Create Backup Directory

     src/lib/components/_backup_3d/
     ├── TemplateCard3D.svelte           # Copy from src/lib/components/
     ├── IDCarousel3D.svelte             # Copy from src/lib/components/
     ├── Carousel3DItem.svelte           # Copy from src/lib/components/
     └── card3d/                         # Copy entire directory
         ├── AnimationController.ts
         ├── BeatController.ts
         ├── TapController.ts
         ├── TextureManager.ts
         ├── card3d-state.svelte.ts
         ├── overlay-helpers.ts
         ├── types.ts
         └── index.ts

     Note: These are COPIES, not moves. Original files remain functional for authenticated app.

     ---
     Phase 2: Route Migration

     Current State (Already Supports This!)

     - hooks.server.ts:190-197 already marks / as public route
     - (shell)/+layout.svelte:601-638 already has unauthenticated header

     Changes Required

     1. Create Dashboard Route
     src/routes/(shell)/dashboard/
     ├── +page.svelte        ← Move content from (shell)/+page.svelte
     └── +page.server.ts     ← Move from (shell)/+page.server.ts

     2. Create Marketing Homepage
     src/routes/(shell)/+page.svelte      ← Replace with marketing page
     src/routes/(shell)/+page.server.ts   ← Simplify (no data needed for public)

     3. Update Auth Redirect in hooks.server.ts:205
     // Change: throw redirect(303, '/');
     // To: throw redirect(303, '/dashboard');

     4. Update Navigation Links
     - BottomNavigation.svelte: Home → /dashboard
     - DesktopHeader.svelte: Logo → /dashboard (when logged in)

     ---
     Phase 3: New File Structure

     src/lib/components/marketing/
     ├── MarketingScene.svelte            # Fixed WebGL canvas wrapper
     ├── HeroCard3D.svelte                # State machine-driven card
     ├── HeroCardGeometry.svelte          # Card mesh with normal map
     ├── ExplodedLayerPlane.svelte        # Individual layer (x3)
     ├── InstancedCardGrid.svelte         # 50-card background
     ├── LanyardMesh.svelte               # Cloth-like lanyard
     ├── LaserScanEffect.svelte           # Red scan line + glow
     └── sections/
         ├── HeroSection.svelte           # "Identity, Encoded."
         ├── VerificationSection.svelte   # "Kill the Spreadsheet."
         ├── LayersSection.svelte         # "Engineered, Not Just Printed."
         ├── UseCasesSection.svelte       # Schools/Dorms/Events
         ├── TestimonialsSection.svelte   # System Scale + quotes
         ├── ShopSection.svelte           # "Digital Brain. Physical Beauty."
         └── FooterSection.svelte         # Clean text footer

     src/lib/marketing/
     ├── scroll/
     │   ├── LenisManager.ts              # Smooth scroll singleton
     │   ├── ScrollState.svelte.ts        # Reactive scroll progress
     │   └── ScrollObservers.ts           # IntersectionObserver factory
     ├── animation/
     │   ├── HeroCardStateMachine.ts      # State machine logic
     │   ├── CardAnimations.ts            # Interpolation helpers
     │   └── LanyardPhysics.ts            # Pendulum simulation
     └── textures/
         └── MarketingTextureManager.ts   # Extended preloader

     src/lib/assets/marketing/            # Static assets (bundled)
     ├── ka-normal.png                    # 512x512 Baybayin normal map
     ├── white-glossy.png                 # 1024x640 hero base
     ├── student-id.png                   # 1024x640 school texture
     ├── dorm-key.png                     # 1024x640 dorm texture
     ├── vip-pass.png                     # 1024x640 event texture
     └── lanyard-diffuse.png              # 256x1024 lanyard strip

     ---
     Phase 4: HeroCard3D State Machine

     States

     type HeroCardState =
       | 'hero'           // Slow rotation, embossed Ka symbol
       | 'verification'   // Flat, laser scan, green glow
       | 'exploding'      // Transition: layers separating
       | 'exploded'       // 3 planes hovering apart
       | 'collapsing'     // Transition: layers merging
       | 'useCases'       // Texture swapping on scroll
       | 'shrinking'      // Transition: moving to corner
       | 'testimonials'   // Small, grid visible behind
       | 'growing'        // Transition: returning to center
       | 'shop'           // Lanyard attached, pendulum swing

     Scroll Triggers

     | Scroll % | State Transition                    |
     |----------|-------------------------------------|
     | 0%       | hero (start)                        |
     | 15%      | hero → verification                 |
     | 30%      | verification → exploding → exploded |
     | 45%      | exploded → collapsing → useCases    |
     | 60%      | useCases → shrinking → testimonials |
     | 80%      | testimonials → growing → shop       |
     | 95%      | Footer (no 3D)                      |

     Use Case Sub-Scroll (45-60%)

     | Sub-Progress | Texture        |
     |--------------|----------------|
     | 0-33%        | student-id.png |
     | 33-66%       | dorm-key.png   |
     | 66-100%      | vip-pass.png   |

     ---
     Phase 5: Scroll System Architecture

     ┌────────────────────────────────────────────────────────────┐
     │  <html> - Lenis smooth scroll wrapper                      │
     ├────────────────────────────────────────────────────────────┤
     │  <body> - ~700vh total height                              │
     │  ┌──────────────────────────────────────────────────────┐  │
     │  │  FIXED: MarketingScene.svelte                        │  │
     │  │  ├── Canvas (100vw × 100vh, position: fixed)         │  │
     │  │  ├── z-index: 0 (behind content)                     │  │
     │  │  └── Single RAF loop for all animations              │  │
     │  └──────────────────────────────────────────────────────┘  │
     │                                                            │
     │  ┌──────────────────────────────────────────────────────┐  │
     │  │  SCROLL: Section Containers                          │  │
     │  │  ├── Section 1 (100vh) - HeroSection                 │  │
     │  │  ├── Section 2 (100vh) - VerificationSection         │  │
     │  │  ├── Section 3 (100vh) - LayersSection               │  │
     │  │  ├── Section 4 (150vh) - UseCasesSection             │  │
     │  │  ├── Section 5 (100vh) - TestimonialsSection         │  │
     │  │  ├── Section 6 (100vh) - ShopSection                 │  │
     │  │  └── Section 7 (50vh)  - FooterSection               │  │
     │  │  z-index: 10 (above 3D, pointer-events: none)        │  │
     │  └──────────────────────────────────────────────────────┘  │
     └────────────────────────────────────────────────────────────┘

     ScrollState.svelte.ts

     // Svelte 5 reactive scroll state
     export function createScrollState() {
       let progress = $state(0);           // 0-1 normalized
       let velocity = $state(0);           // Scroll velocity
       let direction = $state<1 | -1>(1);  // Scroll direction
       let currentSection = $state(0);     // Active section index

       function update(scrollY: number, limit: number, delta: number) {
         progress = Math.min(1, Math.max(0, scrollY / limit));
         velocity = delta;
         direction = delta >= 0 ? 1 : -1;
         // Determine section from breakpoints
       }

       return { get progress, get velocity, get currentSection, update };
     }

     ---
     Phase 6: Asset Creation Specs

     Textures (to be created via design tool or AI)

     | Asset               | Size     | Format     | Purpose                                    |
     |---------------------|----------|------------|--------------------------------------------|
     | ka-normal.png       | 512×512  | PNG (RGB)  | Baybayin "Ka" emboss, OpenGL tangent space |
     | white-glossy.png    | 1024×640 | PNG (RGBA) | Hero state base, subtle gradient           |
     | student-id.png      | 1024×640 | PNG (RGBA) | University student ID mockup               |
     | dorm-key.png        | 1024×640 | PNG (RGBA) | Dormitory access card mockup               |
     | vip-pass.png        | 1024×640 | PNG (RGBA) | VIP event pass mockup                      |
     | lanyard-diffuse.png | 256×1024 | PNG (RGB)  | Lanyard fabric with Baybayin pattern       |

     Normal Map Creation Steps

     1. Create 512×512 grayscale heightmap of Baybayin "Ka" (ᜃ)
     2. Convert to normal map using ShaderMap or GIMP normalmap plugin
     3. Settings: Strength 2.0, OpenGL format (Y+ up)
     4. Test with normalScale: new Vector2(0.5, 0.5)

     ---
     Phase 7: Performance Budget

     Geometry

     | Component               | Triangles | Instances | Draw Calls |
     |-------------------------|-----------|-----------|------------|
     | HeroCard3D              | ~200      | 1         | 1          |
     | ExplodedLayerPlane (×3) | 2 each    | 3         | 3          |
     | InstancedCardGrid       | 200       | 50        | 1          |
     | LanyardMesh             | ~500      | 1         | 1          |
     | LaserScanEffect         | -         | 1         | 1          |
     | TOTAL                   | ~906      | 56        | 7          |

     Texture Memory

     | Asset                            | Memory   |
     |----------------------------------|----------|
     | 5 card textures @ 1024×640 RGBA  | ~12.5 MB |
     | 1 normal map @ 512×512 RGB       | ~0.75 MB |
     | 1 lanyard texture @ 256×1024 RGB | ~0.75 MB |
     | TOTAL                            | ~14 MB   |

     Frame Budget (60fps = 16.67ms)

     | Phase                    | Budget |
     |--------------------------|--------|
     | Lenis scroll calculation | 0.5ms  |
     | State machine update     | 0.5ms  |
     | Animation interpolation  | 1.0ms  |
     | Physics (lanyard)        | 0.5ms  |
     | Three.js render          | 8.0ms  |
     | Compositing              | 2.0ms  |
     | Buffer                   | 4.0ms  |

     ---
     Phase 8: Implementation Order

     Step 1: Backup (1 hour)

     - Create _backup_3d/ directory
     - Copy all 3D components (not move)
     - Verify originals still work

     Step 2: Route Migration (2 hours)

     - Create /dashboard route with moved homepage content
     - Update hooks.server.ts redirect
     - Update navigation links
     - Test authenticated flow still works

     Step 3: Scroll Infrastructure (3 hours)

     - Install Lenis: pnpm add lenis
     - Create LenisManager.ts
     - Create ScrollState.svelte.ts
     - Create ScrollObservers.ts
     - Integrate into marketing page

     Step 4: 3D Scene Foundation (4 hours)

     - Create MarketingScene.svelte (fixed canvas)
     - Create HeroCardGeometry.svelte
     - Create basic HeroCard3D.svelte
     - Test card renders and responds to scroll

     Step 5: State Machine (4 hours)

     - Create HeroCardStateMachine.ts
     - Implement state transitions
     - Create CardAnimations.ts interpolation helpers
     - Wire to scroll progress

     Step 6: Section 1 - Hero (3 hours)

     - Create ka-normal.png asset
     - Add normal map to geometry
     - Implement slow rotation
     - Create HeroSection.svelte text overlay

     Step 7: Section 2 - Verification (3 hours)

     - Create LaserScanEffect.svelte
     - Implement laser scan animation
     - Add green verification glow
     - Create VerificationSection.svelte

     Step 8: Section 3 - Exploded View (4 hours)

     - Create ExplodedLayerPlane.svelte
     - Implement Z-axis separation
     - Create layer textures (base, data, security)
     - Create LayersSection.svelte

     Step 9: Section 4 - Use Cases (3 hours)

     - Create use case textures
     - Extend texture manager for preloading
     - Implement scroll-synced texture swaps
     - Create UseCasesSection.svelte

     Step 10: Section 5 - Testimonials (4 hours)

     - Create InstancedCardGrid.svelte
     - Implement 50-card instanced mesh
     - Add "active card" traversal animation
     - Create TestimonialsSection.svelte

     Step 11: Section 6 - Shop/Lanyard (4 hours)

     - Create LanyardMesh.svelte (TubeGeometry)
     - Implement LanyardPhysics.ts pendulum
     - Create lanyard drop animation
     - Create ShopSection.svelte

     Step 12: Footer & Polish (3 hours)

     - Create FooterSection.svelte
     - Add scroll progress indicators
     - Mobile responsiveness pass
     - Performance optimization

     ---
     Critical Files to Modify

     | File                                       | Change                                     |
     |--------------------------------------------|--------------------------------------------|
     | src/hooks.server.ts:205                    | Redirect authenticated users to /dashboard |
     | src/routes/(shell)/+page.svelte            | Replace with marketing homepage            |
     | src/routes/(shell)/+page.server.ts         | Simplify for public access                 |
     | src/lib/components/BottomNavigation.svelte | Update home link                           |
     | src/lib/components/DesktopHeader.svelte    | Update logo link for auth users            |
     | src/lib/utils/cardGeometry.ts              | Extend for normal map support              |

     ---
     Approval Checklist

     - Route strategy defined
     - All technical decisions made
     - File structure planned
     - State machine designed
     - Scroll system architecture defined
     - Asset specifications documented
     - Performance budget calculated
     - Implementation order established

   
