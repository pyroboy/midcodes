-- Create a security definer function to get the user's role safely
-- This bypasses RLS on the profiles table, avoiding recursion or access issues
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Grant execute to authenticated users (needed for the policy to use it)
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- Drop previous attempts
DROP POLICY IF EXISTS "Super Admin Full Access" ON storage.objects;

-- Create the definitive policy using the helper
CREATE POLICY "Super Admin Full Access"
ON storage.objects
FOR ALL
TO authenticated
USING (
  (public.get_my_role() = 'super_admin'::user_role)
  OR (public.get_my_role() = 'id_gen_admin'::user_role)
)
WITH CHECK (
  (public.get_my_role() = 'super_admin'::user_role)
  OR (public.get_my_role() = 'id_gen_admin'::user_role)
);
