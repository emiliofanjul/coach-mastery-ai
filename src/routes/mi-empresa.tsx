import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Trash2, Save, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/mi-empresa")({
  head: () => ({
    meta: [
      { title: "Mi Empresa — Closer" },
      {
        name: "description",
        content:
          "Edita el conocimiento que tu Closer usa para entrenar a tu equipo: productos, cliente típico, objeciones, argumentos y restricciones.",
      },
    ],
  }),
  component: MiEmpresaPage,
});

// Llaves conocidas → etiqueta humana + tipo de campo
const KNOWN_FIELDS: Array<{
  key: string;
  label: string;
  help: string;
  kind: "text" | "textarea" | "list";
  placeholder?: string;
}> = [
  {
    key: "PRODUCTOS_ACTIVOS",
    label: "Qué vendes",
    help: "Productos, marcas o líneas que tu equipo ofrece hoy.",
    kind: "textarea",
    placeholder: "Ej. Lubricantes Bardahl para motor y transmisión…",
  },
  {
    key: "CLIENTE_TIPICO",
    label: "Cómo es tu cliente típico",
    help: "Perfil: cómo piensa, qué le importa, cómo decide.",
    kind: "textarea",
    placeholder: "Ej. Dueño de refaccionaria en zona semi-urbana, decide por confianza…",
  },
  {
    key: "CONTEXTO_DE_VENTA",
    label: "Cómo es una venta típica",
    help: "Escenario real: tipo de interacción, duración, ambiente.",
    kind: "textarea",
    placeholder: "Ej. Visita en mostrador, 5-10 min, ruido de taller…",
  },
  {
    key: "OBJECIONES_REALES",
    label: "Objeciones reales que oyes",
    help: "Una por renglón. Las objeciones que de verdad frenan la venta.",
    kind: "list",
    placeholder: "Ej. 'Está muy caro'",
  },
  {
    key: "ARGUMENTOS_DE_VALOR",
    label: "Tus argumentos de valor",
    help: "Una por renglón. Lo que de verdad convence.",
    kind: "list",
    placeholder: "Ej. 'Rinde 20% más que la competencia'",
  },
  {
    key: "TONO_DETECTADO",
    label: "Tono de la relación",
    help: "Cómo se hablan tú y tu cliente.",
    kind: "text",
    placeholder: "Ej. Informal, trato de confianza",
  },
  {
    key: "RESTRICCIONES",
    label: "Restricciones (qué nunca prometer)",
    help: "Lo que el equipo NO debe decir o prometer bajo ninguna circunstancia.",
    kind: "textarea",
    placeholder: "Ej. No prometer entregas en menos de 48h…",
  },
];

const KNOWN_KEYS = new Set(KNOWN_FIELDS.map((f) => f.key));

function splitList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v !== "string") return [];
  return v
    .split(/[;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinList(items: string[]): string {
  return items.map((s) => s.trim()).filter(Boolean).join("; ");
}

type BrainDraft = {
  known: Record<string, string | string[]>;
  extras: Array<{ key: string; value: string }>;
};

function MiEmpresaPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [draft, setDraft] = useState<BrainDraft>({ known: {}, extras: [] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate({ to: "/login" });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, company_id")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile || profile.role !== "manager" || !profile.company_id) {
        if (!cancelled) {
          setDenied(true);
          setLoading(false);
        }
        return;
      }
      const { data: company, error } = await supabase
        .from("companies")
        .select("id, name, company_sales_brain")
        .eq("id", profile.company_id)
        .maybeSingle();
      if (error || !company) {
        if (!cancelled) {
          setDenied(true);
          setLoading(false);
        }
        return;
      }
      const brain = (company.company_sales_brain ?? {}) as Record<string, unknown>;
      const known: Record<string, string | string[]> = {};
      for (const f of KNOWN_FIELDS) {
        const v = brain[f.key];
        if (f.kind === "list") known[f.key] = splitList(v);
        else known[f.key] = typeof v === "string" ? v : v == null ? "" : JSON.stringify(v);
      }
      const extras: Array<{ key: string; value: string }> = [];
      for (const [k, v] of Object.entries(brain)) {
        if (KNOWN_KEYS.has(k)) continue;
        extras.push({
          key: k,
          value: typeof v === "string" ? v : JSON.stringify(v, null, 2),
        });
      }
      if (!cancelled) {
        setCompanyId(company.id);
        setCompanyName(company.name ?? "");
        setDraft({ known, extras });
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  function updateKnown(key: string, value: string | string[]) {
    setDraft((d) => ({ ...d, known: { ...d.known, [key]: value } }));
  }

  function updateExtra(idx: number, patch: Partial<{ key: string; value: string }>) {
    setDraft((d) => {
      const extras = [...d.extras];
      extras[idx] = { ...extras[idx], ...patch };
      return { ...d, extras };
    });
  }

  function removeExtra(idx: number) {
    setDraft((d) => {
      const extras = [...d.extras];
      extras.splice(idx, 1);
      return { ...d, extras };
    });
  }

  async function handleSave() {
    if (!companyId) return;
    setSaving(true);
    try {
      const brain: Record<string, unknown> = {};
      for (const f of KNOWN_FIELDS) {
        const v = draft.known[f.key];
        if (f.kind === "list") {
          brain[f.key] = joinList((v as string[]) ?? []);
        } else {
          brain[f.key] = ((v as string) ?? "").trim();
        }
      }
      for (const { key, value } of draft.extras) {
        const k = key.trim();
        if (!k) continue;
        // intenta preservar JSON si aplica
        let parsed: unknown = value;
        const t = value.trim();
        if (t.startsWith("{") || t.startsWith("[")) {
          try {
            parsed = JSON.parse(t);
          } catch {
            parsed = value;
          }
        }
        brain[k] = parsed;
      }
      const { error } = await supabase.rpc("update_company_brain", { _brain: brain as any });
      if (error) throw error;
      toast.success("Guardado. Tu Closer ya usa estos cambios.");
    } catch (e: any) {
      console.error("save brain error", e);
      toast.error(e?.message ?? "No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080F] text-white flex items-center justify-center">
        <div className="text-white/60 font-['DM_Sans']">Cargando…</div>
      </div>
    );
  }

  if (denied) {
    return (
      <div className="min-h-screen bg-[#08080F] text-white flex flex-col items-center justify-center px-6 gap-4 text-center">
        <div className="font-['Syne'] text-2xl font-bold">Solo para managers</div>
        <div className="text-white/60 font-['DM_Sans'] max-w-sm">
          Esta sección edita el conocimiento de tu empresa que alimenta a Closer. Requiere rol de manager.
        </div>
        <Button
          onClick={() => navigate({ to: "/mapa" })}
          className="bg-[#FF6B2B] hover:bg-[#ff7a42] rounded-[99px]"
        >
          Ir al mapa
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080F] text-white">
      <div className="mx-auto w-full max-w-[720px] px-5 pt-6 pb-32">
        <header className="mb-6 flex items-center justify-between gap-4">
          <Link
            to="/mapa"
            className="text-white/60 hover:text-white flex items-center gap-2 text-sm font-['DM_Sans']"
          >
            <ArrowLeft className="h-4 w-4" /> Mapa
          </Link>
          <div className="text-white/50 text-xs font-['DM_Sans'] truncate">
            {companyName}
          </div>
        </header>

        <h1 className="font-['Syne'] text-3xl font-black tracking-tight mb-1">Mi Empresa</h1>
        <p className="text-white/60 font-['DM_Sans'] mb-4">
          Este es el conocimiento con el que tu Closer entrena a tu equipo. Edítalo cuando cambie tu realidad
          comercial.
        </p>
        <div className="mb-6 flex items-start gap-2 rounded-[14px] border border-[#FF6B2B]/30 bg-[#FF6B2B]/10 p-3 text-[#FF6B2B]">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="text-xs font-['DM_Sans'] leading-relaxed">
            Esto cambia lo que tu Closer usa para entrenar a tu equipo. El siguiente ejemplo o práctica que se
            genere usará estos datos.
          </div>
        </div>

        <div className="space-y-5">
          {KNOWN_FIELDS.map((f) => (
            <FieldBlock
              key={f.key}
              field={f}
              value={draft.known[f.key]}
              onChange={(v) => updateKnown(f.key, v)}
            />
          ))}

          {(draft.extras.length > 0 || true) && (
            <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-1 font-['Syne'] font-bold">Otros campos</div>
              <div className="mb-4 text-xs text-white/50 font-['DM_Sans']">
                Cualquier otro dato que alimenta a tu Closer. Puedes editarlo o eliminarlo.
              </div>
              <div className="space-y-3">
                {draft.extras.map((e, i) => (
                  <div key={i} className="rounded-[10px] border border-white/10 bg-white/[0.02] p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <input
                        value={e.key}
                        onChange={(ev) => updateExtra(i, { key: ev.target.value })}
                        placeholder="LLAVE"
                        className="flex-1 bg-black/40 border border-white/10 rounded-[8px] px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-[#FF6B2B]"
                      />
                      <button
                        onClick={() => removeExtra(i)}
                        className="text-white/40 hover:text-red-400 p-1"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <textarea
                      value={e.value}
                      onChange={(ev) => updateExtra(i, { value: ev.target.value })}
                      rows={3}
                      className="w-full bg-black/40 border border-white/10 rounded-[8px] px-3 py-2 text-sm text-white outline-none focus:border-[#FF6B2B] font-['DM_Sans']"
                    />
                  </div>
                ))}
                <button
                  onClick={() =>
                    setDraft((d) => ({ ...d, extras: [...d.extras, { key: "", value: "" }] }))
                  }
                  className="inline-flex items-center gap-2 text-xs text-white/60 hover:text-white font-['DM_Sans']"
                >
                  <Plus className="h-3.5 w-3.5" /> Agregar campo
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#08080F]/95 backdrop-blur px-5 py-3">
          <div className="mx-auto flex w-full max-w-[720px] items-center justify-between gap-3">
            <div className="text-[11px] text-white/50 font-['DM_Sans']">
              Cambios activos en la próxima práctica.
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#FF6B2B] hover:bg-[#ff7a42] rounded-[99px] font-['Syne'] font-bold text-black"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldBlock({
  field,
  value,
  onChange,
}: {
  field: (typeof KNOWN_FIELDS)[number];
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
}) {
  return (
    <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-1 font-['Syne'] font-bold">{field.label}</div>
      <div className="mb-3 text-xs text-white/50 font-['DM_Sans']">{field.help}</div>
      {field.kind === "text" && (
        <input
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full bg-black/40 border border-white/10 rounded-[10px] px-3 py-2 text-sm text-white outline-none focus:border-[#FF6B2B] font-['DM_Sans']"
        />
      )}
      {field.kind === "textarea" && (
        <textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder={field.placeholder}
          className="w-full bg-black/40 border border-white/10 rounded-[10px] px-3 py-2 text-sm text-white outline-none focus:border-[#FF6B2B] font-['DM_Sans'] leading-relaxed"
        />
      )}
      {field.kind === "list" && (
        <ListEditor
          items={(value as string[]) ?? []}
          onChange={onChange}
          placeholder={field.placeholder}
        />
      )}
    </div>
  );
}

function ListEditor({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={it}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
            placeholder={placeholder}
            className="flex-1 bg-black/40 border border-white/10 rounded-[10px] px-3 py-2 text-sm text-white outline-none focus:border-[#FF6B2B] font-['DM_Sans']"
          />
          <button
            onClick={() => {
              const next = [...items];
              next.splice(i, 1);
              onChange(next);
            }}
            className="text-white/40 hover:text-red-400 p-1"
            aria-label="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, ""])}
        className="inline-flex items-center gap-2 text-xs text-white/60 hover:text-white font-['DM_Sans']"
      >
        <Plus className="h-3.5 w-3.5" /> Agregar renglón
      </button>
    </div>
  );
}
