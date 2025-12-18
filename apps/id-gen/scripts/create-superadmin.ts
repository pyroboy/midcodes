import { auth } from '../src/lib/server/auth';
import { db } from '../src/lib/server/db';
import { profiles } from '../src/lib/server/schema';
import { eq } from 'drizzle-orm';

async function main() {
    const email = process.argv[2];
    const password = process.argv[3];
    const name = process.argv[4] || 'Super Admin';

    if (!email || !password) {
        console.error('Usage: npx vite-node scripts/create-superadmin.ts <email> <password> [name]');
        process.exit(1);
    }

    console.log(`Creating superadmin account for ${email}...`);

    try {
        // 1. Create user via Better Auth
        // logic: Better Auth's local client API might need a request context, 
        // but 'auth.api' usually works for server-side calls if configured correctly?
        // Actually, auth.api.signUpEmail is mainly for client-side or context-aware calls.
        // For internal admin, we might need a different approach or construct a fake request.
        // However, Better Auth has an 'admin' plugin we are using? 
        // Let's try standard signUpEmail first. If it fails due to missing context, we might need to mock.
        
        // Wait, 'auth.api' methods usually return a response or headers.
        
        const res = await auth.api.signUpEmail({
            body: {
                email,
                password,
                name
            }
        });

        if (!res) {
            throw new Error('Failed to create user (no response)');
        }

        // 2. Fetch the user to get ID (Better Auth might return it, typically inside user object)
        const user = await db.query.user.findFirst({
            where: (users, { eq }) => eq(users.email, email)
        });

        if (!user) {
            throw new Error('User created but not found in database');
        }

        console.log(`User created with ID: ${user.id}`);

        // 3. Update profile role to 'super_admin'
        // The profile should have been created by the auth hook.
        // We act optimistically; if hook failed (unlikely in same process?), we upsert.
        
        await db.insert(profiles).values({
            id: user.id,
            email: user.email,
            role: 'super_admin'
        }).onConflictDoUpdate({
            target: profiles.id,
            set: { role: 'super_admin' }
        });

        console.log(`✅ Successfully promoted ${email} to super_admin!`);
        process.exit(0);

    } catch (e: any) {
        console.error('Error creating superadmin:', e.message || e);
        process.exit(1);
    }
}

main();
