# Supabase Schema Dump using MCP

This command uses Claude Code's Supabase MCP integration to dump the complete database schema.

## Usage

```bash
claude mcp call supabase execute_sql --query "QUERY_BELOW"
```

## Schema Dump Query

The following SQL query extracts complete schema information:

```sql
WITH table_info AS (
    SELECT 
        c.relname as table_name,
        (
            SELECT string_agg(
                format('    %I %s%s%s',
                    a.attname,
                    pg_catalog.format_type(a.atttypid, a.atttypmod),
                    CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END,
                    CASE 
                        WHEN a.atthasdef 
                        THEN ' DEFAULT ' || pg_catalog.pg_get_expr(d.adbin, d.adrelid)
                        ELSE ''
                    END
                ),
                E',\n'
            )
            FROM pg_catalog.pg_attribute a
            LEFT JOIN pg_catalog.pg_attrdef d ON (a.attrelid = d.adrelid AND a.attnum = d.adnum)
            WHERE a.attrelid = c.oid
            AND a.attnum > 0
            AND NOT a.attisdropped
        ) as column_definitions
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r'
    AND n.nspname = 'public'
),
policy_info AS (
    SELECT 
        tablename,
        string_agg(
            format(
                'ALTER TABLE %I ENABLE ROW LEVEL SECURITY;' ||
                E'\nCREATE POLICY %I ON %I' ||
                E'\n    AS %s' ||
                E'\n    FOR %s' ||
                E'\n    TO %s' ||
                E'\n    USING (%s)%s;',
                tablename,
                polname, tablename,
                polroles,
                CASE WHEN polcmd = '*' THEN 'ALL' ELSE polcmd END,
                CASE WHEN roles = '{public}' THEN 'public' ELSE array_to_string(roles, ', ') END,
                polk,
                CASE 
                    WHEN polqual IS NOT NULL 
                    THEN E'\n    WITH CHECK (' || polqual || ')'
                    ELSE ''
                END
            ),
            E'\n\n'
        ) as policies
    FROM (
        SELECT 
            c.relname as tablename,
            p.polname,
            CASE 
                WHEN p.polpermissive THEN 'PERMISSIVE'
                ELSE 'RESTRICTIVE'
            END as polroles,
            p.polcmd,
            ARRAY(
                SELECT pg_get_userbyid(unnest(p.polroles))
            ) as roles,
            pg_catalog.pg_get_expr(p.polqual, p.polrelid) as polk,
            CASE WHEN p.polwithcheck IS NOT NULL 
                THEN pg_catalog.pg_get_expr(p.polwithcheck, p.polrelid)
                ELSE NULL 
            END as polqual
        FROM pg_catalog.pg_policy p
        JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
    ) subq
    GROUP BY tablename
),
trigger_info AS (
    SELECT 
        c.relname as table_name,
        t.tgname as trigger_name,
        format(
            'CREATE TRIGGER %I\n    %s %s ON %I\n    FOR EACH %s\n    EXECUTE FUNCTION %s(%s);',
            t.tgname,
            CASE WHEN (t.tgtype & 1) <> 0 THEN 'BEFORE'
                 WHEN (t.tgtype & 2) <> 0 THEN 'AFTER'
                 WHEN (t.tgtype & 4) <> 0 THEN 'INSTEAD OF'
                 ELSE '' END,
            replace(
                trim(
                    both ',' from
                    concat_ws(', ',
                        CASE WHEN (t.tgtype & 8) <> 0 THEN 'INSERT' ELSE NULL END,
                        CASE WHEN (t.tgtype & 16) <> 0 THEN 'DELETE' ELSE NULL END,
                        CASE WHEN (t.tgtype & 32) <> 0 THEN 'UPDATE' ELSE NULL END,
                        CASE WHEN (t.tgtype & 64) <> 0 THEN 'TRUNCATE' ELSE NULL END
                    )
                )
            , ', ', ','),
            c.relname,
            CASE WHEN (t.tgtype & 1) = 0 THEN 'STATEMENT' ELSE 'ROW' END,
            p.proname,
            pg_get_function_arguments(p.oid)
        ) as trigger_def
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE NOT t.tgisinternal
    AND n.nspname = 'public'
),
function_info AS (
    SELECT 
        p.proname as function_name,
        format(
            'CREATE FUNCTION %I(%s)\nRETURNS %s\nLANGUAGE %s\nAS $$\n%s\n$$;',
            p.proname,
            pg_get_function_arguments(p.oid),
            pg_get_function_result(p.oid),
            l.lanname,
            pg_get_functiondef(p.oid)
        ) as function_def
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    JOIN pg_language l ON p.prolang = l.oid
    WHERE n.nspname = 'public'
    AND p.prokind IN ('f', 'p')
),
trg_def AS (
    SELECT table_name, string_agg(trigger_def, E'\n\n') AS trigger_def
    FROM trigger_info
    GROUP BY table_name
),
enum_info AS (
    SELECT
        t.typname AS enum_name,
        format(
            'CREATE TYPE %I AS ENUM (%s);',
            t.typname,
            string_agg(quote_literal(e.enumlabel), ', ' ORDER BY e.enumsortorder)
        ) AS definition
    FROM pg_type t
    JOIN pg_enum e      ON e.enumtypid = t.oid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
    GROUP BY t.typname
)

-- Output table with policies and triggers
SELECT 
    'TABLE: ' || COALESCE(t.table_name, p.tablename, trg_def.table_name) AS name,
    format(
        '%s%s',
        COALESCE(format(E'CREATE TABLE %I (\n%s\n);\n\n', t.table_name, t.column_definitions), ''),
        COALESCE(p.policies || E'\n\n', '')
    ) ||
    COALESCE(trg_def.trigger_def, '') AS definition
FROM table_info t
FULL OUTER JOIN policy_info p 
    ON t.table_name = p.tablename
FULL OUTER JOIN trg_def
    ON COALESCE(t.table_name, p.tablename) = trg_def.table_name

UNION ALL

-- Output triggers individually
SELECT 
    'TRIGGER: ' || table_name || '__' || trigger_name,
    trigger_def
FROM trigger_info

UNION ALL

-- Output functions
SELECT 
    'FUNCTION: ' || function_name,
    function_def
FROM function_info

UNION ALL

-- Output enums
SELECT
    'ENUM: ' || enum_name,
    definition
FROM enum_info

ORDER BY name;
```

## What This Query Extracts

📋 **Schema dump includes:**
- Table definitions with columns and constraints
- Row Level Security (RLS) policies  
- Database triggers
- Custom functions
- Enum types

## Example Usage

### Basic Schema Dump
```bash
claude mcp call supabase execute_sql --query "$(cat .claude/commands/supabase-schema-dump-mcp.md | sed -n '/```sql/,/```/p' | sed '1d;$d')"
```

### Save to File
```bash
claude mcp call supabase execute_sql --query "$(cat .claude/commands/supabase-schema-dump-mcp.md | sed -n '/```sql/,/```/p' | sed '1d;$d')" > schema_dump_$(date +%Y%m%d_%H%M%S).sql
```

### Custom Output File
```bash
claude mcp call supabase execute_sql --query "$(cat .claude/commands/supabase-schema-dump-mcp.md | sed -n '/```sql/,/```/p' | sed '1d;$d')" > my_schema.sql
```

## Requirements

- ✅ Claude Code CLI with Supabase MCP integration configured
- ✅ Valid Supabase project connection
- ❌ No need for psql installation
- ❌ No need for database credentials

## Benefits

🚀 **MCP Integration:**
- Uses Claude Code's built-in Supabase MCP tools
- No external dependencies required
- Leverages existing project configuration

📁 **File Output:**
- Easy command-line file redirection
- Timestamped filenames available
- Standard SQL format output