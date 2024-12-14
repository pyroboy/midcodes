// src/routes/overview/monthly/+page.server.ts

import { db } from '$lib/db/db';





export async function load() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed

  const result = await db.query.locations.findMany({
    // where: eq(locations.locationStatus, 'OCCUPIED'),
    orderBy: [asc(locations.locationFloorLevel)],
    with: {
      leases: {
        where: eq(leases.leaseStatus, 'ACTIVE'),
        with: {
          leaseTenants: {
            with: {
              tenant: true
            }
          }
        }
      }
    }
  });

  // Generate an array of the last 12 months
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(currentYear, currentMonth - i - 1, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }).reverse();

  // Fetch balances for each tenant for the last 12 months
  const balances = await db.select({
    tenantId: tenants.id,
    month: sql<string>`DATE_TRUNC('month', ${accounts.dateIssued})::text`,
    balance: sql<number>`SUM(${accounts.balance})`
  })
    .from(accounts)
    .innerJoin(leases, eq(accounts.leaseId, leases.id))
    .innerJoin(tenants, eq(leases.id, tenants.mainleaseId))
    .where(and(
      eq(leases.leaseStatus, 'ACTIVE'),
      sql`${accounts.dateIssued} >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months')`
    ))
    .groupBy(tenants.id, sql`DATE_TRUNC('month', ${accounts.dateIssued})`)
    .orderBy(tenants.id, sql`DATE_TRUNC('month', ${accounts.dateIssued})`);

  return {
    locations: result,
    months,
    balances
  };
}