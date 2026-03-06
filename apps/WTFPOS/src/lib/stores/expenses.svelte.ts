/**
 * Expense Store — Svelte 5 Runes
 */
import { nanoid } from 'nanoid';
import { session } from '$lib/stores/session.svelte';
import { getDb } from '$lib/db';
import { createRxStore } from '$lib/stores/sync.svelte';
import { browser } from '$app/environment';
import { log } from '$lib/stores/audit.svelte';
export { expenseCategories, validateExpense } from '$lib/stores/expenses.utils';
import { expenseCategories } from '$lib/stores/expenses.utils';

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
    updatedAt: string;
}

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
    console.log('[EXPENSE_DEBUG] addExpense called:', { category, amount, description, paidBy, receiptPhoto });
    
    if (!browser) {
        console.error('[EXPENSE_DEBUG] Not in browser environment');
        return { success: false, error: 'Not in browser environment' };
    }
    
    // Validate inputs
    const validationError = validateExpense(category, amount, description, paidBy);
    if (validationError) {
        console.error('[EXPENSE_DEBUG] Validation failed:', validationError);
        return { success: false, error: validationError };
    }
    
    // DEBUG: Check if receiptPhoto is a blob URL that won't persist
    if (receiptPhoto) {
        console.warn('[EXPENSE_DEBUG] Receipt photo provided:', receiptPhoto.substring(0, 100) + '...');
        if (receiptPhoto.startsWith('blob:')) {
            console.error('[EXPENSE_DEBUG] CRITICAL: Blob URL will not persist after page reload!');
        }
    }
    
    const locationId = session.locationId === 'all' ? 'qc' : session.locationId;
    console.log('[EXPENSE_DEBUG] Using locationId:', locationId, '(session.locationId:', session.locationId + ')');
    
    const expense: Expense = {
        id: nanoid(),
        category: category.trim(),
        amount,
        description: description.trim(),
        paidBy: paidBy.trim(),
        locationId: locationId,
        createdBy: session.userName || 'Staff',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(receiptPhoto && { receiptPhoto })
    };
    
    try {
        const db = await getDb();
        await db.expenses.insert(expense);
        
        console.log('[EXPENSE_DEBUG] Expense saved successfully:', expense.id);
        
        // Log to audit
        log.expenseLogged(category, amount, description);
        
        return { success: true, id: expense.id };
    } catch (err) {
        console.error('[EXPENSE_DEBUG] Failed to add expense:', err);
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

