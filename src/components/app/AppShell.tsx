import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Map as MapIcon, Store, Users, LogOut, ArrowLeft, User as UserIcon, FileText } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getStoredSupabaseSession } from "@/lib/browser-auth-session";


// ─────────────────────────── Context ───────────────────────────

type Role = "manager" | "vendedor" | null;

type Profile = {
  userId: string;
  role: Role;
  companyId: string | null;
  isPersonal: boolean;
} | null;

type AppShellCtx = {
  role: Role;
  profile: Profile;
  isAuthed: boolean;
  isReady: boolean;
  open: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  registerHeader: () => () => void;
  hasHeader: boolean;
};

const Ctx = createContext<AppShellCtx>({
  role: null,
  profile: null,
  isAuthed: false,
  isReady: true,
  open: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  registerHeader: () => () => {},
  hasHeader: false,
});

export function useAppShell() {
  return useContext(Ctx);
}

// ─────────────────────────── REST profile resolver ───────────────────────────
// Direct fetch (bypasses supabase-js) with a hard timeout — the role always
// resolves even if the SDK is deadlocked. Single call per session; the result
// is cached in AppShellProvider and consumed via useAppShell().

const SUPABASE_REST_URL = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1`;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type ProfileRow = {
  role?: string | null;
  company_id?: string | null;
  companies?: { is_personal?: boolean | null } | null;
};

async function fetchProfile(
  userId: string,
  accessToken: string,
): Promise<{ role: Role; companyId: string | null; isPersonal: boolean }> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(
      `${SUPABASE_REST_URL}/profiles?select=role,company_id,companies(is_personal)&id=eq.${encodeURIComponent(userId)}&limit=1`,
      {
        signal: controller.signal,
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    if (!res.ok) return { role: "vendedor", companyId: null, isPersonal: false };
    const rows = (await res.json()) as ProfileRow[];
    const r = rows[0]?.role;
    return {
      role: r === "manager" ? "manager" : "vendedor",
      companyId: rows[0]?.company_id ?? null,
      isPersonal: rows[0]?.companies?.is_personal === true,
    };
  } catch {
    return { role: "vendedor", companyId: null, isPersonal: false };
  } finally {
    window.clearTimeout(timeout);
  }
}

// ─────────────────────────── Provider ───────────────────────────

export function AppShellProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isReady] = useState(true);
  const [open, setOpen] = useState(false);
  const [headerCount, setHeaderCount] = useState(0);
  // React to route changes — this catches sign-in / sign-out transitions
  // (login navigates to /mapa, logout navigates to /login) so we refresh
  // the cached profile without re-mounting the provider.
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const session = getStoredSupabaseSession();
    if (!session) {
      currentUserIdRef.current = null;
      setIsAuthed(false);
      setProfile(null);
      return;
    }
    setIsAuthed(true);
    // Same user as last time → keep cached role, no re-fetch.
    if (currentUserIdRef.current === session.userId && profile) return;
    currentUserIdRef.current = session.userId;
    // Clear stale profile so no drawer item leaks across accounts while the
    // new fetch is in flight.
    setProfile((p) => (p && p.userId === session.userId ? p : null));
    let alive = true;
    void fetchProfile(session.userId, session.accessToken).then((res) => {
      if (!alive) return;
      setProfile({ userId: session.userId, role: res.role, companyId: res.companyId, isPersonal: res.isPersonal });
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const openDrawer = useCallback(() => setOpen(true), []);
  const closeDrawer = useCallback(() => setOpen(false), []);

  const registerHeader = useCallback(() => {
    setHeaderCount((c) => c + 1);
    return () => setHeaderCount((c) => Math.max(0, c - 1));
  }, []);

  const role = profile?.role ?? null;

  const value = useMemo<AppShellCtx>(
    () => ({
      role,
      profile,
      isAuthed,
      isReady,
      open,
      openDrawer,
      closeDrawer,
      registerHeader,
      hasHeader: headerCount > 0,
    }),
    [role, profile, isAuthed, isReady, open, openDrawer, closeDrawer, registerHeader, headerCount],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {isAuthed && <AppDrawer open={open} onClose={closeDrawer} role={role} isPersonal={profile?.isPersonal === true} />}
      {isAuthed && headerCount === 0 && <FloatingMenuButton onOpen={openDrawer} />}
    </Ctx.Provider>
  );
}

// ─────────────────────────── Floating ☰ (routes without AppHeader) ───────────────────────────

function FloatingMenuButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      aria-label="Abrir menú"
      aria-haspopup="dialog"
      className="fixed top-3 right-3 z-40 h-10 w-10 grid place-items-center rounded-full bg-black/50 backdrop-blur text-white/90 hover:text-white hover:bg-black/70 border border-white/10 transition-colors"
    >
      <Menu size={20} />
    </button>
  );
}

// ─────────────────────────── Drawer ───────────────────────────

type NavItem = { to: string; label: string; icon: typeof Store };

const COMMON_ITEMS: NavItem[] = [
  { to: "/mapa", label: "Mapa", icon: MapIcon },
  { to: "/pitches", label: "Mis Pitches", icon: FileText },
];


const MANAGER_ITEMS: NavItem[] = [
  { to: "/mi-empresa", label: "Mi Empresa", icon: Store },
  { to: "/equipo", label: "Mi Equipo", icon: Users },
];

const PROFILE_ITEM: NavItem = { to: "/mi-perfil", label: "Mi Perfil", icon: UserIcon };

// Robust logout: purge local session synchronously, then navigate.
// Any hang in supabase.auth.signOut() cannot block the user.
function purgeLocalSession() {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith("sb-") && k.endsWith("-auth-token")) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
    sessionStorage.removeItem("closer:selectedRole");
    sessionStorage.removeItem("closer:pendingCompanyName");
    sessionStorage.removeItem("closer:pendingInviteCode");
  } catch {
    /* ignore */
  }
}

function AppDrawer({
  open,
  onClose,
  role,
  isPersonal,
}: {
  open: boolean;
  onClose: () => void;
  role: Role;
  isPersonal: boolean;
}) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<Element | null>(null);
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  useEffect(() => {
    if (open) openerRef.current = document.activeElement;
    else if (openerRef.current instanceof HTMLElement) openerRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) setConfirmingLogout(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", handler);
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("[data-drawer-close]")?.focus();
    }, 60);
    return () => { document.removeEventListener("keydown", handler); window.clearTimeout(t); };
  }, [open, onClose]);

  const handleLogout = () => {
    // 1) Clear caches + local session synchronously (never awaits network).
    try { queryClient.clear(); } catch { /* ignore */ }
    purgeLocalSession();
    // 2) Fire-and-forget SDK signOut so the server-side session is also revoked.
    void (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        await supabase.auth.signOut();
      } catch {
        /* ignore — local state is already cleared */
      }
    })();
    // 3) Navigate immediately.
    onClose();
    navigate({ to: "/login", replace: true });
  };

  const items: NavItem[] = [
    ...COMMON_ITEMS,
    ...(role === "manager" && !isPersonal ? MANAGER_ITEMS : []),
    PROFILE_ITEM,
  ];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100]">
          <motion.button
            aria-label="Cerrar menú"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-black/60"
          />
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menú de la app"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-y-0 left-0 w-[85%] max-w-[340px] bg-[#0D0D18] border-r border-white/10 shadow-2xl flex flex-col"
            onPointerDown={(e) => {
              const startX = e.clientX;
              const el = panelRef.current;
              if (!el) return;
              let dx = 0;
              const move = (ev: PointerEvent) => {
                dx = Math.min(0, ev.clientX - startX);
                el.style.transform = `translateX(${dx}px)`;
              };
              const up = (ev: PointerEvent) => {
                window.removeEventListener("pointermove", move);
                window.removeEventListener("pointerup", up);
                el.style.transform = "";
                if (dx < -60 || (ev.clientX - startX) < -60) onClose();
              };
              window.addEventListener("pointermove", move);
              window.addEventListener("pointerup", up);
            }}
          >
            <div className="flex items-center gap-3 px-4 pt-4 pb-2">
              <button
                data-drawer-close
                onClick={onClose}
                aria-label="Cerrar menú"
                className="h-10 w-10 grid place-items-center rounded-full text-white/80 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={22} />
              </button>
              <div className="font-['Syne'] font-black text-[#FF6B2B] tracking-tight text-lg">
                CLOSER
              </div>
            </div>

            <nav className="mt-3 flex-1 overflow-y-auto px-2 pb-4">
              <ul className="flex flex-col gap-1">
                {items.map((item) => {
                  const active = pathname === item.to || pathname.startsWith(item.to + "/");
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={onClose}
                        className={[
                          "flex items-center gap-3 px-3 py-3 rounded-[14px] font-['DM_Sans'] font-medium text-[0.95rem] transition-colors",
                          active
                            ? "bg-[#FF6B2B]/15 text-[#FF6B2B] border border-[#FF6B2B]/30"
                            : "text-white/85 hover:bg-white/5 border border-transparent",
                        ].join(" ")}
                      >
                        <Icon size={18} className="shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="border-t border-white/10 px-3 py-3">
              {!confirmingLogout ? (
                <button
                  onClick={() => setConfirmingLogout(true)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-[14px] font-['DM_Sans'] font-medium text-[0.95rem] text-white/85 hover:bg-white/5 border border-transparent transition-colors"
                >
                  <LogOut size={18} className="shrink-0" />
                  <span>Cerrar sesión</span>
                </button>
              ) : (
                <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-3">
                  <div className="font-['DM_Sans'] text-[0.85rem] text-white/85 mb-3">
                    ¿Seguro que quieres cerrar sesión?
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmingLogout(false)}
                      className="flex-1 px-3 py-2 rounded-full border border-white/15 text-white/80 hover:text-white hover:border-white/30 font-['DM_Sans'] text-[0.85rem] font-semibold transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex-1 px-3 py-2 rounded-full bg-[#FF6B2B] text-white hover:bg-[#ff7d47] font-['DM_Sans'] text-[0.85rem] font-semibold transition-colors"
                    >
                      Sí, salir
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────── Header ───────────────────────────

type AppHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  back?: { to: string; label?: string };
  rightExtras?: ReactNode;
};

export function AppHeader({ title, subtitle, back, rightExtras }: AppHeaderProps) {
  const { isAuthed, openDrawer, registerHeader } = useAppShell();

  useEffect(() => {
    const unregister = registerHeader();
    return unregister;
  }, [registerHeader]);

  return (
    <header
      className="sticky top-0 z-30 flex items-start justify-between gap-3 px-4 pt-3 pb-4"
      style={{
        background:
          "linear-gradient(180deg, #08080F 0%, #08080F 72%, transparent 100%)",
      }}
    >
      <div className="flex items-center gap-1 min-w-0">
        {isAuthed ? (
          <button
            onClick={openDrawer}
            aria-label="Abrir menú"
            aria-haspopup="dialog"
            className="h-10 w-10 shrink-0 grid place-items-center rounded-full text-white/85 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Menu size={22} />
          </button>
        ) : null}
        {back && (
          <Link
            to={back.to}
            aria-label={back.label ?? "Volver"}
            className="h-10 w-10 shrink-0 grid place-items-center rounded-full text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
        )}
        <div className="min-w-0 pl-1">
          <div className="font-['Syne'] font-extrabold text-[#FF6B2B] tracking-tight text-[1.25rem] leading-tight truncate">
            {title}
          </div>
          {subtitle && (
            <div className="font-['DM_Sans'] text-[0.68rem] uppercase tracking-[0.06em] text-[#5A5A8A] truncate">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {rightExtras && (
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          {rightExtras}
        </div>
      )}
    </header>
  );
}
