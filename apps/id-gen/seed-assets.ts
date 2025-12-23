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
		console.log('Seeding dummy template asset...');

		// Check if any size preset exists
		const presets = await db.select().from(schema.templateSizePresets).limit(1);
		let presetId = null;
		if (presets.length > 0) {
			presetId = presets[0].id;
		}

		const newAsset = await db
			.insert(schema.templateAssets)
			.values({
				name: 'Test Asset Background',
				description: 'A test background asset seeded for debugging',
				category: 'Other',
				tags: ['test', 'debug'],
				sizePresetId: presetId,
				sampleType: 'other',
				orientation: 'landscape',
				imagePath: 'placeholders/test-bg.png',
				imageUrl: 'https://placehold.co/600x400/png',
				widthPixels: 600,
				heightPixels: 400,
				isPublished: true,
				uploadedBy: null // or fetch a user if needed, but schema allows null
			})
			.returning();

		console.log('Seeded Asset:', JSON.stringify(newAsset[0], null, 2));
	} catch (error) {
		console.error('Error seeding asset:', error);
	}
}

main();
