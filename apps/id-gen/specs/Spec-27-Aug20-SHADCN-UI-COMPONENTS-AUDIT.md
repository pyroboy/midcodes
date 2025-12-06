# Spec-27-Aug20-SHADCN-UI-COMPONENTS-AUDIT

## Technical Specification: shadcn-ui Components Audit & Cleanup

**Date:** August 20, 2024  
**Version:** 1.0  
**Complexity:** Low (3/10)  
**Scope:** Dependency Cleanup & Bundle Optimization

---

## Step 1 – Requirement Extraction

### Core Requirements

- **Audit all shadcn-ui components** to identify unused installations
- **Remove unused component folders** to reduce bundle size and dependencies
- **Clean up package.json dependencies** that are no longer needed
- **Preserve actively used components** (Card, Button, Input, etc.)
- **Create removal script** for safe component uninstallation
- **Keep bite-sized scope** - focus only on confirmed unused shadcn components

---

## Step 2 – Context Awareness

### shadcn-ui Component Analysis

```typescript
// Found shadcn-ui component folders (50+ components installed):
src/lib/components/ui/
├── accordion/          // ❌ 0 usage - candidate for removal
├── alert-dialog/       // ❌ 0 usage - candidate for removal
├── alert/              // ✅ Used - keep
├── aspect-ratio/       // ❓ Unknown usage - needs verification
├── avatar/             // ❓ Unknown usage - needs verification
├── badge/              // ✅ Used - keep
├── breadcrumb/         // ❌ 0 usage - candidate for removal
├── button/             // ✅ Heavily used - keep
├── calendar/           // ❓ 20 references - needs verification
├── card/               // ✅ Heavily used - keep
├── carousel/           // ❌ 0 usage - candidate for removal
├── chart/              // ❌ 0 usage - candidate for removal
├── checkbox/           // ❓ Unknown usage - needs verification
├── collapsible/        // ❓ Unknown usage - needs verification
├── command/            // ❓ Unknown usage - needs verification
├── context-menu/       // ❓ Unknown usage - needs verification
├── dialog/             // ❓ Unknown usage - needs verification
├── drawer/             // ❓ Unknown usage - needs verification
├── dropdown-menu/      // ❓ Unknown usage - needs verification
├── form/               // ❓ Unknown usage - needs verification
├── hover-card/         // ❌ 0 usage - candidate for removal
├── input/              // ✅ Heavily used - keep
├── label/              // ✅ Used - keep
├── menubar/            // ❓ Unknown usage - needs verification
├── navigation-menu/    // ❓ Unknown usage - needs verification
├── pagination/         // ❓ Unknown usage - needs verification
├── popover/            // ❓ Unknown usage - needs verification
├── progress/           // ❓ Unknown usage - needs verification
├── radio-group/        // ❓ Unknown usage - needs verification
├── resizable/          // ❓ Unknown usage - needs verification
├── scroll-area/        // ❓ Unknown usage - needs verification
├── select/             // ❓ Unknown usage - needs verification
├── separator/          // ✅ Used - keep
├── sheet/              // ❓ Unknown usage - needs verification
├── skeleton/           // ❓ Unknown usage - needs verification
├── slider/             // ❓ Unknown usage - needs verification
├── sonner/             // ✅ Used (toast system) - keep
├── switch/             // ❓ Unknown usage - needs verification
├── table/              // ❓ Unknown usage - needs verification
├── tabs/               // ❓ Unknown usage - needs verification
├── textarea/           // ❓ Unknown usage - needs verification
├── toast/              // ❓ Unknown usage - needs verification
├── toggle-group/       // ❓ Unknown usage - needs verification
├── toggle/             // ❓ Unknown usage - needs verification
├── tooltip/            // ❓ Unknown usage - needs verification
└── ...
```

---

## Step 3 – Spec Expansion

### Audit Strategy

```
Phase 1: Usage Detection → Phase 2: Categorization → Phase 3: Safe Removal
       ↓                          ↓                       ↓
  Scan all imports         Unused/Used/Unknown      Remove unused only
```

### Component Usage Categories

#### Definitely Used (Keep)

- **button/** - Primary interaction component
- **card/** - Layout component heavily used
- **input/** - Form input component
- **label/** - Form label component
- **badge/** - Status indicators
- **separator/** - Layout dividers
- **sonner/** - Toast notification system

#### Definitely Unused (Remove)

- **accordion/** - 0 imports found
- **alert-dialog/** - 0 imports found
- **breadcrumb/** - 0 imports found
- **carousel/** - 0 imports found
- **chart/** - 0 imports found
- **hover-card/** - 0 imports found

#### Needs Verification (Audit Required)

- All other components require usage scanning

---

## Step 4 – Implementation Guidance

### Comprehensive Usage Audit Script

```bash
#!/bin/bash
# audit-shadcn-components.sh - Complete usage analysis

echo "🔍 Auditing shadcn-ui component usage..."

# Get list of all UI component folders
UI_COMPONENTS=($(ls src/lib/components/ui/ | grep -v "\.svelte$" | grep -v "index\.ts"))

echo "Found ${#UI_COMPONENTS[@]} component folders to audit"
echo ""

# Create results arrays
USED_COMPONENTS=()
UNUSED_COMPONENTS=()
UNKNOWN_COMPONENTS=()

for component in "${UI_COMPONENTS[@]}"; do
  echo "Checking: $component"

  # Count imports (exclude the component's own folder)
  import_count=$(grep -r "from.*ui/$component" src --include="*.svelte" --include="*.ts" | wc -l)
  import_count2=$(grep -r "import.*$component" src --include="*.svelte" --include="*.ts" | grep -v "ui/$component" | wc -l)

  total_imports=$((import_count + import_count2))

  echo "  Imports: $total_imports"

  if [ $total_imports -eq 0 ]; then
    UNUSED_COMPONENTS+=("$component")
    echo "  Status: ❌ UNUSED"
  elif [ $total_imports -gt 10 ]; then
    USED_COMPONENTS+=("$component")
    echo "  Status: ✅ HEAVILY USED"
  else
    UNKNOWN_COMPONENTS+=("$component")
    echo "  Status: ❓ NEEDS VERIFICATION ($total_imports imports)"
  fi
  echo ""
done

# Generate summary report
echo "=== AUDIT SUMMARY ==="
echo ""
echo "✅ HEAVILY USED (${#USED_COMPONENTS[@]}):"
printf '%s\n' "${USED_COMPONENTS[@]}" | sed 's/^/  - /'
echo ""

echo "❌ UNUSED (${#UNUSED_COMPONENTS[@]}):"
printf '%s\n' "${UNUSED_COMPONENTS[@]}" | sed 's/^/  - /'
echo ""

echo "❓ NEEDS VERIFICATION (${#UNKNOWN_COMPONENTS[@]}):"
printf '%s\n' "${UNKNOWN_COMPONENTS[@]}" | sed 's/^/  - /'
echo ""

# Generate removal commands for unused components
if [ ${#UNUSED_COMPONENTS[@]} -gt 0 ]; then
  echo "🗑️  REMOVAL COMMANDS:"
  echo "mkdir -p backup/unused-shadcn-components"
  for component in "${UNUSED_COMPONENTS[@]}"; do
    echo "cp -r src/lib/components/ui/$component backup/unused-shadcn-components/"
  done
  echo ""
  for component in "${UNUSED_COMPONENTS[@]}"; do
    echo "rm -rf src/lib/components/ui/$component"
  done
fi
```

### Manual Verification for Unknown Components

```bash
# For components with 1-10 imports, manually verify usage
verify_component() {
  local component=$1
  echo "=== Verifying $component ==="

  # Show actual import lines
  echo "Import statements:"
  grep -r "from.*ui/$component\|import.*$component" src --include="*.svelte" --include="*.ts" | grep -v "ui/$component/"

  echo ""
  echo "Usage in files:"
  # Look for actual component usage (not just imports)
  grep -r "<$component\|$component\." src --include="*.svelte" --include="*.ts" | head -5
}

# Example usage
# verify_component "calendar"
# verify_component "dialog"
```

### Safe Removal Process

```bash
# Phase 1: Backup all components being removed
echo "📦 Creating backup..."
mkdir -p backup/unused-shadcn-components

# Backup confirmed unused components
CONFIRMED_UNUSED=(
  "accordion"
  "alert-dialog"
  "breadcrumb"
  "carousel"
  "chart"
  "hover-card"
)

for component in "${CONFIRMED_UNUSED[@]}"; do
  if [ -d "src/lib/components/ui/$component" ]; then
    cp -r "src/lib/components/ui/$component" backup/unused-shadcn-components/
    echo "✓ Backed up: $component"
  fi
done

# Phase 2: Remove unused components
echo -e "\n🗑️  Removing unused components..."
for component in "${CONFIRMED_UNUSED[@]}"; do
  if [ -d "src/lib/components/ui/$component" ]; then
    rm -rf "src/lib/components/ui/$component"
    echo "✓ Removed: $component"
  fi
done

# Phase 3: Clean up index.ts exports if they exist
echo -e "\n🧹 Cleaning up index.ts exports..."
# This would need to be done manually or with careful sed commands
```

### Package Dependencies Cleanup

```bash
# Check if any package.json dependencies are now unused
echo "📦 Checking for unused dependencies..."

# This would require checking package.json for dependencies that were
# only used by the removed components (manual process)
# Example: @radix-ui/react-accordion if only used by accordion component
```

### Documentation Creation

```markdown
# SHADCN_COMPONENT_AUDIT.md

## Component Audit Results - [Date]

### Removed Components (Confirmed Unused)

- **accordion** - Collapsible content sections (0 imports)
- **alert-dialog** - Modal confirmation dialogs (0 imports)
- **breadcrumb** - Navigation breadcrumbs (0 imports)
- **carousel** - Content carousel/slider (0 imports)
- **chart** - Data visualization components (0 imports)
- **hover-card** - Hover tooltip cards (0 imports)

### Retained Components (Active Usage)

- **button** - Primary interaction component
- **card** - Layout and content containers
- **input** - Form input fields
- **label** - Form field labels
- **badge** - Status indicators
- **separator** - Visual dividers
- **sonner** - Toast notifications

### Benefits

- Reduced bundle size
- Fewer files to maintain
- Cleaner component tree
- Faster IDE performance

### Restoration Process

If any removed component is needed:

1. Copy from backup/unused-shadcn-components/
2. Restore to src/lib/components/ui/
3. Add necessary imports
4. Install any missing dependencies
```

---

## Step 5 – Output Checklist

✅ **Checklist:**

1. **UI Changes (Complexity: 1/10)** – No UI changes, components weren't being used
2. **UX Changes (Complexity: 1/10)** – No UX impact, unused components removed
3. **Data Handling (Complexity: 1/10)** – No data handling changes
4. **Function Logic (Complexity: 3/10)** – Audit scripts and verification logic for safe removal
5. **ID/Key Consistency (Complexity: 1/10)** – No impact on ID/key systems

**Estimated Development Time:** 2-3 hours  
**Bundle Size Reduction**: 6+ component folders removed  
**Success Criteria:** Unused shadcn components removed, build works, audit documentation created
