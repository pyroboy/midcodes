-- Add profile_picture_url field to tenants table
ALTER TABLE public.tenants 
ADD COLUMN profile_picture_url TEXT;

-- Add a comment to describe the field
COMMENT ON COLUMN public.tenants.profile_picture_url IS 'URL to tenant profile picture stored in Cloudinary';