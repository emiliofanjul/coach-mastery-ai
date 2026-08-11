
CREATE POLICY "branding_select_authenticated"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'branding');

CREATE POLICY "branding_insert_own_folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'branding' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "branding_update_own_folder"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'branding' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'branding' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "branding_delete_own_folder"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'branding' AND (storage.foldername(name))[1] = auth.uid()::text);
