// src/routes/transactions/+page.server.ts

import { db } from '$lib/db/db';
import { transactions, accounts, leases, transactionAccounts } from '$lib/db/schema';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { zod } from "sveltekit-superforms/adapters";
import { eq, sql,desc } from 'drizzle-orm';

const transactionInsertSchema = createInsertSchema(transactions, {
  id: z.number().optional(),
  totalAccountCharges: z.number(),
  amount: z.number(),
  change: z.number(),
  transactionDate: z.string(),
  paidBy: z.string().optional(),
  receivedBy: z.string().optional(),
  createdBy: z.number(),
  updatedBy: z.number().optional(),
  transactionType: z.enum(['CASH', 'BANK', 'GCASH', 'OTHER']),
  financialPeriodId: z.number().optional(),
});

const accountSchema = z.object({
  id: z.number(),
  leaseId: z.number(),
  type: z.enum(['RENT', 'UTILITIES', 'SECURITY_DEPOSIT', 'PENALTY_RENT', 'PENALTY_UTILITY', 'OVERDUE_RENT', 'OVERDUE_UTILITIES', 'MAINTENANCE', 'SERVICE_FEE']),
  amount: z.number(),
  balance: z.number().nullable(),
  dateIssued: z.string(),
  dueOn: z.string().nullable(),
});

const formSchema = transactionInsertSchema.extend({
  selectedAccounts: z.array(accountSchema),
});

export const load = async () => {
  const accountsData = await db.query.accounts.findMany({
    with: {
      lease: true
    }
  });

  const form = await superValidate(zod(formSchema));
  const recentTransactions = await db
  .select()
  .from(transactions)
  .orderBy(desc(transactions.transactionDate))
  .limit(10);

  return {
    transactions: recentTransactions,
    accounts: accountsData,
    form
  };
};

export const actions = {
  create: async ({ request }) => {
    const form = await superValidate(request, zod(formSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const { selectedAccounts, ...transactionData } = form.data;
      
      await db.transaction(async (trx) => {
        const [insertedTransaction] = await trx.insert(transactions).values({
          ...transactionData,
          transactionDate: sql`${transactionData.transactionDate}::date`
        }).returning();

        await trx.insert(transactionAccounts).values(
          selectedAccounts.map(account => ({
            transactionId: insertedTransaction.id,
            accountId: account.id
          }))
        );

        for (const account of selectedAccounts) {
          if (account.balance !== null) {
            await trx.update(accounts)
              .set({ balance: account.balance - account.amount })
              .where(eq(accounts.id, account.id));
          }
        }
      });
    } catch (error) {
      console.error('Error creating transaction:', error);
      return fail(500, { form, error: 'Failed to create transaction' });
    }

    return { form };
  },
};