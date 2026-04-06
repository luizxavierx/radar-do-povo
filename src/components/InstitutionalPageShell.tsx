import { ShieldCheck } from "lucide-react";

import AppSidebar from "@/components/AppSidebar";
import EditorialPageHeader from "@/components/EditorialPageHeader";
import EditorialSection from "@/components/EditorialSection";
import SeoHead from "@/components/SeoHead";
import { buildBreadcrumbStructuredData, buildCanonicalUrl } from "@/lib/seo";

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
  seoTitle: string;
  seoDescription: string;
  seoPath: string;
};

const InstitutionalPageShell = ({
  eyebrow,
  title,
  intro,
  sections,
  seoTitle,
  seoDescription,
  seoPath,
}: InstitutionalPageShellProps) => {
  return (
    <div>
      <SeoHead
        title={seoTitle}
        description={seoDescription}
        path={seoPath}
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: seoTitle,
            description: seoDescription,
            url: buildCanonicalUrl(seoPath),
            inLanguage: "pt-BR",
            isPartOf: {
              "@type": "WebSite",
              name: "Radar do Povo",
              url: "https://radardopovo.com",
            },
          },
          buildBreadcrumbStructuredData([
            { name: "Home", path: "/" },
            { name: title, path: seoPath },
          ]),
        ]}
      />
      <AppSidebar />

      <main className="lg:ml-72">
        <div className="mx-auto w-full max-w-[920px] px-4 pb-10 pt-20 sm:px-6 sm:pt-24 lg:pt-10">
          <EditorialPageHeader
            eyebrow={eyebrow}
            icon={ShieldCheck}
            title={title}
            description={intro}
          />

          <section className="mt-6 space-y-4">
            {sections.map((section) => (
              <EditorialSection key={section.title} tone="muted">
                <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
                <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                {section.bullets?.length ? (
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="surface-muted px-4 py-3">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </EditorialSection>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
};

export default InstitutionalPageShell;
