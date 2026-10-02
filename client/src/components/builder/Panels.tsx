import { useState } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Copy, GripVertical, Home, Plus, Trash2, Check } from 'lucide-react';
import type { Block, BlockType, Business, Page, Project, Theme } from '@shared/types';
import { BLOCKS, BLOCK_CATEGORIES } from '@shared/blocks';
import { FONTS, THEME_PRESETS, slugify } from '@shared/templates';
import { BlockIcon } from '../../lib/icons';
import { ColorInput, Toggle } from '../fields';

/* ---------------- Add sections ---------------- */

export function BlockLibrary({ onAdd, kind }: { onAdd: (t: BlockType) => void; kind: Project['kind'] }) {
  const [q, setQ] = useState('');
  const all = Object.values(BLOCKS).filter((b) => !q || `${b.label} ${b.description}`.toLowerCase().includes(q.toLowerCase()));
  const cats = kind === 'app' ? ['App', ...BLOCK_CATEGORIES.filter((c) => c !== 'App')] : BLOCK_CATEGORIES;
  return (
    <div>
      <div className="px-4 pt-4">
        <input className="input" placeholder="Search sections…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {cats.map((cat) => {
        const items = all.filter((b) => b.category === cat);
        if (!items.length) return null;
        return (
          <div key={cat}>
            <div className="panel-title">{cat}</div>
            <div className="grid grid-cols-1 gap-1.5 px-3 pb-2">
              {items.map((b) => (
                <button key={b.type} onClick={() => onAdd(b.type)} className="group flex items-start gap-3 rounded-lg border border-transparent p-2 text-left transition hover:border-slate-200 hover:bg-white hover:shadow-xs">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-brand-50 group-hover:text-brand-600">
                    <BlockIcon name={b.icon} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-800">{b.label}</span>
                    <span className="block text-xs text-slate-500">{b.description}</span>
                  </span>
                  <Plus className="mt-1.5 ml-auto size-4 shrink-0 text-slate-300 group-hover:text-brand-600" />
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Layers (drag to reorder) ---------------- */

function LayerRow({ block, selected, onSelect, onDuplicate, onDelete }: { block: Block; selected: boolean; onSelect: () => void; onDuplicate: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const def = BLOCKS[block.type];
  const sub = block.props.heading || block.props.title || block.props.logoText || '';
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group flex items-center gap-1 rounded-lg border bg-white px-1.5 py-1.5 ${isDragging ? 'z-10 shadow-lg' : ''} ${selected ? 'border-brand-500 ring-2 ring-brand-100' : 'border-slate-200'}`}
    >
      <button className="cursor-grab touch-none p-1 text-slate-400 hover:text-slate-700 active:cursor-grabbing" aria-label={`Drag ${def.label}`} {...attributes} {...listeners}>
        <GripVertical className="size-4" />
      </button>
      <button className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={onSelect}>
        <BlockIcon name={def.icon} className="size-4 shrink-0 text-slate-500" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{def.label}</span>
          {sub && <span className="block truncate text-[11px] text-slate-400">{String(sub)}</span>}
        </span>
      </button>
      <button className="icon-btn !size-7 opacity-0 group-hover:opacity-100 focus:opacity-100" onClick={onDuplicate} aria-label="Duplicate"><Copy className="size-3.5" /></button>
      <button className="icon-btn !size-7 opacity-0 group-hover:opacity-100 hover:!text-rose-600 focus:opacity-100" onClick={onDelete} aria-label="Delete"><Trash2 className="size-3.5" /></button>
    </li>
  );
}

export function LayersPanel({ page, selectedId, onSelect, onReorder, onDuplicate, onDelete }: {
  page: Page;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (blocks: Block[]) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = page.blocks.findIndex((b) => b.id === e.active.id);
    const to = page.blocks.findIndex((b) => b.id === e.over!.id);
    onReorder(arrayMove(page.blocks, from, to));
  };
  return (
    <div>
      <div className="panel-title">Sections on “{page.name}”</div>
      <p className="px-4 pb-3 text-xs text-slate-500">Drag to reorder. Click to edit.</p>
      {page.blocks.length === 0 && <p className="mx-4 rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">No sections yet.</p>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={page.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-1.5 px-3 pb-4">
            {page.blocks.map((b) => (
              <LayerRow key={b.id} block={b} selected={b.id === selectedId} onSelect={() => onSelect(b.id)} onDuplicate={() => onDuplicate(b.id)} onDelete={() => onDelete(b.id)} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

/* ---------------- Pages ---------------- */

export function PagesPanel({ project, currentId, onOpen, onAdd, onUpdate, onDuplicate, onDelete }: {
  project: Project;
  currentId: string;
  onOpen: (id: string) => void;
  onAdd: (name: string) => void;
  onUpdate: (id: string, patch: Partial<Page>) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const current = project.pages.find((p) => p.id === currentId)!;
  const slugTaken = (slug: string, id: string) => project.pages.some((p) => p.id !== id && p.slug === slug);
  const [slugDraft, setSlugDraft] = useState<{ id: string; v: string } | null>(null);

  return (
    <div>
      <div className="panel-title">{project.kind === 'app' ? 'Screens' : 'Pages'}</div>
      <ul className="space-y-1 px-3">
        {project.pages.map((p) => (
          <li key={p.id}>
            <button onClick={() => onOpen(p.id)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${p.id === currentId ? 'bg-brand-50 font-semibold text-brand-700' : 'hover:bg-white'}`}>
              {p.slug === '' ? <Home className="size-4" /> : <span className="w-4 text-center text-slate-400">/</span>}
              <span className="flex-1 truncate">{p.name}</span>
              <span className="text-xs text-slate-400">{p.blocks.length}</span>
            </button>
          </li>
        ))}
      </ul>
      <form
        className="mt-3 flex gap-2 px-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) {
            onAdd(name.trim());
            setName('');
          }
        }}
      >
        <input className="input" placeholder="New page name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        <button className="btn-primary shrink-0 !px-2.5" aria-label="Add page"><Plus className="size-4" /></button>
      </form>

      <div className="panel-title mt-4 border-t border-slate-200 pt-5">This page</div>
      <div className="space-y-3 px-4 pb-6">
        <div>
          <label className="label">Page name</label>
          <input className="input" value={current.name} maxLength={40} onChange={(e) => onUpdate(current.id, { name: e.target.value })} />
        </div>
        {current.slug !== '' && (
          <div>
            <label className="label">Page address</label>
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <span>/</span>
              <input
                className="input"
                value={slugDraft?.id === current.id ? slugDraft.v : current.slug}
                onChange={(e) => setSlugDraft({ id: current.id, v: e.target.value })}
                onBlur={() => {
                  if (!slugDraft) return;
                  const s = slugify(slugDraft.v);
                  if (s && s !== 'index' && !slugTaken(s, current.id)) onUpdate(current.id, { slug: s });
                  setSlugDraft(null);
                }}
              />
            </div>
            {slugDraft && slugTaken(slugify(slugDraft.v), current.id) && <p className="mt-1 text-xs text-rose-600">Another page already uses this address.</p>}
          </div>
        )}
        <div className="flex gap-2">
          <button className="btn-secondary flex-1 text-xs" onClick={() => onDuplicate(current.id)}><Copy className="size-3.5" /> Duplicate</button>
          <button className="btn-secondary flex-1 text-xs text-rose-600" disabled={current.slug === ''} onClick={() => onDelete(current.id)} title={current.slug === '' ? 'The home page cannot be deleted' : ''}>
            <Trash2 className="size-3.5" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Business / site settings ---------------- */

export function SitePanel({ project, onBusiness, onProject }: { project: Project; onBusiness: (patch: Partial<Business>) => void; onProject: (patch: Partial<Project>) => void }) {
  const b = project.business;
  const [slug, setSlug] = useState(project.slug);
  const text = (key: keyof Business, label: string, placeholder = '', help = '') => (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={String(b[key] ?? '')} placeholder={placeholder} onChange={(e) => onBusiness({ [key]: e.target.value })} />
      {help && <p className="mt-1 text-[11px] text-slate-400">{help}</p>}
    </div>
  );
  return (
    <div className="space-y-6 px-4 py-4">
      <section className="space-y-3">
        <h3 className="text-xs font-bold tracking-wide text-slate-500 uppercase">Business</h3>
        {text('name', 'Business name')}
        {text('tagline', 'Tagline', 'What you do, in one line', 'Shown in Google results and when your link is shared')}
        {text('location', 'Location', 'e.g. Moi Avenue, Nairobi CBD')}
      </section>
      <section className="space-y-3">
        <h3 className="text-xs font-bold tracking-wide text-slate-500 uppercase">Contact</h3>
        {text('phone', 'Phone', '0712 345 678')}
        {text('whatsapp', 'WhatsApp number', '0712 345 678', 'Order and chat buttons open WhatsApp with this number')}
        {text('email', 'Email', 'hello@yourbusiness.co.ke')}
        <Toggle label="Floating WhatsApp button" checked={b.showWhatsappButton} onChange={(v) => onBusiness({ showWhatsappButton: v })} />
      </section>
      <section className="space-y-3">
        <h3 className="text-xs font-bold tracking-wide text-slate-500 uppercase">M-Pesa payments</h3>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 text-xs font-semibold">
          {(['none', 'till', 'paybill'] as const).map((t) => (
            <button key={t} className={`rounded-md py-1.5 ${b.mpesaType === t ? 'bg-white shadow-xs' : 'text-slate-500'}`} onClick={() => onBusiness({ mpesaType: t })}>
              {t === 'none' ? 'Off' : t === 'till' ? 'Till (Buy Goods)' : 'Paybill'}
            </button>
          ))}
        </div>
        {b.mpesaType !== 'none' && text('mpesaNumber', b.mpesaType === 'till' ? 'Till number' : 'Business number')}
        {b.mpesaType === 'paybill' && text('mpesaAccount', 'Account number', 'e.g. your name or order no.')}
      </section>
      <section className="space-y-3">
        <h3 className="text-xs font-bold tracking-wide text-slate-500 uppercase">Site</h3>
        <div>
          <label className="label">Site type</label>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 text-xs font-semibold">
            {(['website', 'app'] as const).map((k) => (
              <button key={k} className={`rounded-md py-1.5 ${project.kind === k ? 'bg-white shadow-xs' : 'text-slate-500'}`} onClick={() => onProject({ kind: k })}>
                {k === 'website' ? 'Website' : 'Phone app'}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Every published site can be installed on a phone home screen. Phone apps open in the mobile preview and suggest the tab bar.</p>
        </div>
        <div>
          <label className="label">Site address</label>
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <span className="shrink-0">/sites/</span>
            <input className="input" value={slug} onChange={(e) => setSlug(e.target.value)} onBlur={() => { const s = slugify(slug); setSlug(s); if (s !== project.slug) onProject({ slug: s }); }} />
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------------- Theme ---------------- */

export function ThemePanel({ theme, onChange }: { theme: Theme; onChange: (patch: Partial<Theme>) => void }) {
  return (
    <div className="space-y-6 px-4 py-4">
      <section>
        <h3 className="mb-2 text-xs font-bold tracking-wide text-slate-500 uppercase">Presets</h3>
        <div className="grid grid-cols-2 gap-2">
          {THEME_PRESETS.map((p) => {
            const active = p.theme.primary === theme.primary && p.theme.background === theme.background;
            return (
              <button key={p.id} onClick={() => onChange(p.theme)} className={`relative rounded-lg border p-2 text-left ${active ? 'border-brand-500 ring-2 ring-brand-100' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="flex h-8 overflow-hidden rounded-md">
                  {[p.theme.background, p.theme.surface, p.theme.primary, p.theme.accent, p.theme.text].map((c, i) => (
                    <span key={i} className="flex-1" style={{ background: c }} />
                  ))}
                </div>
                <span className="mt-1.5 block text-xs font-semibold">{p.name}</span>
                {active && <Check className="absolute top-1 right-1 size-3.5 rounded-full bg-brand-600 p-0.5 text-white" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-xs font-bold tracking-wide text-slate-500 uppercase">Colours</h3>
        <ColorInput label="Brand" value={theme.primary} onChange={(v) => onChange({ primary: v })} />
        <ColorInput label="Accent" value={theme.accent} onChange={(v) => onChange({ accent: v })} />
        <ColorInput label="Background" value={theme.background} onChange={(v) => onChange({ background: v })} />
        <ColorInput label="Alternate background" value={theme.surface} onChange={(v) => onChange({ surface: v })} />
        <ColorInput label="Text" value={theme.text} onChange={(v) => onChange({ text: v })} />
      </section>
      <section className="space-y-3">
        <h3 className="text-xs font-bold tracking-wide text-slate-500 uppercase">Typography & shape</h3>
        <div>
          <label className="label">Heading font</label>
          <select className="input" value={theme.headingFont} onChange={(e) => onChange({ headingFont: e.target.value })}>
            {FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Body font</label>
          <select className="input" value={theme.font} onChange={(e) => onChange({ font: e.target.value })}>
            {FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Corner roundness · {theme.radius}px</label>
          <input type="range" min={0} max={28} value={theme.radius} onChange={(e) => onChange({ radius: Number(e.target.value) })} className="w-full accent-brand-600" />
        </div>
      </section>
    </div>
  );
}
