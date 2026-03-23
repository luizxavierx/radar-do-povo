import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  ChevronRight,
  Compass,
  Home,
  KeyRound,
  LibraryBig,
  Menu,
  Plane,
  Search,
  X,
} from "lucide-react";
import logo from "@/assets/logo.png";

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
  {
    label: "Membros",
    items: [{ icon: KeyRound, label: "Membros", path: "/membros", hint: "API paga e docs" }],
  },
];

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
  {
    icon: KeyRound,
    label: "Area de membros",
    description: "Plano mensal",
    path: "/membros",
  },
];

const AppSidebar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const goTo = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/80 bg-white/95 backdrop-blur-sm lg:hidden">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-4">
          <button onClick={() => goTo("/")} className="inline-flex items-center">
            <img src={logo} alt="Radar do Povo" className="h-9 w-auto" />
          </button>

          <button
            onClick={() => setOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-card"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {open ? (
        <div
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-50 h-full w-72 border-r border-sidebar-border bg-[linear-gradient(180deg,#f7fbfd_0%,#ffffff_16%,#f9fbfc_100%)] text-sidebar-foreground shadow-elevated transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto">
          <div className="border-b border-sidebar-border/80 px-5 py-5">
            <div className="flex items-center justify-between gap-2">
              <button onClick={() => goTo("/")} className="inline-flex items-center text-left">
                <img src={logo} alt="Radar do Povo" className="h-12 w-auto" />
              </button>

              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-sidebar-foreground/70 hover:bg-muted lg:hidden"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-[24px] border border-primary/15 bg-gradient-to-br from-primary/10 via-white to-cyan-50 p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                Painel institucional
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                Dados publicos organizados para leitura clara.
              </p>
            </div>
          </div>

          <nav className="space-y-6 px-3 py-5">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/55">
                  {group.label}
                </p>
                <div className="space-y-1.5">
                  {group.items.map((item) => {
                    const active = location.pathname === item.path;

                    return (
                      <button
                        key={item.path}
                        onClick={() => goTo(item.path)}
                        className={`group relative w-full overflow-hidden rounded-2xl border px-3.5 py-3 text-left transition-all duration-200 ${
                          active
                            ? "border-primary/20 bg-primary/10 text-primary shadow-sm"
                            : "border-transparent text-sidebar-foreground hover:border-border/70 hover:bg-white"
                        }`}
                      >
                        <div
                          className={`absolute left-0 top-3 bottom-3 w-1 rounded-full transition-colors ${
                            active ? "bg-primary" : "bg-transparent group-hover:bg-primary/20"
                          }`}
                        />
                        <div className="flex items-center gap-3 pl-2">
                          <span
                            className={`rounded-xl p-2 ${
                              active ? "bg-white text-primary" : "bg-white/70 text-sidebar-foreground"
                            }`}
                          >
                            <item.icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold">{item.label}</p>
                            <p className="text-[11px] text-sidebar-foreground/60">{item.hint}</p>
                          </div>
                          <ChevronRight
                            className={`h-4 w-4 transition-transform ${
                              active ? "translate-x-0 text-primary" : "text-sidebar-foreground/40 group-hover:translate-x-0.5"
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="rounded-[24px] border border-sidebar-border/80 bg-white/80 p-3 shadow-sm">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/55">
                Atalhos uteis
              </p>
              <div className="mt-3 space-y-2">
                {quickLinks.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => goTo(item.path)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-transparent bg-background/85 px-3 py-3 text-left transition-colors hover:border-border/70 hover:bg-white"
                  >
                    <span className="rounded-xl bg-primary/10 p-2 text-primary">
                      <item.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground">{item.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </nav>

          <div className="mt-auto border-t border-sidebar-border/80 px-5 py-5">
            <div className="rounded-[20px] border border-border/70 bg-white/80 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Status da base
                </p>
                <Activity className="h-4 w-4 animate-pulse-glow rounded-full text-primary" />
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">
                Monitoramento ativo.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
