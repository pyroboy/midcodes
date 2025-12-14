
// @ts-ignore
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load env vars manually to avoid dotenv dependency issues
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.PRIVATE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugStats() {
  console.log('--- Starting Admin Stats Debug ---');

  // 1. Get the user's org_id
  const email = 'arjomagno@gmail.com';
  const { data: userProfile, error: userError } = await supabase
    .from('profiles')
    .select('id, org_id, role')
    .eq('email', email)
    .single();

  if (userError || !userProfile) {
    console.error('Could not find user profile:', userError);
    return;
  }

  console.log('User Profile:', userProfile);
  const org_id = userProfile.org_id;

  if (!org_id) {
    console.error('User has no org_id');
    return;
  }

  const startOfToday = new Date();
  startOfToday.setHours(0,0,0,0);
  const startOfTodayIso = startOfToday.toISOString();

  // 2. Run the stats queries (simulating admin.remote.ts logic)
  const queries = [
    // Total cards
    supabase.from('idcards').select('*', { count: 'exact', head: true }).eq('org_id', org_id),
    
    // Cards today
    supabase.from('idcards').select('*', { count: 'exact', head: true }).eq('org_id', org_id).gte('created_at', startOfTodayIso),

    // Users
    supabase.from('profiles').select('id').eq('org_id', org_id),

    // Templates
    supabase.from('templates').select('id').eq('org_id', org_id),

    // Invoices (Revenue)
    supabase.from('invoices').select('total_amount').eq('org_id', org_id).eq('status', 'paid'),

    // Credits Balance
    supabase.from('profiles').select('credits_balance').eq('org_id', org_id),
    
    // Credits Used Today 
    supabase.from('credit_transactions').select('amount').eq('org_id', org_id).lt('amount', 0).gte('created_at', startOfTodayIso)
  ];

  const results = await Promise.all(queries);

  const totalCards = results[0].count;
  const cardsToday = results[1].count;
  const totalUsers = results[2].data?.length;
  const totalTemplates = results[3].data?.length;
  
  const paidInvoices = results[4].data || [];
  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  const profiles = results[5].data || [];
  const totalCredits = profiles.reduce((sum, p) => sum + (p.credits_balance || 0), 0);

  const transactions = results[6].data || [];
  const creditsUsedToday = Math.abs(transactions.reduce((sum, t) => sum + (t.amount || 0), 0));

  console.log('\n--- Actual DB Data (Service Role) ---');
  console.log(`Org ID: ${org_id}`);
  console.log(`Total Cards: ${totalCards}`);
  console.log(`Cards Today: ${cardsToday}`);
  console.log(`Total Users: ${totalUsers}`);
  console.log(`Total Templates: ${totalTemplates}`);
  console.log(`Total Revenue: ${totalRevenue}`);
  console.log(`Total Credits Balance: ${totalCredits}`);
  console.log(`Credits Used Today: ${creditsUsedToday}`);

  // 3. Check RLS Policies (Inspection only)
  // We can't easily "simulate" RLS exactly effectively without logging in as the user, 
  // but looking at the data existence tells us if it's a data issue or permission issue.
  if (totalRevenue === 0 && totalCredits === 0) {
      console.log('\n[Observation] Revenue and Credits are 0 in the DB. The dashboard is correct to show 0.');
  } else {
      console.log('\n[Observation] Data EXISTS in DB. If dashboard shows 0, it is likely an RLS/Permission issue.');
  }

}

debugStats();
