-- Create RLS policies for role_emulation_sessions table

-- Allow users to view their own emulation sessions
CREATE POLICY "Users can view own emulation sessions"
    ON public.role_emulation_sessions
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
    );

-- Allow users to create their own emulation sessions
CREATE POLICY "Users can create own emulation sessions"
    ON public.role_emulation_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid()
    );

-- Allow users to update their own emulation sessions
CREATE POLICY "Users can update own emulation sessions"
    ON public.role_emulation_sessions
    FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid()
    )
    WITH CHECK (
        user_id = auth.uid()
    );

-- Allow service role to manage all emulation sessions
CREATE POLICY "Service role can manage all emulation sessions"
    ON public.role_emulation_sessions
    TO service_role
    USING (true)
    WITH CHECK (true);
