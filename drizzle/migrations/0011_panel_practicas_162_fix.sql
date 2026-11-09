-- Corrección: texto exacto de admin_practica del archivo panel_practicas_162.sql (sin clave duplicada).
CREATE OR REPLACE FUNCTION public.admin_practica(_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE r jsonb;
BEGIN
  IF NOT public.es_admin_plataforma() THEN
    RAISE EXCEPTION 'Solo administradores de la plataforma';
  END IF;
  SELECT jsonb_build_object(
    'id', e.id, 'created_at', e.created_at, 'node_id', e.node_id, 'payload', e.payload,
    'audio_url', e.audio_url, 'prompt_version', e.prompt_version, 'model', e.model,
    'vendedor', s.full_name, 'audio_consent', coalesce(s.audio_consent, false),
    'empresa', c.name, 'personal', coalesce(c.is_personal, false),
    'nodo', n.name
  ) INTO r
  FROM public.seller_events e
  JOIN public.sellers s ON s.id = e.seller_id
  LEFT JOIN public.companies c ON c.id = s.company_id
  LEFT JOIN public.nodes n ON n.id = e.node_id
  WHERE e.id = _id AND e.event_type = 'practice_session';
  RETURN r;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_practica(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_practica(uuid) TO authenticated;