import { ArrowUpRight, Mail, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import AppSidebar from "@/components/AppSidebar";

type InstitutionalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

type InstitutionalPageShellProps = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: InstitutionalSection[];
};

const institutionalLinks = [
  { label: "Termos", path: "/termos" },
  { label: "Metodologia", path: "/metodologia" },
  { label: "Diretriz editorial", path: "/diretrizes-editoriais" },
  { label: "Contato", path: "/contato" },
];

const InstitutionalPageShell = ({
  eyebrow,
  title,
  intro,
  sections,
}: InstitutionalPageShellProps) => {
  const location = useLocation();

  return (
    <div>
      <AppSidebar />

      <main className="lg:ml-72">
        <div className="mx-auto w-full max-w-[1120px] px-4 pb-10 pt-20 sm:px-6 sm:pt-24 lg:pt-10">
          <section className="rounded-[32px] border border-white/70 bg-card/92 p-6 shadow-elevated backdrop-blur-sm sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              {eyebrow}
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              {intro}
            </p>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4">
              {sections.map((section) => (
                <article
                  key={section.title}
                  className="rounded-[28px] border border-border/70 bg-card/88 p-5 shadow-card sm:p-6"
                >
                  <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
                  <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                  {section.bullets?.length ? (
                    <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="rounded-2xl border border-border/70 bg-background/85 px-4 py-3">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ))}
            </div>

            <aside className="space-y-4">
              <section className="rounded-[28px] border border-border/70 bg-card/88 p-5 shadow-card">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Areas institucionais
                </p>
                <div className="mt-4 grid gap-2">
                  {institutionalLinks.map((item) => {
                    const active = location.pathname === item.path;

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`inline-flex items-center justify-between rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors ${
                          active
                            ? "border-primary/20 bg-primary/10 text-primary"
                            : "border-border/70 bg-background text-foreground hover:border-primary/20 hover:bg-muted/60"
                        }`}
                      >
                        <span>{item.label}</span>
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-[28px] border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-5 shadow-card">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  Contato institucional
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Para correcoes, observacoes editoriais ou duvidas sobre os recortes publicados,
                  use o canal abaixo.
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
            </aside>
          </section>
        </div>
      </main>
    </div>
  );
};

export default InstitutionalPageShell;
