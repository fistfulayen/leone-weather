-- Verify the presence dates are in the table
SELECT * FROM presence_dates;

-- If the above shows no results, run this to add the dates:
-- INSERT INTO presence_dates (start_date, end_date, notes)
-- VALUES ('2025-12-19', '2026-01-04', 'Christmas/New Year visit');

-- Check if they're present today
SELECT is_present_on_date(CURRENT_DATE) as "Are they present today?";

-- Check specific dates
SELECT
  '2025-12-13' as date,
  is_present_on_date('2025-12-13'::date) as present;

SELECT
  '2025-12-19' as date,
  is_present_on_date('2025-12-19'::date) as present;

SELECT
  '2026-01-04' as date,
  is_present_on_date('2026-01-04'::date) as present;
