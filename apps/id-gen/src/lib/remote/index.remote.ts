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

// Template and custom design functions
export {
	getTemplateAssetsBySize,
	getTemplateAssetCounts,
	getSizePresets,
	createCustomDesignRequest,
	uploadCustomDesignAsset,
	getUserCustomDesignRequests
} from './templates.remote';

// AI settings functions
export {
	getAISettings,
	getAIUsageStats,
	updateAISettings,
	addAICredits,
	rotateAPIKey,
	deleteAPIKey
} from './ai-settings.remote';

// Analytics functions
export {
	getOverviewAnalytics,
	getRevenueAnalytics,
	getCreditAnalytics,
	getCardAnalytics,
	getUserAnalytics
} from './analytics.remote';

// Decompose functions
export {
	checkDecomposeAvailable,
	decomposeImage,
	saveLayers,
    getDecomposeHistory
} from './decompose.remote';
