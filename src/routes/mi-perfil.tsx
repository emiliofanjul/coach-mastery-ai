import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getStoredSupabaseSession } from "@/lib/browser-auth-session";
import { restGetMaybeSingle, restMutate } from "@/lib/supabase-rest";

export const Route = createFileRoute("/mi-perfil")({
  head: () => ({
    meta: [
      { title: "Mi Perfil — Closer" },
      { name: "description", content: "Tu cuenta en Closer y opciones para unirte a una empresa." },
    ],
  }),
  component: MiPerfilPage,
});

type ProfileRow = { role: string; company_id: string | null; full_name: string | null; email: string | null; avatar_url: string | null };
type CompanyRow = { id: string; name: string | null; is_personal: boolean | null };

function MiPerfilPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [company, setCompany] = useState<CompanyRow | null>(null);
  const [showJoin, setShowJoin] = useState(false);
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [preview, setPreview] = useState<{ ok: boolean; companyName?: string; message?: string } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [confirmCreateTeam, setConfirmCreateTeam] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = getStoredSupabaseSession();
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      try {
        const p = await restGetMaybeSingle<ProfileRow>(
          `profiles?select=role,company_id,full_name,email&id=eq.${session.userId}&limit=1`,
        );
        let c: CompanyRow | null = null;
        if (p?.company_id) {
          c = await restGetMaybeSingle<CompanyRow>(
            `companies?select=id,name,is_personal&id=eq.${p.company_id}&limit=1`,
          );
        }
        if (!cancelled) {
          setProfile(p);
          setCompany(c);
          setLoading(false);
        }
      } catch (e) {
        console.error("[mi-perfil] load", e);
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const isPersonal = company?.is_personal === true;
  const canJoin = isPersonal || (profile?.role !== "manager" && !profile?.company_id);

  async function handleCheck() {
    const c = code.trim().toUpperCase();
    if (c.length < 4) return;
    setChecking(true);
    setPreview(null);
    try {
      const rows = await restMutate<{ valid: boolean; reason?: string; company_name?: string }>(
        "rpc/validate_invite_code",
        { method: "POST", body: { _code: c } },
      );
      const d: any = Array.isArray(rows) ? rows[0] : rows;
      if (d?.valid) setPreview({ ok: true, companyName: d.company_name });
      else setPreview({ ok: false, message: reasonToText(d?.reason) });
    } catch (e: any) {
      setPreview({ ok: false, message: "No pudimos validar el código." });
    } finally {
      setChecking(false);
    }
  }

  async function handleJoin() {
    setJoining(true);
    try {
      const rows = await restMutate<{ ok: boolean; reason?: string }>(
        "rpc/join_company_with_code",
        { method: "POST", body: { _code: code.trim().toUpperCase() } },
      );
      const d: any = Array.isArray(rows) ? rows[0] : rows;
      if (d?.ok) {
        toast.success("Te uniste a la empresa. Recargando…");
        window.setTimeout(() => window.location.assign("/mapa"), 800);
      } else {
        toast.error(reasonToText(d?.reason));
        setJoining(false);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "No pudimos vincularte a la empresa.");
      setJoining(false);
    }
  }

  async function handleCreateTeam() {
    const name = teamName.trim();
    if (name.length < 2) {
      toast.error("Escribe un nombre para tu equipo.");
      return;
    }
    setCreatingTeam(true);
    try {
      const rows = await restMutate<{ ok: boolean }>(
        "rpc/convert_personal_to_company",
        { method: "POST", body: { _name: name } },
      );
      const d: any = Array.isArray(rows) ? rows[0] : rows;
      if (d?.ok) {
        toast.success("Equipo creado. Cargando tu panel…");
        window.setTimeout(() => window.location.assign("/mi-empresa"), 700);
      } else {
        toast.error("No pudimos crear tu equipo. Intenta de nuevo.");
        setCreatingTeam(false);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "No pudimos crear tu equipo.");
      setCreatingTeam(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080F] text-white flex items-center justify-center">
        <div className="text-white/60 font-['DM_Sans']">Cargando…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080F] text-white">
      <AppHeader title="Mi Perfil" subtitle={profile?.email ?? undefined} />
      <div className="mx-auto w-full max-w-[560px] px-5 pt-2 pb-16">
        <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-5 mb-4">
          <div className="text-xs uppercase tracking-[0.06em] text-white/40 font-['DM_Sans']">Nombre</div>
          <div className="mt-1 font-['DM_Sans'] text-white">{profile?.full_name ?? "—"}</div>
          <div className="mt-3 text-xs uppercase tracking-[0.06em] text-white/40 font-['DM_Sans']">Correo</div>
          <div className="mt-1 font-['DM_Sans'] text-white">{profile?.email ?? "—"}</div>
          <div className="mt-3 text-xs uppercase tracking-[0.06em] text-white/40 font-['DM_Sans']">Modo</div>
          <div className="mt-1 font-['DM_Sans'] text-white">
            {isPersonal
              ? "Cuenta individual"
              : profile?.role === "manager"
              ? `Manager · ${company?.name ?? ""}`
              : `Vendedor · ${company?.name ?? ""}`}
          </div>
        </div>

        {canJoin && (
          <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-5">
            <div className="font-['Syne'] font-bold text-white text-lg">Unirme a una empresa</div>
            <p className="mt-1 text-sm text-white/60 font-['DM_Sans']">
              Si tu manager te compartió un código, úsalo para unirte a su equipo. Tu progreso se conserva.
            </p>

            {!showJoin ? (
              <Button
                onClick={() => setShowJoin(true)}
                className="mt-4 bg-[#FF6B2B] hover:bg-[#ff7a42] rounded-[99px] font-['Syne'] font-bold text-black"
              >
                Tengo un código
              </Button>
            ) : (
              <div className="mt-4 space-y-3">
                <input
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setPreview(null);
                    setConfirming(false);
                  }}
                  placeholder="EMPRESA-XXXX"
                  className="w-full bg-black/40 border border-white/10 rounded-[10px] px-3 py-2 text-sm text-white outline-none focus:border-[#FF6B2B] font-mono"
                />
                {!preview && (
                  <Button
                    onClick={handleCheck}
                    disabled={checking || code.trim().length < 4}
                    className="w-full bg-white/10 hover:bg-white/20 text-white rounded-[99px]"
                  >
                    {checking ? "Validando…" : "Validar código"}
                  </Button>
                )}
                {preview && !preview.ok && (
                  <div className="text-sm text-[#EF476F] font-['DM_Sans']">{preview.message}</div>
                )}
                {preview && preview.ok && !confirming && (
                  <div className="rounded-[10px] border border-[#06D6A0]/40 bg-[#06D6A0]/10 p-3">
                    <div className="text-sm text-[#06D6A0] font-['DM_Sans'] font-semibold">
                      ✓ Código válido — {preview.companyName}
                    </div>
                    <div className="mt-2 text-xs text-white/60 font-['DM_Sans']">
                      Vas a dejar tu cuenta individual para unirte como vendedor. Tu historial se conserva.
                    </div>
                    <Button
                      onClick={() => setConfirming(true)}
                      className="mt-3 bg-[#FF6B2B] hover:bg-[#ff7a42] rounded-[99px] font-['Syne'] font-bold text-black"
                    >
                      Continuar
                    </Button>
                  </div>
                )}
                {confirming && (
                  <div className="rounded-[10px] border border-[#FF6B2B]/40 bg-[#FF6B2B]/10 p-3">
                    <div className="text-sm text-white font-['DM_Sans']">
                      Confirmo unirme a <b>{preview?.companyName}</b>.
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        onClick={() => setConfirming(false)}
                        variant="outline"
                        className="flex-1 border-white/20 rounded-[99px]"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleJoin}
                        disabled={joining}
                        className="flex-1 bg-[#FF6B2B] hover:bg-[#ff7a42] rounded-[99px] font-['Syne'] font-bold text-black"
                      >
                        {joining ? "Uniendo…" : "Sí, unirme"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {isPersonal && (
          <div className="mt-4 rounded-[14px] border border-white/10 bg-white/[0.03] p-5">
            <div className="font-['Syne'] font-bold text-white text-lg">Crear equipo</div>
            <p className="mt-1 text-sm text-white/60 font-['DM_Sans']">
              Convierte tu cuenta individual en un equipo. Vas a poder invitar vendedores y administrar su entrenamiento. Tu progreso y datos se conservan.
            </p>

            {!showCreateTeam ? (
              <Button
                onClick={() => setShowCreateTeam(true)}
                className="mt-4 bg-[#FF6B2B] hover:bg-[#ff7a42] rounded-[99px] font-['Syne'] font-bold text-black"
              >
                Crear equipo
              </Button>
            ) : !confirmCreateTeam ? (
              <div className="mt-4 space-y-3">
                <input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Nombre del equipo o empresa"
                  className="w-full bg-black/40 border border-white/10 rounded-[10px] px-3 py-2 text-sm text-white outline-none focus:border-[#FF6B2B] font-['DM_Sans']"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setShowCreateTeam(false);
                      setTeamName("");
                    }}
                    variant="outline"
                    className="flex-1 border-white/20 rounded-[99px]"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => setConfirmCreateTeam(true)}
                    disabled={teamName.trim().length < 2}
                    className="flex-1 bg-[#FF6B2B] hover:bg-[#ff7a42] rounded-[99px] font-['Syne'] font-bold text-black"
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-[10px] border border-[#FF6B2B]/40 bg-[#FF6B2B]/10 p-3">
                <div className="text-sm text-white font-['DM_Sans']">
                  Vas a convertir tu cuenta en un equipo llamado <b>{teamName.trim()}</b>. Vas a poder invitar vendedores y administrar su entrenamiento. ¿Continuar?
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={() => setConfirmCreateTeam(false)}
                    variant="outline"
                    className="flex-1 border-white/20 rounded-[99px]"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateTeam}
                    disabled={creatingTeam}
                    className="flex-1 bg-[#FF6B2B] hover:bg-[#ff7a42] rounded-[99px] font-['Syne'] font-bold text-black"
                  >
                    {creatingTeam ? "Creando…" : "Sí, crear equipo"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function reasonToText(reason?: string): string {
  switch (reason) {
    case "not_found":
      return "Código no encontrado.";
    case "expired":
      return "Este código expiró.";
    case "used":
      return "Este código ya fue usado.";
    case "locked":
      return "Este código está bloqueado temporalmente.";
    case "already_in_company":
      return "Ya perteneces a una empresa.";
    default:
      return "Código no válido.";
  }
}
