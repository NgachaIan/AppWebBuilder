import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import archiver from 'archiver';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { flush, load, save, store } from './store';
import { createProject, slugify, TEMPLATES, uid } from '../shared/templates';
import { esc, findPage, onColor, renderPage } from '../shared/render';
import type { Lead, Project, ProjectSummary } from '../shared/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 4000);
const CLIENT_DIST = path.resolve(__dirname, '../client/dist');
const RESERVED = new Set(['api', 'sites', 'admin', 'app', 'builder', 'www', 'static', 'assets']);

load();

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '25mb' })); // projects can carry uploaded images as data URLs

/* ---------------- helpers ---------------- */

function uniqueSlug(base: string, ignoreId?: string): string {
  let s = slugify(base);
  if (RESERVED.has(s)) s = `${s}-site`;
  const taken = new Set(store.projects.filter((p) => p.id !== ignoreId).map((p) => p.slug));
  if (!taken.has(s)) return s;
  for (let i = 2; ; i++) if (!taken.has(`${s}-${i}`)) return `${s}-${i}`;
}

function summary(p: Project): ProjectSummary {
  const leads = store.leads.filter((l) => l.projectId === p.id);
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    kind: p.kind,
    template: p.template,
    published: p.published,
    publishedAt: p.publishedAt,
    updatedAt: p.updatedAt,
    pageCount: p.pages.length,
    unreadLeads: leads.filter((l) => !l.read).length,
    totalLeads: leads.length,
  };
}

function getProject(req: Request, res: Response): Project | undefined {
  const p = store.projects.find((x) => x.id === req.params.id);
  if (!p) res.status(404).json({ error: 'Project not found' });
  return p;
}

const str = (v: unknown, max = 500) => String(v ?? '').trim().slice(0, max);

/** Basic structural validation so a bad client can't corrupt the store. */
function validateProject(body: any): string | null {
  if (!body || typeof body !== 'object') return 'Body must be a project object';
  if (!Array.isArray(body.pages) || body.pages.length === 0) return 'Project needs at least one page';
  const slugs = new Set<string>();
  for (const pg of body.pages) {
    if (typeof pg.slug !== 'string' || !Array.isArray(pg.blocks)) return 'Invalid page';
    if (pg.slug && !/^[a-z0-9-]+$/.test(pg.slug)) return `Invalid page address "${pg.slug}"`;
    if (slugs.has(pg.slug)) return `Two pages share the address "/${pg.slug}"`;
    slugs.add(pg.slug);
  }
  if (!slugs.has('')) return 'Project needs a home page';
  if (!body.theme || !body.business) return 'Missing theme or business info';
  return null;
}

/* ---------------- API: templates & projects ---------------- */

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/templates', (_req, res) => {
  res.json(TEMPLATES);
});

app.get('/api/projects', (_req, res) => {
  const list = [...store.projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(summary);
  res.json(list);
});

app.post('/api/projects', (req, res) => {
  const name = str(req.body?.name, 80) || 'My business';
  const template = str(req.body?.template, 40) || 'blank';
  const project = createProject(template, name, uniqueSlug(name));
  store.projects.push(project);
  save();
  res.status(201).json(project);
});

app.post('/api/projects/import', (req, res) => {
  const err = validateProject(req.body);
  if (err) {
    res.status(400).json({ error: `Could not import: ${err}` });
    return;
  }
  const now = new Date().toISOString();
  const project: Project = {
    ...req.body,
    id: uid('prj'),
    name: str(req.body.name, 80) || 'Imported site',
    slug: uniqueSlug(req.body.slug || req.body.name || 'imported'),
    kind: req.body.kind === 'app' ? 'app' : 'website',
    template: str(req.body.template, 40) || 'blank',
    published: false,
    publishedAt: undefined,
    createdAt: now,
    updatedAt: now,
  };
  store.projects.push(project);
  save();
  res.status(201).json(project);
});

app.get('/api/projects/:id', (req, res) => {
  const p = getProject(req, res);
  if (p) res.json(p);
});

app.put('/api/projects/:id', (req, res) => {
  const p = getProject(req, res);
  if (!p) return;
  const err = validateProject(req.body);
  if (err) {
    res.status(400).json({ error: err });
    return;
  }
  const next: Project = {
    ...p,
    name: str(req.body.name, 80) || p.name,
    kind: req.body.kind === 'app' ? 'app' : 'website',
    theme: req.body.theme,
    business: req.body.business,
    pages: req.body.pages,
    updatedAt: new Date().toISOString(),
  };
  if (req.body.slug && req.body.slug !== p.slug) {
    const wanted = slugify(req.body.slug);
    if (RESERVED.has(wanted) || store.projects.some((x) => x.id !== p.id && x.slug === wanted)) {
      res.status(409).json({ error: `The address "${wanted}" is already taken` });
      return;
    }
    next.slug = wanted;
  }
  Object.assign(p, next);
  save();
  res.json(p);
});

app.delete('/api/projects/:id', (req, res) => {
  const p = getProject(req, res);
  if (!p) return;
  store.projects = store.projects.filter((x) => x.id !== p.id);
  store.leads = store.leads.filter((l) => l.projectId !== p.id);
  save();
  res.status(204).end();
});

app.post('/api/projects/:id/duplicate', (req, res) => {
  const p = getProject(req, res);
  if (!p) return;
  const copy: Project = JSON.parse(JSON.stringify(p));
  const now = new Date().toISOString();
  Object.assign(copy, { id: uid('prj'), name: `${p.name} (copy)`, slug: uniqueSlug(`${p.slug}-copy`), published: false, publishedAt: undefined, createdAt: now, updatedAt: now });
  store.projects.push(copy);
  save();
  res.status(201).json(copy);
});

app.post('/api/projects/:id/publish', (req, res) => {
  const p = getProject(req, res);
  if (!p) return;
  p.published = req.body?.published !== false;
  p.publishedAt = p.published ? new Date().toISOString() : p.publishedAt;
  save();
  res.json(summary(p));
});

/** Rendered page for dashboard thumbnails and unpublished previews. */
app.get('/api/projects/:id/preview', (req, res) => {
  const p = getProject(req, res);
  if (!p) return;
  const page = findPage(p, str(req.query.page, 60)) ?? p.pages[0];
  let html = renderPage(p, page, { mode: 'export' });
  if (req.query.thumb) html = html.replace(/<script>[\s\S]*?<\/script>/g, '').replace('</head>', '<style>html{overflow:hidden}.wa-fab{display:none}</style></head>');
  res.type('html').send(html);
});

/* ---------------- API: export ---------------- */

app.get('/api/projects/:id/export', (req, res) => {
  const p = getProject(req, res);
  if (!p) return;
  const origin = `${req.protocol}://${req.get('host')}`;
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${p.slug}-site.zip"`);
  const zip = archiver('zip', { zlib: { level: 9 } });
  zip.on('error', (e) => {
    console.error(e);
    res.end();
  });
  zip.pipe(res);
  for (const page of p.pages) {
    zip.append(renderPage(p, page, { mode: 'export', apiOrigin: origin }), { name: `${page.slug || 'index'}.html` });
  }
  zip.append(
    `${p.business.name}\n${'='.repeat(p.business.name.length)}\n\nExported from AppWebBuilder on ${new Date().toDateString()}.\n\nUpload every .html file to any static host (Netlify, GitHub Pages, cPanel, etc.).\nindex.html is your home page. The contact form posts messages to ${origin}; leave that server running or remove the form.\n`,
    { name: 'README.txt' },
  );
  zip.finalize();
});

/* ---------------- API: leads (contact form messages) ---------------- */

const leadHits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (leadHits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  leadHits.set(ip, recent);
  return recent.length > 8;
}

app.options('/api/sites/:slug/leads', cors());
app.post('/api/sites/:slug/leads', cors(), (req, res) => {
  const p = store.projects.find((x) => x.slug === req.params.slug && x.published);
  if (!p) {
    res.status(404).json({ error: 'Site not found' });
    return;
  }
  if (req.body?.website) {
    res.status(201).json({ ok: true }); // honeypot: silently drop bots
    return;
  }
  if (rateLimited(req.ip ?? 'x')) {
    res.status(429).json({ error: 'Too many messages, please try again later' });
    return;
  }
  const lead: Lead = {
    id: uid('lead'),
    projectId: p.id,
    name: str(req.body?.name, 120),
    phone: str(req.body?.phone, 40),
    email: str(req.body?.email, 160),
    message: str(req.body?.message, 2000),
    page: str(req.body?.page, 60),
    createdAt: new Date().toISOString(),
    read: false,
  };
  if (!lead.name || !lead.message) {
    res.status(400).json({ error: 'Name and message are required' });
    return;
  }
  store.leads.push(lead);
  save();
  res.status(201).json({ ok: true });
});

app.get('/api/projects/:id/leads', (req, res) => {
  const p = getProject(req, res);
  if (!p) return;
  res.json(store.leads.filter((l) => l.projectId === p.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
});

app.patch('/api/projects/:id/leads/:leadId', (req, res) => {
  const lead = store.leads.find((l) => l.id === req.params.leadId && l.projectId === req.params.id);
  if (!lead) {
    res.status(404).json({ error: 'Message not found' });
    return;
  }
  if (typeof req.body?.read === 'boolean') lead.read = req.body.read;
  save();
  res.json(lead);
});

app.delete('/api/projects/:id/leads/:leadId', (req, res) => {
  store.leads = store.leads.filter((l) => !(l.id === req.params.leadId && l.projectId === req.params.id));
  save();
  res.status(204).end();
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

/* ---------------- Published sites (+ PWA) ---------------- */

function published(req: Request, res: Response): Project | undefined {
  const p = store.projects.find((x) => x.slug === req.params.slug);
  if (!p || !p.published) {
    res.status(404).type('html').send(notFound('This site is not published yet.'));
    return;
  }
  return p;
}

function notFound(msg: string) {
  return `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Not found</title><body style="font:16px system-ui;display:grid;place-items:center;min-height:90vh;color:#334155"><div style="text-align:center"><h1 style="margin:0 0 8px">404</h1><p>${esc(msg)}</p></div></body>`;
}

app.get('/sites/:slug/manifest.webmanifest', (req, res) => {
  const p = published(req, res);
  if (!p) return;
  const base = `/sites/${p.slug}`;
  res.type('application/manifest+json').json({
    name: p.business.name,
    short_name: p.business.name.slice(0, 12),
    description: p.business.tagline,
    start_url: `${base}/`,
    scope: `${base}/`,
    display: 'standalone',
    background_color: p.theme.background,
    theme_color: p.theme.primary,
    icons: [{ src: `${base}/icon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
  });
});

app.get('/sites/:slug/icon.svg', (req, res) => {
  const p = published(req, res);
  if (!p) return;
  const letter = esc((p.business.name.trim()[0] ?? 'A').toUpperCase());
  res
    .type('image/svg+xml')
    .send(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="${esc(p.theme.primary)}"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="300" font-weight="700" fill="${onColor(p.theme.primary)}">${letter}</text></svg>`,
    );
});

app.get('/sites/:slug/sw.js', (req, res) => {
  const p = published(req, res);
  if (!p) return;
  // Network-first service worker: always fresh when online, cached copy when offline.
  res
    .type('application/javascript')
    .set('Service-Worker-Allowed', `/sites/${p.slug}/`)
    .send(
      `const C='awb-${p.slug}';self.addEventListener('install',e=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(C).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)))});`,
    );
});

function servePage(req: Request, res: Response) {
  const p = published(req, res);
  if (!p) return;
  const slug = String(req.params.page ?? '').replace(/\.html$/, '');
  const page = findPage(p, slug === 'index' ? '' : slug);
  if (!page) {
    res.status(404).type('html').send(notFound('Page not found.'));
    return;
  }
  res.type('html').send(renderPage(p, page, { mode: 'published', baseUrl: `/sites/${p.slug}` }));
}

app.get('/sites/:slug', (req, res) => {
  // Express is non-strict about trailing slashes, so normalise here to keep the PWA scope consistent.
  if (!req.path.endsWith('/')) {
    const q = req.originalUrl.slice(req.path.length);
    res.redirect(301, `/sites/${encodeURIComponent(req.params.slug)}/${q}`);
    return;
  }
  servePage(req, res);
});
app.get('/sites/:slug/:page', servePage);

/* ---------------- Builder app (production build) ---------------- */

if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST, { index: false, maxAge: '1h' }));
  app.get(/^(?!\/(api|sites)\/).*/, (_req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
}

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(err.status ?? 500).json({ error: err.type === 'entity.too.large' ? 'Project is too large (try smaller images)' : 'Server error' });
});

const server = app.listen(PORT, () => {
  console.log(`AppWebBuilder API on http://localhost:${PORT}`);
  if (fs.existsSync(CLIENT_DIST)) console.log(`Builder UI served at http://localhost:${PORT}`);
});

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    flush();
    server.close(() => process.exit(0));
  });
}
