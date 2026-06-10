import fs from 'fs';
import path from 'path';
import type { TranslateSessionData } from '../types';
import {
  buildPageMeta,
  escapeHtml,
  listPublicInternalPaths,
  renderMetaTags,
  SITE_ORIGIN,
} from './siteMeta';
import type { SeoLang } from './seoCopy';
import { localizePath } from './localizedPaths';

const SEO_LANGS: SeoLang[] = ['en', 'it'];

function stripExistingSeoTags(html: string): string {
  return html
    .replace(/<meta name="description"[^>]*>\s*/g, '')
    .replace(/<meta property="og:[^"]+"[^>]*>\s*/g, '')
    .replace(/<meta name="twitter:[^"]+"[^>]*>\s*/g, '')
    .replace(/<link rel="canonical"[^>]*>\s*/g, '')
    .replace(/<link rel="alternate" hreflang="[^"]+"[^>]*>\s*/g, '')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '');
}

export function injectMetaIntoHtml(html: string, meta: ReturnType<typeof buildPageMeta>): string {
  let out = stripExistingSeoTags(html);
  out = out.replace(/<html lang="[^"]*">/, `<html lang="${meta.lang}">`);
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(meta.documentTitle)}</title>`);
  out = out.replace('</head>', `  ${renderMetaTags(meta)}\n</head>`);
  return out;
}

function internalPathToDistFile(distDir: string, internalPath: string, lang: SeoLang): string {
  const localized = localizePath(internalPath, lang);
  if (localized === '/' || localized === '/it/') {
    return lang === 'it' ? path.join(distDir, 'it', 'index.html') : path.join(distDir, 'index.html');
  }
  const relative = localized.startsWith('/it/')
    ? localized.slice('/it/'.length)
    : localized.slice(1);
  const subdir = lang === 'it' ? path.join(distDir, 'it', relative) : path.join(distDir, relative);
  return path.join(subdir, 'index.html');
}

function writeSitemap(distDir: string, paths: string[]): void {
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = paths.flatMap(internalPath =>
    SEO_LANGS.map(lang => {
      const localized = localizePath(internalPath, lang);
      const loc = `${SITE_ORIGIN}${localized}`;
      const alternates = SEO_LANGS.map(altLang => {
        const altPath = localizePath(internalPath, altLang);
        const href = `${SITE_ORIGIN}${altPath}`;
        return `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${href}"/>`;
      }).join('\n');
      const xDefault = localizePath(internalPath, 'en');
      const xDefaultHref = `${SITE_ORIGIN}${xDefault}`;
      const priority = internalPath === '/' ? '1.0' : internalPath.startsWith('/genki/') ? '0.8' : '0.7';
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
${alternates}
    <xhtml:link rel="alternate" hreflang="x-default" href="${xDefaultHref}"/>
  </url>`;
    }),
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;

  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), xml, 'utf-8');
}

function writeRobots(distDir: string): void {
  const content = `User-agent: *
Allow: /

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`;
  fs.writeFileSync(path.join(distDir, 'robots.txt'), content, 'utf-8');
}

export type GenerateSeoArtifactsOptions = {
  genkiLessons: TranslateSessionData[];
  sentenceLessons: TranslateSessionData[];
};

export function generateSeoArtifacts(
  distDir: string,
  options: GenerateSeoArtifactsOptions,
): void {
  const templatePath = path.join(distDir, 'index.html');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Missing build output at ${templatePath}. Run vite build first.`);
  }

  const template = fs.readFileSync(templatePath, 'utf-8');
  const paths = listPublicInternalPaths(options.genkiLessons, options.sentenceLessons);

  for (const internalPath of paths) {
    for (const lang of SEO_LANGS) {
      const meta = buildPageMeta({
        internalPath,
        lang,
        genkiLessons: options.genkiLessons,
        sentenceLessons: options.sentenceLessons,
      });
      const html = injectMetaIntoHtml(template, meta);
      const outFile = internalPathToDistFile(distDir, internalPath, lang);
      fs.mkdirSync(path.dirname(outFile), { recursive: true });
      fs.writeFileSync(outFile, html, 'utf-8');
    }
  }

  writeSitemap(distDir, paths);
  writeRobots(distDir);
}
