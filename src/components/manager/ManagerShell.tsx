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
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { Menu, X, Store, Users, LogOut, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

// ─────────────────────────── Context ───────────────────────────

type ManagerShellCtx = {
  isManager: boolean;
  isReady: boolean;
  open: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const Ctx = createContext<ManagerShellCtx>({
  isManager: false,
  isReady: false,
  open: false,
  openDrawer: () => {},
  closeDrawer: () => {},
});

export function useManagerShell() {
  return useContext(Ctx);
}

// ─────────────────────────── Provider ───────────────────────────

export function ManagerShellProvider({ children }: { children: ReactNode }) {
  const [isManager, setIsManager] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [open, setOpen] = useState(false);

  // Detect manager role once auth is available; re-check on auth changes.
  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) {
          setIsManager(false);
          setIsReady(true);
        }
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setIsManager(prof?.role === "manager");
      setIsReady(true);
    };

    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const openDrawer = useCallback(() => setOpen(true), []);
  const closeDrawer = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ isManager, isReady, open, openDrawer, closeDrawer }),
    [isManager, isReady, open, openDrawer, closeDrawer],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {isManager && <ManagerDrawer open={open} onClose={closeDrawer} />}
    </Ctx.Provider>
  );
}

// ─────────────────────────── Drawer ───────────────────────────

type NavItem = { to: string; label: string; icon: typeof Store };

const NAV_ITEMS: NavItem[] = [
  { to: "/mi-empresa", label: "Mi Empresa", icon: Store },
  { to: "/equipo", label: "Mi Equipo", icon: Users },
];

function ManagerDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const panelRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<Element | null>(null);
  const x = useMotionValue(0);
  const scrimOpacity = useTransform(x, [-320, 0], [0, 1]);

  // Remember the trigger to restore focus.
  useEffect(() => {
    if (open) {
      openerRef.current = document.activeElement;
    } else if (openerRef.current instanceof HTMLElement) {
      openerRef.current.focus();
    }
  }, [open]);

  // Body scroll lock while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape to close + focus trap.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    // Autofocus the close button.
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("[data-drawer-close]")?.focus();
    }, 60);
    return () => {
      document.removeEventListener("keydown", handler);
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100]">
          {/* Scrim */}
          <motion.button
            aria-label="Cerrar menú"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-black/60"
            style={{ opacity: scrimOpacity as unknown as number }}
          />
          {/* Panel */}
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navegación del manager"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.6, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60 || info.velocity.x < -300) onClose();
            }}
            style={{ x }}
            className="absolute inset-y-0 left-0 w-[85%] max-w-[340px] bg-[#0D0D18] border-r border-white/10 shadow-2xl flex flex-col"
          >
            {/* Close (top-left, matches ☰ position) */}
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

            <div className="px-3 mt-2 text-[0.65rem] uppercase tracking-[0.14em] text-white/40 font-['DM_Sans'] font-bold pl-4">
              Panel del manager
            </div>

            <nav className="mt-3 flex-1 overflow-y-auto px-2 pb-6">
              <ul className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => {
                  const active =
                    pathname === item.to || pathname.startsWith(item.to + "/");
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
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────── Header ───────────────────────────

type ManagerHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  back?: { to: string; label?: string };
  rightExtras?: ReactNode;
  showLogout?: boolean;
};

export function ManagerHeader({
  title,
  subtitle,
  back,
  rightExtras,
  showLogout = true,
}: ManagerHeaderProps) {
  const { isManager, openDrawer } = useManagerShell();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("closer:selectedRole");
      sessionStorage.removeItem("closer:pendingCompanyName");
      sessionStorage.removeItem("closer:pendingInviteCode");
    }
    navigate({ to: "/login", replace: true });
  };

  return (
    <header
      className="sticky top-0 z-30 flex items-start justify-between gap-3 px-4 pt-3 pb-4"
      style={{
        background:
          "linear-gradient(180deg, #08080F 0%, #08080F 72%, transparent 100%)",
      }}
    >
      {/* Left: ☰ (fixed) + optional Back */}
      <div className="flex items-center gap-1 min-w-0">
        {isManager ? (
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

      {/* Right: page extras + logout */}
      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
        {rightExtras}
        {showLogout && (
          <button
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            className="inline-flex items-center gap-1 rounded-full border border-[#252535] px-3 py-1.5 text-[0.7rem] font-['DM_Sans'] font-semibold text-[#5A5A8A] hover:text-white hover:border-white/30 transition-colors"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        )}
      </div>
    </header>
  );
}
