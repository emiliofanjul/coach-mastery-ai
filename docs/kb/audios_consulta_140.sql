-- Solo lectura. El tamaño de los audios de práctica que ya existen, para poner un límite que no corte ninguno real.
SELECT count(*) AS audios,
       max((metadata->>'size')::bigint) AS mas_grande_bytes,
       round(max((metadata->>'size')::bigint) / 1048576.0, 1) AS mas_grande_mb,
       round(percentile_cont(0.95) WITHIN GROUP (ORDER BY (metadata->>'size')::bigint)::numeric / 1048576.0, 1) AS p95_mb,
       string_agg(DISTINCT metadata->>'mimetype', ', ') AS tipos
FROM storage.objects
WHERE bucket_id = 'practice-audio';
