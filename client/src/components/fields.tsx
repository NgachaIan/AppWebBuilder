import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, ImagePlus, Plus, Trash2, X } from 'lucide-react';
import type { Field, Page, Props } from '@shared/types';
import { fileToDataUrl } from '../lib/images';
import { useToast } from '../lib/toast';

export interface FieldCtx {
  pages: Page[];
  anchors: string[];
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1 text-sm">
      <span className="text-slate-700">{label}</span>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative h-5 w-9 shrink-0 rounded-full transition ${checked ? 'bg-brand-600' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
    </label>
  );
}

export function ColorInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex items-center gap-2">
        <input type="color" aria-label={label} value={value} onChange={(e) => { onChange(e.target.value); setDraft(e.target.value); }} className="h-9 w-11 cursor-pointer rounded-lg border border-slate-200 bg-white p-1" />
        <input
          className="input font-mono uppercase"
          value={draft}
          maxLength={7}
          onChange={(e) => {
            setDraft(e.target.value);
            if (/^#[0-9a-f]{6}$/i.test(e.target.value)) onChange(e.target.value.toLowerCase());
          }}
          onBlur={() => setDraft(value)}
        />
      </div>
    </div>
  );
}

export function ImageInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const isData = value?.startsWith('data:');

  async function onFile(f?: File) {
    if (!f) return;
    setBusy(true);
    try {
      onChange(await fileToDataUrl(f));
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  }

  return (
    <div>
      <span className="label">{label}</span>
      <div
        className="group relative flex h-28 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFile(e.dataTransfer.files[0]);
        }}
      >
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <span className="text-xs text-slate-400">No image</span>}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-900/50 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
          <button type="button" className="btn bg-white !px-2.5 !py-1.5 text-xs text-slate-800" onClick={() => ref.current?.click()} disabled={busy}>
            <ImagePlus className="size-3.5" /> {busy ? 'Uploading…' : value ? 'Replace' : 'Upload'}
          </button>
          {value && (
            <button type="button" className="btn bg-white !px-2 !py-1.5 text-xs text-rose-600" onClick={() => onChange('')} aria-label="Remove image">
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>
      <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      <input className="input mt-1.5 !py-1.5 text-xs" placeholder="…or paste an image URL" value={isData ? '' : value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

const SPECIAL = [
  { value: 'whatsapp', label: 'WhatsApp chat' },
  { value: 'call', label: 'Phone call' },
  { value: 'email', label: 'Send email' },
];

export function LinkInput({ value, onChange, label, ctx }: { value: string; onChange: (v: string) => void; label: string; ctx: FieldCtx }) {
  const v = value ?? '';
  const kind = v.startsWith('page:') ? v : SPECIAL.some((s) => s.value === v) ? v : v.startsWith('#') ? 'anchor' : v ? 'url' : '';
  return (
    <div>
      <span className="label">{label}</span>
      <select
        className="input"
        value={kind}
        onChange={(e) => {
          const k = e.target.value;
          if (k === 'url') onChange('https://');
          else if (k === 'anchor') onChange(`#${ctx.anchors[0] ?? 'contact'}`);
          else onChange(k);
        }}
      >
        <option value="">Nothing</option>
        <optgroup label="Contact">
          {SPECIAL.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </optgroup>
        <optgroup label="Pages">
          {ctx.pages.map((p) => (
            <option key={p.id} value={`page:${p.slug}`}>{p.name} page</option>
          ))}
          {v.startsWith('page:') && v.includes('#') && <option value={v}>{v.replace('page:', 'Page ').replace('#', ' → section #')}</option>}
        </optgroup>
        <option value="anchor">Section on this page…</option>
        <option value="url">Web address…</option>
      </select>
      {kind === 'anchor' && (
        <select className="input mt-1.5" value={v.slice(1)} onChange={(e) => onChange(`#${e.target.value}`)}>
          {Array.from(new Set([...ctx.anchors, v.slice(1)])).filter(Boolean).map((a) => (
            <option key={a} value={a}>#{a}</option>
          ))}
        </select>
      )}
      {kind === 'url' && <input className="input mt-1.5" value={v} placeholder="https://" onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
}

function ListInput({ field, value, onChange, ctx, group }: { field: Field; value: Props[]; onChange: (v: Props[]) => void; ctx: FieldCtx; group: string }) {
  const items = Array.isArray(value) ? value : [];
  const [open, setOpen] = useState<number | null>(null);
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setOpen(j);
  };
  return (
    <div>
      <span className="label">{field.label}</span>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center gap-1 px-2 py-1.5">
              <button type="button" className="min-w-0 flex-1 truncate text-left text-sm font-medium" onClick={() => setOpen(open === i ? null : i)}>
                {String(item[field.itemLabel ?? ''] || `Item ${i + 1}`)}
              </button>
              <button type="button" className="icon-btn !size-6" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ChevronUp className="size-3.5" /></button>
              <button type="button" className="icon-btn !size-6" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down"><ChevronDown className="size-3.5" /></button>
              <button type="button" className="icon-btn !size-6 hover:!text-rose-600" onClick={() => { onChange(items.filter((_, k) => k !== i)); setOpen(null); }} aria-label="Remove"><Trash2 className="size-3.5" /></button>
            </div>
            {open === i && (
              <div className="space-y-3 border-t border-slate-100 p-3">
                {field.itemFields!.map((f) => (
                  <FieldEditor key={f.key} field={f} value={item[f.key]} ctx={ctx} group={`${group}.${i}`} onChange={(val) => onChange(items.map((it, k) => (k === i ? { ...it, [f.key]: val } : it)))} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <button type="button" className="btn-secondary mt-2 w-full !py-1.5 text-xs" onClick={() => { onChange([...items, JSON.parse(JSON.stringify(field.newItem ?? {}))]); setOpen(items.length); }}>
        <Plus className="size-3.5" /> Add {field.label.toLowerCase().replace(/s$/, '')}
      </button>
    </div>
  );
}

export function FieldEditor({ field, value, onChange, ctx, group }: { field: Field; value: any; onChange: (v: any) => void; ctx: FieldCtx; group: string }) {
  const help = field.help ? <p className="mt-1 text-[11px] text-slate-400">{field.help}</p> : null;
  switch (field.type) {
    case 'textarea':
      return (
        <div>
          <label className="label">{field.label}</label>
          <textarea className="input min-h-20 resize-y" rows={3} value={value ?? ''} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
          {help}
        </div>
      );
    case 'select':
      return (
        <div>
          <label className="label">{field.label}</label>
          <select className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
            {field.options!.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {help}
        </div>
      );
    case 'toggle':
      return (
        <div>
          <Toggle label={field.label} checked={!!value} onChange={onChange} />
          {help}
        </div>
      );
    case 'color':
      return <ColorInput label={field.label} value={value || '#000000'} onChange={onChange} />;
    case 'image':
      return <ImageInput label={field.label} value={value ?? ''} onChange={onChange} />;
    case 'link':
      return <LinkInput label={field.label} value={value ?? ''} onChange={onChange} ctx={ctx} />;
    case 'list':
      return <ListInput field={field} value={value} onChange={onChange} ctx={ctx} group={group} />;
    default:
      return (
        <div>
          <label className="label">{field.label}</label>
          <input className="input" value={value ?? ''} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
          {help}
        </div>
      );
  }
}
