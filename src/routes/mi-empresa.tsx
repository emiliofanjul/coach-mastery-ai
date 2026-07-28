import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Save, AlertTriangle, Copy, RefreshCw, XCircle, ChevronDown, ChevronUp, Users, Brain, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AppHeader } from "@/components/app/AppShell";
import { getStoredSupabaseSession } from "@/lib/browser-auth-session";
import { restGetMaybeSingle, restMutate } from "@/lib/supabase-rest";

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
    label: "Productos activos",
    help: "Lo que el cliente simulado conoce de tu catálogo durante las prácticas.",
    kind: "textarea",
    placeholder: "Ej. Lubricantes Bardahl para motor y transmisión…",
  },
  {
    key: "CLIENTE_TIPICO",
    label: "Cliente típico",
    help: "Define cómo se comporta el cliente simulado.",
    kind: "textarea",
    placeholder: "Ej. Dueño de refaccionaria en zona semi-urbana, decide por confianza…",
  },
  {
    key: "CONTEXTO_DE_VENTA",
    label: "Contexto de venta",
    help: "Define cómo se comporta el cliente simulado.",
    kind: "textarea",
    placeholder: "Ej. Visita en mostrador, 5-10 min, ruido de taller…",
  },
  {
    key: "OBJECIONES_REALES",
    label: "Objeciones reales",
    help: "Las objeciones que van a enfrentar en la práctica.",
    kind: "list",
    placeholder: "Ej. 'Está muy caro'",
  },
  {
    key: "ARGUMENTOS_DE_VALOR",
    label: "Argumentos de valor",
    help: "Lo que Closer espera que tus vendedores sepan defender.",
    kind: "list",
    placeholder: "Ej. 'Rinde 20% más que la competencia'",
  },
  {
    key: "TONO_DETECTADO",
    label: "Tono",
    help: "Define cómo se comporta el cliente simulado.",
    kind: "text",
    placeholder: "Ej. Informal, trato de confianza",
  },
  {
    key: "RESTRICCIONES",
    label: "Restricciones",
    help: "Lo que Closer nunca va a permitir que tus vendedores prometan.",
    kind: "textarea",
    placeholder: "Ej. No prometer entregas en menos de 48h…",
  },
];

const KNOWN_KEYS = new Set(KNOWN_FIELDS.map((f) => f.key));

// Llaves legacy o efímeras que nunca deben aparecer en la UI ni persistirse.
// DON_RAMON_RESPUESTA se persistía por error desde el onboarding viejo.
const HIDDEN_KEYS = new Set(["DON_RAMON_RESPUESTA", "__preview_response"]);

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
  const [industry, setIndustry] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [brainUpdatedAt, setBrainUpdatedAt] = useState<string | null>(null);
  const [isPersonal, setIsPersonal] = useState<boolean>(false);
  const [draft, setDraft] = useState<BrainDraft>({ known: {}, extras: [] });
  const [saving, setSaving] = useState(false);
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [brainOpen, setBrainOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = getStoredSupabaseSession();
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      const profile = await restGetMaybeSingle<{ role: string; company_id: string | null }>(
        `profiles?select=role,company_id&id=eq.${session.userId}&limit=1`,
      );
      if (!profile || profile.role !== "manager" || !profile.company_id) {
        if (!cancelled) {
          setDenied(true);
          setLoading(false);
        }
        return;
      }
      const company = await restGetMaybeSingle<{
        id: string;
        name: string | null;
        is_personal: boolean | null;
        industry: string | null;
        logo_url: string | null;
        brain_updated_at: string | null;
        company_sales_brain: Record<string, unknown> | null;
      }>(
        `companies?select=id,name,is_personal,industry,logo_url,brain_updated_at,company_sales_brain&id=eq.${profile.company_id}&limit=1`,
      );
      if (!company) {
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
        if (HIDDEN_KEYS.has(k)) continue;
        extras.push({
          key: k,
          value: typeof v === "string" ? v : JSON.stringify(v, null, 2),
        });
      }
      if (!cancelled) {
        setCompanyId(company.id);
        setCompanyName(company.name ?? "");
        setIndustry(company.industry ?? "");
        setLogoUrl(company.logo_url ?? "");
        setBrainUpdatedAt(company.brain_updated_at ?? null);
        setIsPersonal(company.is_personal === true);
        setDraft({ known, extras });
        setLoading(false);
      }
    })().catch((e) => {
      console.error("[mi-empresa] load failed", e);
      if (!cancelled) {
        setDenied(true);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleSaveIdentity() {
    if (!companyId) return;
    setSavingIdentity(true);
    try {
      await restMutate("rpc/update_company_identity", {
        method: "POST",
        body: {
          _name: companyName.trim(),
          _industry: industry.trim(),
          _logo_url: logoUrl.trim(),
        },
      });
      toast.success("Identidad actualizada.");
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo guardar la identidad.");
    } finally {
      setSavingIdentity(false);
    }
  }

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
        if (HIDDEN_KEYS.has(k)) continue; // no reintroducir llaves legacy/efímeras
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
      const res: any = await restMutate("rpc/update_company_brain", {
        method: "POST",
        body: { _brain: brain },
      });
      const updated = Array.isArray(res) ? res[0] : res;
      if (updated?.updated_at) setBrainUpdatedAt(updated.updated_at);
      else setBrainUpdatedAt(new Date().toISOString());
      toast.success("Guardado. Estos cambios afectan las prácticas de todo tu equipo a partir de ahora.");
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

  const brainUpdatedLabel = brainUpdatedAt
    ? new Date(brainUpdatedAt).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })
    : "nunca";

  return (
    <div className="min-h-screen bg-[#08080F] text-white">
      <AppHeader title="Mi Empresa" subtitle={companyName || undefined} />
      <div className="mx-auto w-full max-w-[720px] px-5 pt-2 pb-32">
        <h1 className="font-['Syne'] text-3xl font-black tracking-tight mb-6">Mi Empresa</h1>

        {/* 1. IDENTIDAD */}
        <section className="mb-6 rounded-[14px] border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-4 w-4 text-[#FF6B2B]" />
            <h2 className="font-['Syne'] font-bold text-white text-lg">Identidad</h2>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wide text-white/50 font-['DM_Sans'] mb-1">
                Nombre de la empresa
              </label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-[10px] px-3 py-2 text-sm text-white outline-none focus:border-[#FF6B2B] font-['DM_Sans']"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-white/50 font-['DM_Sans'] mb-1">
                Giro
              </label>
              <input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Ej. Refacciones automotrices"
                className="w-full bg-black/40 border border-white/10 rounded-[10px] px-3 py-2 text-sm text-white outline-none focus:border-[#FF6B2B] font-['DM_Sans']"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-white/50 font-['DM_Sans'] mb-1">
                Logo (URL)
              </label>
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://…"
                className="w-full bg-black/40 border border-white/10 rounded-[10px] px-3 py-2 text-sm text-white outline-none focus:border-[#FF6B2B] font-['DM_Sans']"
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSaveIdentity}
                disabled={savingIdentity}
                className="bg-white/10 hover:bg-white/20 rounded-[99px] text-white"
              >
                {savingIdentity ? "Guardando…" : "Guardar identidad"}
              </Button>
            </div>
          </div>
        </section>

        {/* 2. EQUIPO */}
        {!isPersonal && companyId && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-[#FF6B2B]" />
              <h2 className="font-['Syne'] font-bold text-white text-lg">Equipo</h2>
            </div>
            <InviteCard companyId={companyId} />
            <MembersList companyId={companyId} />
          </section>
        )}

        {/* 3. CEREBRO DE VENTAS (accordion) */}
        <section className="mb-6 rounded-[14px] border border-white/10 bg-white/[0.03]">
          <button
            onClick={() => setBrainOpen((v) => !v)}
            className="w-full flex items-center gap-3 p-5 text-left"
          >
            <Brain className="h-4 w-4 text-[#FF6B2B] shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-['Syne'] font-bold text-white text-lg">Cerebro de ventas</div>
              <div className="text-xs text-white/50 font-['DM_Sans'] mt-0.5">
                La información que Closer usa para entrenar a tu equipo. Última actualización: {brainUpdatedLabel}
              </div>
            </div>
            {brainOpen ? <ChevronUp className="h-4 w-4 text-white/60" /> : <ChevronDown className="h-4 w-4 text-white/60" />}
          </button>

          {brainOpen && (
            <div className="border-t border-white/10 p-5">
              <div className="mb-4 flex items-start gap-2 rounded-[10px] border border-[#FF6B2B]/30 bg-[#FF6B2B]/10 p-3 text-[#FF6B2B]">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="text-xs font-['DM_Sans'] leading-relaxed">
                  Estos cambios afectan las prácticas de todo tu equipo a partir de ahora.
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
              </div>
            </div>
          )}
        </section>

        {/* 4. Futuras secciones */}
        <section className="mb-6 rounded-[14px] border border-dashed border-white/10 bg-white/[0.02] p-5 text-center">
          <div className="text-xs uppercase tracking-wide text-white/40 font-['DM_Sans']">Próximamente</div>
          <div className="mt-1 text-sm text-white/60 font-['DM_Sans']">Pitches · Consumo y plan</div>
        </section>

        {brainOpen && (
          <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#08080F]/95 backdrop-blur px-5 py-3">
            <div className="mx-auto flex w-full max-w-[720px] items-center justify-between gap-3">
              <div className="text-[11px] text-white/50 font-['DM_Sans']">
                Estos cambios afectan las prácticas de todo tu equipo.
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#FF6B2B] hover:bg-[#ff7a42] rounded-[99px] font-['Syne'] font-bold text-black"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Guardando…" : "Guardar cerebro"}
              </Button>
            </div>
          </div>
        )}
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

// ─────────────────────────── Invite management ───────────────────────────

type ActiveInvite = { code: string; expires_at: string; duration_hours: number };

function InviteCard({ companyId: _companyId }: { companyId: string }) {
  const [active, setActive] = useState<ActiveInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [duration, setDuration] = useState<24 | 168 | 720>(168);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await restMutate<ActiveInvite | null>("rpc/get_active_company_invite", {
        method: "POST",
        body: {},
      });
      const d: any = Array.isArray(rows) ? rows[0] : rows;
      setActive(d ?? null);
    } catch {
      setActive(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      const rows = await restMutate<ActiveInvite>("rpc/generate_company_invite", {
        method: "POST",
        body: { _hours: duration },
      });
      const d: any = Array.isArray(rows) ? rows[0] : rows;
      setActive(d);
      toast.success("Código generado");
    } catch (e: any) {
      toast.error(e?.message ?? "No pudimos generar el código.");
    } finally {
      setGenerating(false);
    }
  };

  const revoke = async () => {
    if (!confirm("¿Revocar el código activo? Nadie más podrá usarlo.")) return;
    setRevoking(true);
    try {
      await restMutate("rpc/revoke_company_invite", { method: "POST", body: {} });
      setActive(null);
      toast.success("Código revocado");
    } catch (e: any) {
      toast.error(e?.message ?? "No pudimos revocar el código.");
    } finally {
      setRevoking(false);
    }
  };

  const copy = async () => {
    if (!active) return;
    try {
      await navigator.clipboard.writeText(active.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  };

  const expiresLabel = active
    ? `expira ${new Date(active.expires_at).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}`
    : "";

  return (
    <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-5 mb-4">
      <div className="font-['Syne'] font-bold text-white text-lg">Invitar vendedores</div>
      <p className="mt-1 text-sm text-white/60 font-['DM_Sans']">
        Genera un código temporal y compártelo con tu equipo. Solo puede haber uno activo a la vez.
      </p>

      {loading ? (
        <div className="mt-4 text-sm text-white/50 font-['DM_Sans']">Cargando…</div>
      ) : active ? (
        <div className="mt-4">
          <div className="rounded-[10px] border border-[#FF6B2B]/40 bg-[#FF6B2B]/10 p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-mono text-lg tracking-wider text-[#FF6B2B] truncate">{active.code}</div>
              <div className="mt-0.5 text-[11px] text-white/60 font-['DM_Sans']">{expiresLabel}</div>
            </div>
            <button
              onClick={copy}
              className="h-9 px-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-['DM_Sans'] font-semibold inline-flex items-center gap-1.5"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              onClick={revoke}
              disabled={revoking}
              variant="outline"
              className="border-white/20 rounded-[99px] text-white/80 hover:text-white"
            >
              <XCircle className="h-4 w-4 mr-1.5" /> Revocar
            </Button>
            <Button
              onClick={generate}
              disabled={generating}
              className="bg-white/10 hover:bg-white/20 text-white rounded-[99px]"
            >
              <RefreshCw className="h-4 w-4 mr-1.5" /> Nuevo
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            {[
              { v: 24 as const, label: "24 h" },
              { v: 168 as const, label: "7 días" },
              { v: 720 as const, label: "30 días" },
            ].map((opt) => (
              <button
                key={opt.v}
                onClick={() => setDuration(opt.v)}
                className={[
                  "flex-1 h-10 rounded-[99px] text-xs font-['DM_Sans'] font-semibold border transition-colors",
                  duration === opt.v
                    ? "bg-[#FF6B2B]/15 border-[#FF6B2B]/50 text-[#FF6B2B]"
                    : "bg-white/[0.02] border-white/10 text-white/70 hover:text-white",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Button
            onClick={generate}
            disabled={generating}
            className="w-full bg-[#FF6B2B] hover:bg-[#ff7a42] rounded-[99px] font-['Syne'] font-bold text-black"
          >
            {generating ? "Generando…" : "Generar código"}
          </Button>
        </div>
      )}
    </div>
  );
}

type MemberRow = {
  id: string;
  full_name: string | null;
  is_active: boolean;
  profile_id: string;
};

function MembersList({ companyId }: { companyId: string }) {
  const [members, setMembers] = useState<MemberRow[] | null>(null);
  const [emails, setEmails] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await restGetMaybeSingle<MemberRow[]>(
          `sellers?select=id,full_name,is_active,profile_id&company_id=eq.${companyId}&order=full_name.asc`,
        );
        // restGetMaybeSingle returns first row; use restGet for arrays
      } catch {
        /* ignore */
      }
      try {
        const { restGet } = await import("@/lib/supabase-rest");
        const rows = await restGet<MemberRow>(
          `sellers?select=id,full_name,is_active,profile_id&company_id=eq.${companyId}&order=full_name.asc`,
        );
        if (!cancelled) setMembers(rows);
        const ids = rows.map((r) => r.profile_id).filter(Boolean);
        if (ids.length > 0) {
          const emailRows = await restGet<{ id: string; email: string | null }>(
            `profiles?select=id,email&id=in.(${ids.join(",")})`,
          );
          if (!cancelled) {
            const map: Record<string, string> = {};
            for (const e of emailRows) if (e.email) map[e.id] = e.email;
            setEmails(map);
          }
        }
      } catch (e) {
        console.error("[mi-empresa] members", e);
        if (!cancelled) setMembers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const toggle = async (m: MemberRow) => {
    const next = !m.is_active;
    setMembers((prev) => prev?.map((x) => (x.id === m.id ? { ...x, is_active: next } : x)) ?? null);
    try {
      await restMutate("rpc/set_seller_active", {
        method: "POST",
        body: { _seller_id: m.id, _active: next },
      });
    } catch (e: any) {
      toast.error("No pudimos actualizar. Revierte y reintenta.");
      setMembers((prev) => prev?.map((x) => (x.id === m.id ? { ...x, is_active: m.is_active } : x)) ?? null);
    }
  };

  if (!members) {
    return (
      <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-5 text-sm text-white/50 font-['DM_Sans']">
        Cargando equipo…
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-5 text-sm text-white/60 font-['DM_Sans']">
        Nadie se ha unido todavía. Comparte tu código y aparecerán aquí.
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-5">
      <div className="font-['Syne'] font-bold text-white text-lg mb-3">Se unieron con este código</div>
      <ul className="divide-y divide-white/5">
        {members.map((m) => (
          <li key={m.id} className="py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-['DM_Sans'] text-white truncate">{m.full_name ?? "Sin nombre"}</div>
              <div className="text-[11px] text-white/50 truncate">{emails[m.profile_id] ?? ""}</div>
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-white/70 font-['DM_Sans'] cursor-pointer">
              <input
                type="checkbox"
                checked={m.is_active}
                onChange={() => toggle(m)}
                style={{ accentColor: "#FF6B2B" }}
              />
              {m.is_active ? "Activo" : "Inactivo"}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

