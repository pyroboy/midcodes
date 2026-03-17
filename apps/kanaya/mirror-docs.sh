#!/bin/bash

# Mirror documentation and specifications to Obsidian vault
# Usage: ./mirror-docs.sh [specific-file]

REPO_DOCS="/data/data/com.termux/files/home/midcodes/apps/id-gen/docs"
REPO_SPECS="/data/data/com.termux/files/home/midcodes/apps/id-gen/specs"
VAULT_DOCS="/data/data/com.termux/files/home/storage/shared/arjoencrypted/midcodes/01 - Midcodes/SPEEDRUNS🏃‍♂️💨/ID-GEN/repo-docs"
VAULT_SPECS="/data/data/com.termux/files/home/storage/shared/arjoencrypted/midcodes/01 - Midcodes/SPEEDRUNS🏃‍♂️💨/ID-GEN/repo-specs"

# Create mirror directories if they don't exist
mkdir -p "$VAULT_DOCS"
mkdir -p "$VAULT_SPECS"

# Get next sequence number for each type
get_next_number() {
    local type="$1"  # "Doc" or "Spec"
    local vault_dir="$2"
    
    local max_num=$(ls "$vault_dir"/${type}-*-*.md 2>/dev/null | sed -n "s/.*${type}-\([0-9][0-9]\)-.*/\1/p" | sort -n | tail -1)
    if [[ -z "$max_num" ]]; then
        echo "01"
    else
        printf "%02d" $((10#$max_num + 1))
    fi
}

# Convert title to appropriate format based on type
format_title() {
    local title="$1"
    local type="$2"
    
    # Remove .md extension
    title=$(echo "$title" | sed 's/\.md$//')
    
    if [[ "$type" == "spec" ]]; then
        # Specs: Convert to dash-separated format
        echo "$title" | sed 's/[_]/ /g' | sed 's/\b\w/\U&/g' | sed 's/ /-/g'
    else
        # Docs: Keep original capitalized format with underscores
        echo "$title"
    fi
}

# Function to mirror a single file from docs folder
mirror_doc() {
    local file="$1"
    local filename=$(basename "$file")
    
    echo "📄 Mirroring (doc): $filename → $filename"
    cp "$file" "$VAULT_DOCS/$filename"
}

# Function to mirror a single file from specs folder  
mirror_spec() {
    local file="$1"
    local filename=$(basename "$file")
    local today=$(date +"%b%d")
    
    # Check if already follows spec naming convention
    if [[ $filename =~ ^Spec-[0-9]{2}-[A-Z][a-z]{2}[0-9]{2}-.+\.md$ ]]; then
        echo "✅ Already follows spec convention: $filename"
        cp "$file" "$VAULT_SPECS/"
    else
        # Apply spec naming convention
        local number=$(get_next_number "Spec" "$VAULT_SPECS")
        local title=$(format_title "$filename" "spec")
        local new_name="Spec-${number}-${today}-${title}.md"
        echo "📝 Mirroring (spec): $filename → $new_name"
        cp "$file" "$VAULT_SPECS/${new_name}"
    fi
}

# If specific file provided, mirror just that file
if [[ -n "$1" ]]; then
    if [[ -f "$REPO_DOCS/$1" ]]; then
        mirror_doc "$REPO_DOCS/$1"
        echo "✅ Doc file mirrored: $1"
    elif [[ -f "$REPO_SPECS/$1" ]]; then
        mirror_spec "$REPO_SPECS/$1"
        echo "✅ Spec file mirrored: $1"
    else
        echo "❌ File not found in docs/ or specs/: $1"
        exit 1
    fi
else
    # Mirror all files
    echo "🔄 Mirroring all documentation and specification files..."
    
    # Mirror docs
    echo "📄 Processing docs folder..."
    for file in "$REPO_DOCS"/*.md; do
        if [[ -f "$file" ]]; then
            mirror_doc "$file"
        fi
    done
    
    # Mirror specs
    echo "📝 Processing specs folder..."
    for file in "$REPO_SPECS"/*.md; do
        if [[ -f "$file" ]]; then
            mirror_spec "$file"
        fi
    done
    
    echo "✅ All files mirrored to vault"
fi

# Show summary
echo ""
echo "📊 Summary:"
echo "   Repository docs: $(ls -1 "$REPO_DOCS"/*.md 2>/dev/null | wc -l) files"
echo "   Repository specs: $(ls -1 "$REPO_SPECS"/*.md 2>/dev/null | wc -l) files"
echo "   Vault docs: $(find "$VAULT_DOCS" -name "*.md" 2>/dev/null | wc -l) files (original names)"
echo "   Vault specs: $(find "$VAULT_SPECS" -name "Spec-*.md" 2>/dev/null | wc -l) files (numbered)"
echo "   Docs location: $VAULT_DOCS"
echo "   Specs location: $VAULT_SPECS"