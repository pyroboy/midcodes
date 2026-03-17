#!/bin/bash

# Auto-sync script for ID-Gen repository specs to Obsidian vault
# Usage: ./sync-specs.sh

REPO_SPECS_DIR="/data/data/com.termux/files/home/midcodes/apps/id-gen/specs"
VAULT_SPECS_DIR="/data/data/com.termux/files/home/storage/shared/arjoencrypted/midcodes/01 - Midcodes/SPEEDRUNS🏃‍♂️💨/ID-GEN/repo-specs"

# Create vault directory if it doesn't exist
mkdir -p "$VAULT_SPECS_DIR"

# Count files before sync
repo_count=$(ls "$REPO_SPECS_DIR"/*.md 2>/dev/null | wc -l)
vault_count=$(ls "$VAULT_SPECS_DIR"/*.md 2>/dev/null | wc -l)

echo "📋 Spec Sync Status:"
echo "Repository specs: $repo_count"
echo "Vault specs: $vault_count"

if [ "$repo_count" -eq "$vault_count" ]; then
    echo "✅ Specs already in sync"
    exit 0
fi

echo "🔄 Syncing specs to vault..."

# Copy all spec files from repo to vault
for spec_file in "$REPO_SPECS_DIR"/Spec-*.md; do
    if [ -f "$spec_file" ]; then
        filename=$(basename "$spec_file")
        cp "$spec_file" "$VAULT_SPECS_DIR/"
        echo "📄 Synced: $filename"
    fi
done

# Verify sync
new_vault_count=$(ls "$VAULT_SPECS_DIR"/*.md 2>/dev/null | wc -l)
echo "✅ Sync complete: $new_vault_count specs in vault"

if [ "$repo_count" -eq "$new_vault_count" ]; then
    echo "🎉 All specs successfully synced!"
else
    echo "⚠️ Sync may be incomplete. Check manually."
fi