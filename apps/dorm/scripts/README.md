# Schema Dump Scripts

This directory contains Node.js scripts for dumping your Supabase database schema.

## Scripts Overview

### 1. `schema-dump.js` - Full Schema Dump
Attempts to execute the complete schema dump query including tables, policies, triggers, functions, and enums.

**Note:** This script may require admin privileges or a custom RPC function to work properly.

### 2. `schema-dump-simple.js` - Simplified Schema Dump
A simplified version that focuses on table structures and basic column information. This is more likely to work with standard user permissions.

## Usage

### Using npm scripts (Recommended)

```bash
# Full schema dump to console
npm run schema:dump

# Simple schema dump to console
npm run schema:dump:simple

# Full schema dump to timestamped file
npm run schema:dump:file

# Simple schema dump to timestamped file
npm run schema:dump:simple:file
```

### Direct script execution

```bash
# Full schema dump
node scripts/schema-dump.js [output-file]

# Simple schema dump
node scripts/schema-dump-simple.js [output-file]

# Examples
node scripts/schema-dump.js schema.sql
node scripts/schema-dump-simple.js schema_simple.sql
```

## Environment Variables

The scripts automatically load environment variables from your `.env` file. They look for:

- `PUBLIC_SUPABASE_URL` or `SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY` or `SUPABASE_ANON_KEY`

## Output Examples

### Simple Schema Dump Output
```sql
-- Supabase Schema Dump (Simplified)
-- Generated on: 2024-01-15T10:30:00.000Z
-- Database: https://your-project.supabase.co
-- 
-- Summary:
--   Tables: 15
--   Note: This is a simplified dump. For complete schema including
--   policies, triggers, and functions, use the MCP command or psql.
--

-- Table: users
CREATE TABLE users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: properties
CREATE TABLE properties (
  id serial NOT NULL,
  name text NOT NULL,
  address text,
  created_at timestamp with time zone DEFAULT now()
);
```

## Troubleshooting

### Permission Errors
If you get permission errors with the full schema dump:

1. **Use the simple version**: `npm run schema:dump:simple`
2. **Use MCP command**: `claude mcp call supabase execute_sql --query "..."` 
3. **Use psql directly** with your database credentials

### Connection Errors
- Check your `.env` file has the correct Supabase URL and API key
- Ensure your database is accessible
- Verify your API key has the necessary permissions

### Missing Dependencies
```bash
npm install @supabase/supabase-js
```

## Alternative Methods

### MCP Command (Recommended for complete dumps)
```bash
claude mcp call supabase execute_sql --query "YOUR_SCHEMA_QUERY"
```

### Direct psql
```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" -c "YOUR_SCHEMA_QUERY"
```

## File Structure

```
scripts/
├── README.md                 # This file
├── schema-dump.js           # Full schema dump script
└── schema-dump-simple.js    # Simplified schema dump script
```

## Contributing

When modifying these scripts:

1. Test with both console output and file output
2. Ensure proper error handling
3. Update this README if adding new functionality
4. Consider backward compatibility
