-- 010_create_storage.sql
-- Run via Supabase Dashboard or CLI

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-reports', 'medical-reports', false)
ON CONFLICT (id) DO NOTHING;

-- Patients can upload to their own folder
CREATE POLICY "Patients upload own reports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'medical-reports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Patients can read their own files
CREATE POLICY "Patients read own reports"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'medical-reports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Patients can delete their own files
CREATE POLICY "Patients delete own reports"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'medical-reports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can read all files
CREATE POLICY "Admins read all reports"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'medical-reports'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
