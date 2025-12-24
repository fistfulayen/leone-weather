-- Create table to track when Hedvig & Ian are at Cascina Leone
CREATE TABLE IF NOT EXISTS presence_dates (
  id BIGSERIAL PRIMARY KEY,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for date range queries
CREATE INDEX idx_presence_dates_range ON presence_dates (start_date, end_date);

-- Insert current planned visit (Dec 19, 2025 - Jan 4, 2026)
INSERT INTO presence_dates (start_date, end_date, notes)
VALUES
  ('2025-12-19', '2026-01-04', 'Christmas/New Year visit');

-- Helper function to check if they're present on a given date
CREATE OR REPLACE FUNCTION is_present_on_date(check_date DATE)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.presence_dates
    WHERE check_date >= start_date AND check_date <= end_date
  );
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Enable Row Level Security (optional but recommended)
ALTER TABLE presence_dates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed)
CREATE POLICY "Allow all operations on presence_dates"
  ON presence_dates
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE presence_dates IS 'Tracks date ranges when Hedvig & Ian are present at Cascina Leone';
COMMENT ON COLUMN presence_dates.start_date IS 'First day of visit (inclusive)';
COMMENT ON COLUMN presence_dates.end_date IS 'Last day of visit (inclusive)';
COMMENT ON COLUMN presence_dates.notes IS 'Optional description of the visit';
