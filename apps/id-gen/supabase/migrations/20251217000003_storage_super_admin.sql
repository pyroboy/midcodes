-- Create a policy that allows Super Admins to do ANYTHING on storage.objects
-- This solves the issue where RLS enforces folder ownership (e.g. auth.uid()) but Super Admins need to manage all files.

CREATE POLICY "Super Admin Full Access"
ON storage.objects
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);
