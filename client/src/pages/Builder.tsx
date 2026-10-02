import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Check, CloudOff, Copy, ExternalLink, Eye, EyeOff, FileText, Layers, Loader2, Monitor, Palette, Plus, Redo2, Rocket,
  Settings2, Smartphone, Tablet, Undo2, X, MessageCircle,
} from 'lucide-react';
import type { Block, BlockType, Business, Page, Project, Theme } from '@shared/types';
import { BLOCKS } from '@shared/blocks';
import { block as newBlock, cloneBlock, clonePage, slugify, uid } from '@shared/templates';
import { renderEditorPayload } from '@shared/render';
import { api } from '../lib/api';
import { useHistory } from '../lib/useHistory';
import { useToast } from '../lib/toast';
import { useConfirm } from '../lib/confirm';
import Logo from '../components/Logo';
import Canvas, { type CanvasMessage, type Device } from '../components/builder/Canvas';
import { BlockLibrary, LayersPanel, PagesPanel, SitePanel, ThemePanel } from '../components/builder/Panels';
import { Inspector, SetupChecklist } from '../components/builder/Inspector';
import ExportMenu from '../components/builder/ExportMenu';
import { exportProject, type ExportKind } from '../lib/exporter';

type Tab = 'add' | 'layers' | 'pages' | 'site' | 'theme';
type SaveState = 'saved' | 'pending' | 'saving' | 'error';

const LABELS = Object.fromEntries(Object.values(BLOCKS).map((b) => [b.type, b.label]));
const TABS: { id: Tab; label: string; icon: typeof Plus }[] = [
  { id: 'add', label: 'Add', icon: Plus },
  { id: 'layers', label: 'Sections', icon: Layers },
  { id: 'pages', label: 'Pages', icon: FileText },
  { id: 'site', label: 'Site', icon: Settings2 },
  { id: 'theme', label: 'Theme', icon: Palette },
];

function PublishDialog({ project, onClose, onUnpublish, onPreview }: { project: Project; onClose: () => void; onUnpublish: () => void; onPreview: () => void }) {
  const url = `${window.location.origin}${api.siteUrl(project.slug)}`;
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  if (api.demo)
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-labelledby="pub-title">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Rocket className="size-5" /></div>
            <button className="icon-btn" onClick={onClose} aria-label="Close"><X className="size-4" /></button>
          </div>
          <h2 id="pub-title" className="text-lg font-bold">Published</h2>
          <p className="mt-1 text-sm text-slate-500">
            In the full app your site goes live at <span className="font-mono text-slate-700">/sites/{project.slug}</span> and can be installed on a phone. In this demo, preview it here: the buttons work and contact-form messages land in your dashboard inbox.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className="btn-primary" onClick={onPreview}><Eye className="size-4" /> Preview site</button>
            <button className="btn-secondary" onClick={onClose}>Keep editing</button>
          </div>
          <button className="mt-4 text-xs font-semibold text-rose-600 hover:underline" onClick={onUnpublish}>Unpublish site</button>
        </div>
      </div>
    );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-labelledby="pub-title">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Rocket className="size-5" /></div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X className="size-4" /></button>
        </div>
        <h2 id="pub-title" className="text-lg font-bold">Your site is live</h2>
        <p className="mt-1 text-sm text-slate-500">Share this link with customers. Changes you make are published automatically as you edit.</p>
        <div className="mt-4 flex gap-2">
          <input className="input font-mono text-xs" readOnly value={url} onFocus={(e) => e.target.select()} />
          <button
            className="btn-secondary shrink-0"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              } catch {
                toast('Copy failed — select the link and copy it manually', 'error');
              }
            }}
          >
            {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a className="btn-primary" href={url} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /> Open site</a>
          <a className="btn bg-[#25d366] text-white hover:brightness-95" href={`https://wa.me/?text=${encodeURIComponent(`Check out ${project.business.name}: ${url}`)}`} target="_blank" rel="noreferrer">
            <MessageCircle className="size-4" /> Share
          </a>
        </div>
        <div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
          <strong className="text-slate-800">Install as a phone app:</strong> open the link in Chrome on Android and tap “Add to Home screen” (on iPhone: Share → Add to Home Screen).
        </div>
        <button className="mt-4 text-xs font-semibold text-rose-600 hover:underline" onClick={onUnpublish}>Unpublish site</button>
      </div>
    </div>
  );
}

export default function Builder() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const history = useHistory<Project | null>(null);
  const project = history.value;

  const [pageId, setPageId] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('add');
  const [device, setDevice] = useState<Device>('desktop');
  const [preview, setPreview] = useState(false);
  const [save, setSave] = useState<SaveState>('saved');
  const [publishOpen, setPublishOpen] = useState(false);
  const [scrollToId, setScrollToId] = useState<{ id: string; n: number } | null>(null);
  const [scrollToAnchor, setScrollToAnchor] = useState<{ anchor: string; n: number } | null>(null);
  const [loadError, setLoadError] = useState('');
  const [live, setLive] = useState(false);

  const lastSaved = useRef<Project | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inFlight = useRef<Promise<unknown> | null>(null);

  /* ---------- load ---------- */
  useEffect(() => {
    api
      .project(id)
      .then((p) => {
        lastSaved.current = p;
        history.reset(p);
        setPageId(p.pages[0].id);
        setLive(p.published);
        if (p.kind === 'app') setDevice('mobile');
      })
      .catch((e) => setLoadError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ---------- autosave ---------- */
  const persist = useCallback(async (p: Project) => {
    setSave('saving');
    const job = api
      .save(p)
      .then((saved) => {
        lastSaved.current = saved;
        setSave((s) => (s === 'saving' ? 'saved' : s));
      })
      .catch((e: Error) => {
        setSave('error');
        toast(e.message, 'error');
        // If the address was rejected, roll that one field back so later saves succeed.
        if (/address/i.test(e.message) && lastSaved.current) {
          const prevSlug = lastSaved.current.slug;
          history.set((cur) => (cur ? { ...cur, slug: prevSlug } : cur));
        }
      });
    inFlight.current = job;
    await job;
  }, [toast, history]);

  useEffect(() => {
    if (!project || project === lastSaved.current) return;
    setSave('pending');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(project), 700);
    return () => clearTimeout(saveTimer.current);
  }, [project, persist]);

  const flushSave = useCallback(async () => {
    clearTimeout(saveTimer.current);
    if (inFlight.current) await inFlight.current;
    if (project && project !== lastSaved.current) await persist(project);
  }, [project, persist]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (save !== 'saved') e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [save]);

  /* ---------- derived ---------- */
  const page = project?.pages.find((p) => p.id === pageId) ?? project?.pages[0];
  const selected = page?.blocks.find((b) => b.id === selectedId) ?? null;
  const payload = useMemo(() => (project && page ? renderEditorPayload(project, page, LABELS, preview) : null), [project, page, preview]);
  const fieldCtx = useMemo(() => ({ pages: project?.pages ?? [], anchors: (page?.blocks ?? []).map((b) => b.props.anchor).filter(Boolean) as string[] }), [project?.pages, page?.blocks]);

  /* ---------- mutations ---------- */
  const update = useCallback((fn: (p: Project) => Project, group?: string) => history.set((p) => (p ? fn(p) : p), group), [history]);
  const updatePage = useCallback((pid: string, fn: (pg: Page) => Page, group?: string) => update((p) => ({ ...p, pages: p.pages.map((pg) => (pg.id === pid ? fn(pg) : pg)) }), group), [update]);
  const setBlocks = useCallback((fn: (b: Block[]) => Block[], group?: string) => page && updatePage(page.id, (pg) => ({ ...pg, blocks: fn(pg.blocks) }), group), [page, updatePage]);

  const focusBlock = (bid: string) => {
    setSelectedId(bid);
    setScrollToId({ id: bid, n: Date.now() });
  };

  function addBlock(type: BlockType) {
    if (!page) return;
    if (type === 'appbar' && page.blocks.some((b) => b.type === 'appbar')) {
      toast('This page already has a tab bar');
      return;
    }
    const b = newBlock(type);
    setBlocks((blocks) => {
      let at = blocks.length;
      const sel = blocks.findIndex((x) => x.id === selectedId);
      if (type === 'navbar') at = 0;
      else if (type === 'footer' || type === 'appbar') at = blocks.length;
      else if (sel >= 0) at = sel + 1;
      else while (at > 0 && ['footer', 'appbar'].includes(blocks[at - 1].type)) at--;
      return [...blocks.slice(0, at), b, ...blocks.slice(at)];
    });
    setTimeout(() => focusBlock(b.id), 50);
  }

  function moveBlock(bid: string, dir: -1 | 1) {
    setBlocks((blocks) => {
      const i = blocks.findIndex((b) => b.id === bid);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= blocks.length) return blocks;
      const next = [...blocks];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function duplicateBlock(bid: string) {
    const src = page?.blocks.find((b) => b.id === bid);
    if (!src) return;
    const copy = cloneBlock(src);
    setBlocks((blocks) => {
      const i = blocks.findIndex((b) => b.id === bid);
      return [...blocks.slice(0, i + 1), copy, ...blocks.slice(i + 1)];
    });
    setTimeout(() => focusBlock(copy.id), 50);
  }

  function deleteBlock(bid: string) {
    setBlocks((blocks) => blocks.filter((b) => b.id !== bid));
    if (selectedId === bid) setSelectedId(null);
    toast('Section deleted — press Ctrl+Z to undo');
  }

  const setProp = (key: string, value: any) => selected && setBlocks((blocks) => blocks.map((b) => (b.id === selected.id ? { ...b, props: { ...b.props, [key]: value } } : b)), `${selected.id}.${key}`);
  const setTheme = (patch: Partial<Theme>) => update((p) => ({ ...p, theme: { ...p.theme, ...patch } }), `theme.${Object.keys(patch).join()}`);
  const setBusiness = (patch: Partial<Business>) => update((p) => ({ ...p, business: { ...p.business, ...patch } }), `biz.${Object.keys(patch).join()}`);

  function openPage(pid: string, anchor = '') {
    setPageId(pid);
    setSelectedId(null);
    setScrollToAnchor({ anchor, n: Date.now() });
  }

  function addPage(name: string) {
    if (!project) return;
    let slug = slugify(name);
    if (slug === 'index') slug = 'index-page';
    const taken = new Set(project.pages.map((p) => p.slug));
    let s = slug;
    for (let i = 2; taken.has(s); i++) s = `${slug}-${i}`;
    // Start new pages with the same nav/footer as the home page.
    const home = project.pages.find((p) => p.slug === '') ?? project.pages[0];
    const chrome = home.blocks.filter((b) => ['navbar', 'footer', 'appbar'].includes(b.type)).map(cloneBlock);
    const nav = chrome.filter((b) => b.type === 'navbar');
    const rest = chrome.filter((b) => b.type !== 'navbar');
    const pg: Page = { id: uid('p'), name, slug: s, blocks: [...nav, newBlock('text', { heading: name, body: 'Add content to this page.' }), ...rest] };
    update((p) => ({ ...p, pages: [...p.pages, pg] }));
    openPage(pg.id);
    toast(`Page “${name}” added at /${s}`);
  }

  function duplicatePage(pid: string) {
    if (!project) return;
    const src = project.pages.find((p) => p.id === pid)!;
    const taken = new Set(project.pages.map((p) => p.slug));
    const base = `${src.slug || 'home'}-copy`;
    let s = base;
    for (let i = 2; taken.has(s); i++) s = `${base}-${i}`;
    const copy = clonePage(src, `${src.name} copy`, s);
    update((p) => ({ ...p, pages: [...p.pages, copy] }));
    openPage(copy.id);
  }

  async function deletePage(pid: string) {
    if (!project) return;
    const pg = project.pages.find((p) => p.id === pid)!;
    if (pg.slug === '' || !(await confirm(`Delete the “${pg.name}” page?`))) return;
    update((p) => ({ ...p, pages: p.pages.filter((x) => x.id !== pid) }));
    openPage(project.pages.find((p) => p.slug === '')!.id);
  }

  /* ---------- canvas events ---------- */
  function onCanvas(m: CanvasMessage) {
    if (!project) return;
    if (m.type === 'select') {
      setSelectedId(m.id);
    } else if (m.type === 'navigate') {
      const target = project.pages.find((p) => p.slug === m.slug);
      if (target) openPage(target.id, m.anchor);
    } else if (m.type === 'lead') {
      if (api.demo) {
        api.addLead(project.id, m.data).then(() => toast('Message received — see it in the dashboard inbox'));
      } else if (live) {
        fetch(`/api/sites/${project.slug}/leads`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(m.data) })
          .then((r) => toast(r.ok ? 'Message sent to your inbox' : 'Could not send the message', r.ok ? 'ok' : 'error'));
      } else {
        toast('Publish the site to receive contact-form messages');
      }
    } else if (m.type === 'key') {
      handleKey({ ...m, typing: false });
    } else if (m.type === 'action') {
      if (m.action === 'up') moveBlock(m.id, -1);
      if (m.action === 'down') moveBlock(m.id, 1);
      if (m.action === 'duplicate') duplicateBlock(m.id);
      if (m.action === 'delete') deleteBlock(m.id);
    }
  }

  /* ---------- keyboard (from the page or forwarded from the canvas) ---------- */
  function handleKey(k: { key: string; mod: boolean; shift: boolean; typing: boolean }): boolean {
    const key = k.key.toLowerCase();
    if (k.mod && key === 'z' && !k.typing) {
      if (k.shift) history.redo();
      else history.undo();
    } else if (k.mod && key === 'y' && !k.typing) history.redo();
    else if (k.mod && key === 's') flushSave();
    else if (!k.typing && selectedId && (k.key === 'Delete' || k.key === 'Backspace')) deleteBlock(selectedId);
    else if (k.key === 'Escape' && !k.typing) {
      setSelectedId(null);
      setPreview(false);
    } else return false;
    return true;
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement)?.tagName);
      if (handleKey({ key: e.key, mod: e.ctrlKey || e.metaKey, shift: e.shiftKey, typing })) e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /* ---------- publish / export ---------- */
  async function publish() {
    if (!project) return;
    await flushSave();
    try {
      await api.publish(project.id, true);
      setLive(true);
      setPublishOpen(true);
    } catch (e: any) {
      toast(e.message, 'error');
    }
  }

  async function unpublish() {
    if (!project) return;
    await api.publish(project.id, false);
    setLive(false);
    setPublishOpen(false);
    toast('Site unpublished');
  }

  async function runExport(kind: ExportKind) {
    if (!project || !page) return;
    await flushSave();
    try {
      // With a real server, exported contact forms post back to it; in the demo they send via WhatsApp.
      const outcome = await exportProject(project, kind, page, api.demo ? undefined : window.location.origin);
      if (outcome === 'saved') toast(kind === 'backup' ? 'Backup saved' : 'Export saved');
    } catch (e: any) {
      toast(e?.message ?? 'Export failed', 'error');
    }
  }

  /* ---------- render ---------- */
  if (loadError)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <CloudOff className="size-10 text-slate-300" />
        <p className="font-semibold">{loadError}</p>
        <Link to="/" className="btn-secondary">Back to dashboard</Link>
      </div>
    );
  if (!project || !page || !payload)
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );

  const selIndex = selected ? page.blocks.indexOf(selected) : -1;
  const SaveBadge = (
    <span className="hidden items-center gap-1.5 text-xs font-medium text-slate-500 md:flex" aria-live="polite">
      {save === 'saved' && <><Check className="size-3.5 text-emerald-500" /> Saved</>}
      {save === 'pending' && <><span className="size-1.5 rounded-full bg-amber-400" /> Unsaved</>}
      {save === 'saving' && <><Loader2 className="size-3.5 animate-spin" /> Saving…</>}
      {save === 'error' && <button className="flex items-center gap-1 text-rose-600" onClick={() => persist(project)}><CloudOff className="size-3.5" /> Retry save</button>}
    </span>
  );

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3">
        <button className="icon-btn" onClick={async () => { await flushSave(); navigate('/'); }} aria-label="Back to dashboard"><ArrowLeft className="size-4" /></button>
        <Link to="/" className="hidden sm:block"><Logo compact /></Link>
        <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />
        <input
          className="w-32 min-w-0 rounded-md px-2 py-1 text-sm font-semibold outline-none hover:bg-slate-100 focus:bg-slate-100 sm:w-48"
          value={project.name}
          aria-label="Project name"
          onChange={(e) => update((p) => ({ ...p, name: e.target.value }), 'name')}
        />
        <select className="input !w-auto !py-1 text-sm" value={page.id} onChange={(e) => openPage(e.target.value)} aria-label="Current page">
          {project.pages.map((p) => <option key={p.id} value={p.id}>{p.name}{p.slug ? ` (/${p.slug})` : ''}</option>)}
        </select>

        <div className="mx-auto hidden items-center gap-0.5 rounded-lg bg-slate-100 p-0.5 md:flex">
          {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([d, I]) => (
            <button key={d} onClick={() => setDevice(d)} className={`rounded-md p-1.5 ${device === d ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`} aria-label={`${d} preview`} title={`${d[0].toUpperCase()}${d.slice(1)} view`}>
              <I className="size-4" />
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          {SaveBadge}
          <button className="icon-btn" onClick={history.undo} disabled={!history.canUndo} title="Undo (Ctrl+Z)"><Undo2 className="size-4" /></button>
          <button className="icon-btn" onClick={history.redo} disabled={!history.canRedo} title="Redo (Ctrl+Shift+Z)"><Redo2 className="size-4" /></button>
          <button className={`btn-ghost !px-2.5 ${preview ? 'bg-slate-100' : ''}`} onClick={() => { setPreview((v) => !v); setSelectedId(null); }} title="Preview without editing outlines">
            {preview ? <EyeOff className="size-4" /> : <Eye className="size-4" />}<span className="hidden lg:inline">{preview ? 'Edit' : 'Preview'}</span>
          </button>
          <ExportMenu pageName={page.name} onExport={runExport} />
          {live ? (
            <button className="btn-primary !bg-emerald-600 hover:!bg-emerald-700" onClick={async () => { await flushSave(); setPublishOpen(true); }}>
              <Rocket className="size-4" /> Live
            </button>
          ) : (
            <button className="btn-primary" onClick={publish}><Rocket className="size-4" /> Publish</button>
          )}
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {/* Left rail + panel */}
        {!preview && (
          <>
            <nav className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-slate-200 bg-white py-3" aria-label="Builder tools">
              {TABS.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)} className={`flex w-12 flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-semibold ${tab === t.id ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>
                  <t.icon className="size-[18px]" />
                  {t.label}
                </button>
              ))}
            </nav>
            <aside className="scroll-thin w-72 shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-50">
              {tab === 'add' && <BlockLibrary onAdd={addBlock} kind={project.kind} />}
              {tab === 'layers' && (
                <LayersPanel page={page} selectedId={selectedId} onSelect={focusBlock} onReorder={(blocks) => setBlocks(() => blocks)} onDuplicate={duplicateBlock} onDelete={deleteBlock} />
              )}
              {tab === 'pages' && (
                <PagesPanel project={project} currentId={page.id} onOpen={openPage} onAdd={addPage} onUpdate={(pid, patch) => updatePage(pid, (pg) => ({ ...pg, ...patch }), `page.${pid}.${Object.keys(patch).join()}`)} onDuplicate={duplicatePage} onDelete={deletePage} />
              )}
              {tab === 'site' && <SitePanel key={project.slug} project={project} onBusiness={setBusiness} onProject={(patch) => { update((p) => ({ ...p, ...patch })); if (patch.kind === 'app') setDevice('mobile'); }} />}
              {tab === 'theme' && <ThemePanel theme={project.theme} onChange={setTheme} />}
            </aside>
          </>
        )}

        {/* Canvas */}
        <div className="min-w-0 flex-1">
          <Canvas payload={payload} selectedId={selectedId} device={device} scrollToId={scrollToId} scrollToAnchor={scrollToAnchor} onMessage={onCanvas} />
        </div>

        {/* Inspector */}
        {!preview && (
          <aside className={`w-80 shrink-0 border-l border-slate-200 bg-white ${selected ? 'absolute inset-y-0 right-0 z-10 shadow-xl xl:static xl:shadow-none' : 'hidden xl:block'}`}>
            {selected ? (
              <Inspector
                block={selected}
                ctx={fieldCtx}
                onChange={setProp}
                onClose={() => setSelectedId(null)}
                onMove={(d) => moveBlock(selected.id, d)}
                onDuplicate={() => duplicateBlock(selected.id)}
                onDelete={() => deleteBlock(selected.id)}
                isFirst={selIndex === 0}
                isLast={selIndex === page.blocks.length - 1}
              />
            ) : (
              <div className="scroll-thin h-full overflow-y-auto">
                <SetupChecklist project={{ ...project, published: live }} onOpenSite={() => setTab('site')} onOpenTheme={() => setTab('theme')} />
              </div>
            )}
          </aside>
        )}
      </div>

      {publishOpen && <PublishDialog project={project} onClose={() => setPublishOpen(false)} onUnpublish={unpublish} onPreview={() => { setPublishOpen(false); setSelectedId(null); setPreview(true); }} />}
    </div>
  );
}
