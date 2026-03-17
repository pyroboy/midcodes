#!/usr/bin/env python3

# Read the file
with open('/Users/arjomagno/Documents/GitHub/midcodes/apps/id-gen/src/routes/admin/template-assets/decompose/+page.svelte', 'r') as f:
    lines = f.readlines()

# Find line with "/>" (HistoryItem closing tag) followed by extra </div> lines
# We want to keep lines 1-2412 (HistoryItem closing), and then skip the extra lines
# until we reach the proper {/each} for the history foreach

# Looking for the pattern:
# Line 2412: />
# Lines 2413-2417: Extra </div>, {/each}, </div>, {/if}, </div>  <- REMOVE THESE
# Line 2418: {/each}  <- KEEP (this is the history items {/each})

new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    
    # Look for our HistoryItem component end
    if i >= 2410 and i <= 2412 and '/>' in line.strip():
        new_lines.append(line)
        # Now skip the extra lines until we find the outer {/each}
        i += 1
        skipped = 0
        while i < len(lines):
            current = lines[i].strip()
            # Skip </div>, {/each} that are part of old nested structure
            if current in ['</div>', '{/each}', '{/if}'] and skipped < 5:
                print(f"Skipping line {i+1}: {lines[i].rstrip()}")
                skipped += 1
                i += 1
            else:
                break
        continue
    
    new_lines.append(line)
    i += 1

# Write back
with open('/Users/arjomagno/Documents/GitHub/midcodes/apps/id-gen/src/routes/admin/template-assets/decompose/+page.svelte', 'w') as f:
    f.writelines(new_lines)

print(f"File now has {len(new_lines)} lines (was {len(lines)})")
