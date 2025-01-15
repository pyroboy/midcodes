declare module "std/http/server.ts" {
  export function serve(handler: (request: Request) => Promise<Response> | Response): void;
}

declare module "@supabase/supabase-js" {
  export interface SupabaseClientOptions {
    auth: {
      autoRefreshToken: boolean;
      persistSession: boolean;
      detectSessionInUrl: boolean;
    };
  }

  export interface QueryBuilder<T> {
    eq(column: string, value: string): QueryBuilder<T>;
    select(columns?: string): QueryBuilder<T>;
    single(): Promise<{ data: T | null; error: Error | null }>;
    maybeSingle(): Promise<{ data: T | null; error: Error | null }>;
    execute(): Promise<{ data: T[]; error: Error | null }>;
  }

  export interface SupabaseClient {
    auth: {
      getUser(jwt: string): Promise<{ data: { user: { id: string } }, error: Error | null }>;
    };
    from<T>(table: string): {
      select(columns?: string): QueryBuilder<T>;
      insert(data: Partial<T>): Promise<{ data: T; error: Error | null }>;
      update(data: Partial<T>): Promise<{ data: T; error: Error | null }>;
    };
  }

  export function createClient(
    url: string, 
    key: string, 
    options: SupabaseClientOptions
  ): SupabaseClient;
}