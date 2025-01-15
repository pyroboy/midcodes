-- Enable auth schema and extensions
CREATE SCHEMA IF NOT EXISTS auth;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fix the default role value
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user'::user_role;

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Ensure auth.users table exists (if not already created by Supabase)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'auth' 
    AND table_name = 'users'
  ) THEN
    CREATE TABLE auth.users (
      id uuid NOT NULL PRIMARY KEY,
      email text,
      encrypted_password text,
      email_confirmed_at timestamp with time zone,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now()
    );
  END IF;
END $$;
