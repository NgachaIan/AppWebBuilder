import { useEffect, useState } from 'react';
import { Check, Loader2, Smartphone, Globe, X } from 'lucide-react';
import { THEME_PRESETS, type TemplateInfo } from '@shared/templates';
import { api } from '../lib/api';

export default function NewProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [name, setName] = useState('');
  const [template, setTemplate] = useState('shop');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cat, setCat] = useState('All');

  useEffect(() => {
    api.templates().then(setTemplates).catch((e) => setError(e.message));
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Give your business a name');
      return;
    }
    setBusy(true);
    try {
      const p = await api.create(name.trim(), template);
      onCreated(p.id);
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={create} className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" role="dialog" aria-labelledby="np-title">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 id="np-title" className="text-lg font-bold">Create a new site</h2>
            <p className="text-sm text-slate-500">Pick a starting point. You can change everything later.</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X className="size-5" />
          </button>
        </div>

        <div className="scroll-thin flex-1 overflow-y-auto px-6 py-5">
          <label className="label" htmlFor="np-name">Business name</label>
          <input id="np-name" autoFocus className="input mb-6 max-w-md text-base" placeholder="e.g. Wanjiku's Fashion House" value={name} maxLength={80} onChange={(e) => { setName(e.target.value); setError(''); }} />

          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="label !mb-0 mr-1">Template</span>
            {['All', ...Array.from(new Set(templates.map((t) => t.tags[0])))].map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${cat === c ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {templates.filter((t) => cat === 'All' || t.tags[0] === cat).map((t) => {
              const th = THEME_PRESETS.find((x) => x.id === t.themeId)!.theme;
              const active = template === t.id;
              return (
                <button type="button" key={t.id} onClick={() => setTemplate(t.id)} className={`group relative overflow-hidden rounded-xl border text-left transition ${active ? 'border-brand-500 ring-2 ring-brand-100' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="relative h-24 p-3" style={{ background: th.background }}>
                    <div className="mb-2 h-2 w-12 rounded-full" style={{ background: th.text, opacity: 0.8 }} />
                    <div className="mb-1.5 h-1.5 w-24 rounded-full" style={{ background: th.text, opacity: 0.25 }} />
                    <div className="mb-3 h-1.5 w-16 rounded-full" style={{ background: th.text, opacity: 0.25 }} />
                    <div className="flex gap-1.5">
                      <div className="h-4 w-12 rounded" style={{ background: th.primary }} />
                      <div className="h-4 w-8 rounded" style={{ background: th.accent }} />
                    </div>
                    <div className="absolute top-3 right-3 h-16 w-20 rounded-lg" style={{ background: `linear-gradient(135deg, ${th.primary}, ${th.accent})` }} />
                    {t.kind === 'app' && <Smartphone className="absolute right-4 bottom-2 size-4 text-white/80" />}
                  </div>
                  <div className="border-t border-slate-100 bg-white p-3">
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                      {t.kind === 'app' ? <Smartphone className="size-3.5 text-slate-400" /> : <Globe className="size-3.5 text-slate-400" />}
                      {t.name}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{t.description}</p>
                    <div className="mt-2 flex gap-1">
                      {t.tags.map((tag) => (
                        <span key={tag} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{tag}</span>
                      ))}
                    </div>
                  </div>
                  {active && (
                    <span className="absolute top-2 left-2 flex size-5 items-center justify-center rounded-full bg-brand-600 text-white">
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <p className="text-sm text-rose-600" role="alert">{error}</p>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              Create site
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
