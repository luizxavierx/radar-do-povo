import { ShieldCheck } from "lucide-react";

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

const InstitutionalPageShell = ({
  eyebrow,
  title,
  intro,
  sections,
}: InstitutionalPageShellProps) => {
  return (
    <div>
      <AppSidebar />

      <main className="lg:ml-72">
        <div className="mx-auto w-full max-w-[920px] px-4 pb-10 pt-20 sm:px-6 sm:pt-24 lg:pt-10">
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

          <section className="mt-6 space-y-4">
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
          </section>
        </div>
      </main>
    </div>
  );
};

export default InstitutionalPageShell;
