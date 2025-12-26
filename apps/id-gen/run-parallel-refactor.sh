#!/bin/bash
# Parallel execution script for Templates Page Refactoring
# Run in Warp terminal: bash run-parallel-refactor.sh

set -e

echo "🚀 Starting Parallel Refactoring Tasks..."

# Function to run a task with status
run_task() {
    local name="$1"
    local command="$2"
    echo "▶️  Starting: $name"
    eval "$command" &
    echo "✅ $name started in background"
}

# Phase 1: Extract Utilities (4 parallel tasks)
run_task "templateImageUpload.ts" "cat > src/lib/utils/templateImageUpload.ts << 'EOF'
// Image Upload Utilities
// Functions: uploadImage(), blobToDataUrl(), fetchBackgroundAsBlob()

export async function uploadImage(file: File, path: string, userId: string) {
  // TODO: Implement image upload logic
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function fetchBackgroundAsBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  return response.blob();
}
EOF"

run_task "templateHelpers.ts" "cat > src/lib/utils/templateHelpers.ts << 'EOF'
// Template Helpers
// Functions: detectOrientationFromDimensions(), findBestDefaultSize(), validateBackgrounds()

export function detectOrientationFromDimensions(width: number, height: number): 'portrait' | 'landscape' {
  return width >= height ? 'landscape' : 'portrait';
}

export function getOrientationAwarePixelDimensions(dims: { width: number; height: number }, expectedOrientation: string) {
  // TODO: Implement orientation-aware dimension calculation
  return dims;
}

export function findBestDefaultSize(presets: any[], orientation: string) {
  // TODO: Implement best default size finding
  return presets[0];
}

export function validateBackgrounds(frontBackground: any, backBackground: any) {
  // TODO: Implement background validation
  return { valid: true, errors: [] };
}

export function validateImage(file: File, side: 'front' | 'back') {
  // TODO: Implement image validation
  return { valid: true, errors: [] };
}
EOF"

run_task "templateElements.ts" "cat > src/lib/utils/templateElements.ts << 'EOF'
// Element Management Utilities
// Functions: triggerElementCreation(), sanitizeElement(), splitElementsBySide()

export function triggerElementCreation() {
  // TODO: Implement element creation trigger
}

export function sanitizeElement(el: any) {
  // TODO: Implement element sanitization
  return el;
}

export function splitElementsBySide(elements: any[]) {
  return {
    front: elements.filter(e => e.side === 'front' || !e.side),
    back: elements.filter(e => e.side === 'back')
  };
}
EOF"

run_task "backgroundPosition.ts" "cat > src/lib/utils/backgroundPosition.ts << 'EOF'
// Background Position Helpers
// Functions: handleBackgroundPositionUpdate(), updateCropPreviews()

export function handleBackgroundPositionUpdate(position: { x: number; y: number }, side: 'front' | 'back') {
  // TODO: Implement background position update
  return { x: position.x, y: position.y };
}

export function updateCropPreviews(frontBackground: any, backBackground: any) {
  // TODO: Implement crop preview updates
  return { front: null, back: null };
}
EOF"

# Wait for all tasks to complete
wait
echo "✅ All Phase 1 utilities created successfully!"
