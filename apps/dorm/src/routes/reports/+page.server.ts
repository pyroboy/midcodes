import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Database } from '$lib/database.types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession }, url }) => {
  const session = await safeGetSession();
  if (!session) {
    throw error(401, 'Unauthorized');
  }

  // Get query parameters or use defaults
  const year = url.searchParams.get('year') || new Date().getFullYear().toString();
  const month = url.searchParams.get('month') || new Date().toLocaleString('en-US', { month: 'long' }).toLowerCase();
  const propertyId = url.searchParams.get('propertyId') || null;
  
  // Convert month name to month number (1-12)
  const months = [
    'january', 'february', 'march', 'april',
    'may', 'june', 'july', 'august',
    'september', 'october', 'november', 'december'
  ];
  const monthIndex = months.indexOf(month.toLowerCase()) + 1;
  
  // Calculate date range for the selected month
  const startDate = new Date(parseInt(year), monthIndex - 1, 1);
  const endDate = new Date(parseInt(year), monthIndex, 0); // Last day of the month
  
  // Format dates for database queries
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  console.log(`Fetching data for period: ${startDateStr} to ${endDateStr}${propertyId ? `, property: ${propertyId}` : ''}`);

  try {
    // Step 1: Get all properties for the filter dropdown
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, name');
    
    if (propertiesError) throw new Error(`Error fetching properties: ${propertiesError.message}`);

    // If no property is selected, return the list of properties for selection
    if (!propertyId) {
      return {
        properties,
        year,
        month,
        propertyId: null
      };
    }

    // Step 2: First get all rental units for the selected property
    const { data: propertyUnits, error: propertyUnitsError } = await supabase
      .from('rental_unit')
      .select('id')
      .eq('property_id', propertyId);
    
    if (propertyUnitsError) throw new Error(`Error fetching property units: ${propertyUnitsError.message}`);
    
    // Extract the unit IDs
    const unitIds = propertyUnits?.map(unit => unit.id) || [];
    
    // Step 3: Get all leases for the units in this property
    const { data: leases, error: leasesError } = await supabase
      .from('leases')
      .select('id, rental_unit_id')
      .in('rental_unit_id', unitIds);
    
    if (leasesError) throw new Error(`Error fetching leases: ${leasesError.message}`);

    // Create a map of lease_id to rental_unit_id
    const leaseToUnitMap = new Map();
    leases?.forEach(lease => {
      leaseToUnitMap.set(lease.id, lease.rental_unit_id);
    });

    // Step 4: Get all rental units with their floor IDs
    const { data: rentalUnits, error: unitsError } = await supabase
      .from('rental_unit')
      .select('id, floor_id')
      .eq('property_id', propertyId);
    
    if (unitsError) throw new Error(`Error fetching rental units: ${unitsError.message}`);

    // Create a map of rental_unit_id to floor_id
    const unitToFloorMap = new Map();
    rentalUnits?.forEach(unit => {
      unitToFloorMap.set(unit.id, unit.floor_id);
    });

    // Step 5: Get all floors for the selected property
    const { data: floors, error: floorsError } = await supabase
      .from('floors')
      .select('id, floor_number')
      .eq('property_id', propertyId);
    
    if (floorsError) throw new Error(`Error fetching floors: ${floorsError.message}`);

    // Create a map of floor_id to floor_number
    const floorMap = new Map();
    floors?.forEach(floor => {
      floorMap.set(floor.id, floor.floor_number);
    });

    // Step 6: Get all lease IDs for this property
    const leaseIds = leases?.map(lease => lease.id) || [];

    // Step 7: Get all rental income for the period
    const { data: rentalIncome, error: rentalError } = await supabase
      .from('billings')
      .select('id, amount, type, billing_date, lease_id')
      .eq('type', 'RENT')
      .gte('billing_date', startDateStr)
      .lte('billing_date', endDateStr)
      .in('lease_id', leaseIds);
      
    if (rentalError) throw new Error(`Error fetching rental income: ${rentalError.message}`);

    // Step 8: Get all expenses for the period and property
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('id, amount, description, type, status, created_at')
      .eq('property_id', propertyId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });
      
    if (expensesError) throw new Error(`Error fetching expenses: ${expensesError.message}`);

    // Process the data to match the expected format in the dashboard
    // Group rental income by floor
    const floorData = {
      secondFloor: { income: 0, note: '' },
      thirdFloor: { income: 0, note: '' }
    };

    // Process rental income by floor using our maps to join the data
    rentalIncome?.forEach(billing => {
      const rentalUnitId = leaseToUnitMap.get(billing.lease_id);
      const floorId = unitToFloorMap.get(rentalUnitId);
      const floorNumber = floorMap.get(floorId);
      
      if (floorNumber === 2) {
        floorData.secondFloor.income += Number(billing.amount);
      } else if (floorNumber === 3) {
        floorData.thirdFloor.income += Number(billing.amount);
      }
    });

    // Calculate totals
    const grossIncome = floorData.secondFloor.income + floorData.thirdFloor.income;
    
    // Calculate total expenses
    const totalExpenses = expenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
    
    // Calculate net income
    const netIncome = grossIncome - totalExpenses;
    
    // Calculate profit sharing
    const forty = netIncome * 0.4;
    const sixty = netIncome * 0.6;

    // Construct the final data object
    const reportData = {
      floorData,
      expenses: expenses || [],
      profitSharing: {
        forty,
        sixty
      },
      totals: {
        grossIncome,
        totalExpenses,
        netIncome
      }
    };

    return {
      reportData,
      year,
      month,
      propertyId,
      properties
    };
  } catch (err) {
    console.error('Error in reports load function:', err);
    throw error(500, `Failed to load report data: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
};
