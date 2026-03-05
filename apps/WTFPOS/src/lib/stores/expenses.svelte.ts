/**
 * Expense Store — Svelte 5 Runes
 */
import { nanoid } from 'nanoid';
import { session } from '$lib/stores/session.svelte';
import { getDb } from '$lib/db';
import { createRxStore } from '$lib/stores/sync.svelte';
import { browser } from '$app/environment';
import { log } from '$lib/stores/audit.svelte';

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

function validateExpense(category: string, amount: number, description: string, paidBy: string): string | null {
    if (!category || category.trim() === '') return 'Category is required';
    if (!expenseCategories.includes(category)) return 'Invalid category';
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) return 'Amount must be a positive number';
    if (amount > 999999999) return 'Amount exceeds maximum allowed';
    if (!description || description.trim() === '') return 'Description is required';
    if (description.length > 500) return 'Description is too long (max 500 characters)';
    if (!paidBy || paidBy.trim() === '') return 'Paid by is required';
    if (paidBy.length > 100) return 'Paid by name is too long (max 100 characters)';
    return null;
}

export async function addExpense(category: string, amount: number, description: string, paidBy: string, receiptPhoto?: string): Promise<{ success: boolean; error?: string; id?: string }> {
    if (!browser) return { success: false, error: 'Not in browser environment' };
    
    // Validate inputs
    const validationError = validateExpense(category, amount, description, paidBy);
    if (validationError) {
        return { success: false, error: validationError };
    }
    
    const expense: Expense = {
        id: nanoid(),
        category: category.trim(),
        amount,
        description: description.trim(),
        paidBy: paidBy.trim(),
        locationId: session.locationId === 'all' ? 'qc' : session.locationId,
        createdBy: session.userName || 'Staff',
        createdAt: new Date().toISOString(),
        ...(receiptPhoto && { receiptPhoto })
    };
    
    try {
        const db = await getDb();
        await db.expenses.insert(expense);
        
        // Log to audit
        log.expenseLogged(category, amount, description);
        
        return { success: true, id: expense.id };
    } catch (err) {
        console.error('[EXPENSE] Failed to add expense:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error occurred' };
    }
}

export async function deleteExpense(id: string): Promise<{ success: boolean; error?: string }> {
    if (!browser) return { success: false, error: 'Not in browser environment' };
    if (!id || typeof id !== 'string') return { success: false, error: 'Invalid expense ID' };
    
    try {
        const db = await getDb();
        const doc = await db.expenses.findOne(id).exec();
        if (!doc) {
            return { success: false, error: 'Expense not found' };
        }
        await doc.remove();
        return { success: true };
    } catch (err) {
        console.error('[EXPENSE] Failed to delete expense:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error occurred' };
    }
}

