import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins/admin";
import { db } from "./db";
import * as schema from "./schema";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: schema.user,
            session: schema.session,
            account: schema.account,
            verification: schema.verification,
        }
    }),
    plugins: [
        admin()
    ],
    emailAndPassword: {
        enabled: true
    },
    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    await db.insert(schema.profiles).values({
                        id: user.id,
                        email: user.email,
                    });
                },
            },
        },
    },
});
