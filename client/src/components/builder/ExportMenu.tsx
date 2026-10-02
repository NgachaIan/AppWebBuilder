import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download, FileArchive, FileCode2, FileJson, Loader2 } from 'lucide-react';
import type { ExportKind } from '../../lib/exporter';

const OPTIONS: { kind: ExportKind; title: string; detail: string; icon: typeof Download }[] = [
  { kind: 'zip', title: 'Website (.zip)', detail: 'Every page as HTML, ready to upload to any web host', icon: FileArchive },
  { kind: 'page', title: 'This page (.html)', detail: 'A single file you can open or share', icon: FileCode2 },
  { kind: 'backup', title: 'Project backup (.json)', detail: 'Re-import later from the dashboard', icon: FileJson },
];

export default function ExportMenu({ pageName, onExport }: { pageName: string; onExport: (kind: ExportKind) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<ExportKind | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  async function run(kind: ExportKind) {
    setBusy(kind);
    try {
      await onExport(kind);
    } finally {
      setBusy(null);
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button className={`btn-ghost !px-2.5 ${open ? 'bg-slate-100' : ''}`} onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} title="Export your site">
        <Download className="size-4" />
        <span className="hidden lg:inline">Export</span>
        <ChevronDown className="hidden size-3.5 lg:block" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-11 z-40 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          {OPTIONS.map((o) => (
            <button key={o.kind} role="menuitem" disabled={!!busy} onClick={() => run(o.kind)} className="flex w-full items-start gap-3 rounded-lg p-2.5 text-left hover:bg-slate-50 disabled:opacity-60">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                {busy === o.kind ? <Loader2 className="size-4 animate-spin" /> : <o.icon className="size-4" />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-800">{o.kind === 'page' ? `“${pageName}” page (.html)` : o.title}</span>
                <span className="block text-xs text-slate-500">{o.detail}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
