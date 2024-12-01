| schema   | table_name                 | definition_and_policies                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| auth     | audit_log_entries          | CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) NOT NULL DEFAULT ''::character varying
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| auth     | flow_state                 | CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| auth     | identities                 | CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text DEFAULT lower((identity_data ->> 'email'::text)),
    id uuid NOT NULL DEFAULT gen_random_uuid()
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| auth     | instances                  | CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| auth     | mfa_amr_claims             | CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| auth     | mfa_challenges             | CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| auth     | mfa_factors                | CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| auth     | one_time_tokens            | CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    updated_at timestamp without time zone NOT NULL DEFAULT now()
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| auth     | refresh_tokens             | CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass),
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| auth     | role_emulation_sessions    | CREATE TABLE auth.role_emulation_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    original_role user_role NOT NULL,
    emulated_role user_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone NOT NULL,
    status auth.emulation_status DEFAULT 'active'::auth.emulation_status,
    metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE auth.role_emulation_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own role emulations" ON auth.role_emulation_sessions
    AS PERMISSIVE
    FOR r
    TO authenticated
    USING ((auth.uid() = user_id));

ALTER TABLE auth.role_emulation_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create role emulations if authorized" ON auth.role_emulation_sessions
    AS PERMISSIVE
    FOR a
    TO authenticated
    USING ()
    WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'super_admin'::user_role)))));

ALTER TABLE auth.role_emulation_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own emulation sessions" ON auth.role_emulation_sessions
    AS PERMISSIVE
    FOR r
    TO authenticated
    USING (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'super_admin'::user_role))))));                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| auth     | saml_providers             | CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| auth     | saml_relay_states          | CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| auth     | schema_migrations          | CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| auth     | sessions                   | CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| auth     | sso_domains                | CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| auth     | sso_providers              | CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| auth     | users                      | CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone DEFAULT LEAST(email_confirmed_at, phone_confirmed_at),
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean NOT NULL DEFAULT false,
    deleted_at timestamp with time zone,
    is_anonymous boolean NOT NULL DEFAULT false
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| pgsodium | key                        | CREATE TABLE pgsodium.key (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    status pgsodium.key_status DEFAULT 'valid'::pgsodium.key_status,
    created timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires timestamp with time zone,
    key_type pgsodium.key_type,
    key_id bigint DEFAULT nextval('pgsodium.key_key_id_seq'::regclass),
    key_context bytea DEFAULT '\x7067736f6469756d'::bytea,
    name text,
    associated_data text DEFAULT 'associated'::text,
    raw_key bytea,
    raw_key_nonce bytea,
    parent_key uuid,
    comment text,
    user_data text
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| public   | attendees                  | CREATE TABLE public.attendees (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    basic_info jsonb DEFAULT '{}'::jsonb,
    event_id uuid NOT NULL,
    ticket_info jsonb DEFAULT '{}'::jsonb,
    is_paid boolean DEFAULT false,
    is_printed boolean DEFAULT false,
    received_by uuid,
    qr_link text,
    reference_code_url text,
    attendance_status text DEFAULT 'notRegistered'::text,
    qr_scan_info jsonb[] DEFAULT '{}'::jsonb[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    org_id uuid NOT NULL
);

ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view their own registrations" ON public.attendees
    AS PERMISSIVE
    FOR r
    TO unknown (OID=0)
    USING ((EXISTS ( SELECT 1
   FROM events
  WHERE ((events.id = attendees.event_id) AND (events.is_public = true)))));

ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all attendees" ON public.attendees
    AS PERMISSIVE
    FOR r
    TO authenticated
    USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role = 'super_admin'::user_role) OR ((profiles.org_id = attendees.org_id) AND (profiles.role = ANY (ARRAY['org_admin'::user_role, 'event_admin'::user_role]))))))));

ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can register for public events" ON public.attendees
    AS PERMISSIVE
    FOR a
    TO unknown (OID=0)
    USING ()
    WITH CHECK ((EXISTS ( SELECT 1
   FROM events
  WHERE ((events.id = attendees.event_id) AND (events.is_public = true)))));

ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can update attendees" ON public.attendees
    AS PERMISSIVE
    FOR w
    TO authenticated
    USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role = 'super_admin'::user_role) OR ((profiles.org_id = attendees.org_id) AND (profiles.role = ANY (ARRAY['org_admin'::user_role, 'event_admin'::user_role]))))))));

ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can delete attendees" ON public.attendees
    AS PERMISSIVE
    FOR d
    TO authenticated
    USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role = 'super_admin'::user_role) OR ((profiles.org_id = attendees.org_id) AND (profiles.role = ANY (ARRAY['org_admin'::user_role, 'event_admin'::user_role])))))))); |
| public   | events                     | CREATE TABLE public.events (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    event_name text NOT NULL,
    event_long_name text,
    event_url text,
    other_info jsonb DEFAULT '{}'::jsonb,
    ticketing_data jsonb[] DEFAULT '{}'::jsonb[],
    is_public boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid NOT NULL,
    org_id uuid NOT NULL
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view event_url of public events" ON public.events
    AS PERMISSIVE
    FOR r
    TO unknown (OID=0)
    USING (is_public);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events are viewable based on is_public flag and org membership" ON public.events
    AS PERMISSIVE
    FOR r
    TO authenticated
    USING ((is_public OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role = 'super_admin'::user_role) OR ((profiles.org_id = events.org_id) AND (profiles.role = ANY (ARRAY['org_admin'::user_role, 'event_admin'::user_role, 'user'::user_role])))))))));

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create events for their organization" ON public.events
    AS PERMISSIVE
    FOR a
    TO authenticated
    USING ()
    WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.org_id = events.org_id) AND (profiles.role = ANY (ARRAY['super_admin'::user_role, 'org_admin'::user_role, 'event_admin'::user_role]))))));

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events are updatable by admins" ON public.events
    AS PERMISSIVE
    FOR w
    TO authenticated
    USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role = 'super_admin'::user_role) OR ((profiles.org_id = events.org_id) AND (profiles.role = ANY (ARRAY['org_admin'::user_role, 'event_admin'::user_role]))))))));

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events are deletable by admins" ON public.events
    AS PERMISSIVE
    FOR d
    TO authenticated
    USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role = 'super_admin'::user_role) OR ((profiles.org_id = events.org_id) AND (profiles.role = ANY (ARRAY['org_admin'::user_role, 'event_admin'::user_role]))))))));                                                                                 |
| public   | idcards                    | CREATE TABLE public.idcards (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    template_id uuid,
    front_image text,
    back_image text,
    data jsonb,
    created_at timestamp with time zone DEFAULT now(),
    org_id uuid NOT NULL
);

ALTER TABLE public.idcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all authenticated users" ON public.idcards
    AS PERMISSIVE
    FOR r
    TO authenticated
    USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role = 'super_admin'::user_role) OR ((profiles.role = 'org_admin'::user_role) AND (profiles.org_id = idcards.org_id)) OR ((profiles.role = 'user'::user_role) AND (profiles.org_id = idcards.org_id)))))));

ALTER TABLE public.idcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable insert access based on role" ON public.idcards
    AS PERMISSIVE
    FOR a
    TO authenticated
    USING ()
    WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role = 'super_admin'::user_role) OR ((profiles.role = 'org_admin'::user_role) AND (profiles.org_id = idcards.org_id)) OR ((profiles.role = 'user'::user_role) AND (profiles.org_id = idcards.org_id)))))));

ALTER TABLE public.idcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable update access based on role" ON public.idcards
    AS PERMISSIVE
    FOR w
    TO authenticated
    USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role = 'super_admin'::user_role) OR ((profiles.role = 'org_admin'::user_role) AND (profiles.org_id = idcards.org_id)) OR ((profiles.role = 'user'::user_role) AND (profiles.org_id = idcards.org_id)))))));

ALTER TABLE public.idcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable delete access based on role" ON public.idcards
    AS PERMISSIVE
    FOR d
    TO authenticated
    USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role = 'super_admin'::user_role) OR ((profiles.role = 'org_admin'::user_role) AND (profiles.org_id = idcards.org_id)))))));                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| public   | organizations              | CREATE TABLE public.organizations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organizations are viewable by authenticated users" ON public.organizations
    AS PERMISSIVE
    FOR r
    TO authenticated
    USING (true);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organizations are insertable by super admin" ON public.organizations
    AS PERMISSIVE
    FOR a
    TO authenticated
    USING ()
    WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'super_admin'::user_role)))));

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organizations are updatable by super admin" ON public.organizations
    AS PERMISSIVE
    FOR w
    TO authenticated
    USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'super_admin'::user_role)))));

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organizations are deletable by super admin" ON public.organizations
    AS PERMISSIVE
    FOR d
    TO authenticated
    USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'super_admin'::user_role)))));                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| public   | profiles                   | CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text,
    role user_role DEFAULT 'user'::user_role,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    org_id uuid
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by users based on role" ON public.profiles
    AS PERMISSIVE
    FOR r
    TO authenticated
    USING (
CASE
    WHEN ((auth.jwt() ->> 'role'::text) = 'super_admin'::text) THEN true
    ELSE (auth.uid() = id)
END);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can delete profile based on role" ON public.profiles
    AS PERMISSIVE
    FOR d
    TO authenticated
    USING (
CASE
    WHEN ((auth.jwt() ->> 'role'::text) = 'super_admin'::text) THEN true
    ELSE (auth.uid() = id)
END);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own profile" ON public.profiles
    AS PERMISSIVE
    FOR a
    TO authenticated
    USING ()
    WITH CHECK ((auth.uid() = id));

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can update profile based on role" ON public.profiles
    AS PERMISSIVE
    FOR w
    TO authenticated
    USING (
CASE
    WHEN ((auth.jwt() ->> 'role'::text) = 'super_admin'::text) THEN true
    ELSE (auth.uid() = id)
END);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| public   | templates                  | CREATE TABLE public.templates (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid,
    name text NOT NULL,
    front_background text,
    back_background text,
    orientation text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    template_elements jsonb NOT NULL,
    org_id uuid
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable template delete access based on role" ON public.templates
    AS PERMISSIVE
    FOR d
    TO authenticated
    USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role = 'super_admin'::user_role) OR ((profiles.role = 'org_admin'::user_role) AND (profiles.org_id = templates.org_id)))))));

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable template insert access based on role" ON public.templates
    AS PERMISSIVE
    FOR a
    TO authenticated
    USING ()
    WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role = 'super_admin'::user_role) OR ((profiles.role = ANY (ARRAY['org_admin'::user_role, 'user'::user_role])) AND (profiles.org_id = templates.org_id) AND (templates.org_id IS NOT NULL)))))));

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable template read access based on role" ON public.templates
    AS PERMISSIVE
    FOR r
    TO authenticated
    USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role = 'super_admin'::user_role) OR ((profiles.role = ANY (ARRAY['org_admin'::user_role, 'user'::user_role])) AND (profiles.org_id = templates.org_id)))))));

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable template update access based on role" ON public.templates
    AS PERMISSIVE
    FOR w
    TO authenticated
    USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role = 'super_admin'::user_role) OR ((profiles.role = ANY (ARRAY['org_admin'::user_role, 'user'::user_role])) AND (profiles.org_id = templates.org_id)))))));                                                                                                                                                                                                                                                                                                                                                        |
| realtime | schema_migrations          | CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| realtime | subscription               | CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] NOT NULL DEFAULT '{}'::realtime.user_defined_filter[],
    claims jsonb NOT NULL,
    claims_role regrole NOT NULL DEFAULT realtime.to_regrole((claims ->> 'role'::text)),
    created_at timestamp without time zone NOT NULL DEFAULT timezone('utc'::text, now())
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| storage  | buckets                    | CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text
);

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable insert for authenticated users only" ON storage.buckets
    AS PERMISSIVE
    FOR a
    TO authenticated
    USING ()
    WITH CHECK (true);

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
CREATE POLICY public_buckets ON storage.buckets
    AS PERMISSIVE
    FOR r
    TO unknown (OID=0)
    USING (true);

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to use all buckets" ON storage.buckets
    AS PERMISSIVE
    FOR A
    TO authenticated
    USING ((auth.role() = 'authenticated'::text));                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| storage  | migrations                 | CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| storage  | objects                    | CREATE TABLE storage.objects (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] DEFAULT string_to_array(name, '/'::text),
    version text,
    owner_id text,
    user_metadata jsonb
);

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read rendered-id-cards" ON storage.objects
    AS PERMISSIVE
    FOR r
    TO authenticated
    USING ((auth.role() = 'authenticated'::text));

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to write rendered-id-cards" ON storage.objects
    AS PERMISSIVE
    FOR a
    TO authenticated
    USING ()
    WITH CHECK ((auth.role() = 'authenticated'::text));

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous reads" ON storage.objects
    AS PERMISSIVE
    FOR r
    TO anon
    USING (((bucket_id = 'templates'::text) AND (auth.uid() IS NOT NULL)));

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous users to read template files" ON storage.objects
    AS PERMISSIVE
    FOR r
    TO anon
    USING ((bucket_id = 'templates'::text));

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated uploads" ON storage.objects
    AS PERMISSIVE
    FOR a
    TO authenticated
    USING ()
    WITH CHECK (((bucket_id = 'templates'::text) AND (auth.uid() IS NOT NULL)));

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow authorized insert m2ctvr_0" ON storage.objects
    AS PERMISSIVE
    FOR a
    TO authenticated
    USING ()
    WITH CHECK (((bucket_id = 'id-card-uploads'::text) AND (auth.uid() IS NOT NULL)));

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read and write id-card-uploads" ON storage.objects
    AS PERMISSIVE
    FOR A
    TO authenticated
    USING (((bucket_id = 'id-card-uploads'::text) AND (auth.role() = 'authenticated'::text)))
    WITH CHECK (((bucket_id = 'id-card-uploads'::text) AND (auth.role() = 'authenticated'::text)));                                                                                                                                                                                          |
| storage  | s3_multipart_uploads       | CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint NOT NULL DEFAULT 0,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL,
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    user_metadata jsonb
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| storage  | s3_multipart_uploads_parts | CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    upload_id text NOT NULL,
    size bigint NOT NULL DEFAULT 0,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL,
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| vault    | secrets                    | CREATE TABLE vault.secrets (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text,
    description text NOT NULL DEFAULT ''::text,
    secret text NOT NULL,
    key_id uuid DEFAULT (pgsodium.create_key()).id,
    nonce bytea DEFAULT pgsodium.crypto_aead_det_noncegen(),
    created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |