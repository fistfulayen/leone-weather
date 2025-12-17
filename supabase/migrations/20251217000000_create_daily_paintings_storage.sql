-- Create storage bucket for daily paintings
INSERT INTO storage.buckets (id, name, public)
VALUES ('daily-paintings', 'daily-paintings', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for daily paintings bucket
CREATE POLICY "Public read access for daily paintings"
ON storage.objects FOR SELECT
USING (bucket_id = 'daily-paintings');

CREATE POLICY "Authenticated users can upload daily paintings"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'daily-paintings' AND auth.role() = 'authenticated');

CREATE POLICY "Service role can manage daily paintings"
ON storage.objects FOR ALL
USING (bucket_id = 'daily-paintings' AND auth.role() = 'service_role');
