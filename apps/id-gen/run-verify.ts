// run-verify.ts
// Simple script to run our verification tool using mock data

import type { SupabaseClient } from '@supabase/supabase-js';
import { verifyPaymentSystem, testPaymentToggle } from './verify_payment_system';

// Create a mock Supabase client for demonstration
const orgId = 'test-org-id';
const adminId = 'admin-123';

// Create a mock Supabase client for testing
const mockSupabase = createMockSupabaseClient();

async function runTests() {
	console.log('Running payment system verification with MOCK DATA:');
	console.log(`- Org ID: ${orgId}`);
	console.log(`- Admin ID: ${adminId}`);
	console.log('---------------------------------------------\n');
	console.log('NOTE: This is using mock data for demonstration!');
	console.log('In production, use the actual Supabase client.\n');

	try {
		// Run the verification with mock data
		const verified = await verifyPaymentSystem(mockSupabase, orgId);

		if (verified) {
			console.log('\nVerification successful! Running toggle test...\n');
			// If verification succeeded, try the toggle test
			await testPaymentToggle(mockSupabase, orgId, adminId);
		}
	} catch (error) {
		console.error('Error running tests:', error);
	}
}

// Create a mock Supabase client for demonstration purposes
function createMockSupabaseClient(): SupabaseClient {
	// Default data state for our mock
	const mockData = {
		org_settings: {
			payments_enabled: true,
			payments_bypass: false,
			updated_by: null,
			updated_at: new Date().toISOString()
		},
		users: [
			{ id: 'user1', email: 'user@example.com', role: 'id_gen_user', org_id: orgId },
			{ id: 'admin1', email: 'admin@example.com', role: 'org_admin', org_id: orgId },
			{ id: 'super1', email: 'super@example.com', role: 'super_admin', org_id: orgId }
		]
	};

	// Create a mock client that simulates Supabase responses
	return {
		from: (table: string) => ({
			select: (columns: string) => ({
				limit: (n: number) => ({
					// For org_settings checks (no chain)
					eq: (column: string, value: string) => ({
						single: () => {
							if (table === 'org_settings' && value === orgId) {
								return Promise.resolve({ data: mockData.org_settings, error: null });
							}
							if (table === 'admin_audit' || table === 'credit_transactions') {
								return Promise.resolve({ data: null, error: null });
							}
							return Promise.resolve({
								data: null,
								error: { code: 'PGRST116', message: 'No rows found' }
							});
						}
					})
				}),
				// For user role checks
				in: (column: string, values: string[]) => ({
					eq: (column: string, value: string) => ({
						limit: (n: number) => {
							if (table === 'profiles' && value === orgId) {
								return Promise.resolve({ data: mockData.users, error: null });
							}
							return Promise.resolve({ data: [], error: null });
						}
					})
				}),
				// Direct eq for single operations
				eq: (column: string, value: string) => ({
					single: () => {
						if (table === 'org_settings' && value === orgId) {
							return Promise.resolve({ data: mockData.org_settings, error: null });
						}
						return Promise.resolve({
							data: null,
							error: { code: 'PGRST116', message: 'No rows found' }
						});
					}
				})
			}),
			update: (updates: any) => ({
				eq: (column: string, value: string) => {
					if (table === 'org_settings' && value === orgId) {
						// Update our mock state
						mockData.org_settings = { ...mockData.org_settings, ...updates };
						return Promise.resolve({ error: null });
					}
					return Promise.resolve({ error: { message: 'Update failed' } });
				}
			}),
			insert: (data: any) => {
				if (table === 'org_settings') {
					mockData.org_settings = { ...data };
					return Promise.resolve({ error: null });
				}
				return Promise.resolve({ error: null });
			}
		})
	} as unknown as SupabaseClient;
}

runTests().catch(console.error);
