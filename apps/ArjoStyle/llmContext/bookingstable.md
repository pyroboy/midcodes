-- Create the bookings table
CREATE TABLE public.bookings (
    -- Core Columns
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the booking
    created_at timestamp with time zone DEFAULT now() NOT NULL, -- When the booking request was submitted
    status text DEFAULT 'Pending'::text NOT NULL, -- Booking status: Pending, Confirmed, Rejected, Completed, Needs Info

    -- Personal Info
    name text NOT NULL,
    email text NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'), -- Basic email format check
    phone text NOT NULL,
    dob date, -- Date of birth (YYYY-MM-DD)
    preferred_contact text, -- sms, call, whatsapp, email, etc.
    instagram_handle text, -- Optional
    facebook_profile text, -- Optional

    -- Tattoo Details
    category text, -- e.g., Arms, Legs, Torso Front
    placement text, -- e.g., Inner Bicep, Forearm, Sternum
    tattoo_size numeric, -- Approximate size in inches (using numeric for potential decimals)
    is_color boolean DEFAULT false NOT NULL,
    is_cover_up boolean DEFAULT false NOT NULL,
    complexity integer CHECK (complexity BETWEEN 1 AND 3), -- 1: Simple, 2: Detailed, 3: Intricate
    creative_freedom integer CHECK (creative_freedom BETWEEN 0 AND 100), -- 0-100 percentage

    -- Notes & Requirements
    specific_reqs text, -- Description of the tattoo idea
    must_haves text, -- Specific elements that must be included
    color_prefs text, -- Notes on color choices
    placement_notes text, -- Specific notes about the placement area

    -- Scheduling
    requested_date timestamp with time zone, -- Requested appointment date (stores date and potentially time zone info)
    requested_time text, -- Requested appointment time (e.g., "2:00 PM") stored as text
    artist_preference text, -- Optional preferred artist name

    -- Estimates & Pricing
    estimated_duration integer, -- Estimated duration in minutes
    estimated_sessions integer, -- Estimated number of sessions
    pricing_details jsonb, -- Store the pricing breakdown { basePrice, ..., total }

    -- References
    reference_image_urls jsonb, -- Store array of { url, name } or { public_id, name } objects

    -- Agreements
    terms_agreed boolean DEFAULT false NOT NULL,
    medical_confirmed boolean DEFAULT false NOT NULL,
    age_confirmed boolean DEFAULT false NOT NULL

    -- Optional: Add a user_id column if you link bookings to authenticated users
    -- user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add comments to columns for clarity (optional but recommended)
COMMENT ON COLUMN public.bookings.status IS 'Booking status: Pending, Confirmed, Rejected, Completed, Needs Info';
COMMENT ON COLUMN public.bookings.dob IS 'Date of birth (YYYY-MM-DD)';
COMMENT ON COLUMN public.bookings.tattoo_size IS 'Approximate size in inches';
COMMENT ON COLUMN public.bookings.complexity IS '1: Simple, 2: Detailed, 3: Intricate';
COMMENT ON COLUMN public.bookings.creative_freedom IS '0-100 percentage';
COMMENT ON COLUMN public.bookings.requested_date IS 'Requested appointment date (timestamp with time zone)';
COMMENT ON COLUMN public.bookings.requested_time IS 'Requested appointment time (e.g., "2:00 PM")';
COMMENT ON COLUMN public.bookings.estimated_duration IS 'Estimated duration in minutes';
COMMENT ON COLUMN public.bookings.pricing_details IS 'Stores pricing breakdown: { basePrice, complexityPrice, placementPrice, colorPrice, coverUpPrice, total }';
COMMENT ON COLUMN public.bookings.reference_image_urls IS 'Array of reference image objects, e.g., [{ url, name }] or [{ public_id, name }]';

-- Enable Row Level Security (IMPORTANT FOR SECURITY)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create Basic RLS Policies (EXAMPLES - **ADJUST THESE TO YOUR ACTUAL NEEDS**)

-- Example 1: Allow Admin Users (assuming you have a way to identify admins, e.g., custom claim or metadata)
-- Replace 'admin' with your actual role identification method. This requires you set up roles/claims.
-- CREATE POLICY "Allow admin full access" ON public.bookings
-- FOR ALL
-- TO authenticated -- Or specific admin role
-- USING (auth.jwt() ->> 'user_role' = 'admin') -- Example using a custom JWT claim 'user_role'
-- WITH CHECK (auth.jwt() ->> 'user_role' = 'admin');

-- Example 2: Allow Authenticated Users to Read/Update *Their Own* Bookings (if linking to users)
-- Requires a user_id column linked to auth.users
-- CREATE POLICY "Allow users to manage their own bookings" ON public.bookings
-- FOR SELECT, UPDATE
-- TO authenticated
-- USING (auth.uid() = user_id)
-- WITH CHECK (auth.uid() = user_id);

-- Example 3: *TEMPORARY* Policy for Testing Script Inserts (if needed)
-- This allows the anonymous key used by the script to insert. **REMOVE or SECURE this for production.**
CREATE POLICY "Allow anon inserts for testing" ON public.bookings
FOR INSERT
TO anon -- The role used by the ANON_KEY
WITH CHECK (true); -- Allows any insert by anon key

-- Example 4: Allow Admin Role (created via dashboard or SQL) to do everything
-- CREATE POLICY "Allow admin role full access" ON public.bookings
-- FOR ALL
-- TO authenticated -- Or a specific role name if you created one like 'service_role' or 'admin_role'
-- USING (is_claims_admin()) -- If using Supabase built-in admin claims via Gotrue settings
-- WITH CHECK (is_claims_admin());


-- Grant usage permissions on the table to roles (anon, authenticated)
-- Adjust these grants based on your RLS policies and needs.
-- Granting SELECT to anon might be needed if you display *any* booking info publicly (unlikely)
-- GRANT SELECT ON TABLE public.bookings TO anon; -- Likely not needed/wanted
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.bookings TO authenticated; -- Example: Allow logged-in users basic access (RLS controls *what* they can access)
GRANT ALL ON TABLE public.bookings TO service_role; -- The service_role key bypasses RLS


-- Grant permissions for the sequence used by the default ID if needed (usually handled automatically)
-- GRANT USAGE, SELECT ON SEQUENCE public.bookings_id_seq TO anon, authenticated;