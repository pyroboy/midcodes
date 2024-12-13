// src/routes/expenses/+page.server.ts
import { db } from '$lib/db/db';
import { expenses } from '$lib/db/schema';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import { zod } from 'sveltekit-superforms/adapters';

// Define a Zod schema for the form
const formSchema = z.object({
  amount: z.coerce.number().positive(),
  type: z.enum(['MAINTENANCE', 'RENOVATION', 'MISC', 'SUPPLIES', 'UTILITIES', 'TRAVEL', 'OPERATING', 'REPAIRS', 'CASH_ADVANCE', 'MARKETING', 'SALARIES']),
  issuedTo: z.string().optional(),
  notes: z.string().optional(),
  dateIssued: z.string(),
  isRecurring: z.boolean().optional(),
});

export const load = async () => {
  const expenseList = await db.select().from(expenses).orderBy('dateIssued', { descending: true });
  const form = await superValidate(zod(formSchema));

  return {
    expenseList,
    form
  };
};

export const actions = {
  default: async ({ request }) => {
    const form = await superValidate(request, zod(formSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      await db.insert(expenses).values({
        ...form.data,
        createdBy: 1, // Replace with actual user ID when authentication is implemented
        dateIssued: new Date(form.data.dateIssued),
      } as any); // Using 'as any' to bypass type checking for this insert
    } catch (err) {
      console.error(err);
      return fail(500, { form, message: 'Failed to add expense' });
    }

    return { form };
  }
};