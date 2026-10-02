import { ArrowDown, ArrowUp, CheckCircle2, Circle, Copy, MousePointerClick, Trash2, X } from 'lucide-react';
import type { Block, Project } from '@shared/types';
import { BLOCKS } from '@shared/blocks';
import { BlockIcon } from '../../lib/icons';
import { FieldEditor, type FieldCtx } from '../fields';

export function Inspector({ block, ctx, onChange, onClose, onMove, onDuplicate, onDelete, isFirst, isLast }: {
  block: Block;
  ctx: FieldCtx;
  onChange: (key: string, value: any) => void;
  onClose: () => void;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const def = BLOCKS[block.type];
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><BlockIcon name={def.icon} /></span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold">{def.label}</div>
          <div className="truncate text-xs text-slate-500">{def.description}</div>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close inspector"><X className="size-4" /></button>
      </div>
      <div className="flex gap-1 border-b border-slate-200 px-3 py-2">
        <button className="icon-btn" onClick={() => onMove(-1)} disabled={isFirst} title="Move up"><ArrowUp className="size-4" /></button>
        <button className="icon-btn" onClick={() => onMove(1)} disabled={isLast} title="Move down"><ArrowDown className="size-4" /></button>
        <button className="icon-btn" onClick={onDuplicate} title="Duplicate"><Copy className="size-4" /></button>
        <button className="icon-btn ml-auto hover:!text-rose-600" onClick={onDelete} title="Delete section"><Trash2 className="size-4" /></button>
      </div>
      <div className="scroll-thin flex-1 space-y-4 overflow-y-auto p-4">
        {def.fields.map((f) => (
          <FieldEditor key={`${block.id}.${f.key}`} field={f} value={block.props[f.key]} ctx={ctx} group={`${block.id}.${f.key}`} onChange={(v) => onChange(f.key, v)} />
        ))}
        <details className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
          <summary className="cursor-pointer text-xs font-semibold text-slate-600">Advanced</summary>
          <div className="pt-3">
            <label className="label">Section ID (for links like #contact)</label>
            <input className="input" value={block.props.anchor ?? ''} placeholder="e.g. menu" onChange={(e) => onChange('anchor', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} />
          </div>
        </details>
      </div>
    </div>
  );
}

export function SetupChecklist({ project, onOpenSite, onOpenTheme }: { project: Project; onOpenSite: () => void; onOpenTheme: () => void }) {
  const b = project.business;
  const items = [
    { done: !!(b.whatsapp || b.phone), label: 'Add your phone or WhatsApp', action: onOpenSite },
    { done: !!b.location, label: 'Add your location', action: onOpenSite },
    { done: b.mpesaType !== 'none' && !!b.mpesaNumber, label: 'Add M-Pesa Till or Paybill', action: onOpenSite },
    { done: !!b.tagline, label: 'Write a tagline for Google', action: onOpenSite },
    { done: project.template !== 'blank' || project.theme.primary !== '#0f766e', label: 'Pick your brand colours', action: onOpenTheme },
    { done: project.published, label: 'Publish your site', action: undefined },
  ];
  const done = items.filter((i) => i.done).length;
  return (
    <div className="p-5">
      <div className="mb-6 flex flex-col items-center rounded-xl border border-dashed border-slate-300 p-5 text-center text-slate-500">
        <MousePointerClick className="mb-2 size-6 text-slate-400" />
        <p className="text-sm font-medium text-slate-700">Select a section to edit it</p>
        <p className="text-xs">Click anything on the page, or pick from the Sections tab.</p>
      </div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold">Launch checklist</h3>
        <span className="text-xs font-semibold text-slate-500">{done}/{items.length}</span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(done / items.length) * 100}%` }} />
      </div>
      <ul className="space-y-1">
        {items.map((i) => (
          <li key={i.label}>
            <button disabled={!i.action} onClick={i.action} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-100 disabled:hover:bg-transparent">
              {i.done ? <CheckCircle2 className="size-4 text-emerald-500" /> : <Circle className="size-4 text-slate-300" />}
              <span className={i.done ? 'text-slate-400 line-through' : 'text-slate-700'}>{i.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
