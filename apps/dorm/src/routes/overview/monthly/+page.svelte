<!-- @migration-task Error while migrating Svelte code: Identifier 'PageData' has already been declared
https://svelte.dev/e/js_parse_error -->
<!-- <script lang="ts">
  import type { PageData } from './$types';
  import { formatCurrency } from '$lib/utils/format';
  import * as Card from '$lib/components/ui/card';
  import * as Table from '$lib/components/ui/table';
  import { Badge } from '$lib/components/ui/badge';
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';

  // interface PageData {
  //   rental_unit: ServerRental_Unit[];
  //   balances: Balance[];
  //   months: string[];
  //   lastMonthExpenses: Expense[];
  //   isAdminLevel: boolean;
  //   isStaffLevel: boolean;
  // }

  export let data: PageData;

  // Server response types
  interface ServerRental_Unit {
    id: number;
    name: string;
    number: number;
    floor_number: number;
    rental_unit_status: string;
    property_id: number;
    leases: Array<{
      id: number;
      lease_status: string;
      lease_start_date: string;
      lease_end_date: string;
      lease_rent_rate: number;
      lease_tenants: Array<{
        tenant: {
          id: number;
          email: string;
          first_name: string;
          last_name: string;
        };
      }>;
    }>;
  }

  interface Rental_unit {
    id: number;
    name: string;
    number: number;
    capacity: number;
    rental_unit_status: 'VACANT' | 'OCCUPIED' | 'RESERVED';
    base_rate: number;
    property_id: number;
    floor_id: number;
    type: string;
    amenities: Record<string, any>;
    floors: {
      floor_number: number;
      wing: string | null;
      status: 'ACTIVE' | 'INACTIVE';
    };
    leases: Array<{
      id: number;
      name: string;
      status: string;
      type: string;
      start_date: string;
      end_date: string;
      rent_amount: number;
      security_deposit: number;
      balance: number;
      notes: string | null;
      lease_tenants: Array<{
        tenant: {
          id: number;
          name: string;
          email: string | null;
          contact_number: string | null;
        };
      }>;
      billings: Array<{
        id: number;
        type: 'RENT' | 'UTILITY' | 'PENALTY' | 'MAINTENANCE' | 'SERVICE';
        utility_type: string | null;
        amount: number;
        paid_amount: number;
        balance: number;
        status: string;
        due_date: string;
        billing_date: string;
        penalty_amount: number;
        notes: string | null;
      }>;
      payment_schedules: Array<{
        id: number;
        due_date: string;
        expected_amount: number;
        type: 'RENT' | 'UTILITY' | 'PENALTY' | 'MAINTENANCE' | 'SERVICE';
        frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
        status: 'PENDING' | 'PAID' | 'OVERDUE';
        notes: string | null;
      }>;
    }>;
    meters: Array<{
      id: number;
      name: string;
      location_type: 'PROPERTY' | 'FLOOR' | 'RENTAL_UNIT';
      type: 'ELECTRIC' | 'WATER' | 'GAS' | 'INTERNET';
      is_active: boolean;
      status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
      initial_reading: number;
      unit_rate: number;
      notes: string | null;
      readings: Array<{
        reading: number;
        reading_date: string;
      }>;
    }>;
    maintenance: Array<{
      id: number;
      title: string;
      description: string;
      status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
      completed_at: string | null;
      notes: string | null;
    }>;
  }

  interface Expense {
    id: number;
    property_id: number;
    amount: number;
    description: string;
    type: 'UTILITY' | 'MAINTENANCE' | 'SUPPLIES';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    created_by: string;
    created_at: string;
  }

  interface Balance {
    tenant_id: number;
    month: string;
    balance: number;
  }

  interface BudgetCompliance {
    allocated: number;
    spent: number;
    remaining: number;
    status: 'WITHIN_BUDGET' | 'OVER_BUDGET';
  }

  // Convert server response to Rental_unit type
  function convertToRental_Unit(serverRental_Unit: any): Rental_unit {
    return {
      ...serverRental_Unit,
      capacity: serverRental_Unit.capacity || 0,
      base_rate: serverRental_Unit.base_rate || 0,
      floor_id: serverRental_Unit.floor_id || 0,
      type: serverRental_Unit.type || '',
      amenities: serverRental_Unit.amenities || {},
      floors: serverRental_Unit.floors || { floor_number: 0, wing: null, status: 'ACTIVE' },
      leases: (serverRental_Unit.leases || []).map((lease: any) => ({
        ...lease,
        name: lease.name || '',
        status: lease.status || lease.lease_status || 'ACTIVE',
        type: lease.type || '',
        start_date: lease.start_date || lease.lease_start_date,
        end_date: lease.end_date || lease.lease_end_date,
        rent_amount: lease.rent_amount || lease.lease_rent_rate || 0,
        security_deposit: lease.security_deposit || 0,
        balance: lease.balance || 0,
        notes: lease.notes || null,
        lease_tenants: (lease.lease_tenants || []).map((lt: any) => ({
          tenant: {
            id: lt.tenant.id,
            name: lt.tenant.name || `${lt.tenant.first_name} ${lt.tenant.last_name}`,
            email: lt.tenant.email,
            contact_number: lt.tenant.contact_number || null
          }
        })),
        billings: (lease.billings || []).map((bill: any) => ({
          id: bill.id,
          type: bill.type || 'RENT',
          utility_type: bill.utility_type || null,
          amount: bill.amount || 0,
          paid_amount: bill.paid_amount || 0,
          balance: bill.balance || 0,
          status: bill.status || '',
          due_date: bill.due_date || '',
          billing_date: bill.billing_date || '',
          penalty_amount: bill.penalty_amount || 0,
          notes: bill.notes || null
        })),
        payment_schedules: (lease.payment_schedules || []).map((ps: any) => ({
          id: ps.id,
          due_date: ps.due_date,
          expected_amount: ps.expected_amount,
          type: ps.type || 'RENT',
          frequency: ps.frequency || 'MONTHLY',
          status: ps.status || 'PENDING',
          notes: ps.notes || null
        }))
      })),
      meters: (serverRental_Unit.meters || []).map((meter: any) => ({
        id: meter.id,
        name: meter.name || '',
        location_type: meter.location_type || 'PROPERTY',
        type: meter.type || 'ELECTRIC',
        is_active: meter.is_active || true,
        status: meter.status || 'ACTIVE',
        initial_reading: meter.initial_reading || 0,
        unit_rate: meter.unit_rate || 0,
        notes: meter.notes || null,
        readings: (meter.readings || []).map((reading: any) => ({
          reading: reading.reading || 0,
          reading_date: reading.reading_date || ''
        }))
      })),
      maintenance: (serverRental_Unit.maintenance || []).map((issue: any) => ({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        status: issue.status || 'PENDING',
        completed_at: issue.completed_at,
        notes: issue.notes || null
      }))
    };
  }

  // Group rental_unit by floor
  $: rental_unitByFloor = data.rental_unit.map(convertToRental_Unit).reduce<Record<number, Rental_unit[]>>((acc, rental_unit) => {
    const floor = rental_unit.floors.floor_number;
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(rental_unit);
    return acc;
  }, {});

  // Group balances by tenant
  $: balancesByTenant = data.balances.reduce((acc: Record<number, Record<string, number>>, balance: Balance) => {
    if (!acc[balance.tenant_id]) acc[balance.tenant_id] = {};
    acc[balance.tenant_id][balance.month] = balance.balance;
    return acc;
  }, {});

  // Calculate rental_unit statistics
  $: rental_unitStats = {
    total: data.rental_unit.length,
    occupied: data.rental_unit.filter(r => r.rental_unit_status === 'OCCUPIED').length,
    vacant: data.rental_unit.filter(r => r.rental_unit_status === 'VACANT').length,
    reserved: data.rental_unit.filter(r => r.rental_unit_status === 'RESERVED').length,
  };

  // Calculate financial statistics
  $: financialStats = data.rental_unit.map(convertToRental_Unit).reduce((acc, rental_unit) => {
    rental_unit.leases.forEach(lease => {
      acc.totalRent += lease.rent_amount;
      acc.totalDeposits += lease.security_deposit;
      acc.totalBalance += lease.balance;
      lease.billings.forEach(bill => {
        if (bill.type === 'UTILITY') acc.totalUtilities += bill.balance;
        if (bill.type === 'PENALTY') acc.totalPenalties += bill.amount;
      });
    });
    return acc;
  }, {
    totalRent: 0,
    totalDeposits: 0,
    totalBalance: 0,
    totalUtilities: 0,
    totalPenalties: 0
  });

  // Calculate expense statistics
  $: expenseStats = {
    total: data.lastMonthExpenses.reduce((sum: number, exp: Expense) => sum + exp.amount, 0),
    pending: data.lastMonthExpenses
      .filter((exp: Expense) => exp.status === 'PENDING')
      .reduce((sum: number, exp: Expense) => sum + exp.amount, 0)
  };

  // Add budget tracking function
  function calculateBudgetCompliance(expenses: Expense[]): BudgetCompliance {
    const allocated = 100000; // This should come from property settings
    const spent = expenses.reduce((total, exp) => total + exp.amount, 0);
    const remaining = allocated - spent;
  
    return {
      allocated,
      spent,
      remaining,
      status: remaining >= 0 ? 'WITHIN_BUDGET' : 'OVER_BUDGET'
    };
  }

  type BadgeVariant = 'default' | 'destructive' | 'secondary' | 'outline';

  function getStatusVariant(status: string): BadgeVariant {
    switch (status) {
      case 'OCCUPIED':
      case 'COMPLETED':
      case 'PAID':
        return 'default';
      case 'VACANT':
      case 'OVERDUE':
        return 'destructive';
      case 'RESERVED':
        return 'secondary';
      case 'PENDING':
      case 'IN_PROGRESS':
      default:
        return 'outline';
    }
  }

  function getPaymentStatusVariant(status: string): BadgeVariant {
    switch (status) {
      case 'PAID':
        return 'default';
      case 'OVERDUE':
        return 'destructive';
      case 'PENDING':
      default:
        return 'outline';
    }
  }
</script>

<div class="container mx-auto p-4 space-y-8">
  <div class="flex justify-between items-center">
    <h1 class="text-2xl font-bold">Monthly Overview</h1>
    {#if data.isAdminLevel || data.isStaffLevel}
      <div class="flex gap-2">
        <button class="btn variant-filled">Export Report</button>
        <button class="btn variant-filled">Print View</button>
      </div>
    {/if}
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <Card.Root>
      <Card.Header>
        <Card.Title>Rental_unit Statistics</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm">Total Rental_Units</p>
            <p class="text-2xl font-bold">{rental_unitStats.total}</p>
          </div>
          <div>
            <p class="text-sm">Occupied</p>
            <p class="text-2xl font-bold">{rental_unitStats.occupied}</p>
          </div>
          <div>
            <p class="text-sm">Vacant</p>
            <p class="text-2xl font-bold">{rental_unitStats.vacant}</p>
          </div>
          <div>
            <p class="text-sm">Reserved</p>
            <p class="text-2xl font-bold">{rental_unitStats.reserved}</p>
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header>
        <Card.Title>Financial Overview</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="space-y-2">
          <div>
            <p class="text-sm">Total Monthly Rent</p>
            <p class="text-2xl font-bold">{formatCurrency(financialStats.totalRent)}</p>
          </div>
          <div>
            <p class="text-sm">Outstanding Balance</p>
            <p class="text-2xl font-bold">{formatCurrency(financialStats.totalBalance)}</p>
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header>
        <Card.Title>Utility Overview</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="space-y-2">
          <div>
            <p class="text-sm">Outstanding Utilities</p>
            <p class="text-2xl font-bold">{formatCurrency(financialStats.totalUtilities)}</p>
          </div>
          <div>
            <p class="text-sm">Total Penalties</p>
            <p class="text-2xl font-bold">{formatCurrency(financialStats.totalPenalties)}</p>
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header>
        <Card.Title>Expenses Overview</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="space-y-2">
          <div>
            <p class="text-sm">Monthly Expenses</p>
            <p class="text-2xl font-bold">{formatCurrency(expenseStats.total)}</p>
          </div>
          <div>
            <p class="text-sm">Pending Expenses</p>
            <p class="text-2xl font-bold">{formatCurrency(expenseStats.pending)}</p>
          </div>
        </div>
      </Card.Content>
    </Card.Root>
  </div>

  {#if data.lastMonthExpenses.length > 0}
    {#if data.isAdminLevel || data.isStaffLevel}
      {@const budgetStatus = calculateBudgetCompliance(data.lastMonthExpenses)}
      <Card.Root>
        <Card.Header>
          <Card.Title>Budget Status</Card.Title>
        </Card.Header>
        <Card.Content>
          <div class="grid gap-4">
            <div class="flex items-center justify-between">
              <span>Allocated Budget:</span>
              <span class="font-medium">₱{budgetStatus.allocated.toLocaleString()}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Total Spent:</span>
              <span class="font-medium">₱{budgetStatus.spent.toLocaleString()}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Remaining:</span>
              <span class="font-medium">₱{budgetStatus.remaining.toLocaleString()}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Status:</span>
              <Badge variant={budgetStatus.status === 'WITHIN_BUDGET' ? 'secondary' : 'destructive'}>
                {budgetStatus.status}
              </Badge>
            </div>
          </div>
        </Card.Content>
      </Card.Root>
    {/if}
  {/if}

  <Tabs value="overview" class="w-full">
    <TabsList>
      <TabsTrigger value="overview">Overview</TabsTrigger>
      <TabsTrigger value="financial">Financial</TabsTrigger>
      <TabsTrigger value="utilities">Utilities</TabsTrigger>
      <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
    </TabsList>

    <TabsContent value="overview">
      {#each Object.entries(rental_unitByFloor) as [floor, rental_unit]}
        <Card.Root class="mb-4">
          <Card.Header>
            <Card.Title>Floor {floor}</Card.Title>
          </Card.Header>
          <Card.Content>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Rental_unit</Table.Head>
                  <Table.Head>Type</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head>Tenant</Table.Head>
                  <Table.Head>Base Rate</Table.Head>
                  <Table.Head>Balance</Table.Head>
                  <Table.Head>Lease End</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {#each rental_unit as rental_unit}
                  {#each rental_unit.leases as lease}
                    {#each lease.lease_tenants as { tenant }}
                      <Table.Row>
                        <Table.Cell>{rental_unit.number}</Table.Cell>
                        <Table.Cell>{rental_unit.type}</Table.Cell>
                        <Table.Cell>
                          <Badge variant={getStatusVariant(rental_unit.rental_unit_status)}>
                            {rental_unit.rental_unit_status}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <div>
                            <p>{tenant.name}</p>
                            {#if tenant.contact_number}
                              <p class="text-sm text-muted-foreground">{tenant.contact_number}</p>
                            {/if}
                          </div>
                        </Table.Cell>
                        <Table.Cell>{formatCurrency(rental_unit.base_rate)}</Table.Cell>
                        <Table.Cell>
                          <Badge variant={lease.balance > 0 ? 'destructive' : 'default'}>
                            {formatCurrency(lease.balance)}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>{new Date(lease.end_date).toLocaleDateString()}</Table.Cell>
                      </Table.Row>
                    {/each}
                  {/each}
                {/each}
              </Table.Body>
            </Table.Root>
          </Card.Content>
        </Card.Root>
      {/each}
    </TabsContent>

    <TabsContent value="maintenance">
      {#each Object.entries(rental_unitByFloor) as [floor, rental_unit]}
        <Card.Root class="mb-4">
          <Card.Header>
            <Card.Title>Floor {floor} - Maintenance Status</Card.Title>
          </Card.Header>
          <Card.Content>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Rental_unit</Table.Head>
                  <Table.Head>Issue</Table.Head>
                  <Table.Head>Description</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head>Completed</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {#each rental_unit as rental_unit}
                  {#each rental_unit.maintenance as issue}
                    <Table.Row>
                      <Table.Cell>{rental_unit.number}</Table.Cell>
                      <Table.Cell>{issue.title}</Table.Cell>
                      <Table.Cell>{issue.description}</Table.Cell>
                      <Table.Cell>
                        <Badge variant={issue.status === 'COMPLETED' ? 'default' : 'outline'}>
                          {issue.status}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        {#if issue.completed_at}
                          {new Date(issue.completed_at).toLocaleDateString()}
                        {:else}
                          -
                        {/if}
                      </Table.Cell>
                    </Table.Row>
                  {/each}
                {/each}
              </Table.Body>
            </Table.Root>
          </Card.Content>
        </Card.Root>
      {/each}
    </TabsContent>

    <TabsContent value="financial">
      {#each Object.entries(rental_unitByFloor) as [floor, rental_unit]}
        <Card.Root class="mb-4">
          <Card.Header>
            <Card.Title>Floor {floor} - Financial Details</Card.Title>
          </Card.Header>
          <Card.Content>
            <div class="space-y-4">
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.Head>Rental_unit</Table.Head>
                    <Table.Head>Tenant</Table.Head>
                    {#each data.months as month}
                      <Table.Head>{month}</Table.Head>
                    {/each}
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {#each rental_unit as rental_unit}
                    {#each rental_unit.leases as lease}
                      {#each lease.lease_tenants as { tenant }}
                        <Table.Row>
                          <Table.Cell>{rental_unit.number}</Table.Cell>
                          <Table.Cell>{tenant.name}</Table.Cell>
                          {#each data.months as month}
                            <Table.Cell>
                              {formatCurrency(balancesByTenant[tenant.id]?.[month] ?? 0)}
                            </Table.Cell>
                          {/each}
                        </Table.Row>
                      {/each}
                    {/each}
                  {/each}
                </Table.Body>
              </Table.Root>

              <div class="mt-4">
                <h4 class="text-lg font-semibold mb-2">Upcoming Payments</h4>
                <Table.Root>
                  <Table.Header>
                    <Table.Row>
                      <Table.Head>Rental_unit</Table.Head>
                      <Table.Head>Due Date</Table.Head>
                      <Table.Head>Amount</Table.Head>
                      <Table.Head>Type</Table.Head>
                      <Table.Head>Status</Table.Head>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {#each rental_unit as rental_unit}
                      {#each rental_unit.leases as lease}
                        {#each lease.payment_schedules.filter(ps => new Date(ps.due_date) >= new Date()) as schedule}
                          <Table.Row>
                            <Table.Cell>{rental_unit.number}</Table.Cell>
                            <Table.Cell>{new Date(schedule.due_date).toLocaleDateString()}</Table.Cell>
                            <Table.Cell>{formatCurrency(schedule.expected_amount)}</Table.Cell>
                            <Table.Cell>{schedule.type}</Table.Cell>
                            <Table.Cell>
                              <Badge variant={getPaymentStatusVariant(schedule.status)}>
                                {schedule.status}
                              </Badge>
                            </Table.Cell>
                          </Table.Row>
                        {/each}
                      {/each}
                    {/each}
                  </Table.Body>
                </Table.Root>
              </div>
            </div>
          </Card.Content>
        </Card.Root>
      {/each}
    </TabsContent>

    <TabsContent value="utilities">
      {#each Object.entries(rental_unitByFloor) as [floor, rental_unit]}
        <Card.Root class="mb-4">
          <Card.Header>
            <Card.Title>Floor {floor} - Utility Details</Card.Title>
          </Card.Header>
          <Card.Content>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Rental_unit</Table.Head>
                  <Table.Head>Meter</Table.Head>
                  <Table.Head>Type</Table.Head>
                  <Table.Head>Latest Reading</Table.Head>
                  <Table.Head>Rate</Table.Head>
                  <Table.Head>Status</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {#each rental_unit as rental_unit}
                  {#each rental_unit.meters as meter}
                    <Table.Row>
                      <Table.Cell>{rental_unit.number}</Table.Cell>
                      <Table.Cell>{meter.name}</Table.Cell>
                      <Table.Cell>{meter.type}</Table.Cell>
                      <Table.Cell>
                        {#if meter.readings.length > 0}
                          {meter.readings[meter.readings.length - 1].reading}
                        {:else}
                          {meter.initial_reading}
                        {/if}
                      </Table.Cell>
                      <Table.Cell>{formatCurrency(meter.unit_rate)}</Table.Cell>
                      <Table.Cell>
                        <Badge variant={getStatusVariant(meter.status)}>
                          {meter.status}
                        </Badge>
                      </Table.Cell>
                    </Table.Row>
                  {/each}
                {/each}
              </Table.Body>
            </Table.Root>
          </Card.Content>
        </Card.Root>
      {/each}
    </TabsContent>
  </Tabs>
</div> -->
