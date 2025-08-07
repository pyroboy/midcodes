const { Client } = require('pg');

// Simple approach: get basic table structure using information_schema
const client = new Client({
  host: 'aws-0-us-west-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.wnkqlrfmtiibrqnncgqu',
  password: process.env.DB_PASSWORD || 'your_password_here',
  ssl: { rejectUnauthorized: false }
});

const simpleQuery = `
SELECT 
    t.table_name,
    string_agg(
        '    ' || c.column_name || ' ' || 
        CASE 
            WHEN c.data_type = 'character varying' THEN 'varchar(' || COALESCE(c.character_maximum_length::text, '') || ')'
            WHEN c.data_type = 'character' THEN 'char(' || COALESCE(c.character_maximum_length::text, '') || ')'
            WHEN c.data_type = 'numeric' THEN 'numeric(' || COALESCE(c.numeric_precision::text, '') || ',' || COALESCE(c.numeric_scale::text, '') || ')'
            ELSE c.data_type
        END ||
        CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN c.column_default IS NOT NULL THEN ' DEFAULT ' || c.column_default ELSE '' END,
        E',\n'
        ORDER BY c.ordinal_position
    ) as columns
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND c.table_schema = 'public'
GROUP BY t.table_name
ORDER BY t.table_name;
`;

(async () => {
  try {
    await client.connect();
    console.log('Connected to database successfully');
    
    const result = await client.query(simpleQuery);
    
    console.log('\n' + '='.repeat(80));
    console.log('DATABASE SCHEMA DUMP');
    console.log('='.repeat(80));
    
    result.rows.forEach(row => {
      console.log('\n' + '-'.repeat(60));
      console.log(`TABLE: ${row.table_name}`);
      console.log('-'.repeat(60));
      console.log(`CREATE TABLE ${row.table_name} (`);
      console.log(row.columns);
      console.log(');');
    });
    
    console.log('\n' + '='.repeat(80));
    console.log(`Total tables found: ${result.rows.length}`);
    console.log('='.repeat(80));
    
  } catch (err) {
    console.error('Error:', err.message);
    console.log('\nTrying with environment variables...');
    
    // Fallback: Let user know they need to set DB_PASSWORD
    console.log('\nPlease run: export DB_PASSWORD=your_actual_db_password');
    console.log('Or check your Supabase project settings for the database password.');
    
  } finally {
    await client.end();
  }
})();