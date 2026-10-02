import type { Lead, Project, ProjectSummary } from '@shared/types';
import type { TemplateInfo } from '@shared/templates';
import { localApi } from './localApi';

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {
      /* not json */
    }
    throw new Error(msg);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

const serverApi = {
  demo: false as boolean,
  templates: () => req<TemplateInfo[]>('/api/templates'),
  projects: () => req<ProjectSummary[]>('/api/projects'),
  project: (id: string) => req<Project>(`/api/projects/${id}`),
  create: (name: string, template: string) => req<Project>('/api/projects', { method: 'POST', body: JSON.stringify({ name, template }) }),
  save: (p: Project) => req<Project>(`/api/projects/${p.id}`, { method: 'PUT', body: JSON.stringify(p) }),
  remove: (id: string) => req<void>(`/api/projects/${id}`, { method: 'DELETE' }),
  duplicate: (id: string) => req<Project>(`/api/projects/${id}/duplicate`, { method: 'POST' }),
  publish: (id: string, published: boolean) => req<ProjectSummary>(`/api/projects/${id}/publish`, { method: 'POST', body: JSON.stringify({ published }) }),
  leads: (id: string) => req<Lead[]>(`/api/projects/${id}/leads`),
  markLead: (id: string, leadId: string, read: boolean) => req<Lead>(`/api/projects/${id}/leads/${leadId}`, { method: 'PATCH', body: JSON.stringify({ read }) }),
  deleteLead: (id: string, leadId: string) => req<void>(`/api/projects/${id}/leads/${leadId}`, { method: 'DELETE' }),
  exportUrl: (id: string) => `/api/projects/${id}/export`,
  previewUrl: (id: string, page = '', thumb = true) => `/api/projects/${id}/preview?page=${encodeURIComponent(page)}${thumb ? '&thumb=1' : ''}`,
  siteUrl: (slug: string, page = '') => `/sites/${slug}/${page}`,
  addLead: (_id: string, _data: Partial<Lead>): Promise<Lead | void> => Promise.resolve(),
  previewHtml: (_id: string): string => '',
  importProject: (p: Project) => req<Project>('/api/projects/import', { method: 'POST', body: JSON.stringify(p) }),
};

/** Demo build (VITE_DEMO=1) runs entirely in the browser with no server. */
export const DEMO = import.meta.env.VITE_DEMO === '1';
export const api: typeof serverApi = DEMO ? { ...serverApi, ...localApi } : serverApi;
