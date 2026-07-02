UPDATE public.nodes
SET practice_script = jsonb_set(
  jsonb_set(
    practice_script::jsonb,
    '{success_criteria}',
    '[
      {
        "id": "opening.estructura_apertura",
        "weight": 0.35,
        "requires_audio": false,
        "description": "Saludo con energía en las palabras + observación específica del entorno del cliente + apertura de conversación. Sin mencionar producto, empresa ni motivo de venta."
      },
      {
        "id": "opening.personalizacion",
        "weight": 0.30,
        "requires_audio": false,
        "description": "Usa el nombre del cliente y referencia algo específico y observable de su negocio (movimiento, clientela, local). Genérico = no cumple."
      },
      {
        "id": "opening.arranque_sin_disculpa",
        "weight": 0.35,
        "requires_audio": false,
        "description": "Abre con seguridad: sin disculpe la molestia, sin pedir permiso para existir, sin minimizarse (solo le quito un minutito)."
      }
    ]'::jsonb
  ),
  '{version}',
  '"1.1.0"'::jsonb
)
WHERE id = '0.1';