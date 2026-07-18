import { useEffect } from 'react';

const SITE_NAME = 'Kelnix';
const DEFAULT_IMAGE = 'https://kelnix.org/logos/kelnix-og.png';

interface SeoOptions {
  title: string;
  description: string;
  /** Absolute canonical URL, e.g. https://kelnix.org/cladget */
  canonical: string;
  keywords?: string;
  image?: string;
  /** JSON-LD structured data object injected as application/ld+json */
  jsonLd?: Record<string, unknown>;
}

function upsertMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Client-side SEO for our React Router SPA. Sets the document title, meta
 * description, canonical URL, Open Graph / Twitter tags and optional JSON-LD
 * so each route is individually indexable by JS-rendering crawlers.
 * Restores the site defaults on unmount.
 */
export function useSeo({ title, description, canonical, keywords, image, jsonLd }: SeoOptions) {
  useEffect(() => {
    const prevTitle = document.title;
    const prevDescription =
      document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.content ?? '';
    const prevCanonical =
      document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? 'https://kelnix.org/';
    const img = image || DEFAULT_IMAGE;

    document.title = title;
    upsertMeta('meta[name="description"]', 'name', 'description', description);
    upsertLink('canonical', canonical);
    if (keywords) upsertMeta('meta[name="keywords"]', 'name', 'keywords', keywords);

    upsertMeta('meta[property="og:title"]', 'property', 'og:title', title);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', img);
    upsertMeta('meta[property="og:site_name"]', 'property', 'og:site_name', SITE_NAME);
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', img);

    let ldScript: HTMLScriptElement | null = null;
    if (jsonLd) {
      ldScript = document.createElement('script');
      ldScript.type = 'application/ld+json';
      ldScript.setAttribute('data-seo', 'route');
      ldScript.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(ldScript);
    }

    return () => {
      document.title = prevTitle;
      upsertMeta('meta[name="description"]', 'name', 'description', prevDescription);
      upsertLink('canonical', prevCanonical);
      upsertMeta('meta[property="og:title"]', 'property', 'og:title', prevTitle);
      upsertMeta('meta[property="og:description"]', 'property', 'og:description', prevDescription);
      upsertMeta('meta[property="og:url"]', 'property', 'og:url', prevCanonical);
      if (ldScript) ldScript.remove();
    };
  }, [title, description, canonical, keywords, image, jsonLd]);
}
