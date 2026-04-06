import { useEffect } from "react";

import {
  SEO_DEFAULT_DESCRIPTION,
  SEO_DEFAULT_IMAGE,
  SEO_DEFAULT_KEYWORDS,
  SEO_DEFAULT_ROBOTS,
  SEO_DEFAULT_TITLE,
  SEO_SITE_NAME,
  buildCanonicalUrl,
  normalizeSeoText,
  type SeoStructuredData,
} from "@/lib/seo";

type SeoHeadProps = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  imageAlt?: string;
  type?: string;
  robots?: string;
  keywords?: string[];
  structuredData?: SeoStructuredData | SeoStructuredData[];
};

function ensureMetaTag(
  selector: string,
  attributeName: string,
  attributeValue: string
): HTMLMetaElement {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }

  return element;
}

function ensureLinkTag(
  selector: string,
  attributes: Record<string, string>
): HTMLLinkElement {
  let element = document.head.querySelector<HTMLLinkElement>(selector);

  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  return element;
}

function toAbsoluteImageUrl(image?: string): string {
  if (!image) {
    return SEO_DEFAULT_IMAGE;
  }

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  return buildCanonicalUrl(image);
}

const SeoHead = ({
  title = SEO_DEFAULT_TITLE,
  description = SEO_DEFAULT_DESCRIPTION,
  path = "/",
  image = SEO_DEFAULT_IMAGE,
  imageAlt,
  type = "website",
  robots = SEO_DEFAULT_ROBOTS,
  keywords,
  structuredData,
}: SeoHeadProps) => {
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const canonicalUrl = buildCanonicalUrl(path || window.location.pathname || "/");
    const normalizedDescription = normalizeSeoText(description);
    const normalizedKeywords = (keywords?.length ? keywords : SEO_DEFAULT_KEYWORDS)
      .map((keyword) => normalizeSeoText(keyword))
      .filter(Boolean)
      .join(", ");
    const imageUrl = toAbsoluteImageUrl(image);
    const safeImageAlt = normalizeSeoText(imageAlt || title);
    const normalizedTitle = normalizeSeoText(title);

    document.documentElement.lang = "pt-BR";
    document.title = normalizedTitle;

    ensureMetaTag('meta[name="description"]', "name", "description").setAttribute(
      "content",
      normalizedDescription
    );
    ensureMetaTag('meta[name="keywords"]', "name", "keywords").setAttribute(
      "content",
      normalizedKeywords
    );
    ensureMetaTag('meta[name="robots"]', "name", "robots").setAttribute(
      "content",
      robots
    );
    ensureMetaTag('meta[name="googlebot"]', "name", "googlebot").setAttribute(
      "content",
      robots
    );
    ensureMetaTag('meta[property="og:type"]', "property", "og:type").setAttribute(
      "content",
      type
    );
    ensureMetaTag('meta[property="og:locale"]', "property", "og:locale").setAttribute(
      "content",
      "pt_BR"
    );
    ensureMetaTag(
      'meta[property="og:site_name"]',
      "property",
      "og:site_name"
    ).setAttribute("content", SEO_SITE_NAME);
    ensureMetaTag('meta[property="og:url"]', "property", "og:url").setAttribute(
      "content",
      canonicalUrl
    );
    ensureMetaTag(
      'meta[property="og:title"]',
      "property",
      "og:title"
    ).setAttribute("content", normalizedTitle);
    ensureMetaTag(
      'meta[property="og:description"]',
      "property",
      "og:description"
    ).setAttribute("content", normalizedDescription);
    ensureMetaTag(
      'meta[property="og:image"]',
      "property",
      "og:image"
    ).setAttribute("content", imageUrl);
    ensureMetaTag(
      'meta[property="og:image:alt"]',
      "property",
      "og:image:alt"
    ).setAttribute("content", safeImageAlt);
    ensureMetaTag('meta[name="twitter:card"]', "name", "twitter:card").setAttribute(
      "content",
      "summary_large_image"
    );
    ensureMetaTag(
      'meta[name="twitter:title"]',
      "name",
      "twitter:title"
    ).setAttribute("content", normalizedTitle);
    ensureMetaTag(
      'meta[name="twitter:description"]',
      "name",
      "twitter:description"
    ).setAttribute("content", normalizedDescription);
    ensureMetaTag(
      'meta[name="twitter:image"]',
      "name",
      "twitter:image"
    ).setAttribute("content", imageUrl);
    ensureMetaTag(
      'meta[name="twitter:image:alt"]',
      "name",
      "twitter:image:alt"
    ).setAttribute("content", safeImageAlt);

    ensureLinkTag('link[rel="canonical"]', { rel: "canonical", href: canonicalUrl });
    ensureLinkTag(
      'link[rel="alternate"][hreflang="pt-BR"]',
      { rel: "alternate", hreflang: "pt-BR", href: canonicalUrl }
    );
    ensureLinkTag(
      'link[rel="alternate"][hreflang="x-default"]',
      { rel: "alternate", hreflang: "x-default", href: canonicalUrl }
    );

    document
      .querySelectorAll('script[data-radar-seo="structured-data"]')
      .forEach((node) => node.remove());

    const entries = Array.isArray(structuredData)
      ? structuredData
      : structuredData
        ? [structuredData]
        : [];

    entries.forEach((entry) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.radarSeo = "structured-data";
      script.text = JSON.stringify(entry);
      document.head.appendChild(script);
    });
  }, [description, image, imageAlt, keywords, path, robots, structuredData, title, type]);

  return null;
};

export default SeoHead;
