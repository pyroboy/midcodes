// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
interface ImportMetaEnv {
	VITE_PUBLIC_SUPABASE_URL: string
	VITE_PUBLIC_SUPABASE_ANON_KEY: string
  }
  
  interface ImportMeta {
	readonly env: ImportMetaEnv
  }

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
