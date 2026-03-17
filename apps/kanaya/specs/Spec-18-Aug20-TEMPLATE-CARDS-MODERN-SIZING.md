# Spec-18-Aug20-TEMPLATE-CARDS-MODERN-SIZING

## Technical Specification: Modern Template Cards with Dynamic Sizing

**Date:** August 20, 2024  
**Version:** 1.0  
**Complexity:** High (7/10)  
**Scope:** UI/UX Enhancement with Size-Aware Design

---

## Step 1 – Requirement Extraction

### Core Requirements

- **Modernize template list cards** in `/templates/` route with updated visual design
- **Implement dynamic card sizing** based on actual template dimensions (custom CardSize)
- **Improve card layout responsiveness** to accommodate various template aspect ratios
- **Enhance visual hierarchy** with better typography and spacing
- **Add size indicators** showing template dimensions prominently
- **Preserve functionality** - all existing actions (edit, duplicate, delete, use) remain intact
- **Implement adaptive grid** that adjusts card sizes based on template aspect ratios
- **Keep bite-sized scope** - focus only on TemplateList component enhancement

---

## Step 2 – Context Awareness

### Technology Stack

- **Svelte 5 + SvelteKit + Supabase** architecture
- **shadcn-svelte** Card components for design consistency
- **Custom CardSize system** with flexible units (inches, mm, cm, pixels)
- **sizeConversion.ts utilities** for dimension handling and formatting

### Current Implementation Analysis

- **Component**: `src/lib/components/TemplateList.svelte` with basic grid layout
- **Template Data**: Includes `width_pixels`, `height_pixels`, and `orientation` fields
- **Aspect Ratio Logic**: Existing `getTemplateAspectRatio()` function with legacy support
- **Action System**: Hover-revealed buttons for edit, duplicate, delete operations
- **Size System**: Full CardSize infrastructure with unit conversion available

---

## Step 3 – Spec Expansion

### Enhanced Card Architecture

```
TemplateCard.svelte (enhanced)
├── Card Container (dynamic aspect ratio)
│   ├── Image Preview (size-aware scaling)
│   ├── Size Badge Overlay (prominent dimensions)
│   ├── Template Name (improved typography)
│   └── Action Buttons (refined positioning)
└── Responsive Grid Container
    └── Dynamic column sizing based on aspect ratios
```

### State Management Enhancement

- **Existing States Preserved**: `hoveredTemplate`, `notification`, `showSizeDialog`
- **Enhanced Hover Logic**: Smooth transitions with improved visual feedback
- **Size Display State**: Reactive size formatting based on template dimensions
- **Grid Responsiveness**: Dynamic column calculations for optimal layout

### Function-Level Behavior

#### Enhanced Size Display Logic

```typescript
function getTemplateDisplayInfo(template: TemplateData): {
	aspectRatio: string;
	sizeLabel: string;
	cardSize: CardSize | null;
} {
	// Enhanced logic using sizeConversion utilities
	// Handles legacy templates gracefully
	// Returns formatted size information
}
```

#### Dynamic Grid Sizing

- **CSS Grid**: `grid-template-columns: repeat(auto-fit, minmax(var(--min-card-width), 1fr))`
- **Aspect Ratio Variables**: Dynamic CSS custom properties based on template dimensions
- **Responsive Breakpoints**: Adaptive column counts for mobile, tablet, desktop

#### Size Badge Component

```svelte
<!-- New: TemplateSizeBadge.svelte -->
<div class="size-badge">
	<div class="dimensions">{formatDimensions(cardSize)}</div>
	<div class="aspect-ratio">{aspectRatio}</div>
</div>
```

### UI Implementation Specifications

#### Modern Card Design

- **Shadow System**: `shadow-sm hover:shadow-md` with smooth transitions
- **Border Radius**: `rounded-xl` for modern appearance
- **Background**: Proper contrast with dark mode support
- **Spacing**: Consistent padding using shadcn spacing tokens

#### Size Badge Overlay

- **Position**: Top-left corner with backdrop blur
- **Styling**: Modern glass-morphism effect with high contrast text
- **Content**: Formatted dimensions (e.g., "3.375" × 2.125"") and aspect ratio
- **Responsiveness**: Scales appropriately across device sizes

#### Enhanced Typography

- **Template Name**: `text-base font-semibold` with proper line-height
- **Size Labels**: `text-xs font-medium` for dimension display
- **Hierarchy**: Clear visual distinction between primary and secondary text

#### Action Button Refinement

- **Background**: Improved backdrop with better opacity and blur
- **Hover States**: Enhanced visual feedback with proper timing
- **Positioning**: Better alignment and spacing for touch targets
- **Icons**: Consistent sizing and proper contrast

### UX Enhancement Specifications

#### Visual Information Hierarchy

1. **Template Preview** - Primary focus with proper aspect ratio
2. **Size Information** - Prominent but non-intrusive badge
3. **Template Name** - Clear identification
4. **Action Buttons** - Available on hover/focus

#### Responsive Grid Behavior

- **Mobile (< 640px)**: Single column with full-width cards
- **Tablet (640px - 1024px)**: 2-3 columns with adaptive sizing
- **Desktop (> 1024px)**: 3-4 columns optimized for viewing

#### Accessibility Enhancements

- **ARIA Labels**: Comprehensive labeling for screen readers
- **Keyboard Navigation**: Full keyboard accessibility for all actions
- **Color Contrast**: WCAG AA compliance across all text elements
- **Focus Indicators**: Clear visual focus states

### Database Integration

- **Existing Fields Used**:
  - `width_pixels`, `height_pixels` for dimension calculations
  - `orientation` for aspect ratio determination
  - `front_background` for preview images
- **CardSize Derivation**: Convert pixel dimensions to appropriate units
- **Legacy Support**: Handle templates without modern size data

---

## Step 4 – Implementation Guidance

### Development Phases

#### Phase 1: Card Structure Enhancement

```svelte
<!-- Enhanced TemplateList.svelte card structure -->
<Card
	class="group overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
>
	<div class="relative aspect-{aspectRatio}">
		<!-- Image with proper scaling -->
		<img src={template.front_background} class="object-cover w-full h-full" />

		<!-- Size badge overlay -->
		<TemplateSizeBadge {cardSize} class="absolute top-2 left-2" />

		<!-- Action buttons -->
		<div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100">
			<!-- Enhanced button group -->
		</div>
	</div>

	<CardContent class="p-4">
		<h3 class="text-base font-semibold">{template.name}</h3>
	</CardContent>
</Card>
```

#### Phase 2: Size Badge Component

```svelte
<!-- New: TemplateSizeBadge.svelte -->
<script lang="ts">
	import { formatDimensions } from '$lib/utils/sizeConversion';

	let { cardSize, class: className = '' } = $props();

	$: displayInfo = cardSize ? formatDimensions(cardSize, true) : 'Unknown Size';
</script>

<div class="size-badge {className}">
	<span class="dimensions">{displayInfo}</span>
</div>

<style>
	.size-badge {
		@apply bg-background/80 backdrop-blur-sm border border-border rounded-md px-2 py-1;
		@apply text-xs font-medium text-foreground;
	}
</style>
```

#### Phase 3: Enhanced Grid System

```css
/* Dynamic grid with size-aware columns */
.template-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 1.5rem;

	/* Dynamic column sizing based on content */
	@container (min-width: 640px) {
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
	}

	@container (min-width: 1024px) {
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	}
}
```

#### Phase 4: Size Calculation Logic

```typescript
// Enhanced getTemplateDisplayInfo function
function getTemplateDisplayInfo(template: TemplateData): {
	aspectRatio: string;
	sizeLabel: string;
	cardSize: CardSize | null;
} {
	// Use existing width_pixels/height_pixels or derive from CardSize
	if (template.width_pixels && template.height_pixels) {
		const cardSize = createCardSizeFromPixels(
			template.width_pixels,
			template.height_pixels,
			template.name
		);

		return {
			aspectRatio: `${template.width_pixels}/${template.height_pixels}`,
			sizeLabel: formatDimensions(cardSize, true),
			cardSize
		};
	}

	// Legacy support with default dimensions
	return {
		aspectRatio: template.orientation === 'portrait' ? '638/1013' : '1013/638',
		sizeLabel: 'Legacy Size',
		cardSize: LEGACY_CARD_SIZE
	};
}
```

### Files Affected

1. **Enhanced Files**:
   - `src/lib/components/TemplateList.svelte` - main component with modern design
2. **New Files**:
   - `src/lib/components/TemplateSizeBadge.svelte` - reusable size display component

3. **Utilized Existing**:
   - `src/lib/utils/sizeConversion.ts` - formatting and conversion utilities

### Best Practices Implementation

#### Performance Optimization

- **Aspect Ratio CSS**: Use CSS aspect-ratio property for optimal layout
- **Image Loading**: Implement lazy loading for template previews
- **CSS Grid**: Leverage browser-native grid calculations

#### Design System Compliance

- **shadcn Tokens**: Use design system tokens for consistency
- **Dark Mode**: Full dark mode support with proper contrast
- **Component Composition**: Reusable TemplateSizeBadge component

#### Responsive Design

- **Container Queries**: Use container queries for component-level responsiveness
- **Flexible Grid**: Adapt to various screen sizes and orientations
- **Touch Targets**: Ensure minimum 44px touch targets on mobile

---

## Step 5 – Output Checklist

### Implementation Complexity Assessment

✅ **Checklist:**

1. **UI Changes (Complexity: 7/10)**
   - Significant visual overhaul with modern card design
   - Dynamic size badges and enhanced grid layout
   - Improved typography and spacing system

2. **UX Changes (Complexity: 5/10)**
   - Moderate UX improvements with size information display
   - Better visual hierarchy and responsive behavior
   - Enhanced accessibility and interaction feedback

3. **Data Handling (Complexity: 2/10)**
   - Minor enhancements to utilize existing size data
   - No database schema changes required
   - Better use of CardSize system

4. **Function Logic (Complexity: 4/10)**
   - Enhanced sizing logic and grid calculations
   - Improved dimension formatting and display
   - Size-aware component rendering

5. **ID/Key Consistency (Complexity: 1/10)**
   - No changes to ID generation or key structures
   - Only visual and layout enhancements
   - Preserved data integrity

---

## Implementation Priority

⚡ **Development Sequence:**

1. Create TemplateSizeBadge component with proper styling
2. Enhance TemplateList card structure with modern design
3. Implement dynamic grid system with responsive behavior
4. Add size calculation and display logic
5. Test across device sizes and template varieties

**Estimated Development Time:** 8-10 hours  
**Testing Requirements:** Various template sizes, responsive behavior, accessibility  
**Success Criteria:** Modern card design with clear size information and improved user experience

## Design Mockup Description

### Card Layout Vision

```
┌─────────────────────────────┐
│ [3.375" × 2.125"]    [⋯ ⋯ ⋯] │ ← Size badge + Actions
│                             │
│     Template Preview        │ ← Proper aspect ratio
│      (front_background)     │
│                             │
│─────────────────────────────│
│    Template Name            │ ← Enhanced typography
│    Credit Card              │
└─────────────────────────────┘
```

**Key Visual Elements:**

- **Glass-morphism size badge** in top-left with backdrop blur
- **Refined action buttons** in top-right with smooth hover states
- **Dynamic aspect ratios** that reflect actual template dimensions
- **Modern shadows and borders** using shadcn design tokens
- **Responsive grid** that adapts to various template sizes
