#!/usr/bin/env node

/**
 * Simple Supabase Schema Dump Script
 * 
 * A simplified version that attempts to get table information by querying
 * actual tables in the database. This approach works with standard user permissions.
 * 
 * Usage:
 *   node scripts/schema-dump-simple.js [output-file]
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
  process.exit(1);
}

if (!SUPABASE_ANON_KEY) {
  console.error('❌ Error: Missing SUPABASE_ANON_KEY environment variable');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Common table names to try (based on typical Supabase projects)
const COMMON_TABLES = [
  'users', 'profiles', 'auth_users',
  'properties', 'buildings', 'units', 'floors',
  'tenants', 'leases', 'payments', 'expenses',
  'maintenance_requests', 'utility_billings',
  'transactions', 'budgets', 'penalties',
  'meters', 'rental_units'
];

async function dumpSimpleSchema() {
  const outputFile = process.argv[2];
  
  console.log('🔍 Connecting to Supabase...');
  console.log(`📡 URL: ${SUPABASE_URL.replace(/\/$/, '')}`);
  
  try {
    console.log('📋 Discovering tables by attempting queries...');
    
    const discoveredTables = [];
    const tableSchemas = {};
    
    // Try to query each common table to see if it exists
    for (const tableName of COMMON_TABLES) {
      try {
        console.log(`  🔍 Checking table: ${tableName}`);
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error && data !== null) {
          discoveredTables.push(tableName);
          console.log(`  ✅ Found table: ${tableName}`);
          
          // Get column information by examining the data structure
          if (data.length > 0) {
            const sampleRow = data[0];
            const columns = Object.keys(sampleRow).map(colName => {
              const value = sampleRow[colName];
              let dataType = 'text'; // default
              
              if (typeof value === 'number') {
                dataType = Number.isInteger(value) ? 'integer' : 'numeric';
              } else if (typeof value === 'boolean') {
                dataType = 'boolean';
              } else if (value instanceof Date || (typeof value === 'string' && value.includes('T'))) {
                dataType = 'timestamp with time zone';
              } else if (typeof value === 'object' && value !== null) {
                dataType = 'jsonb';
              }
              
              return {
                column_name: colName,
                data_type: dataType,
                is_nullable: 'YES', // We can't determine this from sample data
                column_default: null // We can't determine this from sample data
              };
            });
            
            tableSchemas[tableName] = columns;
          }
        }
      } catch (err) {
        // Table doesn't exist or we don't have access, continue
        console.log(`  ❌ No access to table: ${tableName}`);
      }
    }
    
    if (discoveredTables.length === 0) {
      console.log('ℹ️  No accessible tables found in the database');
      console.log('\n💡 This could mean:');
      console.log('   1. Your API key doesn\'t have the right permissions');
      console.log('   2. The tables have different names');
      console.log('   3. Row Level Security (RLS) is blocking access');
      console.log('\n💡 Try using the MCP command for complete schema dump:');
      console.log('   claude mcp call supabase execute_sql --query "..."');
      return;
    }
    
    // Format the output
    let schemaOutput = '';
    let tableCount = 0;
    
    discoveredTables.forEach(tableName => {
      tableCount++;
      schemaOutput += `-- Table: ${tableName}\n`;
      schemaOutput += `CREATE TABLE ${tableName} (\n`;
      
      const columns = tableSchemas[tableName] || [];
      const columnDefs = columns.map(col => {
        let def = `  ${col.column_name} ${col.data_type}`;
        if (col.is_nullable === 'NO') {
          def += ' NOT NULL';
        }
        if (col.column_default) {
          def += ` DEFAULT ${col.column_default}`;
        }
        return def;
      });
      
      if (columnDefs.length > 0) {
        schemaOutput += columnDefs.join(',\n') + '\n';
      } else {
        schemaOutput += '  -- Column information not available\n';
      }
      
      schemaOutput += ');\n\n';
    });
    
    // Add header
    const header = `-- Supabase Schema Dump (Simplified - Discovered Tables)
-- Generated on: ${new Date().toISOString()}
-- Database: ${SUPABASE_URL.replace(/\/$/, '')}
-- 
-- Summary:
--   Tables: ${tableCount}
--   Note: This is a simplified dump based on accessible tables.
--   Column types are inferred from sample data and may not be exact.
--   For complete schema including policies, triggers, and functions,
--   use the MCP command or psql.
--

`;
    
    const fullOutput = header + schemaOutput;
    
    if (outputFile) {
      writeFileSync(outputFile, fullOutput, 'utf8');
      console.log(`✅ Schema dumped successfully to: ${outputFile}`);
      console.log(`📊 Summary: ${tableCount} tables found`);
    } else {
      console.log('\n' + '='.repeat(80));
      console.log('SCHEMA DUMP OUTPUT (SIMPLIFIED - DISCOVERED TABLES)');
      console.log('='.repeat(80));
      console.log(fullOutput);
      console.log('='.repeat(80));
      console.log(`📊 Summary: ${tableCount} tables found`);
    }
    
    console.log('\n💡 For complete schema dump including policies, triggers, and functions:');
    console.log('   Use: claude mcp call supabase execute_sql --query "..."');
    
  } catch (error) {
    console.error('❌ Error during schema dump:', error.message);
    console.error('\n💡 Try using the MCP command instead:');
    console.error('   claude mcp call supabase execute_sql --query "..."');
    process.exit(1);
  }
}

// Run the script
dumpSimpleSchema().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
