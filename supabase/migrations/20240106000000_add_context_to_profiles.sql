-- Add context column to profiles table
ALTER TABLE public.profiles
ADD COLUMN context jsonb DEFAULT '{}'::jsonb;

-- Create a trigger function to validate context values
CREATE OR REPLACE FUNCTION public.validate_profile_context()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only allow super_admin to modify context
  IF TG_OP IN ('INSERT', 'UPDATE') AND 
     OLD.context IS DISTINCT FROM NEW.context AND
     NOT EXISTS (
       SELECT 1 FROM profiles
       WHERE id = auth.uid()
       AND role = 'super_admin'::user_role
     )
  THEN
    RAISE EXCEPTION 'Only super_admin can modify context';
  END IF;

  -- Check if context is a valid JSON object or null
  IF NEW.context IS NOT NULL AND jsonb_typeof(NEW.context) != 'object' THEN
    RAISE EXCEPTION 'context must be a JSON object or null';
  END IF;

  -- If context is an object, validate its values
  IF NEW.context IS NOT NULL AND jsonb_typeof(NEW.context) = 'object' THEN
    -- Check for null or undefined values in context
    IF EXISTS (
      SELECT 1
      FROM jsonb_each(NEW.context) AS t(key, value)
      WHERE t.value IS NULL OR t.value = 'null'::jsonb
    ) THEN
      RAISE EXCEPTION 'context properties cannot be null';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to validate context on insert or update
CREATE TRIGGER validate_profile_context
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_context();

-- Update get_current_context function to handle both profile and emulation contexts
CREATE OR REPLACE FUNCTION public.get_current_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_context jsonb;
BEGIN
  SELECT 
    COALESCE(
      (
        SELECT metadata 
        FROM role_emulation_sessions 
        WHERE user_id = auth.uid() 
        AND status = 'active' 
        AND expires_at > now()
        ORDER BY created_at DESC 
        LIMIT 1
      ),
      (SELECT context FROM profiles WHERE id = auth.uid()),
      '{}'::jsonb
    ) INTO current_context;
  RETURN current_context;
END;
$$;

-- Comment on the new column
COMMENT ON COLUMN public.profiles.context IS 'User context data that follows the same validation rules as role emulation context. Only modifiable by super_admin.';
