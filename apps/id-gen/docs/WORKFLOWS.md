# Cross-Repository Workflows

## Multi-Repository Context

This project involves two main directories:

### 1. Current ID-Gen Repository
`/data/data/com.termux/files/home/midcodes/apps/id-gen/`
- Main development repository for the **ID Generation** app
- Includes all **source code**, **documentation**, and **project files**

### 2. Obsidian Vault (Knowledge Base)
`/data/data/com.termux/files/home/storage/shared/arjoencrypted/midcodes/`
- Centralized knowledge management system (PARA structure)
- Stores **business documentation**, **speedruns**, **personal development resources**
- Contains **Midcodes documentation** and **technical specs**
- Reference **CLAUDE.md** in the root for full vault structure

## Cross-Repository Workflow

- **Research & Planning** → Use Obsidian Vault for strategy, patterns, and requirements
- **Implementation** → Apply vault knowledge during code development
- **Documentation** → Update both repo and vault after each development cycle
- **Speedrun Link** → This project corresponds to **ID-GEN Speedrun** in the vault
- **Mirroring** → Repo docs automatically mirrored to the vault for centralized access

## Documentation Mirroring Strategy

### Repository Folders
- `/docs/` → Documentation (reports, summaries)
- `/specs/` → Specifications (plans, instructions)
- `/tests/` → Test cases and QA reports

### Vault Targets
- `/repo-docs/` → Documentation (original names)
- `/repo-specs/` → Specifications (with naming convention)
- `/repo-tests/` → Tests (with naming convention)

### File Naming Conventions

- **Specifications** → `Spec-NN-MMMDD-Title-With-Dashes.md`
  - *Example:* `Spec-01-Aug20-Refactoring-Plan-Phase-1.md`
- **Documentation** → Original file name in CAPS
  - *Example:* `BUG_ANALYSIS_REPORT.md`
- **Tests** → `Test-NN-MMMDD-Component-Test-Name.md`
  - *Example:* `Test-01-Aug20-Authentication-Flow-Testing.md`

**Classification:**
- **SPEC** = Plans, guidelines, implementation steps
- **DOC** = Reports, analysis, post-mortems
- **TEST** = QA test cases, results

## Mirroring Commands

**Batch Mirror All Files**
```bash
./mirror-docs.sh
```

**Mirror Single File**
```bash
./mirror-docs.sh "BUG_ANALYSIS_REPORT.md"
```

**Auto Naming Example**
```bash
mirror_doc "BUG_ANALYSIS_REPORT.md" "Bug-Analysis-Report"
```

## Speedrun Development Framework

**Rapid Application Development System Based on Carmen Auto Parts POS**

### Standard Speedrun Structure

#### 1. Business Documentation
- **PRD (Product Requirements Document)** - Core application specification
- **Market Analysis** - Target audience and competitive landscape
- **Executive Summary** - Business case and value proposition

#### 2. Technical Documentation
- **Project Structure** - Complete SvelteKit + Supabase architecture
- **Database Schema** - SQL tables, relationships, and constraints
- **User Flow Diagrams** - Role-based interaction patterns

#### 3. User Experience Design
- **User Personas** - Detailed role definitions and permissions
- **Workflow Documentation** - Step-by-step process flows
- **Success Metrics** - KPIs and measurement frameworks

### Technical Standards for Speedruns

**Required Tech Stack:**
- **Frontend**: Svelte 5 + SvelteKit + TailwindCSS + Shadcn
- **Backend**: Supabase (database, auth, real-time, storage)
- **Validation**: Zod schemas in typeschema.ts files
- **State Management**: Svelte stores + Supabase subscriptions

**File Naming Conventions:**
- **PRD Files**: `[ProjectName] PRD.md`
- **Technical Docs**: `[ProjectName] Project Structure.md`
- **Database**: `[ProjectName] Database.md`
- **User Flows**: `[ProjectName] UserFlow.md`
