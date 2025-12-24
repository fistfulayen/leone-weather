-- Fix function search path security warnings and RLS policy performance issues

-- ============================================================
-- Fix 1: Function search_path security warnings
-- All functions should have an immutable search_path
-- ============================================================

-- Fix is_present_on_date function
CREATE OR REPLACE FUNCTION public.is_present_on_date(check_date DATE)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.presence_dates
    WHERE check_date >= start_date AND check_date <= end_date
  );
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Fix get_todays_album function
CREATE OR REPLACE FUNCTION public.get_todays_album()
RETURNS TABLE(day_of_year INTEGER, title TEXT, artist TEXT, description TEXT) AS $$
DECLARE
  current_day_of_year INTEGER;
BEGIN
  -- Get current day of year in Europe/Rome timezone
  current_day_of_year := EXTRACT(DOY FROM (NOW() AT TIME ZONE 'Europe/Rome'));

  RETURN QUERY
  SELECT
    da.day_of_year,
    da.title,
    da.artist,
    da.description
  FROM public.daily_albums da
  WHERE da.day_of_year = current_day_of_year
  LIMIT 1;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- ============================================================
-- Fix 2: RLS policy performance issues on daily_paintings
-- - auth_rls_initplan: auth.role() re-evaluated per row
-- - multiple_permissive_policies: overlapping SELECT policies
--
-- Solution: Remove the "Allow service role full access" policy.
-- The service_role bypasses RLS by default in Supabase, so this
-- policy is redundant and causes both warnings.
-- ============================================================

DROP POLICY IF EXISTS "Allow service role full access" ON public.daily_paintings;
