UPDATE public.nodes
SET practice_script = jsonb_set(
  jsonb_set(
    practice_script::jsonb,
    '{failure_criteria}',
    '[
      {
        "id": "disculpa_inicial",
        "severity": "major",
        "description": "Abre pidiendo perdón o permiso: disculpe la molestia, perdón, no le quito tiempo, no sé si me recuerde."
      },
      {
        "id": "pitch_prematuro",
        "severity": "major",
        "description": "Menciona producto, empresa, promoción, precio o motivo de venta durante la apertura."
      },
      {
        "id": "fuera_de_scope",
        "severity": "minor",
        "description": "Ejecuta habilidades de pasos posteriores (discovery, presentación, cierre) en lugar de practicar la apertura. No es error de venta — es adelantarse al nodo."
      },
      {
        "id": "monologo",
        "severity": "minor",
        "description": "Turno excesivamente largo que no da espacio al cliente; mezcla saludo con historia, productos o precios."
      }
    ]'::jsonb
  ),
  '{version}',
  '"1.2.0"'::jsonb
)
WHERE id = '0.1';