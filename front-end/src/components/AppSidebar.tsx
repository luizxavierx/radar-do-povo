import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  ChevronRight,
  Compass,
  Home,
  LibraryBig,
  Menu,
  Plane,
  Search,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import logo from "@/assets/logo.png";
import { buildHoverLift, buildRevealVariants, buildStaggerVariants, editorialEase } from "@/lib/motion";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Monitoramento",
    items: [
      { icon: Home, label: "Home", path: "/", hint: "Panorama principal" },
      { icon: Plane, label: "Viagens", path: "/viagens", hint: "Custos oficiais" },
      { icon: BarChart3, label: "Rankings", path: "/rankings", hint: "Comparativos" },
    ],
  },
  {
    label: "Explorar",
    items: [{ icon: Search, label: "Busca", path: "/busca", hint: "Encontrar politico" }],
  },
] as const;

const quickLinks = [
  {
    icon: Compass,
    label: "Painel de viagens",
    description: "Visao principal",
    path: "/viagens",
  },
  {
    icon: LibraryBig,
    label: "Comparativos",
    description: "Rankings anuais",
    path: "/rankings",
  },
] as const;

const AppSidebar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const goTo = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const currentMeta = useMemo(() => {
    const flatItems = navGroups.flatMap((group) => group.items);
    return flatItems.find((item) => item.path === location.pathname);
  }, [location.pathname]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/75 bg-white/92 backdrop-blur-sm lg:hidden">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-4">
          <button onClick={() => goTo("/")} className="inline-flex items-center">
            <img src={logo} alt="Radar do Povo" className="h-9 w-auto" />
          </button>

          <button
            onClick={() => setOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border/80 bg-white text-foreground shadow-card"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduceMotion ? { duration: 0.01 } : { duration: 0.2, ease: editorialEase }}
            className="fixed inset-0 z-40 bg-slate-950/28 backdrop-blur-[2px] lg:hidden"
            onClick={() => setOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-72 border-r border-sidebar-border bg-[linear-gradient(180deg,#f8fbfc_0%,#ffffff_22%,#f7fafb_100%)] text-sidebar-foreground shadow-[8px_0_32px_-24px_rgba(15,23,42,0.28)] transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col overflow-y-auto">
          <div className="border-b border-sidebar-border/80 px-5 py-5">
            <div className="flex items-center justify-between gap-2">
              <button onClick={() => goTo("/")} className="inline-flex items-center text-left">
                <img src={logo} alt="Radar do Povo" className="h-12 w-auto" />
              </button>

              <button
                onClick={() => setOpen(false)}
                className="rounded-xl p-2 text-sidebar-foreground/70 transition-colors hover:bg-muted lg:hidden"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 rounded-[1.6rem] border border-primary/12 bg-[linear-gradient(160deg,rgba(15,118,110,0.07),rgba(255,255,255,0.94)_60%)] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
                Painel institucional
              </p>
              <p className="mt-2 text-[15px] font-semibold leading-6 text-foreground">
                Dados publicos organizados para leitura analitica.
              </p>
              {currentMeta ? (
                <div className="mt-4 editorial-divider" />
              ) : null}
              {currentMeta ? (
                <div className="mt-4 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-semibold text-foreground">{currentMeta.label}</p>
                    <p className="text-muted-foreground">{currentMeta.hint}</p>
                  </div>
                  <span className="rounded-full border border-primary/15 bg-white px-2.5 py-1 font-medium text-primary">
                    ativo
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <motion.nav
            variants={buildStaggerVariants(Boolean(reduceMotion))}
            initial="hidden"
            animate="visible"
            className="space-y-6 px-3 py-5"
          >
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/52">
                  {group.label}
                </p>
                <div className="space-y-1.5">
                  {group.items.map((item) => {
                    const active = location.pathname === item.path;
                    const Icon = item.icon;

                    return (
                      <motion.button
                        key={item.path}
                        variants={buildRevealVariants(Boolean(reduceMotion), { y: 10 })}
                        whileHover={buildHoverLift(Boolean(reduceMotion), -1.5)}
                        onClick={() => goTo(item.path)}
                        className={cn(
                          "group relative w-full overflow-hidden rounded-[1.35rem] border px-3.5 py-3 text-left transition-colors",
                          active
                            ? "border-primary/18 bg-white text-foreground shadow-card"
                            : "border-transparent bg-transparent text-sidebar-foreground hover:border-border/70 hover:bg-white/82"
                        )}
                      >
                        <div
                          className={cn(
                            "absolute left-0 top-3 bottom-3 w-[3px] rounded-full transition-colors",
                            active ? "bg-primary" : "bg-transparent group-hover:bg-primary/16"
                          )}
                        />
                        <div
                          className={cn(
                            "absolute inset-0 opacity-0 transition-opacity duration-200",
                            active
                              ? "bg-[linear-gradient(90deg,rgba(15,118,110,0.08),transparent_45%)] opacity-100"
                              : "group-hover:opacity-100 bg-[linear-gradient(90deg,rgba(15,118,110,0.05),transparent_40%)]"
                          )}
                        />
                        <div className="relative flex items-center gap-3 pl-2">
                          <span
                            className={cn(
                              "rounded-[1rem] border px-2 py-2",
                              active
                                ? "border-primary/12 bg-primary/8 text-primary"
                                : "border-border/60 bg-white/80 text-sidebar-foreground"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold">{item.label}</p>
                            <p className="text-[11px] text-sidebar-foreground/58">{item.hint}</p>
                          </div>
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 transition-all duration-200",
                              active
                                ? "translate-x-0 text-primary"
                                : "text-sidebar-foreground/35 group-hover:translate-x-0.5"
                            )}
                          />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="rounded-[1.55rem] border border-sidebar-border/80 bg-white/88 p-3">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/52">
                Atalhos uteis
              </p>
              <div className="mt-3 space-y-2">
                {quickLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <motion.button
                      key={item.label}
                      variants={buildRevealVariants(Boolean(reduceMotion), { y: 10 })}
                      whileHover={buildHoverLift(Boolean(reduceMotion), -1.5)}
                      onClick={() => goTo(item.path)}
                      className="flex w-full items-center gap-3 rounded-[1.3rem] border border-transparent bg-background/82 px-3 py-3 text-left transition-colors hover:border-border/70 hover:bg-white"
                    >
                      <span className="rounded-[1rem] bg-primary/8 p-2 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{item.label}</p>
                        <p className="text-[11px] text-muted-foreground">{item.description}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.nav>

          <div className="mt-auto border-t border-sidebar-border/80 px-5 py-5">
            <div className="rounded-[1.45rem] border border-border/70 bg-white/88 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Status da base
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">Monitoramento ativo</p>
                </div>
                <motion.span
                  animate={reduceMotion ? undefined : { scale: [1, 1.06, 1] }}
                  transition={reduceMotion ? undefined : { duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/12 bg-primary/8 text-primary"
                >
                  <Activity className="h-4 w-4" />
                </motion.span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
