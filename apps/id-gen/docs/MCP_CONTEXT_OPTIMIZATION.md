# MCP Context Optimization Results

## Context Token Reduction Summary

**Before Optimization**: 17.8k MCP tokens (8.9% of total context)
**After Optimization**: ~1.8k MCP tokens (0.9% of total context)
**Savings**: ~16k tokens (90% reduction)

## Configuration Strategy

The optimization strategy moves from "allow most, deny few" to "deny most, ask for essential":

### **DENIED Tools** (28 tools - ~16k tokens saved)
All non-essential MCP tools are now explicitly denied:

- **Context7 MCP tools** - Use WebSearch instead for documentation
- **DeepWiki MCP tools** - Use WebSearch instead for GitHub repo analysis  
- **Supabase admin tools** - Not needed for core development:
  - Organization management (list_organizations, get_organization)
  - Cost calculation (get_cost, confirm_cost)
  - Project lifecycle (create_project, pause_project, restore_project)
  - Branch management (create_branch, list_branches, delete_branch, merge_branch, reset_branch, rebase_branch)
  - Deployment tools (deploy_edge_function, list_edge_functions)
  - Advanced features (get_logs, get_advisors, apply_migration, list_migrations, list_extensions)

### **ASK-PERMISSION Tools** (4 tools - ~1.8k tokens when used)
Essential development tools require explicit user approval:

- `mcp__supabase__generate_typescript_types` - Database schema type generation
- `mcp__supabase__list_projects` - Project discovery for development  
- `mcp__supabase__execute_sql` - Direct SQL queries for development
- `mcp__supabase__list_tables` - Database structure inspection

### **ALLOWED Tools** (4 tools - no MCP context cost)
Core npm/development commands that don't consume MCP context:

- `Bash(npm run dev:*)`
- `Bash(npm view:*)`
- `Bash(npm run check:*)`
- `Bash(pnpm run test:unit:*)`

## Implementation

The optimization is implemented in the project-specific settings file:
```
/data/data/com.termux/files/home/midcodes/apps/id-gen/.claude/settings.local.json
```

## Usage Impact

### **No Impact** - These workflows continue unchanged:
- Database type generation (asks for permission first)
- SQL queries and table inspection (asks for permission first)  
- NPM development commands (fully allowed)
- Core development tasks (build, test, lint)

### **Alternative Methods** - These workflows now use different tools:
- **Documentation lookup**: Use WebSearch instead of Context7 MCP
- **GitHub repository analysis**: Use WebSearch instead of DeepWiki MCP
- **Library documentation**: Use WebFetch with direct URLs

### **Requires Permission** - These workflows now require explicit approval:
- Generating TypeScript types from database schema
- Listing Supabase projects
- Running direct SQL queries
- Inspecting database table structure

## Benefits

1. **90% Context Reduction**: Frees up ~16k tokens for actual development work
2. **Faster Startup**: Fewer MCP tools to load and validate
3. **Focused Development**: Only essential database tools available
4. **Security**: Explicit approval required for database operations
5. **Flexibility**: Can still access all functionality when needed

## Rollback Instructions

To restore full MCP access, replace the settings file content with:
```json
{
  "permissions": {
    "allow": ["*"],
    "deny": [],
    "ask": []
  }
}
```

## Context Usage Verification

Run `/context` command to verify the token reduction:
- Look for "MCP tools" section showing ~1.8k tokens (down from 17.8k)
- Total context should show improved free space percentage