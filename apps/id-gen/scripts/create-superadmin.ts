console.log('Script started...');
import 'dotenv/config';
console.log('Dotenv loaded.');
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
console.log('Imports 1 done.');
import { betterAuth } from "better-auth";
console.log('BetterAuth imported.');
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins/admin";
import * as schema from '../src/lib/server/schema';
console.log('All imports done.');

async function main() {
    const email = process.argv[2];
    const password = process.argv[3];
    const name = process.argv[4] || 'Super Admin';

    if (!email || !password) {
        console.error('Usage: npx tsx scripts/create-superadmin.ts <email> <password> [name]');
        process.exit(1);
    }

    console.log(`Creating superadmin account for ${email}...`);

    // 1. Setup DB
    const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('NEON_DATABASE_URL or DATABASE_URL not set');
    }
    const sql = neon(connectionString);
    const db = drizzle(sql, { schema });

    // 2. Setup Auth (Local Instance)
    // We mock the secret if missing just to pass validation, assuming we are admin and bypassing some checks?
    // Actually, signUpEmail needs the secret for hashing.
    const secret = process.env.BETTER_AUTH_SECRET || 'temp_secret_for_script'; 
    
    const auth = betterAuth({
        database: drizzleAdapter(db, {
            provider: "pg",
            schema: {
                user: schema.user,
                session: schema.session,
                account: schema.account,
                verification: schema.verification,
            }
        }),
        secret,
        plugins: [
            admin()
        ],
        emailAndPassword: {
            enabled: true
        }
    });

    try {
        // 3. Create User
        console.log('Signing up user...');
        const res = await auth.api.signUpEmail({
            body: {
                email,
                password,
                name
            }
        });

        if (!res) {
             // Sometimes signUpEmail returns user, sometimes response object depending on client.
             // On server/node instance, it usually returns the user object or throws?
             // Better Auth types are complex. Let's assume if no throw, it might have worked.
             // But we verify against DB anyway.
             console.log('SignUp call returned, verifying...');
        }

        // 4. Fetch the user to get ID and verify
        const user = await db.query.user.findFirst({
            where: (users, { eq }) => eq(users.email, email)
        });

        if (!user) {
            throw new Error('User created but not found in database');
        }

        console.log(`User created with ID: ${user.id}`);

        // 5. Update profile role to 'super_admin'
        await db.insert(schema.profiles).values({
            id: user.id,
            email: user.email,
            role: 'super_admin'
        }).onConflictDoUpdate({
            target: schema.profiles.id,
            set: { role: 'super_admin' }
        });

        console.log(`✅ Successfully promoted ${email} to super_admin!`);
        process.exit(0);

    } catch (e: any) {
        // Check if user already exists
        if (e.message && e.message.includes('already exists')) {
             console.log('User already exists, attempting to promote...');
             const user = await db.query.user.findFirst({
                where: (users, { eq }) => eq(users.email, email)
            });
            if (user) {
                 await db.insert(schema.profiles).values({
                    id: user.id,
                    email: user.email,
                    role: 'super_admin'
                }).onConflictDoUpdate({
                    target: schema.profiles.id,
                    set: { role: 'super_admin' }
                });
                console.log(`✅ Successfully promoted ${email} to super_admin!`);
                process.exit(0);
            }
        }

        console.error('Error creating superadmin:', e.message || e);
        console.error(e); // Full log
        process.exit(1);
    }
}

main();
