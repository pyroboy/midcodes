/**
 * Consolidated Remote Functions Entry Point
 * 
 * IMPORTANT: This file re-exports all admin-related remote functions from a SINGLE file.
 * This ensures SvelteKit bundles them into ONE serverless function on Vercel,
 * helping stay within the Hobby plan's 12 function limit.
 * 
 * Import from this file instead of individual .remote.ts files:
 *   import { getAdminDashboardData, getBillingSettings, getInvoices } from '$lib/remote/index.remote';
 */

// Admin functions
export {
	getAdminDashboardData,
	getUsersData,
	addUser,
	updateUserRole,
	deleteUser
} from './admin.remote';

// Billing functions
export {
	getBillingSettings,
	togglePayments,
	setPaymentsBypass,
	getUsersWithCredits,
	adjustUserCredits
} from './billing.remote';

// Invoice functions
export {
	getInvoices,
	getInvoiceById,
	createInvoice,
	sendInvoice,
	markInvoicePaid,
	voidInvoice,
	getAdminAuditLog
} from './invoices.remote';
