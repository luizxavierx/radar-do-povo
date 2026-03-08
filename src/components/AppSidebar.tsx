import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  BarChart3,
  Search,
  Menu,
  X,
  Youtube,
  Instagram,
  ExternalLink,
  Database,
  Activity,
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

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden rounded-2xl bg-sidebar p-3 text-sidebar-foreground shadow-elevated"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="relative h-full overflow-y-auto">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(8,145,178,0.25),_transparent_55%)]" />
          <div className="absolute -left-16 top-32 h-44 w-44 rounded-full bg-cyan-400/15 blur-3xl" />

          <div className="relative px-5 py-5 border-b border-sidebar-border">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-3 text-left"
              >
                <img src={logo} alt="Radar do Povo" className="h-11 w-auto" />
                <div>
                  <p className="font-display text-sm font-semibold tracking-wide">Radar do Povo</p>
                  <p className="text-[11px] text-sidebar-foreground/70">Transparencia em foco</p>
                </div>
              </button>

              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-sidebar-foreground/75 hover:bg-white/10 lg:hidden"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <nav className="relative px-3 py-4 space-y-1.5">
            {navItems.map((item) => {
              const active = location.pathname === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`group w-full rounded-xl px-3.5 py-3 text-left transition-all duration-200 ${
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-glow"
                      : "text-sidebar-foreground/88 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`h-4 w-4 ${active ? "text-cyan-300" : "text-sidebar-foreground/70"}`} />
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="text-[11px] text-sidebar-foreground/60 group-hover:text-sidebar-foreground/80">
                        {item.hint}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="relative mx-3 mt-2 rounded-2xl border border-sidebar-border/80 bg-white/5 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/60">Dados</p>
            <p className="mt-2 text-sm font-medium text-sidebar-foreground">API Radar do Povo</p>
            <p className="mt-1 text-xs text-sidebar-foreground/70">
              Integracao em tempo real com emendas, viagens e perfis publicos.
            </p>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-sidebar-foreground/70">
              <Database className="h-3.5 w-3.5" />
              Fontes governamentais e bases abertas
            </div>
          </div>

          <div className="relative mx-3 mt-3 rounded-2xl border border-sidebar-border/80 bg-white/5 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/60">Links</p>
            <a
              href="https://api.radardopovo.com/graphql"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-between rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-sidebar-foreground hover:bg-white/20"
            >
              Endpoint GraphQL
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href="https://www.portaltransparencia.gov.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-between rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-sidebar-foreground hover:bg-white/20"
            >
              Portal da Transparencia
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="relative mt-4 border-t border-sidebar-border px-5 py-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-sidebar-foreground/70">Radar monitorando gastos</p>
              <Activity className="h-4 w-4 text-cyan-300 animate-pulse-glow rounded-full" />
            </div>

            <div className="mt-3 flex items-center gap-2">
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-sidebar-border p-2 text-sidebar-foreground/75 hover:bg-white/10"
                aria-label="YouTube"
              >
                <Youtube className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-sidebar-border p-2 text-sidebar-foreground/75 hover:bg-white/10"
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
