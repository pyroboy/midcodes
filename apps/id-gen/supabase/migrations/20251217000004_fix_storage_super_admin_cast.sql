-- Fix the Super Admin policy to use correct enum casting and included id_gen_admin for safety.

DROP POLICY IF EXISTS "Super Admin Full Access" ON storage.objects;

CREATE POLICY "Super Admin Full Access"
ON storage.objects
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (
      -- Explicitly cast to user_role enum
      profiles.role = 'super_admin'::user_role
      OR profiles.role = 'id_gen_admin'::user_role
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (
      profiles.role = 'super_admin'::user_role
      OR profiles.role = 'id_gen_admin'::user_role
    )
  )
);
