#!/usr/bin/env python3
import re

# Read the file
with open('/Users/arjomagno/Documents/GitHub/midcodes/apps/id-gen/src/routes/admin/template-assets/decompose/+page.svelte', 'r') as f:
    content = f.read()

# Find the LayerCard section (lines 2218-2536)
# Look for the pattern from "<!-- Layer Card -->" to the closing "</div>" before "{/each}"

# The replacement component
replacement = '''							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<!-- Layer Card Component -->
							<LayerCard
								{layer}
								{selection}
								{isOriginal}
								isSelected={selectedLayerId === layer.id}
								isExpanded={isLayerExpanded}
								{visible}
								{showOriginalLayer}
								{mergeMode}
								mergeOptions={getMergeTargetOptions(layer.id)}
								currentTarget={mergeTargets.get(layer.id)}
								allLayers={currentLayers}
								opacity={getLayerOpacity(layer.id)}
								layerSettings={getLayerSettings(layer.id)}
								isDragged={draggedLayerId === layer.id}
								isDragOver={dragOverLayerId === layer.id}
								onSelect={() => (selectedLayerId = layer.id)}
								onToggleExpanded={() => toggleLayerExpanded(layer.id)}
								onToggleIncluded={() => toggleLayerIncluded(layer.id)}
								onToggleOriginalLayer={() => (showOriginalLayer = !showOriginalLayer)}
								onDelete={() => deleteLayer(layer.id)}
								onUpdateVariableName={(name) => updateVariableName(layer.id, name)}
								onUpdateType={(type) => updateLayerType(layer.id, type)}
								onSetOpacity={(val) => setLayerOpacity(layer.id, val)}
								onToggleDownscale={() => toggleLayerDownscale(layer.id)}
								onSetMergeTarget={(targetId) => setMergeTarget(layer.id, targetId)}
								onPreviewImage={(url, title) => {
									previewImageUrl = url;
									previewImageTitle = title;
									imagePreviewModalOpen = true;
								}}
								onDragStart={(e) => handleLayerDragStart(e, layer.id)}
								onDragOver={(e) => handleLayerDragOver(e, layer.id)}
								onDragLeave={handleLayerDragLeave}
								onDrop={(e) => handleLayerDrop(e, layer.id)}
								onDragEnd={handleLayerDragEnd}
							/>'''

# Split into lines for line-based replacement
lines = content.split('\n')

# Find start line (<!-- svelte-ignore --> before <!-- Layer Card -->)
start_line = None
end_line = None

for i, line in enumerate(lines):
    if '<!-- svelte-ignore a11y_no_static_element_interactions -->' in line and i+1 < len(lines) and '<!-- Layer Card -->' in lines[i+1]:
        start_line = i
    # After finding start, look for the end (</div> followed by {/each})
    if start_line is not None and end_line is None:
        if '</div>' in line:
            # Check if the next non-empty line contains {/each}
            for j in range(i+1, min(i+3, len(lines))):
                if '{/each}' in lines[j]:
                    end_line = i
                    break
        if end_line is not None:
            break

print(f"Found LayerCard from line {start_line+1} to {end_line+1}")

if start_line is not None and end_line is not None:
    # Replace lines
    new_lines = lines[:start_line] + replacement.split('\n') + lines[end_line+1:]
    
    # Write back
    with open('/Users/arjomagno/Documents/GitHub/midcodes/apps/id-gen/src/routes/admin/template-assets/decompose/+page.svelte', 'w') as f:
        f.write('\n'.join(new_lines))
    
    print(f"Replaced {end_line - start_line + 1} lines with {len(replacement.split(chr(10)))} lines")
    print(f"New file has {len(new_lines)} lines")
else:
    print("Could not find LayerCard section")
