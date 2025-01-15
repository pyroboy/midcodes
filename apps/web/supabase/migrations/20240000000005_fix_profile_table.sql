-- Create RLS policies for profiles table

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        id = auth.uid()
    );

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (
        id = auth.uid()
    )
    WITH CHECK (
        id = auth.uid()
    );

-- Allow service role to manage all profiles
CREATE POLICY "Service role can manage all profiles"
    ON public.profiles
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create trigger for handling new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Update the default role for new profiles
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user'::user_role;
