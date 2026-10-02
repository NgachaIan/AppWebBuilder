/**
 * Browser-only backend used by the demo build (VITE_DEMO=1).
 * Mirrors the Express API, but stores everything in localStorage (falls back to memory).
 */
import type { Lead, Project, ProjectSummary } from '@shared/types';
import { createProject, slugify, TEMPLATES, uid } from '@shared/templates';
import { renderPage } from '@shared/render';

const KEY = 'awb-demo-db-v1';
const RESERVED = new Set(['api', 'sites', 'admin', 'app', 'builder', 'www', 'static', 'assets']);
interface DB {
  projects: Project[];
  leads: Lead[];
}

let memory: DB = { projects: [], leads: [] };
let persistent = true;

function read(): DB {
  if (!persistent) return memory;
  try {
    const raw = localStorage.getItem(KEY);
    memory = raw ? JSON.parse(raw) : { projects: [], leads: [] };
  } catch {
    persistent = false;
  }
  return memory;
}

function write(db: DB) {
  memory = db;
  if (!persistent) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch (e: any) {
    if (e?.name === 'QuotaExceededError') throw new Error('Browser storage is full. Use smaller images or delete a site.');
    persistent = false;
  }
}

const tick = <T>(v: T) => new Promise<T>((r) => setTimeout(() => r(structuredClone(v)), 40));
const fail = (msg: string) => Promise.reject(new Error(msg));

function uniqueSlug(db: DB, base: string, ignoreId?: string) {
  let s = slugify(base);
  if (RESERVED.has(s)) s = `${s}-site`;
  const taken = new Set(db.projects.filter((p) => p.id !== ignoreId).map((p) => p.slug));
  if (!taken.has(s)) return s;
  for (let i = 2; ; i++) if (!taken.has(`${s}-${i}`)) return `${s}-${i}`;
}

function summary(db: DB, p: Project): ProjectSummary {
  const leads = db.leads.filter((l) => l.projectId === p.id);
  return {
    id: p.id, name: p.name, slug: p.slug, kind: p.kind, template: p.template, published: p.published, publishedAt: p.publishedAt,
    updatedAt: p.updatedAt, pageCount: p.pages.length, unreadLeads: leads.filter((l) => !l.read).length, totalLeads: leads.length,
  };
}

export const localApi = {
  demo: true as const,
  templates: () => tick(TEMPLATES),
  projects: () => {
    const db = read();
    return tick([...db.projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((p) => summary(db, p)));
  },
  project: (id: string) => {
    const p = read().projects.find((x) => x.id === id);
    return p ? tick(p) : fail('Project not found');
  },
  create: (name: string, template: string) => {
    const db = read();
    const p = createProject(template, name || 'My business', uniqueSlug(db, name || 'My business'));
    write({ ...db, projects: [...db.projects, p] });
    return tick(p);
  },
  save: (next: Project) => {
    const db = read();
    const cur = db.projects.find((x) => x.id === next.id);
    if (!cur) return fail('Project not found');
    const slug = slugify(next.slug);
    if (slug !== cur.slug && (RESERVED.has(slug) || db.projects.some((x) => x.id !== cur.id && x.slug === slug))) return fail(`The address "${slug}" is already taken`);
    // published state is owned by publish(), like the server
    const saved: Project = { ...next, slug, published: cur.published, publishedAt: cur.publishedAt, updatedAt: new Date().toISOString() };
    try {
      write({ ...db, projects: db.projects.map((x) => (x.id === saved.id ? saved : x)) });
    } catch (e: any) {
      return fail(e.message);
    }
    return tick(saved);
  },
  remove: (id: string) => {
    const db = read();
    write({ projects: db.projects.filter((p) => p.id !== id), leads: db.leads.filter((l) => l.projectId !== id) });
    return tick(undefined as void);
  },
  duplicate: (id: string) => {
    const db = read();
    const src = db.projects.find((x) => x.id === id);
    if (!src) return fail('Project not found');
    const now = new Date().toISOString();
    const copy: Project = { ...structuredClone(src), id: uid('prj'), name: `${src.name} (copy)`, slug: uniqueSlug(db, `${src.slug}-copy`), published: false, publishedAt: undefined, createdAt: now, updatedAt: now };
    write({ ...db, projects: [...db.projects, copy] });
    return tick(copy);
  },
  publish: (id: string, published: boolean) => {
    const db = read();
    const p = db.projects.find((x) => x.id === id);
    if (!p) return fail('Project not found');
    p.published = published;
    if (published) p.publishedAt = new Date().toISOString();
    write(db);
    return tick(summary(db, p));
  },
  leads: (id: string) => tick(read().leads.filter((l) => l.projectId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
  addLead: (id: string, data: Partial<Lead>) => {
    const db = read();
    const lead: Lead = {
      id: uid('lead'), projectId: id, name: String(data.name ?? '').slice(0, 120), phone: String(data.phone ?? '').slice(0, 40),
      email: String(data.email ?? '').slice(0, 160), message: String(data.message ?? '').slice(0, 2000), page: String(data.page ?? ''),
      createdAt: new Date().toISOString(), read: false,
    };
    write({ ...db, leads: [...db.leads, lead] });
    return tick(lead);
  },
  markLead: (id: string, leadId: string, isRead: boolean) => {
    const db = read();
    const l = db.leads.find((x) => x.id === leadId && x.projectId === id);
    if (!l) return fail('Message not found');
    l.read = isRead;
    write(db);
    return tick(l);
  },
  deleteLead: (id: string, leadId: string) => {
    const db = read();
    write({ ...db, leads: db.leads.filter((l) => !(l.id === leadId && l.projectId === id)) });
    return tick(undefined as void);
  },
  /** Rendered home page for dashboard thumbnails. */
  previewHtml: (id: string) => {
    const p = read().projects.find((x) => x.id === id);
    if (!p) return '';
    return renderPage(p, p.pages.find((x) => x.slug === '') ?? p.pages[0], { mode: 'export' })
      .replace(/<script>[\s\S]*?<\/script>/g, '')
      .replace('</head>', '<style>html{overflow:hidden}.wa-fab{display:none}</style></head>');
  },
  importProject: (src: Project) => {
    const db = read();
    const now = new Date().toISOString();
    const p: Project = { ...structuredClone(src), id: uid('prj'), slug: uniqueSlug(db, src.slug || src.name), published: false, publishedAt: undefined, createdAt: now, updatedAt: now };
    try {
      write({ ...db, projects: [...db.projects, p] });
    } catch (e: any) {
      return fail(e.message);
    }
    return tick(p);
  },
};
