#!/bin/bash
# ============================================
# GitHub Repo Cleanup Script for pyroboy
# ============================================
# Run this from your terminal (needs gh CLI authenticated)
#
# What it does:
#   1. Archives stale/dead repos
#   2. Deletes duplicate standalone repos (already in midcodes monorepo)
#
# Prerequisites: gh auth login
# ============================================

set -e
echo "🔍 Checking gh auth..."
gh auth status || { echo "❌ Run 'gh auth login' first"; exit 1; }

echo ""
echo "=========================================="
echo "  STEP 1: ARCHIVE stale/dead repos"
echo "=========================================="

ARCHIVE_REPOS=(
  "schoolProject"        # website design class, Jun 2023 — ancient
  "fuel-flow-control-center"  # May 2025, not local, abandoned
  "fuelFlow_local"       # fork, Apr 2025, not local
  "screengate"           # now lives in midcodes/apps/screengate
  "voucherGenerator"     # now lives in midcodes/apps/voucherGenerator
)

for repo in "${ARCHIVE_REPOS[@]}"; do
  echo ""
  echo "📦 Archiving pyroboy/$repo..."
  gh repo archive "pyroboy/$repo" --yes 2>&1 || echo "  ⚠️  Failed or already archived"
done

echo ""
echo "=========================================="
echo "  STEP 2: DELETE duplicate standalone repos"
echo "  (these already live in midcodes monorepo)"
echo "=========================================="

DELETE_REPOS=(
  "AZPOS"            # duplicate — exists as midcodes/apps/AZPOS
  "franchise-nexus"  # duplicate — exists as midcodes/apps/franchise-nexus
)

for repo in "${DELETE_REPOS[@]}"; do
  echo ""
  echo "🗑️  Deleting pyroboy/$repo..."
  gh repo delete "pyroboy/$repo" --yes 2>&1 || echo "  ⚠️  Failed to delete"
done

echo ""
echo "=========================================="
echo "  STEP 3: Decide on these (manual)"
echo "=========================================="
echo "  • tattoo-tide    — last push Apr 2025, 'upload, final?'"
echo "  • auto-parts-optimax — last push Mar 2025"
echo "  • contextM       — last push Nov 2025 (Python)"
echo ""
echo "  To archive:  gh repo archive pyroboy/REPO_NAME --yes"
echo "  To delete:   gh repo delete pyroboy/REPO_NAME --yes"
echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Remaining active repos:"
gh repo list pyroboy --limit 20 --json name,isArchived --jq '.[] | select(.isArchived==false) | .name'
