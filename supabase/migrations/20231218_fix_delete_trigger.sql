-- Drop the old trigger first
DROP TRIGGER IF EXISTS delete_template_cascade ON templates;

-- Drop the old function
DROP FUNCTION IF EXISTS delete_template_elements();

-- Create new function that sets template_id to NULL in idcards
CREATE OR REPLACE FUNCTION delete_template_cascade()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Set template_id to NULL in idcards
  UPDATE idcards SET template_id = NULL WHERE template_id = OLD.id;
  
  RETURN OLD;
END;
$function$;

-- Create new trigger
CREATE TRIGGER delete_template_cascade
    BEFORE DELETE ON public.templates
    FOR EACH ROW
    EXECUTE FUNCTION delete_template_cascade();
