import { useEffect } from 'react';
import type { PageMeta } from './siteMeta';

const MANAGED_SELECTOR = '[data-seo-managed]';

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    el.setAttribute('data-seo-managed', 'true');
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string, hreflang?: string): void {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector(selector) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    if (hreflang) el.hreflang = hreflang;
    el.setAttribute('data-seo-managed', 'true');
    document.head.appendChild(el);
  }
  el.href = href;
}

function upsertJsonLd(id: string, data: Record<string, unknown>): void {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.id = id;
    el.type = 'application/ld+json';
    el.setAttribute('data-seo-managed', 'true');
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function applyPageMeta(meta: PageMeta): void {
  document.documentElement.lang = meta.lang;
  document.title = meta.title;

  upsertMeta('name', 'description', meta.description);
  upsertLink('canonical', meta.canonical);

  document.head.querySelectorAll('link[rel="alternate"][hreflang][data-seo-managed]').forEach(el => el.remove());
  for (const alt of meta.hreflangAlternates) {
    upsertLink('alternate', alt.href, alt.lang);
  }

  upsertMeta('property', 'og:title', meta.og.title);
  upsertMeta('property', 'og:description', meta.og.description);
  upsertMeta('property', 'og:type', meta.og.type);
  upsertMeta('property', 'og:url', meta.og.url);
  upsertMeta('property', 'og:image', meta.og.image);
  upsertMeta('property', 'og:site_name', meta.og.siteName);
  upsertMeta('property', 'og:locale', meta.og.locale);
  upsertMeta('property', 'og:locale:alternate', meta.og.localeAlternate);

  upsertMeta('name', 'twitter:card', meta.twitter.card);
  upsertMeta('name', 'twitter:title', meta.twitter.title);
  upsertMeta('name', 'twitter:description', meta.twitter.description);
  upsertMeta('name', 'twitter:image', meta.twitter.image);

  upsertJsonLd('seo-json-ld', meta.jsonLd);
}

export function usePageMeta(meta: PageMeta | null): void {
  useEffect(() => {
    if (!meta) return;
    applyPageMeta(meta);
  }, [meta]);
}

export function cleanupManagedSeoTags(): void {
  document.head.querySelectorAll(MANAGED_SELECTOR).forEach(el => el.remove());
}
