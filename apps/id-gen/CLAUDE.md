# CLAUDE.md

## meta-instruction
Now think hard and write elegant code that completes this.
Do not add backwards compatibility unless explicitly requested.
After every code block you write, lint, compile, and write corresponding tests and run them before writing the next code block

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
- **Source Tests**: `/data/data/com.termux/files/home/midcodes/apps/id-gen/tests/`

**Vault Targets**:
- **Mirror Docs**: `/data/data/com.termux/files/home/storage/shared/arjoencrypted/midcodes/01 - Midcodes/SPEEDRUNS🏃‍♂️💨/ID-GEN/repo-docs/`
- **Mirror Specs**: `/data/data/com.termux/files/home/storage/shared/arjoencrypted/midcodes/01 - Midcodes/SPEEDRUNS🏃‍♂️💨/ID-GEN/repo-specs/`
- **Mirror Tests**: `/data/data/com.termux/files/home/storage/shared/arjoencrypted/midcodes/01 - Midcodes/SPEEDRUNS🏃‍♂️💨/ID-GEN/repo-tests/`

**Purpose**: 
- Maintain centralized technical documentation in Obsidian vault
- Separate specifications (plans/instructions) from documentation (reports/summaries) and tests (test cases/results)
- Enable cross-linking between repo docs and business documentation
- Preserve development history and technical decisions in knowledge base
- Allow vault-based analysis and relationship mapping of technical documentation

**Naming Conventions**: Repository files are classified into three types with different naming patterns:

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

### **TESTS** (Test Cases/Results): `Test-NN-MMMDD-Component-Test-Name.md`
- **Repository**: `/tests/` folder (source files using naming convention)
- **Vault**: `/repo-tests/` folder (mirrored with same names)
- **Purpose**: Test cases, test results, QA documentation, test plans
- **Format**: `Test-NN-MMMDD-Component-Test-Name.md`
- **Examples**:
  - `Test-01-Aug20-Authentication-Flow-Testing.md`
  - `Test-02-Aug20-Template-Rendering-Performance.md`

### **Classification Criteria**:
- **SPEC**: Contains plans, instructions, implementation guidelines, "how-to" content
- **DOC**: Contains reports, analysis results, summaries, "what happened" content
- **TEST**: Contains test cases, test results, QA procedures, testing documentation

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
   - Tests: Create in `/tests/` with `Test-NN-MMMDD-Component-Test-Name.md` format
2. **Automatic Sync**: Run mirror command after any documentation updates
3. **Batch Processing**: Use the loop command to sync all files with proper naming
4. **Single File**: Use `mirror_doc` function for individual file updates

**Integration with Development Workflow**:
- Create specifications in `/specs/` using naming convention from start
- Create documentation in `/docs/` using CAPITALIZED format
- Create tests in `/tests/` using naming convention from start
- Mirror immediately after creating/updating documentation
- Maintain vault synchronization for centralized knowledge management
- Use date-based naming for chronological organization and easy reference

**Convenience Script**: Use `./mirror-docs.sh` for automatic mirroring
```bash
# Mirror all documentation, specifications, and tests
./mirror-docs.sh

# Mirror specific file from any folder
./mirror-docs.sh "BUG_ANALYSIS_REPORT.md"     # From docs/
./mirror-docs.sh "REFACTORING_PLAN_PHASE_1.md" # From specs/
./mirror-docs.sh "AUTHENTICATION_TESTING.md"   # From tests/
```

**Current Mirror Status**: Repository structure with three documentation types:

**REPOSITORY STRUCTURE**:
- **`/docs/`**: Documentation files (reports, summaries, analysis)
- **`/specs/`**: Specification files (plans, instructions, implementations)
- **`/tests/`**: Test files (test cases, results, QA documentation)

**VAULT MIRROR**:
- **`/repo-docs/`**: Documentation files with original names preserved  
- **`/repo-specs/`**: Specification files with naming convention
- **`/repo-tests/`**: Test files with naming convention

**FILE ORGANIZATION**:
- **SPECIFICATIONS** (Repository: `/specs/` → Vault: `/repo-specs/`): Use `Spec-NN-MMMDD-Title-With-Dashes.md` format
- **DOCUMENTATION** (Repository: `/docs/` → Vault: `/repo-docs/`): Use `CAPITALIZED_TITLES.md` format
- **TESTS** (Repository: `/tests/` → Vault: `/repo-tests/`): Use `Test-NN-MMMDD-Component-Test-Name.md` format

### Search Strategy for Multi-Repository Context

When searching for information:
1. **Code-specific queries**: Search this repository first
2. **Business/strategic queries**: Search the Obsidian vault at `/data/data/com.termux/files/home/storage/shared/arjoencrypted/midcodes/`
3. **Cross-reference**: Use vault documentation to inform code decisions and vice versa
4. **Fallback to Bash**: If Grep tool fails, use standard bash grep commands for reliable searching

## Commands


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
  - `schemas/`  - all the schema files  for the codebase, 
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

## Commands

### BMad Orchestrator Access

**File Location**: `/data/data/com.termux/files/home/midcodes/apps/id-gen/.claude/commands/BMad/agents/bmad-orchestrator.md`

**Direct Command Access**: Since slash commands are difficult to execute, you can directly read and execute the BMad Orchestrator by referencing this file path. The orchestrator provides:

- Master workflow coordination
- Specialized agent transformation 
- Multi-agent task orchestration
- Dynamic resource loading
- Commands start with `*` prefix (e.g., `*help`, `*agent`, `*workflow`)

**Key Commands Available**:
- `*help` - Show available agents and workflows
- `*agent [name]` - Transform into specialized agent 
- `*workflow [name]` - Start specific workflows
- `*task [name]` - Run specific tasks
- `*kb-mode` - Load full BMad knowledge base
- `*chat-mode` - Start conversational assistance

**Usage Pattern**: Read the orchestrator file directly to activate BMad Method capabilities without relying on slash command execution.

## Specification Creation Prompt

When creating technical specifications, use this structured approach to ensure comprehensive and consistent documentation:

### **Senior Software Engineer Specification Process**

You are acting as a **senior software engineer**. Follow these steps strictly and in order.

---

### **Step 0 – Input Reading (No Output)**

- Read the provided user request carefully.
- Store everything in working context silently.
- Do **not output anything** yet.
- This step is for grounding only.

---

### **Step 1 – Requirement Extraction**

- Break the request down into **clear, actionable technical requirements**.
- Identify **what the system must do**.
- If vague, restate in precise engineering terms.

---

### **Step 2 – Context Awareness**

- Assume we are building with **Svelte 5 + SvelteKit + Supabase**.
- Use **Supabase MCP** for ground-truth database handling details.
- Use **Context7 MCP** when dealing with NPM library documentation or usage patterns.
- If database design is involved → align with Supabase handling.
- If NPM packages are mentioned → check via Context7 for correct usage.

---

### **Step 3 – Spec Expansion**

- Expand the requirements into a **Technical Specification**.
- Include:
    - **Data flow** (where input comes from, where it goes, what transforms happen).
    - **State handling** (Svelte store, props, Supabase persistence).
    - **Function-level behavior** (important functions, error handling, edge cases).
    - **UI implications** (if minor, mark as UI minor).
    - **UX implications** (if minor, mark as UX minor).
    - **Database & API calls** (Supabase queries, inserts, auth).
    - **Dependencies** (libraries, MCP references).

---

### **Step 4 – Implementation Guidance**

- Provide a **high-level code strategy** (but not raw code).
- Reference **which files/components** are affected.
- Suggest **best practices** (error handling, performance, maintainability).
- Clarify assumptions explicitly.

---

### **Step 5 – Output Checklist (Always Output This)**

For each type of change, assign a bite-sized complexity level (1–10).
1 = trivial tweak, 10 = deep multi-file/system refactor before each category

At the end of your response, always provide a **checklist summary** like below:

✅ **Checklist:**

1. **UI Changes** – Are they only minor cosmetic adjustments?
2. **UX Changes** – Are they only minor interaction tweaks?
3. **Data Handling** – Any modifications to database schema or Supabase queries?
4. **Function Logic** – Any important business logic updates?
5. **ID/Key Consistency** – Ensure stable unique IDs/keys across state, DB, and UI.

---

⚡ **Important**: Output must always follow **Steps 1–5 in order**. Step 5 checklist is mandatory.

## Test Creation Prompt

When creating test documentation and test cases, use this structured approach to ensure comprehensive and consistent testing coverage:

### **Senior Data Architect Testing Process**

You are acting as a **senior data architect**. Follow these steps strictly and in order.

**Always ask the user: "What test are you concentrating on?" and output the types of test available.**

---

### **Step 0 – Input Reading (No Output)**

- Read the provided user request carefully.
- Store everything in working context silently.
- Do **not output anything** yet.
- This step is for grounding only.

---

### **Step 1 – Requirement Extraction**

- Break the request down into **clear, actionable technical requirements**.
- Identify **what the system must do**.
- If vague, restate in precise engineering terms.

---

### **Step 2 – Context Awareness**
    
    run   mcp__supabase__generate_typescript_types
  to  get the latest supabase types for ground truth   
- Assume we are building with **Svelte 5 + SvelteKit + Supabase**.
- Use **Supabase MCP** for ground-truth database handling details.
- Use **Context7 MCP** when dealing with NPM library documentation or usage patterns.
- If database design is involved → align with Supabase handling.
- If NPM packages are mentioned → check via Context7 for correct usage.

**!! USE SUPABASE MCP check data shape of the database. and output in the spec file**

**includes schemas and types and interfaces where necessary**

---

### **Step 3 – Technical Specification (Expanded)**


- Translate requirements into a **structured specification**.
- Cover:
    - **Data flow** → Input → Processing → Output.
    - **State handling** → (Svelte stores, props, Supabase sync).
    - **Function behaviors** → purpose, edge cases, error handling.
    - **Database/API** → tables, queries, inserts, updates, deletes.
    - **UI/UX considerations** → Only if relevant, mark as _UI minor_ or _UX minor_.
    - **Dependencies** → Libraries, MCP references, external APIs.
- Keep everything **explicit and verifiable**.

---

### **Step 4 – Implementation Plan**
- Propose a **step-by-step plan** for how to implement.
- Specify **which files/components** are involved.
- Highlight **best practices** (error handling, validation, testing, maintainability).
- List **assumptions & constraints** clearly.

---

### **Step 5 – Testing Strategy**

- Outline **how to test the implementation**:
    - Unit tests → Functions.
    - Integration tests → Supabase + SvelteKit flow.
    FOR INTEGRATION TEST
    !!! USE SUPABASE commands as if the using the supabase API NOT MCP COMMMANDS
    !!!Implement mechanisms to seed test data before running tests and clean up created records after tests complete
    !!! to ensure accurate and reliable test results MIRROR the tables to the schema "test_integration" 

    
    - E2E tests → User-level behavior in browser.
- Mention **edge cases** and how to confirm correctness.

---

### **Step 6 – Testing Checklist (Mandatory Output)**

**Always output the supabase table, the schemas, the interfaces, and the types involved**

Always output a testing completeness checklist for the feature/changes.
For each category, assign a rating from 1–10:

1 = weak/incomplete, 10 = strong, fully covered and reliable.

✅ **Checklist:**

1. **Unit Tests** – Are core functions tested with valid, invalid, and edge inputs? (1–10)
2. **Integration Tests** – Are database + API calls tested together with the app logic? (1–10)
3. **E2E Scenarios** – Are main user flows covered (happy path, error path, unusual path)? (1–10)
4. **Edge Cases** – Are rare/extreme inputs tested (empty, too long, duplicates, concurrency)? (1–10)
5. **Error Handling** – Do tests confirm correct UI/UX feedback on failures? (1–10)
6. **Data Consistency** – Do tests ensure store, DB, and UI remain correct after operations? (1–10)
7. **Repeatability** – Can tests run reliably with seeded/clean test data each time? (1–10)
8. **Performance/Load** – If relevant, is the system tested under multiple/parallel actions? (1–10)
9. **Regression Safety** – Do tests prevent breaking existing features? (1–10)
10. **Expected Outcomes** – Are pass/fail conditions clearly defined for each test? (1–10)

---

⚡ **Important**: be aware you can use mcp servers like context7 and supabase mcp for more information

## Commands
