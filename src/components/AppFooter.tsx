import {
  ArrowUpRight,
  BookOpenText,
  FileText,
  Mail,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

const primaryLinks = [
  { label: "Home", path: "/" },
  { label: "Viagens", path: "/viagens" },
  { label: "Rankings", path: "/rankings" },
  { label: "Busca", path: "/busca" },
];

const footerNotes = [
  {
    icon: Scale,
    title: "Termos de uso",
    body:
      "O painel foi pensado para consulta publica, leitura analitica e acompanhamento civico. Os dados podem ser reutilizados com citacao da fonte e do recorte aplicado.",
  },
  {
    icon: BookOpenText,
    title: "Metodologia",
    body:
      "Os numeros exibidos derivam de bases publicas e filtros selecionados em cada tela. Valores, rankings e totais podem mudar conforme atualizacoes oficiais.",
  },
  {
    icon: FileText,
    title: "Diretriz editorial",
    body:
      "O Radar do Povo organiza informacao publica para facilitar leitura, comparacao e rastreabilidade. Ele nao substitui a publicacao oficial do orgao de origem.",
  },
];

type AppFooterProps = {
  className?: string;
};

const AppFooter = ({ className }: AppFooterProps) => {
  const location = useLocation();
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "relative overflow-hidden rounded-[32px] border border-white/70 bg-card/90 p-5 shadow-elevated backdrop-blur-sm sm:p-7",
        className
      )}
    >
      <div className="absolute -left-16 top-0 h-36 w-36 rounded-full bg-cyan-200/25 blur-3xl" />
      <div className="absolute -right-16 bottom-0 h-40 w-40 rounded-full bg-blue-200/20 blur-3xl" />

      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          <ShieldCheck className="h-3.5 w-3.5" />
          Rodape institucional
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <section className="rounded-[28px] border border-border/70 bg-background/85 p-5 sm:p-6">
            <img src={logo} alt="Radar do Povo" className="h-12 w-auto" />
            <h2 className="mt-4 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Transparencia publica com leitura clara e rastreavel.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              O projeto organiza viagens oficiais, emendas e perfis politicos em uma experiencia
              analitica voltada para contexto, comparacao e entendimento rapido dos dados.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                dados publicos
              </span>
              <span className="rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                leitura analitica
              </span>
              <span className="rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                atualizacao continua
              </span>
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <section className="rounded-[28px] border border-border/70 bg-background/85 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Explorar
              </p>
              <div className="mt-4 grid gap-2">
                {primaryLinks.map((item) => {
                  const active = location.pathname === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors",
                        active
                          ? "border-primary/20 bg-primary/10 text-primary"
                          : "border-border/70 bg-card text-foreground hover:border-primary/20 hover:bg-muted/60"
                      )}
                    >
                      <span>{item.label}</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[28px] border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Contato
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Canal para correcoes, observacoes editoriais, pedidos institucionais e sugestoes de
                melhoria do painel.
              </p>
              <a
                href="mailto:radardopovo@proton.me"
                className="mt-4 inline-flex w-full items-center justify-between rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50"
              >
                <span className="inline-flex min-w-0 items-center gap-2 truncate">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">radardopovo@proton.me</span>
                </span>
                <ArrowUpRight className="h-4 w-4 flex-shrink-0" />
              </a>
            </section>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {footerNotes.map((item) => (
            <article
              key={item.title}
              className="rounded-[24px] border border-border/70 bg-background/80 p-5"
            >
              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-primary/10 p-2 text-primary">
                  <item.icon className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-border/70 pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} Radar do Povo. Transparencia publica, contexto analitico e leitura orientada a
            dados.
          </p>
          <p>Fontes publicas podem ser atualizadas pelos orgaos de origem ao longo do tempo.</p>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
