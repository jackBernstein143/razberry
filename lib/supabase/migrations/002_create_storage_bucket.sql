-- Create storage bucket for story audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('story-audio', 'story-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for story-audio bucket
CREATE POLICY "Authenticated users can upload audio" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'story-audio');

CREATE POLICY "Public can view audio" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'story-audio');

CREATE POLICY "Users can delete their own audio" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'story-audio' AND auth.uid()::text = (storage.foldername(name))[1]);