-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE public.user_role AS ENUM (
    'super_admin',
    'org_admin',
    'user',
    'event_admin',
    'event_qr_checker'
);

-- Create utility functions
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Create base tables
CREATE TABLE public.organizations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT organizations_pkey PRIMARY KEY (id)
);

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text,
    role user_role DEFAULT 'user'::user_role,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    org_id uuid REFERENCES public.organizations(id),
    CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

CREATE TABLE public.events (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    event_name text NOT NULL,
    event_long_name text,
    event_url text,
    other_info jsonb DEFAULT '{}'::jsonb,
    ticketing_data jsonb[] DEFAULT '{}'::jsonb[],
    is_public boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid NOT NULL REFERENCES public.profiles(id),
    org_id uuid NOT NULL REFERENCES public.organizations(id),
    CONSTRAINT events_pkey PRIMARY KEY (id)
);

CREATE TABLE public.attendees (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    basic_info jsonb DEFAULT '{}'::jsonb,
    event_id uuid NOT NULL REFERENCES public.events(id),
    ticket_info jsonb DEFAULT '{}'::jsonb,
    is_paid boolean DEFAULT false,
    is_printed boolean DEFAULT false,
    received_by uuid REFERENCES public.profiles(id),
    qr_link text,
    reference_code_url text,
    attendance_status text DEFAULT 'notRegistered'::text,
    qr_scan_info jsonb[] DEFAULT '{}'::jsonb[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    org_id uuid NOT NULL REFERENCES public.organizations(id),
    CONSTRAINT attendees_pkey PRIMARY KEY (id)
);

CREATE TABLE public.templates (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.profiles(id),
    name text NOT NULL,
    front_background text,
    back_background text,
    orientation text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    template_elements jsonb NOT NULL,
    org_id uuid REFERENCES public.organizations(id),
    CONSTRAINT templates_pkey PRIMARY KEY (id)
);

CREATE TABLE public.idcards (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    template_id uuid REFERENCES public.templates(id),
    front_image text,
    back_image text,
    data jsonb,
    created_at timestamp with time zone DEFAULT now(),
    org_id uuid NOT NULL REFERENCES public.organizations(id),
    CONSTRAINT idcards_pkey PRIMARY KEY (id)
);

CREATE TABLE public.role_emulation_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id),
    original_role user_role NOT NULL,
    emulated_role user_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone NOT NULL,
    status text DEFAULT 'active'::text,
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT role_emulation_sessions_pkey PRIMARY KEY (id)
);

-- Create functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
begin
  insert into public.profiles (id, role)
  values (new.id, 'user');
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_effective_role(user_uuid uuid)
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    effective_role user_role;
BEGIN
    -- Check for active emulation
    SELECT emulated_role INTO effective_role
    FROM public.role_emulation_sessions
    WHERE user_id = user_uuid
        AND status = 'active'
        AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;

    -- If no active emulation, return original role
    IF effective_role IS NULL THEN
        SELECT role INTO effective_role
        FROM public.profiles
        WHERE id = user_uuid;
    END IF;

    RETURN effective_role;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_template_org_id()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role != 'super_admin'::user_role 
    AND NEW.org_id IS NULL
  ) THEN
    RAISE EXCEPTION 'org_id is required for non-super_admin users';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_template_elements()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Delete related id_cards
  DELETE FROM id_cards WHERE template_id = OLD.id;
  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_template_by_id(p_template_id uuid, p_user_id uuid)
RETURNS SETOF templates
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
begin
  return query
  select *
  from templates
  where id = p_template_id
  and user_id = p_user_id;
end;
$function$;

-- Create views
CREATE VIEW public.public_events AS
SELECT 
    events.id,
    events.event_name,
    events.event_long_name,
    events.event_url,
    events.other_info,
    events.ticketing_data,
    events.is_public,
    events.org_id,
    organizations.name AS organization_name
FROM events
JOIN organizations ON events.org_id = organizations.id
WHERE events.is_public = true;

-- Create triggers
CREATE TRIGGER update_organizations_modtime
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER delete_template_cascade
    BEFORE DELETE ON public.templates
    FOR EACH ROW
    EXECUTE FUNCTION delete_template_elements();

CREATE TRIGGER enforce_template_org_id
    BEFORE INSERT OR UPDATE ON public.templates
    FOR EACH ROW
    EXECUTE FUNCTION check_template_org_id();

CREATE TRIGGER update_template_modtime
    BEFORE UPDATE ON public.templates
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
