// Dev bypass utilities — only active when `dev === true` and DB is unavailable.
// See also: src/lib/utils/roleChecks.ts for role groupings.

let _dbAvailable: boolean | null = null;

export function isDbAvailable(): boolean {
	if (_dbAvailable !== null) return _dbAvailable;
	try {
		const processEnv: Record<string, string | undefined> =
			typeof process !== 'undefined' && process.env ? process.env : {};
		let url = processEnv.NEON_DATABASE_URL;

		// In Node.js dev, check .env.local directly as a fallback
		if (!url && typeof process !== 'undefined' && process.versions?.node) {
			try {
				const fs = require('node:fs');
				const path = require('node:path');
				for (const envFile of ['.env.local', '.env']) {
					try {
						const envPath = path.resolve(process.cwd(), envFile);
						if (fs.existsSync(envPath)) {
							const content = fs.readFileSync(envPath, 'utf-8');
							const match = content.match(/^NEON_DATABASE_URL=(.+)$/m);
							if (match) {
								url = match[1].trim();
								break;
							}
						}
					} catch {
						// ignore
					}
				}
			} catch {
				// fs/path not available (Cloudflare Workers)
			}
		}

		_dbAvailable = !!url && url !== '' && url !== 'missing';
	} catch {
		_dbAvailable = false;
	}
	return _dbAvailable;
}

export const DEV_USERS: Record<string, { email: string; role: string; permissions: string[] }> = {
	super_admin: {
		email: 'admin@dev.local',
		role: 'super_admin',
		permissions: [
			'properties.read', 'properties.create', 'properties.update', 'properties.delete',
			'tenants.read', 'tenants.create', 'tenants.update', 'tenants.delete',
			'leases.read', 'leases.create', 'leases.update', 'leases.delete',
			'payments.read', 'payments.create', 'payments.update', 'payments.delete',
			'expenses.read', 'expenses.create', 'expenses.update', 'expenses.delete',
			'budgets.read', 'budgets.create', 'budgets.update', 'budgets.delete',
			'reports.read', 'users.read', 'users.create', 'users.update', 'users.delete'
		]
	},
	property_admin: {
		email: 'propadmin@dev.local',
		role: 'property_admin',
		permissions: [
			'properties.read', 'properties.create', 'properties.update',
			'tenants.read', 'tenants.create', 'tenants.update',
			'leases.read', 'leases.create', 'leases.update',
			'payments.read', 'payments.create', 'payments.update',
			'expenses.read', 'expenses.create', 'reports.read'
		]
	},
	property_manager: {
		email: 'manager@dev.local',
		role: 'property_manager',
		permissions: [
			'properties.read', 'tenants.read', 'tenants.create', 'tenants.update',
			'leases.read', 'leases.create', 'leases.update',
			'payments.read', 'payments.create', 'reports.read'
		]
	},
	property_tenant: {
		email: 'tenant@dev.local',
		role: 'property_tenant',
		permissions: ['properties.read', 'tenants.read', 'leases.read', 'payments.read']
	},
	user: {
		email: 'user@dev.local',
		role: 'user',
		permissions: ['properties.read', 'tenants.read', 'leases.read', 'payments.read']
	}
};

export const DEV_PROPERTIES = [
	{
		id: 'dev-prop-1',
		name: 'Dev Property A',
		address: '123 Dev Street',
		type: 'APARTMENT',
		status: 'ACTIVE',
		created_at: '2025-01-01T00:00:00.000Z',
		updated_at: '2025-01-01T00:00:00.000Z'
	},
	{
		id: 'dev-prop-2',
		name: 'Dev Property B',
		address: '456 Test Ave',
		type: 'DORMITORY',
		status: 'ACTIVE',
		created_at: '2025-01-01T00:00:00.000Z',
		updated_at: '2025-01-01T00:00:00.000Z'
	}
];

export const DEV_DASHBOARD_COUNTS = {
	properties: 2,
	tenants: 5,
	activeLeases: 3,
	payments: 12
};
