import { error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { leaseReportFilterSchema } from './reportSchema';
import type { Actions, PageServerLoad } from './$types';
import type { 
  Floor, RentalUnit, Lease, Tenant, Billing, Property, LeaseTenant 
} from './types';
import type { 
  FloorGroup, RentalUnitGroup, TenantPaymentRecord, MonthlyPaymentStatus, LeaseReportData 
} from './reportSchema';

// Configure ISR for lease report caching
export const config = {
	isr: {
		expiration: 180, // Cache for 3 minutes (180 seconds)
		allowQuery: ['propertyId', 'startMonth', 'monthCount']
	}
};

/**
 * Get array of month strings in YYYY-MM format from startMonth for specified number of months
 */
function getMonthsArray(startMonth: string, monthCount: number): string[] {
  const [year, month] = startMonth.split('-').map(n => parseInt(n));
  const months: string[] = [];
  
  for (let i = 0; i < monthCount; i++) {
    const newMonth = (month + i - 1) % 12 + 1; // Adjust for zero-based month (0-11)
    const newYear = year + Math.floor((month + i - 1) / 12);
    months.push(`${newYear}-${newMonth.toString().padStart(2, '0')}`);
  }
  
  return months;
}

/**
 * Determine payment status for a tenant for a specific month and billing type
 */
function getMonthlyPaymentStatus(
  billings: Billing[], 
  month: string, 
  type: 'RENT' | 'UTILITIES' | 'PENALTY'
): 'PAID' | 'PENDING' | 'PARTIAL' | 'OVERDUE' {
  // For utilities, accept both 'UTILITIES' and 'UTILITY' types
  let billingTypes: string[] = [];
  if (type === 'UTILITIES') {
    billingTypes = ['UTILITIES', 'UTILITY'];
  } else if (type === 'PENALTY') {
    billingTypes = ['PENALTY'];
  } else {
    billingTypes = ['RENT'];
  }
  
  // Filter billings for the current month and type
  const relevantBillings = billings.filter(billing => {
    const billingMonth = billing.due_date.substring(0, 7); // Get YYYY-MM from date
    return billingMonth === month && billingTypes.includes(billing.type);
  });
  
  if (relevantBillings.length === 0) {
    return 'PENDING';
  }
  
  // Check if all billings are paid
  const allPaid = relevantBillings.every(b => b.status === 'PAID');
  if (allPaid) return 'PAID';
  
  // Check if any billing is OVERDUE
  const anyOverdue = relevantBillings.some(b => b.status === 'OVERDUE');
  if (anyOverdue) return 'OVERDUE';
  
  // Check if any billing is PARTIAL
  const anyPartial = relevantBillings.some(b => b.status === 'PARTIAL');
  if (anyPartial) return 'PARTIAL';
  
  return 'PENDING';
}

/**
 * Get the total amount for a specific month and billing type
 */
function getMonthlyAmount(
  billings: Billing[],
  month: string,
  type: 'RENT' | 'UTILITIES' | 'PENALTY'
): number {
  // For utilities, accept both 'UTILITIES' and 'UTILITY' types
  let billingTypes: string[] = [];
  if (type === 'UTILITIES') {
    billingTypes = ['UTILITIES', 'UTILITY'];
  } else if (type === 'PENALTY') {
    billingTypes = ['PENALTY'];
  } else {
    billingTypes = ['RENT'];
  }
  
  // Filter billings for the current month and type
  const relevantBillings = billings.filter(billing => {
    const billingMonth = billing.due_date.substring(0, 7); // Get YYYY-MM from date
    return billingMonth === month && billingTypes.includes(billing.type);
  });
  
  // Sum all amounts
  return relevantBillings.reduce((total, billing) => total + billing.amount, 0);
}

/**
 * Helper function to get the correct suffix for floor numbers
 */
function getFloorSuffix(floorNumber: number): string {
  if (floorNumber === 1) return 'st';
  if (floorNumber === 2) return 'nd';
  if (floorNumber === 3) return 'rd';
  return 'th';
}

/**
 * Calculate payment totals for a tenant
 */
function calculatePaymentTotals(leaseBillings: Billing[]): { 
  totalPaid: number, 
  totalRentPaid: number, 
  totalUtilitiesPaid: number, 
  totalPenaltyPaid: number, 
  totalPending: number 
} {
  let totalPaid = 0;
  let totalRentPaid = 0;
  let totalUtilitiesPaid = 0;
  let totalPenaltyPaid = 0;
  let totalPending = 0;
  
  // First, let's log what we're working with
  console.log('Calculating totals for', leaseBillings.length, 'billings');
  
  leaseBillings.forEach(billing => {
    // Add to the appropriate total based on billing type and status
    console.log(`Processing billing: type=${billing.type}, status=${billing.status}, amount=${billing.amount}, paid_amount=${billing.paid_amount || 0}`);
    
    if (billing.type === 'RENT') {
      if (billing.status === 'PAID') {
        totalRentPaid += billing.paid_amount || 0;
        totalPaid += billing.paid_amount || 0;
      } else if (billing.status === 'PARTIAL') {
        const paidAmount = billing.paid_amount || 0;
        totalRentPaid += paidAmount;
        totalPaid += paidAmount;
        totalPending += (billing.amount - paidAmount);
      } else if (billing.status === 'PENDING' || billing.status === 'OVERDUE') {
        totalPending += billing.amount;
      }
    } else if (billing.type === 'UTILITIES' || billing.type === 'UTILITY') {
      if (billing.status === 'PAID') {
        totalUtilitiesPaid += billing.paid_amount || 0;
        totalPaid += billing.paid_amount || 0;
      } else if (billing.status === 'PARTIAL') {
        const paidAmount = billing.paid_amount || 0;
        totalUtilitiesPaid += paidAmount;
        totalPaid += paidAmount;
        totalPending += (billing.amount - paidAmount);
      } else if (billing.status === 'PENDING' || billing.status === 'OVERDUE') {
        // If the billing is pending/overdue, add to pending amount
        totalPending += billing.amount;
      }
    } else if (billing.type === 'PENALTY') {
      if (billing.status === 'PAID') {
        totalPenaltyPaid += billing.paid_amount || 0;
        totalPaid += billing.paid_amount || 0;
      } else if (billing.status === 'PARTIAL') {
        const paidAmount = billing.paid_amount || 0;
        totalPenaltyPaid += paidAmount;
        totalPaid += paidAmount;
        totalPending += (billing.amount - paidAmount);
      } else if (billing.status === 'PENDING' || billing.status === 'OVERDUE') {
        totalPending += billing.amount;
      }
    }
  });
  
  const result = {
    totalPaid,
    totalRentPaid,
    totalUtilitiesPaid,
    totalPenaltyPaid,
    totalPending
  };
  
  console.log('Final calculated totals:', result);
  return result;
}

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase }, url }) => {
  console.log('🔄 Starting lease-report load');
  
  const { user } = await safeGetSession();
  if (!user) throw error(401, 'Unauthorized');

  // Current date as default start month
  const today = new Date();
  const defaultStartMonth = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;

  // Create and validate filter form
  const filterForm = await superValidate(
    {
      startMonth: url.searchParams.get('startMonth') || defaultStartMonth,
      monthCount: parseInt(url.searchParams.get('monthCount') || '6'),
      floorId: url.searchParams.get('floorId') ? parseInt(url.searchParams.get('floorId')!) : undefined,
      propertyId: url.searchParams.get('propertyId') ? parseInt(url.searchParams.get('propertyId')!) : undefined,
      showInactiveLeases: url.searchParams.get('showInactiveLeases') === 'true'
    }, 
    zod(leaseReportFilterSchema)
  );
  
  try {
    const startTime = performance.now();
    
    // Fetch all required data for the report
    const [
      { data: floors, error: floorsError },
      { data: properties, error: propertiesError },
      { data: rentalUnits, error: rentalUnitsError }
    ] = await Promise.all([
      supabase.from('floors').select('*').eq('status', 'ACTIVE'),
      supabase.from('properties').select('*').eq('status', 'ACTIVE'),
      supabase.from('rental_unit').select('*, property:properties(id, name)')
    ]);

    if (floorsError) throw error(500, 'LR-1000 - Failed to load floors');
    if (propertiesError) throw error(500, 'LR-1001 - Failed to load properties');
    if (rentalUnitsError) throw error(500, 'LR-1002 - Failed to load rental units');

    // Build lease query based on filters
    let leaseQuery = supabase.from('leases')
      .select(`
        *,
        rental_unit:rental_unit_id(*),
        lease_tenants(*, tenant:tenant_id(*))
      `);
    
    // Apply status filter
    if (!filterForm.data.showInactiveLeases) {
      leaseQuery = leaseQuery.eq('status', 'ACTIVE');
    }
    
    // Get lease data
    const { data: leases, error: leasesError } = await leaseQuery;
    if (leasesError) throw error(500, 'LR-1003 - Failed to load leases');
    
    // Get all unique lease IDs
    const leaseIds = leases?.map(lease => lease.id) || [];
    
    // Get all billings for these leases
    const { data: billings, error: billingsError } = await supabase
      .from('billings')
      .select('*')
      .in('lease_id', leaseIds);
    
    if (billingsError) throw error(500, 'LR-1004 - Failed to load billings');
    
    // Generate months array for report period
    const months = getMonthsArray(filterForm.data.startMonth, filterForm.data.monthCount);
    const endMonth = months[months.length - 1];
    
    // Build the report data structure
    const reportData: LeaseReportData = {
      floors: [],
      reportPeriod: {
        startMonth: filterForm.data.startMonth,
        endMonth,
        months
      }
    };
    
    // Filter floors if floorId is specified
    let filteredFloors = floors || [];
    if (filterForm.data.floorId) {
      filteredFloors = filteredFloors.filter(floor => floor.id === filterForm.data.floorId);
    }
    
    // Filter by property if specified
    if (filterForm.data.propertyId) {
      filteredFloors = filteredFloors.filter(floor => floor.property_id === filterForm.data.propertyId);
    }

    // Sort floors by floor_number
    filteredFloors.sort((a, b) => a.floor_number - b.floor_number);
    
    // Build the hierarchical structure: Floor -> Rental Unit -> Lease -> Tenant
    for (const floor of filteredFloors) {
      const floorGroup: FloorGroup = {
        floorId: floor.id,
        floorNumber: `${floor.floor_number}${getFloorSuffix(floor.floor_number)} Floor`,
        wing: floor.wing,
        rentalUnits: []
      };
      
      // Get rental units for this floor
      const floorRentalUnits = rentalUnits?.filter(unit => unit.floor_id === floor.id) || [];
      
      // Sort rental units by number
      floorRentalUnits.sort((a, b) => a.number - b.number);
      
      for (const unit of floorRentalUnits) {
        const unitGroup: RentalUnitGroup = {
          rentalUnitId: unit.id,
          roomName: unit.name,
          capacity: unit.capacity,
          tenantRecords: []
        };
        
        // Get leases for this rental unit
        const unitLeases = leases?.filter(lease => lease.rental_unit_id === unit.id) || [];
        
        for (const lease of unitLeases) {
          const leaseTenants = lease.lease_tenants || [];
          
          // Create one record per tenant
          for (const leaseTenant of leaseTenants) {
            const tenant = leaseTenant.tenant;
            if (!tenant) continue;
            
            const leaseBillings = billings?.filter(b => b.lease_id === lease.id) || [];
            
         // Fix for the unterminated string literal
console.log(`\nInspecting billings for lease ID ${lease.id} (${lease.name}), tenant ${tenant.name}:`);
            // Determine payment status for each month
            const monthlyPayments: MonthlyPaymentStatus[] = months.map(month => {
              // Calculate rent, utility, and penalty paid amounts for this month
              const rentPaidAmount = leaseBillings
                .filter(b => b.type === 'RENT' && b.due_date.substring(0, 7) === month)
                .reduce((total, billing) => total + (billing.paid_amount || 0), 0);
                
              const utilitiesPaidAmount = leaseBillings
                .filter(b => (b.type === 'UTILITIES' || b.type === 'UTILITY') && b.due_date.substring(0, 7) === month)
                .reduce((total, billing) => total + (billing.paid_amount || 0), 0);
                
              const penaltyPaidAmount = leaseBillings
                .filter(b => b.type === 'PENALTY' && b.due_date.substring(0, 7) === month)
                .reduce((total, billing) => total + (billing.paid_amount || 0), 0);
                
              return {
                month,
                rent: getMonthlyPaymentStatus(leaseBillings, month, 'RENT'),
                utilities: getMonthlyPaymentStatus(leaseBillings, month, 'UTILITIES'),
                penalty: getMonthlyPaymentStatus(leaseBillings, month, 'PENALTY'),
                rentAmount: getMonthlyAmount(leaseBillings, month, 'RENT'),
                utilitiesAmount: getMonthlyAmount(leaseBillings, month, 'UTILITIES'),
                penaltyAmount: getMonthlyAmount(leaseBillings, month, 'PENALTY'),
                rentPaidAmount,
                utilitiesPaidAmount,
                penaltyPaidAmount
              };
            });
            
            // Calculate payment totals
            const paymentTotals = calculatePaymentTotals(leaseBillings);
            
            console.log(`Creating tenant record for ${tenant.name}, Lease ID: ${lease.id}`);
            console.log('Payment totals:', paymentTotals);
            
            // Create tenant record
            const tenantRecord: TenantPaymentRecord = {
              tenantId: tenant.id,
              tenantName: tenant.name,
              leaseId: lease.id,
              leaseName: lease.name,
              securityDeposit: lease.security_deposit,
              startDate: lease.start_date,
              monthlyPayments,
              totalPaid: paymentTotals.totalPaid,
              totalRentPaid: paymentTotals.totalRentPaid,
              totalUtilitiesPaid: paymentTotals.totalUtilitiesPaid,
              totalPenaltyPaid: paymentTotals.totalPenaltyPaid,
              totalPending: paymentTotals.totalPending
            };
            
            console.log('Created tenant record:', tenantRecord);
            
            unitGroup.tenantRecords.push(tenantRecord);
          }
        }
        
        // Only add rental units that have tenants
        if (unitGroup.tenantRecords.length > 0) {
          floorGroup.rentalUnits.push(unitGroup);
        }
      }
      
      // Only add floors that have rental units with tenants
      if (floorGroup.rentalUnits.length > 0) {
        reportData.floors.push(floorGroup);
      }
    }
    
    const queryTime = performance.now() - startTime;
    console.log('⏱️ Data fetch completed:', {
      floors: reportData.floors.length,
      time: `${queryTime.toFixed(2)}ms`
    });
    
    return {
      filterForm,
      reportData,
      properties: properties || []
    };
  } catch (err) {
    console.error('LR-1005 - Error in load function:', err);
    throw error(500, 'LR-1005 - Internal server error');
  }
};