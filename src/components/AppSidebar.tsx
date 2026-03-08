import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  ExternalLink,
  Home,
  Instagram,
  Menu,
  Search,
  ShieldCheck,
  X,
  Youtube,
} from "lucide-react";
import logo from "@/assets/logo.png";

const navItems = [
  { icon: Home, label: "Home", path: "/", hint: "Painel principal" },
  { icon: Search, label: "Busca", path: "/busca", hint: "Encontrar politico" },
  { icon: BarChart3, label: "Rankings", path: "/rankings", hint: "Comparativos" },
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
          <button onClick={() => goTo("/")} className="inline-flex items-center gap-2">
            <img src={logo} alt="Radar do Povo" className="h-9 w-auto" />
            <span className="text-sm font-display font-semibold text-foreground">Radar do Povo</span>
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
        className={`fixed left-0 top-0 z-50 h-full w-72 border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-elevated transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto">
          <div className="border-b border-sidebar-border px-5 py-5">
            <div className="flex items-center justify-between gap-2">
              <button onClick={() => goTo("/")} className="inline-flex items-center gap-3 text-left">
                <img src={logo} alt="Radar do Povo" className="h-12 w-auto" />
                <div>
                  <p className="font-display text-sm font-semibold text-sidebar-foreground">Radar do Povo</p>
                  <p className="text-[11px] text-sidebar-foreground/65">Transparencia em foco</p>
                </div>
              </button>

              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-sidebar-foreground/70 hover:bg-muted lg:hidden"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <nav className="px-3 py-4">
            {navItems.map((item) => {
              const active = location.pathname === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => goTo(item.path)}
                  className={`mb-1.5 w-full rounded-xl border px-3.5 py-3 text-left transition-all duration-200 ${
                    active
                      ? "border-primary/25 bg-primary/10 text-primary"
                      : "border-transparent text-sidebar-foreground hover:border-border hover:bg-muted/70"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="text-[11px] text-sidebar-foreground/60">{item.hint}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="mx-3 mt-1 rounded-2xl border border-border bg-card p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Dados</p>
            <p className="mt-2 text-sm font-semibold text-foreground">Consulta segura via backend</p>
            <p className="mt-1 text-xs text-muted-foreground">
              O frontend consulta apenas rotas internas do projeto. A URL real da API fica protegida no ambiente da Vercel.
            </p>
            <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Endpoint oculto do cliente
            </div>
          </div>

          <div className="mx-3 mt-3 rounded-2xl border border-border bg-card p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Links</p>
            <a
              href="https://www.portaltransparencia.gov.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
            >
              Portal da Transparencia
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          </div>

          <div className="mt-auto border-t border-sidebar-border px-5 py-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">Radar monitorando gastos</p>
              <Activity className="h-4 w-4 text-primary animate-pulse-glow rounded-full" />
            </div>

            <div className="mt-3 flex items-center gap-2">
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-border p-2 text-muted-foreground hover:bg-muted"
                aria-label="YouTube"
              >
                <Youtube className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-border p-2 text-muted-foreground hover:bg-muted"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
