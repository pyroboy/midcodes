/**
 * Expense Store — Svelte 5 Runes
 */
import { nanoid } from 'nanoid';
import { session } from '$lib/stores/session.svelte';
import { getDb } from '$lib/db';
import { createRxStore } from '$lib/stores/sync.svelte';
import { browser } from '$app/environment';

export interface Expense {
    id: string;
    category: string;
    amount: number;
    description: string;
    paidBy: string;
    locationId: string;
    createdBy: string;
    createdAt: string;
    receiptPhoto?: string;
}

export const expenseCategories = [
    'Labor Budget',
    'Petty Cash',
    'Meat Procurement', 
    'Produce & Sides', 
    'Utilities', 
    'Wages', 
    'Rent', 
    'Miscellaneous'
];

// Replaces the static array with a reactive RxDB query wrapped in a $derived
const dbQuery = createRxStore<Expense>('expenses', db => db.expenses.find({ sort: [{ createdAt: 'desc' }] }));

// We export the getter so UI components still read it identically to before without modifying components
export const allExpenses = {
    get value(): Expense[] {
        return dbQuery.value;
    }
};

export async function addExpense(category: string, amount: number, description: string, paidBy: string, receiptPhoto?: string) {
    if (!browser) return;
    const expense: Expense = {
        id: nanoid(),
        category,
        amount,
        description,
        paidBy,
        locationId: session.locationId === 'all' ? 'qc' : session.locationId,
        createdBy: session.userName || 'Staff',
        createdAt: new Date().toISOString(),
        ...(receiptPhoto && { receiptPhoto })
    };
    
    // Write directly to the local RxDB database instead of a memory array
    const db = await getDb();
    await db.expenses.insert(expense);

    // Try to call audit if it exists
    import('$lib/stores/audit.svelte').then(({ log }) => {
        if (typeof (log as any).expenseAdded === 'function') {
            (log as any).expenseAdded(category, amount);
        } else if (typeof (log as any).writeLog === 'function') {
             (log as any).writeLog(`Expense added: ${category} - ₱${amount}`);
        }
    }).catch(() => {});
}

export async function deleteExpense(id: string) {
    if (!browser) return;
    const db = await getDb();
    const query = db.expenses.findOne(id);
    await query.remove();
}

