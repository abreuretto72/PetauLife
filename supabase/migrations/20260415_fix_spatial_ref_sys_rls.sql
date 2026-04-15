-- Enable RLS on PostGIS system table to satisfy Supabase security advisor.
-- spatial_ref_sys is a read-only reference table (~8000 coordinate systems)
-- installed by the postgis extension. No writes are needed by the app.

ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon + authenticated) to SELECT — this data is public
-- coordinate reference system definitions, not user data.
CREATE POLICY "spatial_ref_sys is publicly readable"
  ON public.spatial_ref_sys
  FOR SELECT
  USING (true);
