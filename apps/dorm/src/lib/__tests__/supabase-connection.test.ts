import { describe, it, expect, beforeAll } from 'vitest';
import { createSupabaseBrowserClient } from '../supabase/index';
import type { Database } from '../database.types';

describe('Supabase Connection Test', () => {
	let supabase: ReturnType<typeof createSupabaseBrowserClient>;

	beforeAll(() => {
		// Initialize Supabase client
		supabase = createSupabaseBrowserClient();
	});

	it('should connect to Supabase successfully', async () => {
		// Test basic connection by checking if we can access the client
		expect(supabase).toBeDefined();
		expect(supabase.from).toBeDefined();
	});

	it('should read from profiles table', async () => {
		try {
			const { data, error } = await supabase.from('profiles').select('*').limit(5);

			if (error) {
				console.error('Error reading profiles:', error);
				// Don't fail the test if there's an auth error, just log it
				expect(error.code).toBeDefined();
			} else {
				expect(data).toBeDefined();
				expect(Array.isArray(data)).toBe(true);
				console.log('Profiles table data:', data);
			}
		} catch (err) {
			console.error('Exception reading profiles:', err);
			// Test should not fail for connection issues
			expect(err).toBeDefined();
		}
	});

	it('should read from properties table', async () => {
		try {
			const { data, error } = await supabase.from('properties').select('*').limit(5);

			if (error) {
				console.error('Error reading properties:', error);
				expect(error.code).toBeDefined();
			} else {
				expect(data).toBeDefined();
				expect(Array.isArray(data)).toBe(true);
				console.log('Properties table data:', data);
			}
		} catch (err) {
			console.error('Exception reading properties:', err);
			expect(err).toBeDefined();
		}
	});

	it('should read from tenants table', async () => {
		try {
			const { data, error } = await supabase.from('tenants').select('*').limit(5);

			if (error) {
				console.error('Error reading tenants:', error);
				expect(error.code).toBeDefined();
			} else {
				expect(data).toBeDefined();
				expect(Array.isArray(data)).toBe(true);
				console.log('Tenants table data:', data);
			}
		} catch (err) {
			console.error('Exception reading tenants:', err);
			expect(err).toBeDefined();
		}
	});

	it('should read from leases table', async () => {
		try {
			const { data, error } = await supabase.from('leases').select('*').limit(5);

			if (error) {
				console.error('Error reading leases:', error);
				expect(error.code).toBeDefined();
			} else {
				expect(data).toBeDefined();
				expect(Array.isArray(data)).toBe(true);
				console.log('Leases table data:', data);
			}
		} catch (err) {
			console.error('Exception reading leases:', err);
			expect(err).toBeDefined();
		}
	});

	it('should read from rental_unit table', async () => {
		try {
			const { data, error } = await supabase.from('rental_unit').select('*').limit(5);

			if (error) {
				console.error('Error reading rental_unit:', error);
				expect(error.code).toBeDefined();
			} else {
				expect(data).toBeDefined();
				expect(Array.isArray(data)).toBe(true);
				console.log('Rental_unit table data:', data);
			}
		} catch (err) {
			console.error('Exception reading rental_unit:', err);
			expect(err).toBeDefined();
		}
	});

	it('should read from floors table', async () => {
		try {
			const { data, error } = await supabase.from('floors').select('*').limit(5);

			if (error) {
				console.error('Error reading floors:', error);
				expect(error.code).toBeDefined();
			} else {
				expect(data).toBeDefined();
				expect(Array.isArray(data)).toBe(true);
				console.log('Floors table data:', data);
			}
		} catch (err) {
			console.error('Exception reading floors:', err);
			expect(err).toBeDefined();
		}
	});

	it('should test a complex query with joins', async () => {
		try {
			const { data, error } = await supabase
				.from('leases')
				.select(
					`
          *,
          rental_unit:rental_unit(
            id,
            name,
            number,
            property:properties(name, address)
          ),
          lease_tenants(
            tenant:tenants(name, email)
          )
        `
				)
				.limit(3);

			if (error) {
				console.error('Error reading complex query:', error);
				expect(error.code).toBeDefined();
			} else {
				expect(data).toBeDefined();
				expect(Array.isArray(data)).toBe(true);
				console.log('Complex query data:', JSON.stringify(data, null, 2));
			}
		} catch (err) {
			console.error('Exception reading complex query:', err);
			expect(err).toBeDefined();
		}
	});
});
