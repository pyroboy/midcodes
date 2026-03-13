/**
 * Expense Store — Svelte 5 Runes
 */
import { nanoid } from 'nanoid';
import { session } from '$lib/stores/session.svelte';
import { createStore } from '$lib/stores/create-store.svelte';
import { getWritableCollection } from '$lib/db/write-proxy';
import { browser } from '$app/environment';
import { log } from '$lib/stores/audit.svelte';
export {
    expenseCategories, expenseCategoryGroups,
    getCategoryBadgeClass, getCategoryGroup, getCategoryIcon,
    getGroupBorderColor, PAID_BY_OPTIONS, LEGACY_CATEGORY_MAP, resolveCategory,
    validateExpense
} from '$lib/stores/expenses.utils';
import { expenseCategories, validateExpense } from '$lib/stores/expenses.utils';

export interface Expense {
    id: string;
    category: string;
    amount: number;
    description: string;
    paidBy: string;
    locationId: string;
    createdBy: string;
    createdAt: string;
    expenseDate?: string | null;
    receiptPhoto?: string;
    updatedAt: string;
}

export interface ExpenseTemplate {
    id: string;
    locationId: string;
    category: string;
    description: string;
    defaultAmount: number;
    paidBy: string;
    recurrence: 'daily' | 'monthly' | 'adhoc';
    isActive: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

// Replaces the static array with a reactive RxDB query wrapped in a $derived
const dbQuery = createStore<Expense>('expenses', db => db.expenses.find({ sort: [{ createdAt: 'desc' }] }), { filter: { locationId: undefined }, sort: (a, b) => b.createdAt.localeCompare(a.createdAt) });

// We export the getter so UI components still read it identically to before without modifying components
export const allExpenses = {
    get value(): Expense[] {
        return dbQuery.value;
    }
};

// ─── Templates (localStorage-backed to stay within RxDB 16-collection limit) ─
const TEMPLATES_KEY = 'wtfpos_expense_templates';

function loadTemplates(): ExpenseTemplate[] {
    if (!browser) return [];
    try {
        const raw = localStorage.getItem(TEMPLATES_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveTemplates(templates: ExpenseTemplate[]) {
    if (!browser) return;
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

let _templates = $state<ExpenseTemplate[]>(loadTemplates());

export const allTemplates = {
    get value(): ExpenseTemplate[] {
        return _templates;
    }
};

export async function addTemplate(
    template: Omit<ExpenseTemplate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; error?: string; id?: string }> {
    if (!browser) return { success: false, error: 'Not in browser environment' };

    const now = new Date().toISOString();
    const doc: ExpenseTemplate = {
        ...template,
        id: nanoid(),
        createdAt: now,
        updatedAt: now,
    };

    _templates = [doc, ..._templates];
    saveTemplates(_templates);
    return { success: true, id: doc.id };
}

export async function updateTemplate(
    id: string,
    updates: Partial<Omit<ExpenseTemplate, 'id' | 'createdAt'>>
): Promise<{ success: boolean; error?: string }> {
    if (!browser) return { success: false, error: 'Not in browser environment' };

    const idx = _templates.findIndex(t => t.id === id);
    if (idx === -1) return { success: false, error: 'Template not found' };

    _templates[idx] = { ..._templates[idx], ...updates, updatedAt: new Date().toISOString() };
    _templates = [..._templates];
    saveTemplates(_templates);
    return { success: true };
}

export async function deleteTemplate(id: string): Promise<{ success: boolean; error?: string }> {
    if (!browser) return { success: false, error: 'Not in browser environment' };

    _templates = _templates.filter(t => t.id !== id);
    saveTemplates(_templates);
    return { success: true };
}

// ─── Expense CRUD ─────────────────────────────────────────────────────────────
export async function addExpense(category: string, amount: number, description: string, paidBy: string, receiptPhoto?: string, expenseDate?: string): Promise<{ success: boolean; error?: string; id?: string }> {
    if (!browser) {
        return { success: false, error: 'Not in browser environment' };
    }

    // Validate inputs
    const validationError = validateExpense(category, amount, description, paidBy);
    if (validationError) {
        return { success: false, error: validationError };
    }

    const locationId = session.locationId === 'all' ? 'tag' : session.locationId;

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
        ...(expenseDate && { expenseDate }),
        ...(receiptPhoto && { receiptPhoto })
    };

    try {
        const col = getWritableCollection('expenses');
        await col.insert(expense);

        // Log to audit
        log.expenseLogged(category, amount, description);

        return { success: true, id: expense.id };
    } catch (err) {
        console.error('[EXPENSE] Failed to add expense:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error occurred' };
    }
}

export async function deleteExpense(id: string, _snapshot?: unknown): Promise<{ success: boolean; error?: string }> {
    if (!browser) return { success: false, error: 'Not in browser environment' };
    if (!id || typeof id !== 'string') return { success: false, error: 'Invalid expense ID' };

    try {
        const col = getWritableCollection('expenses');
        const doc = await col.findOne(id).exec();
        if (!doc) {
            return { success: false, error: 'Expense not found' };
        }
        await col.remove(id);
        return { success: true };
    } catch (err) {
        console.error('[EXPENSE] Failed to delete expense:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error occurred' };
    }
}
