declare module "https://deno.land/std@0.177.0/http/server.ts" {
    export function serve(handler: (request: Request) => Promise<Response> | Response): void;
  }
  
  declare module "https://esm.sh/@supabase/supabase-js@2.38.4" {
    export * from "@supabase/supabase-js";
  }
  
  // Declare Deno namespace
  declare namespace Deno {
    export interface Env {
      get(key: string): string | undefined;
      set(key: string, value: string): void;
      toObject(): { [key: string]: string };
    }
    export const env: Env;
  }