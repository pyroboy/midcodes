# Tap Animation Redesign Plan

## Aesthetic Goal
The animation should feel **tactile, organic, and fluid**, mimicking the natural hand movement of tapping a card against a phone. It should build tension during the approach, provide satisfying feedback during the bump, maintain a "magnetic" connection during the linger, and seamlessly transition into the exploded view during success.

## State Breakdown

### 1. `tap-approach` (The Setup)
**Goal:** Anticipation. A deliberate hand movement, not a robotic slide.
**Timing:** 0% -> 100% of section.
**Motion:**
- **Pos X**: `SCAN_X` -> `APPROACH_X`. Easing: `easeInOutCubic`.
- **Pos Z (Arc)**: Arcs towards camera (max 0.1 at 50%) to "clear obstacles". `sin(PI * p)`.
- **Pos Y (Lift)**: Slight lift to counteract gravity/anticipate interaction.
- **Rot Z (Bank)**: Rolls *into* the turn. As it moves Right, it rolls slightly Right (negative Z).
- **Rot X (Pitch)**: Tilts back slightly (positive X) as if the wrist is cocking back.

### 2. `tap-bump` (The Interaction)
**Goal:** Physicality. The "tap" should feel solid.
**Timing:** 0% -> 100% of section.
**Motion:**
- **Trajectory**: "Dip and Tap".
- **Pos**: Moves from `APPROACH` to `CONTACT` and bounces back.
    - Curve: Fast in, sharp bounce, slower out (`easeOutElastic` feel or sharp `sin`).
- **Rot X (Pitch)**: The top of the card "nods" forward (negative X) to tap the reader.
- **Rot Z (Roll)**: Slight adjustment to align flat with the phone surface.
- **Feedback**: Max intensity glow at impact point (50%).

### 3. `tap-linger` (The Connection)
**Goal:** Data Transfer. Magnetic tension.
**Timing:** 0% -> 100% of section.
**Motion:**
- **Pos**: "Floating" in a magnetic field near `LINGER_POS`.
    - Base: `APPROACH` (where it bounced back to).
    - Modifier: High-frequency, low-amplitude noise/sine wave (vibration).
- **Rot**: Subtle "breathing" rotation.
- **Glow**: Pulsing green rhythmically.

### 4. `tap-success` (The Release & Pre-Rotation)
**Goal:** Satisfaction -> Preparation for Explosion.
**Key Requirement**: Pre-rotate towards `layers-main` Dutch angle.
**Timing:**
- **0-40% (Recoil)**: Pull back to `SUCCESS_POS`. confident movement.
- **40-100% (Pre-Rotation)**: Seamless transition to `layers-main` start pose.
**Layers-Main Target Pose**:
- `Pos`: { x: -0.2, y: 0, z: 0 }
- `Rot`: { x: -0.3 (Tilt Up), y: PI*0.25 (Rot Y), z: 0.3 (Roll Left) }
**Motion Strategy**:
- As the user scrolls through "Success", the card creates a smooth arc from the "Success Hold" pose into the "Explosion Ready" pose.
- **Torque**: The rotation should accelerate towards the end, so the "Explosion" (next section) feels like the release of this torque.
- **Z-Roll**: This is the most prominent feature. The card starts rolling Left (positive Z) to show its thickness/layers.

## Constants Update

```typescript
// Define clear targets
const TAP_START = { pos: SCAN_X, rot: SCAN_ROT_Y };
const TAP_READY = { pos: APPROACH_X, rot: APPROACH_ROT_Y }; // Angled for tap
const TAP_CONTACT = { pos: CONTACT_X, rot: { x: -0.2, y: APPROACH_ROT_Y, z: 0 } }; // Tipped forward
const EXPLOSION_READY = { 
    pos: { x: -0.2, y: 0, z: 0 }, 
    rot: { x: -0.3, y: Math.PI * 0.25, z: 0.3 } 
};
```

## Implementation Steps
1. Update `HeroCardStateMachine.ts` with these refined curves.
2. Add `secondaryMotion` helper if needed for noise/vibration.
3. Ensure `PhoneMesh` timings still align (Phone should essentially be a static receiver or mirror the bump).
