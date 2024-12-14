// src/routes/utility-billings/+page.server.ts
import { superValidate } from 'sveltekit-superforms/server';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { meters, readings, utilityBillings, leases, tenants, accounts, utilityBillingTypeEnum } from '$lib/db/schema';
import { zod } from 'sveltekit-superforms/adapters';

const utilityBillingSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  type: z.enum(utilityBillingTypeEnum.enumValues),
  costPerUnit: z.coerce.number().positive(),
});

const meterBillingSchema = z.object({
  meterId: z.number(),
  meterName: z.string(),
  startReading: z.number(),
  endReading: z.number(),
  consumption: z.number(),
  totalCost: z.number(),
  tenantCount: z.coerce.number(),
  perTenantCost: z.number(),
});

const utilityBillingCreationSchema = utilityBillingSchema.extend({
  meterBillings: z.array(meterBillingSchema),
});

export const load = async () => {
  const form = await superValidate(zod(utilityBillingCreationSchema));

  const allMeters = await db.select().from(meters);
  const allReadings = await db
    .select({
      meterId: readings.meterId,
      readingDate: readings.readingDate,
      readingValue: readings.readingValue,
    })
    .from(readings);

  const availableReadingDates = await db
    .select({ readingDate: readings.readingDate })
    .from(readings)
    .groupBy(readings.readingDate)
    .orderBy(readings.readingDate);

  const tenantCounts = await db
    .select({
      locationId: leases.locationId,
      tenantCount: db.sql<number>`COUNT(DISTINCT ${tenants.id})`,
    })
    .from(leases)
    .leftJoin(tenants, db.eq(tenants.locationId, leases.locationId))
    .where(
      db.and(
        db.eq(leases.leaseStatus, 'ACTIVE'),
        db.sql`${leases.leaseStartDate} <= CURRENT_DATE`,
        db.sql`${leases.leaseEndDate} >= CURRENT_DATE`
      )
    )
    .groupBy(leases.locationId);

  const meterTypes = utilityBillingTypeEnum.enumValues;

  return {
    form,
    allMeters,
    allReadings,
    tenantCounts,
    meterTypes,
    availableReadingDates: availableReadingDates.map(d => d.readingDate),
  };
};

export const actions = {
  default: async ({ request }) => {
    const form = await superValidate(request, zod(utilityBillingCreationSchema));
    console.log('Received form data:', JSON.stringify(form.data, null, 2));

    if (!form.valid) {
      console.log('Form validation failed');
      return fail(400, { form });
    }

    const { startDate, endDate, type, costPerUnit, meterBillings } = form.data;

    // Begin a transaction
    return await db.transaction(async (tx) => {
      console.log('Starting database transaction');

      // Additional validation
      if (!meterBillings || meterBillings.length === 0) {
        console.log('No meter billings provided');
        return fail(400, { form, message: "No meter billings provided" });
      }

      // 1. Create the main utility billing record
      const [utilityBilling] = await tx.insert(utilityBillings).values({
        type,
        billingDate: new Date().toISOString(),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
        createdBy: 1, // Assuming a default user ID for now
      }).returning();
      console.log('Created utility billing record:', utilityBilling);

      let totalAccountsCreated = 0;
      let totalBilledAmount = 0;

      // 2. Process each meter billing
      for (const meterBilling of meterBillings) {
        console.log(`Processing meter billing for meter ${meterBilling.meterId}`);
        // 3. Get active leases for the location associated with this meter
        const activeLeases = await tx.select({
          id: leases.id,
          locationId: leases.locationId,
        })
        .from(leases)
        .innerJoin(meters, db.eq(meters.locationId, leases.locationId))
        .where(
          db.and(
            db.eq(meters.id, meterBilling.meterId),
            db.eq(leases.leaseStatus, 'ACTIVE'),
            db.sql`${leases.leaseStartDate} <= ${endDate}`,
            db.sql`${leases.leaseEndDate} >= ${startDate}`
          )
        );
        console.log(`Found ${activeLeases.length} active leases for meter ${meterBilling.meterId}`);

        if (activeLeases.length === 0) {
          console.log(`No active leases found for meter ${meterBilling.meterName}. Skipping account creation for this meter.`);
          continue; // Skip this meter and continue with the next one
        }

        // 4. Calculate billing amount per lease
        const costPerLease = meterBilling.totalCost / activeLeases.length;
        console.log(`Cost per lease for meter ${meterBilling.meterId}: ${costPerLease}`);

        // 5. Create accounts for each active lease
        for (const lease of activeLeases) {
          const [account] = await tx.insert(accounts).values({
            leaseId: lease.id,
            type: 'UTILITIES',
            category: 'RECEIVABLE',
            amount: costPerLease,
            dateIssued: new Date().toISOString(),
            dueOn: utilityBilling.dueDate,
            utilityBillingId: utilityBilling.id,
            createdBy: 1, // Assuming a default user ID for now
          }).returning();
          totalAccountsCreated++;
          totalBilledAmount += costPerLease;
          console.log(`Created account for lease ${lease.id}:`, account);
        }
      }

      console.log('Transaction completed successfully');
      console.log(`Total accounts created: ${totalAccountsCreated}`);
      console.log(`Total billed amount: ${totalBilledAmount}`);
      
      return { 
        form,
        // success,
        summary: {
          totalAccountsCreated,
          totalBilledAmount
        }
      };
    });
  }
};