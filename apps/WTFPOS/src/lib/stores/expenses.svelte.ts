/**
 * Expense Store — Svelte 5 Runes
 */
import { nanoid } from 'nanoid';
import { session } from '$lib/stores/session.svelte';

export interface Expense {
    id: string;
    category: string;
    amount: number;
    description: string;
    paidBy: string;
    locationId: string;
    createdBy: string;
    createdAt: string;
}

export const expenseCategories = [
    'Meat Procurement', 
    'Produce & Sides', 
    'Utilities', 
    'Wages', 
    'Rent', 
    'Miscellaneous'
];

export const allExpenses = $state<Expense[]>([
    {
        id: nanoid(),
        category: 'Meat Procurement',
        amount: 8500,
        description: 'Pork belly delivery',
        paidBy: 'Petty Cash',
        locationId: 'loc-ayala',
        createdBy: 'Manager',
        createdAt: new Date().toISOString()
    },
    {
        id: nanoid(),
        category: 'Produce & Sides',
        amount: 1250,
        description: 'Morning market run for lettuce',
        paidBy: 'Petty Cash',
        locationId: 'loc-bgc',
        createdBy: 'Manager',
        createdAt: new Date().toISOString()
    }
]);

export function addExpense(category: string, amount: number, description: string, paidBy: string) {
    const expense: Expense = {
        id: nanoid(),
        category,
        amount,
        description,
        paidBy,
        locationId: session.locationId === 'all' ? 'loc-ayala' : session.locationId,
        createdBy: session.userName || 'Staff',
        createdAt: new Date().toISOString()
    };
    allExpenses.unshift(expense);
    // Try to call audit if it exists
    import('$lib/stores/audit.svelte').then(({ log }) => {
        if (typeof (log as any).expenseAdded === 'function') {
            (log as any).expenseAdded(category, amount);
        } else if (typeof (log as any).writeLog === 'function') {
             (log as any).writeLog(`Expense added: ${category} - ₱${amount}`);
        }
    }).catch(() => {});
}

export function deleteExpense(id: string) {
    const idx = allExpenses.findIndex(e => e.id === id);
    if (idx !== -1) {
        allExpenses.splice(idx, 1);
    }
}
