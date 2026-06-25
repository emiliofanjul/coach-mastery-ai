
-- 1) Add consent column to sellers
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS audio_consent boolean NOT NULL DEFAULT false;

-- 2) Storage policies for practice-audio bucket
-- Path convention: {seller_id}/{event_id}.webm
-- Read: a seller can read only objects whose first path segment matches one of their seller.id
-- Writes/updates/deletes: service_role only (Edge Functions). No policy for anon/authenticated => denied.

CREATE POLICY "practice_audio_select_own"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'practice-audio'
  AND EXISTS (
    SELECT 1 FROM public.sellers s
    WHERE s.profile_id = auth.uid()
      AND s.id::text = (storage.foldername(storage.objects.name))[1]
  )
);
