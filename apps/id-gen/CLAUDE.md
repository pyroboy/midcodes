# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Multi-Repository Context

This Claude session has access to two important directories:

1. **Current ID-Gen Repository**: `/data/data/com.termux/files/home/midcodes/apps/id-gen/`
   - Active development repository for the ID Generation application
   - Contains all source code, documentation, and project files

2. **Obsidian Vault (Knowledge Base)**: `/data/data/com.termux/files/home/storage/shared/arjoencrypted/midcodes/`
   - Comprehensive knowledge management system with PARA organization
   - Contains business documentation, speedruns, personal development resources
   - Includes complete Midcodes documentation and technical specifications
   - Reference the main CLAUDE.md in the home directory for detailed vault structure

### Cross-Repository Usage Patterns

- **Research & Planning**: Use the Obsidian vault for business requirements, similar project patterns, and strategic planning
- **Implementation**: Apply patterns and documentation from vault to active development in this repository
- **Documentation**: Create or update vault documentation based on development learnings
- **Speedrun Integration**: This ID-Gen project corresponds to the ID-GEN speedrun in the vault's speedruns directory
- **Repo Docs Mirroring**: Repository documentation is automatically mirrored to vault for centralized knowledge management

### Documentation Mirroring Strategy

**Repository Structure**: 
- **Source Docs**: `/data/data/com.termux/files/home/midcodes/apps/id-gen/docs/`
- **Source Specs**: `/data/data/com.termux/files/home/midcodes/apps/id-gen/specs/`

**Vault Targets**:
- **Mirror Docs**: `/data/data/com.termux/files/home/storage/shared/arjoencrypted/midcodes/01 - Midcodes/SPEEDRUNS🏃‍♂️💨/ID-GEN/repo-docs/`
- **Mirror Specs**: `/data/data/com.termux/files/home/storage/shared/arjoencrypted/midcodes/01 - Midcodes/SPEEDRUNS🏃‍♂️💨/ID-GEN/repo-specs/`

**Purpose**: 
- Maintain centralized technical documentation in Obsidian vault
- Separate specifications (plans/instructions) from documentation (reports/summaries)
- Enable cross-linking between repo docs and business documentation
- Preserve development history and technical decisions in knowledge base
- Allow vault-based analysis and relationship mapping of technical documentation

**Naming Conventions**: Repository files are classified into two types with different naming patterns:

### **SPECIFICATIONS** (Instructions/Plans): `Spec-NN-MMMDD-Title-With-Dashes.md`
- **Repository**: `/specs/` folder (source files using naming convention)
- **Vault**: `/repo-specs/` folder (mirrored with same names)
- **Purpose**: Technical specifications, implementation plans, instructions
- **Format**: `Spec-NN-MMMDD-Title-With-Dashes.md`
- **Examples**:
  - `Spec-01-Aug20-REFACTORING-PLAN-PHASE-1.md`
  - `Spec-02-Aug20-DASHBOARD-UI-IMPROVEMENTS.md`

### **DOCUMENTATION** (Reports/Summaries): `CAPITALIZED_TITLES.md`
- **Repository**: `/docs/` folder (source files)
- **Vault**: `/repo-docs/` folder (same names)
- **Purpose**: Analysis reports, summaries, completion documentation
- **Format**: Original filename preserved
- **Examples**:
  - `BUG_ANALYSIS_REPORT.md` → `BUG_ANALYSIS_REPORT.md`
  - `VERIFICATION_REPORT.md` → `VERIFICATION_REPORT.md`

### **Classification Criteria**:
- **SPEC**: Contains plans, instructions, implementation guidelines, "how-to" content
- **DOC**: Contains reports, analysis results, summaries, "what happened" content

**Mirroring Commands**:
```bash
# Create mirror directory
mkdir -p "/data/data/com.termux/files/home/storage/shared/arjoencrypted/midcodes/01 - Midcodes/SPEEDRUNS🏃‍♂️💨/ID-GEN/repo-docs"

# Get next sequence number
get_next_spec_number() {
    local vault_docs="/data/data/com.termux/files/home/storage/shared/arjoencrypted/midcodes/01 - Midcodes/SPEEDRUNS🏃‍♂️💨/ID-GEN/repo-docs"
    local max_num=$(ls "$vault_docs"/Spec-*-*.md 2>/dev/null | sed -n 's/.*Spec-\([0-9][0-9]\)-.*/\1/p' | sort -n | tail -1)
    if [[ -z "$max_num" ]]; then
        echo "01"
    else
        printf "%02d" $((10#$max_num + 1))
    fi
}

# Convert title to dash-separated format
format_title() {
    local title="$1"
    # Remove .md extension, convert to proper case with dashes
    echo "$title" | sed 's/\.md$//' | sed 's/[_-]/ /g' | sed 's/\b\w/\U&/g' | sed 's/ /-/g'
}

# Mirror all docs with naming convention
for file in "/data/data/com.termux/files/home/midcodes/apps/id-gen/docs/"*.md; do
    if [[ -f "$file" ]]; then
        filename=$(basename "$file")
        # Check if already follows new naming convention
        if [[ $filename =~ ^Spec-[0-9]{2}-[A-Z][a-z]{2}[0-9]{2}-.+\.md$ ]]; then
            cp "$file" "/data/data/com.termux/files/home/storage/shared/arjoencrypted/midcodes/01 - Midcodes/SPEEDRUNS🏃‍♂️💨/ID-GEN/repo-docs/"
        else
            # Apply new naming convention
            spec_num=$(get_next_spec_number)
            today=$(date +"%b%d")
            title=$(format_title "$filename")
            new_name="Spec-${spec_num}-${today}-${title}.md"
            cp "$file" "/data/data/com.termux/files/home/storage/shared/arjoencrypted/midcodes/01 - Midcodes/SPEEDRUNS🏃‍♂️💨/ID-GEN/repo-docs/${new_name}"
        fi
    fi
done

# Quick mirror single file with auto-naming
mirror_doc() {
    local file="$1"
    local custom_title="$2"
    local spec_num=$(get_next_spec_number)
    local today=$(date +"%b%d")
    local title
    
    if [[ -n "$custom_title" ]]; then
        title=$(echo "$custom_title" | sed 's/ /-/g')
    else
        title=$(format_title "$file")
    fi
    
    local new_name="Spec-${spec_num}-${today}-${title}.md"
    cp "/data/data/com.termux/files/home/midcodes/apps/id-gen/docs/${file}" "/data/data/com.termux/files/home/storage/shared/arjoencrypted/midcodes/01 - Midcodes/SPEEDRUNS🏃‍♂️💨/ID-GEN/repo-docs/${new_name}"
    echo "Mirrored: ${file} → ${new_name}"
}

# Usage: mirror_doc "BUG_ANALYSIS_REPORT.md" "Bug-Analysis-Report"
```

**Auto-Mirror Workflow**: 
1. **File Creation**: 
   - Specifications: Create in `/specs/` with `Spec-NN-MMMDD-Title-With-Dashes.md` format
   - Documentation: Create in `/docs/` with `CAPITALIZED_TITLES.md` format
2. **Automatic Sync**: Run mirror command after any documentation updates
3. **Batch Processing**: Use the loop command to sync all files with proper naming
4. **Single File**: Use `mirror_doc` function for individual file updates

**Integration with Development Workflow**:
- Create specifications in `/specs/` using naming convention from start
- Create documentation in `/docs/` using CAPITALIZED format
- Mirror immediately after creating/updating documentation
- Maintain vault synchronization for centralized knowledge management
- Use date-based naming for chronological organization and easy reference

**Convenience Script**: Use `./mirror-docs.sh` for automatic mirroring
```bash
# Mirror all documentation and specifications
./mirror-docs.sh

# Mirror specific file from either folder
./mirror-docs.sh "BUG_ANALYSIS_REPORT.md"     # From docs/
./mirror-docs.sh "REFACTORING_PLAN_PHASE_1.md" # From specs/
```

**Current Mirror Status**: All 19 files successfully organized and mirrored to vault:

**REPOSITORY STRUCTURE**:
- **`/docs/`**: 11 documentation files (reports, summaries, analysis)
- **`/specs/`**: 8 specification files (plans, instructions, implementations)

**VAULT MIRROR**:
- **`/repo-docs/`**: 11 files with original names preserved  
- **`/repo-specs/`**: 8 files with same naming convention as repository

**SPECIFICATIONS** (Repository: `/specs/` → Vault: `/repo-specs/`):
- `Spec-01-Aug20-DASHBOARD-UI-IMPROVEMENTS.md` (both repo and vault)
- `Spec-02-Aug20-ID-GEN-ROLE-INSTRUCTIONS.md` (both repo and vault)
- `Spec-03-Aug20-MOBILE-OPTIMIZATION-PLAN.md` (both repo and vault)
- `Spec-04-Aug20-PAYMENT-BYPASS-IMPLEMENTATION.md` (both repo and vault)
- `Spec-05-Aug20-PAYMENT-STRUCTURE.md` (both repo and vault)
- `Spec-06-Aug20-QA-CHECKLIST-AND-ROLLOUT.md` (both repo and vault)
- `Spec-07-Aug20-REFACTORING-PLAN-PHASE-1.md` (both repo and vault)
- `Spec-08-Aug20-ROUTE-DOCUMENTATION.md` (both repo and vault)

**DOCUMENTATION** (Repository: `/docs/` → Vault: `/repo-docs/`):
- All files preserved with original names for easy recognition

### Search Strategy for Multi-Repository Context

When searching for information:
1. **Code-specific queries**: Search this repository first
2. **Business/strategic queries**: Search the Obsidian vault at `/data/data/com.termux/files/home/storage/shared/arjoencrypted/midcodes/`
3. **Cross-reference**: Use vault documentation to inform code decisions and vice versa
4. **Fallback to Bash**: If Grep tool fails, use standard bash grep commands for reliable searching

## Commands

### Development

- `npm run dev` - Start development server on localhost:5173
- `npm run dev -- --open` - Start dev server and open in browser

### Building and Testing

- `npm run build` - Create production build
- `npm run preview` - Preview production build locally
- `npm run check` - Run Svelte type checking
- `npm run check:watch` - Run type checking in watch mode
- `npm run test` - Run all tests (integration + unit)
- `npm run test:integration` - Run Playwright integration tests
- `npm run test:unit` - Run Vitest unit tests

### Code Quality

- `npm run lint` - Check code formatting and linting (Prettier + ESLint)
- `npm run format` - Auto-format code with Prettier

### Supabase Edge Functions

- `npm run serve:edge` - Serve edge functions locally with env vars
- `npm run deploy:edge` - Deploy role-emulation edge function

### Cleanup

- `npm run clean` - Remove build artifacts and cache

## Architecture

### Core Technology Stack

- **SvelteKit 2.x** with TypeScript - Full-stack framework
- **Vercel** deployment with Node.js 20.x runtime
- **Supabase** - Database, auth, and storage backend
- **TailwindCSS 4.x** - Utility-first styling
- **Threlte** (@threlte/core, @threlte/extras) - 3D graphics with Three.js
- **shadcn-svelte** - UI component library

### Project Structure

- `src/lib/` - Shared utilities and stores
  - `components/` - Reusable Svelte components including shadcn-svelte UI
  - `stores/` - Svelte stores for state management (auth, darkMode, templateStore)
  - `types/` - TypeScript type definitions including generated Supabase types
  - `utils/` - Helper functions for card geometry and ID card operations
- `src/routes/` - SvelteKit file-based routing
  - `templates/` - Template management pages (admin only)
  - `use-template/` - ID generation from templates
  - `all-ids/` - View generated ID cards
  - `auth/` - Authentication pages
  - `api/` - API endpoints

### Database Integration

- Uses Supabase with type-safe generated TypeScript types (`database.types.ts`)
- Row Level Security (RLS) policies enforce role-based access control
- Main tables: `templates`, `idcards`, `organizations`, `profiles`
- Organization-scoped data access patterns

### Role-Based Access Control

Role hierarchy: `super_admin` > `org_admin` > `id_gen_admin` > `id_gen_user`

**Template Management**: Only admin roles (`super_admin`, `org_admin`, `id_gen_admin`) can create/edit templates
**ID Generation**: All roles can generate IDs from available templates
**Data Scope**: All operations are organization-scoped via `org_id`

See `specs/Spec-02-Aug20-ID-GEN-ROLE-INSTRUCTIONS.md` for detailed role implementation guidelines.

### 3D Rendering

Uses Threlte wrapper around Three.js for 3D ID card visualization and rendering. Components handle camera positioning, lighting, and card geometry calculations.

### State Management

- `templateStore.ts` - Template data and elements with complex TemplateElement interface
- `auth.ts` - User session and role management
- `darkMode.ts` - Theme state persistence

### Key Development Patterns

- Server-side route protection with `requireAuth()` in `+page.server.ts` files
- Type-safe Supabase operations with generated database types
- Component composition with shadcn-svelte UI primitives
- File upload/storage through Supabase Storage with organization-scoped paths

### Testing Strategy

- **Integration tests**: Playwright for end-to-end scenarios
- **Unit tests**: Vitest with Testing Library for component testing
- **Mocking**: MSW for API mocking in tests

### Development Notes

- Server binds to `127.0.0.1:5173` specifically for Windows compatibility
- Vite optimizes deps for 3D libraries and UI components
- Uses session storage for auth persistence (not localStorage)
- Environment variables through SvelteKit's `$env` modules

- i want the docs mirroed to my speedrun obisidian vault but in a separste folder repo-docs.