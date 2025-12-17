-- Drop existing restrictive update policies
DROP POLICY IF EXISTS "Enable idcard update access based on role" ON "public"."idcards";
DROP POLICY IF EXISTS "Enable template update access based on role" ON "public"."templates";

-- Recreate ID Card Update Policy including org_admin
CREATE POLICY "Enable idcard update access based on role"
ON "public"."idcards"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (
      profiles.role = 'super_admin'::user_role
      OR (
        profiles.role IN ('id_gen_admin'::user_role, 'org_admin'::user_role)
        AND profiles.org_id = idcards.org_id
      )
    )
  )
);

-- Recreate Template Update Policy including org_admin
CREATE POLICY "Enable template update access based on role"
ON "public"."templates"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (
      profiles.role = 'super_admin'::user_role
      OR (
        profiles.role IN ('id_gen_admin'::user_role, 'org_admin'::user_role)
        AND profiles.org_id = templates.org_id
      )
    )
  )
);
