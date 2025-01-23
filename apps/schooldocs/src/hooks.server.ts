// import { createServerClient } from '@supabase/ssr'
// import type { User, Session } from '@supabase/supabase-js'
// import { sequence } from '@sveltejs/kit/hooks'
// import { redirect, error as throwError } from '@sveltejs/kit'
// import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
// import type { Handle } from '@sveltejs/kit'
// // import type { Locals } from '$lib/types'

// export interface GetSessionResult {
//   session: Session | null;
//   error: Error | null;
//   user: User | null;
// }

// declare global {
//   namespace App {
//     interface Locals extends Locals {}
//   }
// }

// const initializeSupabase: Handle = async ({ event, resolve }) => {
//   event.locals.supabase = createServerClient(
//     PUBLIC_SUPABASE_URL,
//     PUBLIC_SUPABASE_ANON_KEY,
//     {
//       cookies: {
//         get: (key) => event.cookies.get(key),
//         set: (key, value, options) => {
//           try {
//             event.cookies.set(key, value, {
//               ...options,
//               path: '/',
//               sameSite: 'lax',
//               secure: process.env.NODE_ENV === 'production'
//             })
//           } catch (error) {
//             console.error('Cookie could not be set:', error)
//           }
//         },
//         remove: (key, options) => {
//           try {
//             event.cookies.delete(key, { path: '/', ...options })
//           } catch (error) {
//             console.error('Cookie could not be removed:', error)
//           }
//         }
//       }
//     }
//   )

//   event.locals.safeGetSession = async () => {
//     const { data: { session }, error } = await event.locals.supabase.auth.getSession()
//     return {
//       session,
//       error,
//       user: session?.user ?? null
//     }
//   }

//   return resolve(event)
// }

// export const handle = sequence(initializeSupabase)