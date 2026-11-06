-- DESHACER del mensaje 141: quita el límite de tamaño de practice-audio (como estaba antes). Solo si Emilio lo pide.
UPDATE storage.buckets SET file_size_limit = NULL WHERE id = 'practice-audio';
