#!/usr/bin/env python3

# Read the file
with open('/Users/arjomagno/Documents/GitHub/midcodes/apps/id-gen/src/routes/admin/template-assets/decompose/+page.svelte', 'r') as f:
    content = f.read()

# The replacement component
replacement = '''							<!-- History Item Component -->
							<HistoryItem
								{item}
								isActive={activeHistoryId === item.id}
								{isExpanded}
								{display}
								{isSingleResult}
								onClick={() => requestLoadFromHistory(item)}
								onToggleExpanded={() => toggleHistoryExpanded(item.id)}
								onDragStart={(e) => {
									if (isSingleResult) {
										handleDragStart(e, {
											imageUrl: item.resultUrl || item.inputImageUrl,
											name: display.label
										}, item.id);
									}
								}}
								onLayerDragStart={(e, layer) => handleDragStart(e, layer, item.id)}
							/>'''

# Split into lines for line-based replacement
lines = content.split('\n')

# Find the HistoryItem section
start_line = None
end_line = None

for i, line in enumerate(lines):
    if '<div class="space-y-2">' in line and i > 2380:  # After line 2380 to be safe
        # Check previous line for history item context
        start_line = i
        print(f"Found start at line {i+1}: {line[:80]}")
        
    if start_line is not None and end_line is None:
        # Look for </div> followed by {/each}
        if line.strip() == '</div>':
            # Check if next non-empty line is {/each}
            for j in range(i+1, min(i+3, len(lines))):
                if '{/each}' in lines[j]:
                    end_line = i
                    print(f"Found end at line {i+1}: {line}")
                    break
            if end_line is not None:
                break

print(f"\nHistoryItem found from line {start_line+1 if start_line else 'N/A'} to {end_line+1 if end_line else 'N/A'}")

if start_line is not None and end_line is not None:
    # Replace lines
    new_lines = lines[:start_line] + replacement.split('\n') + lines[end_line+1:]
    
    # Write back
    with open('/Users/arjomagno/Documents/GitHub/midcodes/apps/id-gen/src/routes/admin/template-assets/decompose/+page.svelte', 'w') as f:
        f.write('\n'.join(new_lines))
    
    print(f"Replaced {end_line - start_line + 1} lines with {len(replacement.split(chr(10)))} lines")
    print(f"New file has {len(new_lines)} lines")
else:
    print("Could not find History Item section")
