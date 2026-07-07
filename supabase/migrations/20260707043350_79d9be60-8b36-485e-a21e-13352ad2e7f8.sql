CREATE POLICY "practice_audio_select_manager"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'practice-audio'
  AND public.is_manager()
  AND EXISTS (
    SELECT 1 FROM public.sellers s
    WHERE (s.id)::text = (storage.foldername(objects.name))[1]
      AND s.company_id = public.current_company_id()
  )
);