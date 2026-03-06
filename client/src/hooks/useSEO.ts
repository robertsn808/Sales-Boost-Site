import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
}

const BASE_URL = "https://techsavvyhawaii.com";

function setMetaTag(attr: string, key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLinkTag(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function useSEO({
  title,
  description,
  keywords,
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
  ogType,
  twitterTitle,
  twitterDescription,
  twitterImage,
  jsonLd,
  noindex,
}: SEOProps) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    setMetaTag("name", "description", description);
    if (keywords) setMetaTag("name", "keywords", keywords);
    if (noindex) {
      setMetaTag("name", "robots", "noindex, nofollow");
    } else {
      setMetaTag("name", "robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
    }

    // Open Graph
    setMetaTag("property", "og:title", ogTitle || title);
    setMetaTag("property", "og:description", ogDescription || description);
    setMetaTag("property", "og:type", ogType || "website");
    setMetaTag("property", "og:site_name", "TechSavvy Hawaii");
    if (ogImage) setMetaTag("property", "og:image", ogImage);
    if (canonical) setMetaTag("property", "og:url", canonical);

    // Twitter
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", twitterTitle || ogTitle || title);
    setMetaTag("name", "twitter:description", twitterDescription || ogDescription || description);
    if (twitterImage || ogImage) setMetaTag("name", "twitter:image", twitterImage || ogImage || "");

    // Canonical URL
    const canonicalHref = canonical || `${BASE_URL}${window.location.pathname}`;
    setLinkTag("canonical", canonicalHref);

    // JSON-LD structured data
    const scriptEls: HTMLScriptElement[] = [];
    if (jsonLd) {
      const schemas = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      for (const schema of schemas) {
        const scriptEl = document.createElement("script");
        scriptEl.type = "application/ld+json";
        scriptEl.setAttribute("data-page-seo", "true");
        scriptEl.textContent = JSON.stringify(schema);
        document.head.appendChild(scriptEl);
        scriptEls.push(scriptEl);
      }
    }

    return () => {
      document.title = prevTitle;
      scriptEls.forEach((el) => el.remove());
    };
  }, [title, description, keywords, canonical, ogTitle, ogDescription, ogImage, ogType, twitterTitle, twitterDescription, twitterImage, jsonLd, noindex]);
}
