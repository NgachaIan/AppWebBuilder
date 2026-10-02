import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Copy, ExternalLink, Globe, Inbox, MoreHorizontal, Pencil, Plus, Smartphone, Trash2, Rocket, MessageSquare, Upload } from 'lucide-react';
import { parseBackup } from '../lib/exporter';
import type { ProjectSummary } from '@shared/types';
import { api } from '../lib/api';
import { useToast } from '../lib/toast';
import { useConfirm } from '../lib/confirm';
import Logo from '../components/Logo';
import NewProjectModal from '../components/NewProjectModal';
import LeadsDrawer from '../components/LeadsDrawer';

function Thumb({ id }: { id: string }) {
  return (
    <div className="pointer-events-none relative h-44 overflow-hidden bg-slate-100">
      <iframe title="Preview" {...(api.demo ? { srcDoc: api.previewHtml(id) } : { src: api.previewUrl(id) })} loading="lazy" tabIndex={-1} className="absolute top-0 left-0 h-[704px] w-[1280px] origin-top-left scale-[0.25] border-0 sm:scale-[0.27]" sandbox="" />
    </div>
  );
}

function Menu({ onDuplicate, onDelete }: { onDuplicate: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button className="icon-btn" aria-label="More actions" onClick={() => setOpen((o) => !o)}>
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <div className="absolute right-0 bottom-9 z-10 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg">
          <button className="flex w-full items-center gap-2 px-3 py-2 hover:bg-slate-50" onClick={() => { setOpen(false); onDuplicate(); }}>
            <Copy className="size-4" /> Duplicate
          </button>
          <button className="flex w-full items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50" onClick={() => { setOpen(false); onDelete(); }}>
            <Trash2 className="size-4" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [inbox, setInbox] = useState<ProjectSummary | null>(null);
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const fileRef = useRef<HTMLInputElement>(null);

  async function importBackup(file?: File) {
    if (!file) return;
    try {
      const p = await api.importProject(parseBackup(await file.text()));
      toast(`Imported “${p.name}”`);
      load();
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const load = useCallback(() => {
    api.projects().then(setProjects).catch((e) => {
      setProjects([]);
      toast(`Could not reach the server: ${e.message}`, 'error');
    });
  }, [toast]);

  useEffect(load, [load]);

  async function duplicate(p: ProjectSummary) {
    await api.duplicate(p.id);
    toast('Site duplicated');
    load();
  }
  async function remove(p: ProjectSummary) {
    if (!(await confirm(`Delete "${p.name}"? This removes the site and its messages and cannot be undone.`))) return;
    await api.remove(p.id);
    toast('Site deleted');
    load();
  }

  const stats = projects && {
    total: projects.length,
    live: projects.filter((p) => p.published).length,
    unread: projects.reduce((n, p) => n + p.unreadLeads, 0),
  };

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo />
          <div className="flex items-center gap-3">
            {api.demo ? (
              <span className="hidden rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 sm:inline" title="Sites are saved in this browser only">Demo · saved in this browser</span>
            ) : (
              <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 sm:inline">Free plan</span>
            )}
            <button className="btn-secondary" onClick={() => fileRef.current?.click()} title="Import a project backup (.json)">
              <Upload className="size-4" /> <span className="hidden sm:inline">Import</span>
            </button>
            <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => importBackup(e.target.files?.[0])} />
            <button className="btn-primary" onClick={() => setCreating(true)}>
              <Plus className="size-4" /> New site
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-8 flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Your sites</h1>
          <p className="text-slate-500">Build a website or phone app for your business, publish it, and collect customer messages.</p>
        </div>

        {stats && stats.total > 0 && (
          <div className="mb-8 grid grid-cols-3 gap-3 sm:max-w-xl">
            {[
              { label: 'Sites', value: stats.total, icon: Globe },
              { label: 'Live', value: stats.live, icon: Rocket },
              { label: 'New messages', value: stats.unread, icon: MessageSquare },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <s.icon className="size-3.5" /> {s.label}
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums">{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {projects === null ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-200/70" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <Rocket className="size-7" />
            </div>
            <h2 className="text-lg font-bold">Create your first site</h2>
            <p className="mt-1 max-w-md text-slate-500">Choose a template for a duka, restaurant, salon or service business. Add your WhatsApp and M-Pesa details, then publish.</p>
            <button className="btn-primary mt-6" onClick={() => setCreating(true)}>
              <Plus className="size-4" /> New site
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <article key={p.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:shadow-md">
                <Link to={`/builder/${p.id}`} className="block" aria-label={`Edit ${p.name}`}>
                  <Thumb key={p.updatedAt} id={p.id} />
                </Link>
                <div className="border-t border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="flex items-center gap-1.5 truncate font-semibold">
                        {p.kind === 'app' ? <Smartphone className="size-3.5 shrink-0 text-slate-400" /> : <Globe className="size-3.5 shrink-0 text-slate-400" />}
                        <span className="truncate">{p.name}</span>
                      </h3>
                      <p className="truncate text-xs text-slate-500">
                        /sites/{p.slug} · {p.pageCount} {p.pageCount === 1 ? 'page' : 'pages'}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${p.published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {p.published ? 'Live' : 'Draft'}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-1">
                    <button className="btn-primary !px-3 !py-1.5" onClick={() => navigate(`/builder/${p.id}`)}>
                      <Pencil className="size-3.5" /> Edit
                    </button>
                    {p.published && !api.demo && (
                      <a className="btn-ghost !px-2.5 !py-1.5" href={api.siteUrl(p.slug)} target="_blank" rel="noreferrer">
                        <ExternalLink className="size-3.5" /> View
                      </a>
                    )}
                    <button className="btn-ghost relative !px-2.5 !py-1.5" onClick={() => setInbox(p)} title="Messages">
                      <Inbox className="size-3.5" />
                      {p.totalLeads > 0 && <span className="tabular-nums">{p.totalLeads}</span>}
                      {p.unreadLeads > 0 && <span className="absolute top-1 right-1 size-2 rounded-full bg-rose-500" />}
                    </button>
                    <div className="ml-auto">
                      <Menu onDuplicate={() => duplicate(p)} onDelete={() => remove(p)} />
                    </div>
                  </div>
                </div>
              </article>
            ))}
            <button onClick={() => setCreating(true)} className="flex min-h-72 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 transition hover:border-brand-300 hover:bg-white hover:text-brand-600">
              <Plus className="size-6" />
              <span className="font-semibold">New site</span>
            </button>
          </div>
        )}
      </main>

      {creating && <NewProjectModal onClose={() => setCreating(false)} onCreated={(id) => navigate(`/builder/${id}`)} />}
      {inbox && <LeadsDrawer projectId={inbox.id} projectName={inbox.name} onClose={() => setInbox(null)} onChange={load} />}
    </div>
  );
}
