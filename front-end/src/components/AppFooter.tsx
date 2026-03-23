import {
  BarChart3,
  BookOpenText,
  ChevronRight,
  FileText,
  House,
  KeyRound,
  Landmark,
  Mail,
  Plane,
  ScrollText,
  Search,
  Send,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

const primaryLinks = [
  { label: "Home", path: "/", icon: House },
  { label: "Viagens", path: "/viagens", icon: Plane },
  { label: "Rankings", path: "/rankings", icon: BarChart3 },
  { label: "Busca", path: "/busca", icon: Search },
  { label: "Membros", path: "/membros", icon: KeyRound },
];

const institutionalLinks = [
  { label: "Docs da API", path: "/membros/docs", icon: KeyRound },
  { label: "Termos", path: "/termos", icon: ScrollText },
  { label: "Metodologia", path: "/metodologia", icon: BookOpenText },
  { label: "Diretriz editorial", path: "/diretrizes-editoriais", icon: FileText },
  { label: "Contato", path: "/contato", icon: Send },
];

type AppFooterProps = {
  className?: string;
};

const AppFooter = ({ className }: AppFooterProps) => {
  const location = useLocation();
  const year = new Date().getFullYear();

  return (
    <footer className={cn("border-t border-border/70 pt-6", className)}>
      <div className="rounded-[28px] border border-white/70 bg-card/92 p-5 shadow-card backdrop-blur-sm sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(180px,0.7fr)_minmax(220px,0.8fr)]">
          <section className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              <Landmark className="h-3.5 w-3.5" />
              Rodape institucional
            </div>

            <img src={logo} alt="Radar do Povo" className="mt-4 h-11 w-auto" />

            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
              Plataforma de leitura analitica sobre dados publicos, com foco em rastreabilidade,
              comparacao e acesso mais claro a informacoes de interesse publico.
            </p>
          </section>

          <nav className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Navegacao
            </p>
            <div className="mt-3 grid gap-2">
              {primaryLinks.map((item) => {
                const active = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "inline-flex items-center justify-between rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                      active
                        ? "border-primary/20 bg-primary/10 text-primary"
                        : "border-border/70 bg-background text-foreground hover:border-primary/20 hover:bg-muted/60"
                    )}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="min-w-0 space-y-4">
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Institucional
              </p>
              <div className="mt-3 grid gap-2">
                {institutionalLinks.map((item) => {
                  const active = location.pathname === item.path;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "inline-flex items-center justify-between rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                        active
                          ? "border-primary/20 bg-primary/10 text-primary"
                          : "border-border/70 bg-background text-foreground hover:border-primary/20 hover:bg-muted/60"
                      )}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Contato
              </p>
              <a
                href="mailto:radardopovo@proton.me"
                className="mt-3 inline-flex w-full items-center justify-between rounded-2xl border border-emerald-200 bg-white px-3 py-3 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50"
              >
                <span className="inline-flex min-w-0 items-center gap-2 truncate">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">radardopovo@proton.me</span>
                </span>
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
              </a>
            </section>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-border/70 pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>(c) {year} Radar do Povo. Dados publicos organizados para leitura analitica.</p>
          <p>Os recortes podem variar conforme filtros e atualizacoes das bases oficiais.</p>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
