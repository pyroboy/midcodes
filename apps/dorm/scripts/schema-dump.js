#!/usr/bin/env node

/**
 * Supabase Schema Dump Script
 * 
 * Executes the schema dump SQL query and outputs the complete database schema
 * including tables, policies, triggers, functions, and enums.
 * 
 * Usage:
 *   node scripts/schema-dump.js [output-file]
 * 
 * Examples:
 *   node scripts/schema-dump.js                    # Output to console
 *   node scripts/schema-dump.js schema.sql         # Save to file
 *   node scripts/schema-dump.js schema_$(date +%Y%m%d_%H%M%S).sql  # Timestamped file
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get current directory for relative path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file if it exists
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env');
    const envContent = readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });
    
    return envVars;
  } catch (error) {
    // .env file doesn't exist or can't be read, continue with process.env
    return {};
  }
}

// Load environment variables
const envVars = loadEnv();
Object.assign(process.env, envVars);

// Validate required environment variables
const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  console.error('❌ Error: Missing SUPABASE_URL environment variable');
  console.error('Please set PUBLIC_SUPABASE_URL or SUPABASE_URL in your .env file or environment');
  process.exit(1);
}

if (!SUPABASE_ANON_KEY) {
  console.error('❌ Error: Missing SUPABASE_ANON_KEY environment variable');
  console.error('Please set PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY in your .env file or environment');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Schema dump SQL query
const SCHEMA_DUMP_QUERY = `
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
                E',\\n'
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
                E'\\nCREATE POLICY %I ON %I' ||
                E'\\n    AS %s' ||
                E'\\n    FOR %s' ||
                E'\\n    TO %s' ||
                E'\\n    USING (%s)%s;',
                tablename,
                polname, tablename,
                polroles,
                CASE WHEN polcmd = '*' THEN 'ALL' ELSE polcmd END,
                CASE WHEN roles = '{public}' THEN 'public' ELSE array_to_string(roles, ', ') END,
                polk,
                CASE 
                    WHEN polqual IS NOT NULL 
                    THEN E'\\n    WITH CHECK (' || polqual || ')'
                    ELSE ''
                END
            ),
            E'\\n\\n'
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
            'CREATE TRIGGER %I\\n    %s %s ON %I\\n    FOR EACH %s\\n    EXECUTE FUNCTION %s(%s);',
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
            'CREATE FUNCTION %I(%s)\\nRETURNS %s\\nLANGUAGE %s\\nAS $$\\n%s\\n$$;',
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
    SELECT table_name, string_agg(trigger_def, E'\\n\\n') AS trigger_def
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
        COALESCE(format(E'CREATE TABLE %I (\\n%s\\n);\\n\\n', t.table_name, t.column_definitions), ''),
        COALESCE(p.policies || E'\\n\\n', '')
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
`;

async function dumpSchema() {
  const outputFile = process.argv[2];
  
  console.log('🔍 Connecting to Supabase...');
  console.log(`📡 URL: ${SUPABASE_URL.replace(/\/$/, '')}`);
  
  try {
    console.log('📋 Executing schema dump query...');
    
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: SCHEMA_DUMP_QUERY 
    });
    
    if (error) {
      // Fallback to direct query if RPC doesn't exist
      console.log('⚠️  RPC method not available, trying direct query...');
      const { data: directData, error: directError } = await supabase
        .from('information_schema.tables')
        .select('*')
        .limit(1);
      
      if (directError) {
        throw new Error(`Database connection failed: ${directError.message}`);
      }
      
      // If we can connect but RPC doesn't work, provide instructions
      console.error('❌ Error: Schema dump requires admin privileges or custom RPC function');
      console.error('Please use one of these alternatives:');
      console.error('1. Use the MCP command: claude mcp call supabase execute_sql --query "..."');
      console.error('2. Use psql directly with your database credentials');
      console.error('3. Create a custom RPC function for schema dumping');
      process.exit(1);
    }
    
    if (!data || data.length === 0) {
      console.log('ℹ️  No schema objects found in the database');
      return;
    }
    
    // Format the output
    let schemaOutput = '';
    let tableCount = 0;
    let functionCount = 0;
    let triggerCount = 0;
    let enumCount = 0;
    
    data.forEach(row => {
      if (row.name.startsWith('TABLE:')) {
        tableCount++;
        schemaOutput += `-- ${row.name}\n`;
        schemaOutput += row.definition + '\n\n';
      } else if (row.name.startsWith('FUNCTION:')) {
        functionCount++;
        schemaOutput += `-- ${row.name}\n`;
        schemaOutput += row.definition + '\n\n';
      } else if (row.name.startsWith('TRIGGER:')) {
        triggerCount++;
        schemaOutput += `-- ${row.name}\n`;
        schemaOutput += row.definition + '\n\n';
      } else if (row.name.startsWith('ENUM:')) {
        enumCount++;
        schemaOutput += `-- ${row.name}\n`;
        schemaOutput += row.definition + '\n\n';
      }
    });
    
    // Add header
    const header = `-- Supabase Schema Dump
-- Generated on: ${new Date().toISOString()}
-- Database: ${SUPABASE_URL.replace(/\/$/, '')}
-- 
-- Summary:
--   Tables: ${tableCount}
--   Functions: ${functionCount}
--   Triggers: ${triggerCount}
--   Enums: ${enumCount}
--

`;
    
    const fullOutput = header + schemaOutput;
    
    if (outputFile) {
      writeFileSync(outputFile, fullOutput, 'utf8');
      console.log(`✅ Schema dumped successfully to: ${outputFile}`);
      console.log(`📊 Summary: ${tableCount} tables, ${functionCount} functions, ${triggerCount} triggers, ${enumCount} enums`);
    } else {
      console.log('\n' + '='.repeat(80));
      console.log('SCHEMA DUMP OUTPUT');
      console.log('='.repeat(80));
      console.log(fullOutput);
      console.log('='.repeat(80));
      console.log(`📊 Summary: ${tableCount} tables, ${functionCount} functions, ${triggerCount} triggers, ${enumCount} enums`);
    }
    
  } catch (error) {
    console.error('❌ Error during schema dump:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check your Supabase URL and API key');
    console.error('2. Ensure your database is accessible');
    console.error('3. Try using the MCP command instead: claude mcp call supabase execute_sql');
    process.exit(1);
  }
}

// Run the script
dumpSchema().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
