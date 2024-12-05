-- Enable Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_emulation_sessions ENABLE ROW LEVEL SECURITY;

-- Helper function to get current role considering emulation
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_role user_role;
BEGIN
  SELECT 
    COALESCE(
      (
        SELECT emulated_role 
        FROM role_emulation_sessions 
        WHERE user_id = auth.uid() 
        AND status = 'active' 
        AND expires_at > now()
        ORDER BY created_at DESC 
        LIMIT 1
      ),
      (SELECT role FROM profiles WHERE id = auth.uid())
    ) INTO current_role;
  RETURN current_role;
END;
$$;

-- Helper function to get current org_id considering emulation
CREATE OR REPLACE FUNCTION public.get_current_org_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_org_id uuid;
BEGIN
  SELECT 
    COALESCE(
      (
        SELECT emulated_org_id 
        FROM role_emulation_sessions 
        WHERE user_id = auth.uid() 
        AND status = 'active' 
        AND expires_at > now()
        ORDER BY created_at DESC 
        LIMIT 1
      ),
      (SELECT org_id FROM profiles WHERE id = auth.uid())
    ) INTO current_org_id;
  RETURN current_org_id;
END;
$$;

-- Create policies for role_emulation_sessions
CREATE POLICY "Users can view their own role emulation sessions"
ON public.role_emulation_sessions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'::user_role
  )
);

CREATE POLICY "Users can create role emulation sessions"
ON public.role_emulation_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (
      -- Super admins can emulate any role
      profiles.role = 'super_admin'::user_role OR
      -- Org admins can emulate roles within their org
      (profiles.role = 'org_admin'::user_role AND
       NEW.emulated_role IN ('event_admin'::user_role, 'event_qr_checker'::user_role) AND
       NEW.emulated_org_id = profiles.org_id)
    )
  )
);

CREATE POLICY "Users can update their own role emulation sessions"
ON public.role_emulation_sessions
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'::user_role
  )
);

-- Create policies for organizations
CREATE POLICY "Organizations are viewable by authenticated users"
ON public.organizations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Organizations are insertable by super admin"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_current_role() = 'super_admin'::user_role
);

CREATE POLICY "Organizations are updatable by super admin"
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  public.get_current_role() = 'super_admin'::user_role
);

CREATE POLICY "Organizations are deletable by super admin"
ON public.organizations
FOR DELETE
TO authenticated
USING (
  public.get_current_role() = 'super_admin'::user_role
);

-- Create policies for profiles
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles are viewable by users based on role"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  CASE
    WHEN public.get_current_role() = 'super_admin'::user_role THEN true
    WHEN public.get_current_role() = 'org_admin'::user_role THEN
      org_id = public.get_current_org_id()
    ELSE auth.uid() = id
  END
);

CREATE POLICY "Users can update profile based on role"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  CASE
    WHEN public.get_current_role() = 'super_admin'::user_role THEN true
    WHEN public.get_current_role() = 'org_admin'::user_role THEN
      org_id = public.get_current_org_id()
    ELSE auth.uid() = id
  END
);

CREATE POLICY "Users can delete profile based on role"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  CASE
    WHEN public.get_current_role() = 'super_admin'::user_role THEN true
    WHEN public.get_current_role() = 'org_admin'::user_role THEN
      org_id = public.get_current_org_id()
    ELSE auth.uid() = id
  END
);

-- Create policies for events
CREATE POLICY "Events are viewable based on is_public flag and org membership"
ON public.events
FOR SELECT
TO authenticated
USING (
  is_public OR
  CASE
    WHEN public.get_current_role() = 'super_admin'::user_role THEN true
    ELSE org_id = public.get_current_org_id()
  END
);

CREATE POLICY "Users can create events for their organization"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (
  CASE
    WHEN public.get_current_role() = 'super_admin'::user_role THEN true
    WHEN public.get_current_role() IN ('org_admin'::user_role, 'event_admin'::user_role) THEN
      org_id = public.get_current_org_id()
    ELSE false
  END
);

CREATE POLICY "Events are updatable by admins"
ON public.events
FOR UPDATE
TO authenticated
USING (
  CASE
    WHEN public.get_current_role() = 'super_admin'::user_role THEN true
    WHEN public.get_current_role() IN ('org_admin'::user_role, 'event_admin'::user_role) THEN
      org_id = public.get_current_org_id()
    ELSE false
  END
);

CREATE POLICY "Events are deletable by admins"
ON public.events
FOR DELETE
TO authenticated
USING (
  CASE
    WHEN public.get_current_role() = 'super_admin'::user_role THEN true
    WHEN public.get_current_role() IN ('org_admin'::user_role, 'event_admin'::user_role) THEN
      org_id = public.get_current_org_id()
    ELSE false
  END
);

-- Create policies for attendees
CREATE POLICY "Attendees are viewable by event admins"
ON public.attendees
FOR SELECT
TO authenticated
USING (
  CASE
    WHEN public.get_current_role() = 'super_admin'::user_role THEN true
    WHEN public.get_current_role() IN ('org_admin'::user_role, 'event_admin'::user_role, 'event_qr_checker'::user_role) THEN
      EXISTS (
        SELECT 1 FROM events
        WHERE events.id = attendees.event_id
        AND events.org_id = public.get_current_org_id()
      )
    ELSE false
  END
);

CREATE POLICY "Attendees are insertable by event admins"
ON public.attendees
FOR INSERT
TO authenticated
WITH CHECK (
  CASE
    WHEN public.get_current_role() = 'super_admin'::user_role THEN true
    WHEN public.get_current_role() IN ('org_admin'::user_role, 'event_admin'::user_role) THEN
      EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_id
        AND events.org_id = public.get_current_org_id()
      )
    ELSE false
  END
);

CREATE POLICY "Attendees are updatable by event admins"
ON public.attendees
FOR UPDATE
TO authenticated
USING (
  CASE
    WHEN public.get_current_role() = 'super_admin'::user_role THEN true
    WHEN public.get_current_role() IN ('org_admin'::user_role, 'event_admin'::user_role, 'event_qr_checker'::user_role) THEN
      EXISTS (
        SELECT 1 FROM events
        WHERE events.id = attendees.event_id
        AND events.org_id = public.get_current_org_id()
      )
    ELSE false
  END
);

CREATE POLICY "Attendees are deletable by event admins"
ON public.attendees
FOR DELETE
TO authenticated
USING (
  CASE
    WHEN public.get_current_role() = 'super_admin'::user_role THEN true
    WHEN public.get_current_role() IN ('org_admin'::user_role, 'event_admin'::user_role) THEN
      EXISTS (
        SELECT 1 FROM events
        WHERE events.id = attendees.event_id
        AND events.org_id = public.get_current_org_id()
      )
    ELSE false
  END
);

-- Create policies for templates
CREATE POLICY "Templates are viewable by org members"
ON public.templates
FOR SELECT
TO authenticated
USING (
  CASE
    WHEN public.get_current_role() = 'super_admin'::user_role THEN true
    ELSE org_id = public.get_current_org_id()
  END
);

CREATE POLICY "Templates are insertable by admins"
ON public.templates
FOR INSERT
TO authenticated
WITH CHECK (
  CASE
    WHEN public.get_current_role() = 'super_admin'::user_role THEN true
    WHEN public.get_current_role() IN ('org_admin'::user_role) THEN
      org_id = public.get_current_org_id()
    ELSE false
  END
);

CREATE POLICY "Templates are updatable by admins"
ON public.templates
FOR UPDATE
TO authenticated
USING (
  CASE
    WHEN public.get_current_role() = 'super_admin'::user_role THEN true
    WHEN public.get_current_role() IN ('org_admin'::user_role) THEN
      org_id = public.get_current_org_id()
    ELSE false
  END
);

CREATE POLICY "Templates are deletable by admins"
ON public.templates
FOR DELETE
TO authenticated
USING (
  CASE
    WHEN public.get_current_role() = 'super_admin'::user_role THEN true
    WHEN public.get_current_role() IN ('org_admin'::user_role) THEN
      org_id = public.get_current_org_id()
    ELSE false
  END
);

-- Create policies for idcards
CREATE POLICY "ID cards are viewable by org members"
ON public.idcards
FOR SELECT
TO authenticated
USING (
  CASE
    WHEN public.get_current_role() = 'super_admin'::user_role THEN true
    ELSE EXISTS (
      SELECT 1 FROM events
      WHERE events.id = idcards.event_id
      AND events.org_id = public.get_current_org_id()
    )
  END
);

CREATE POLICY "ID cards are insertable by event admins"
ON public.idcards
FOR INSERT
TO authenticated
WITH CHECK (
  CASE
    WHEN public.get_current_role() = 'super_admin'::user_role THEN true
    WHEN public.get_current_role() IN ('org_admin'::user_role, 'event_admin'::user_role) THEN
      EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_id
        AND events.org_id = public.get_current_org_id()
      )
    ELSE false
  END
);

CREATE POLICY "ID cards are updatable by event admins"
ON public.idcards
FOR UPDATE
TO authenticated
USING (
  CASE
    WHEN public.get_current_role() = 'super_admin'::user_role THEN true
    WHEN public.get_current_role() IN ('org_admin'::user_role, 'event_admin'::user_role) THEN
      EXISTS (
        SELECT 1 FROM events
        WHERE events.id = idcards.event_id
        AND events.org_id = public.get_current_org_id()
      )
    ELSE false
  END
);

CREATE POLICY "ID cards are deletable by event admins"
ON public.idcards
FOR DELETE
TO authenticated
USING (
  CASE
    WHEN public.get_current_role() = 'super_admin'::user_role THEN true
    WHEN public.get_current_role() IN ('org_admin'::user_role, 'event_admin'::user_role) THEN
      EXISTS (
        SELECT 1 FROM events
        WHERE events.id = idcards.event_id
        AND events.org_id = public.get_current_org_id()
      )
    ELSE false
  END
);
