export const SEO_SITE_NAME = "Radar do Povo";
export const SEO_SITE_URL = "https://radardopovo.com";
export const SEO_DEFAULT_IMAGE = `${SEO_SITE_URL}/logo.png`;
export const SEO_DEFAULT_TITLE = `${SEO_SITE_NAME} | Transparencia politica em dados`;
export const SEO_DEFAULT_DESCRIPTION =
  "Consulte viagens oficiais, emendas parlamentares, rankings comparativos e perfis politicos em uma leitura clara orientada por dados publicos.";
export const SEO_DEFAULT_ROBOTS =
  "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
export const SEO_DEFAULT_KEYWORDS = [
  "radar do povo",
  "transparencia politica",
  "dados publicos",
  "emendas parlamentares",
  "viagens oficiais",
  "gastos publicos",
  "perfis politicos",
];

export type SeoStructuredData = Record<string, unknown>;

type BreadcrumbItem = {
  name: string;
  path: string;
};

export function buildCanonicalUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SEO_SITE_URL}${normalizedPath}`;
}

export function normalizeSeoText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function truncateSeoDescription(text: string, maxLength = 160): string {
  const normalized = normalizeSeoText(text);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const sliced = normalized.slice(0, maxLength - 1).trim();
  const lastSpace = sliced.lastIndexOf(" ");

  if (lastSpace <= 80) {
    return `${sliced}...`;
  }

  return `${sliced.slice(0, lastSpace)}...`;
}

export function buildBreadcrumbStructuredData(
  items: BreadcrumbItem[]
): SeoStructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: buildCanonicalUrl(item.path),
    })),
  };
}
