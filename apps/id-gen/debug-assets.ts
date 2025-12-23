import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './src/lib/server/schema';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load .env manually
const envConfig = dotenv.parse(fs.readFileSync('.env'));
const connectionString = envConfig.NEON_DATABASE_URL;

if (!connectionString) {
	console.error('NEON_DATABASE_URL not found in .env');
	process.exit(1);
}

const sql = neon(connectionString);
const db = drizzle(sql, { schema });

async function main() {
	try {
		const assets = await db.select().from(schema.templateAssets);
		console.log('Template Assets Count:', assets.length);
		if (assets.length > 0) {
			console.log('Sample Asset:', JSON.stringify(assets[0], null, 2));
			// Check for problematic fields for visibility
			const issues = assets.filter((a) => !a.imageUrl && !a.imagePath);
			if (issues.length > 0) {
				console.warn('Found assets with missing image URL/path:', issues.length);
			}
		} else {
			console.log('No assets found in the database.');
		}

		const templates = await db.select().from(schema.templates);
		console.log('Templates Count:', templates.length);
	} catch (error) {
		console.error('Error fetching assets:', error);
	}
}

main();
