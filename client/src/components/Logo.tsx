export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2 font-bold tracking-tight text-slate-900">
      <svg viewBox="0 0 64 64" className="size-7" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="#4f46e5" />
        <path d="M18 44 28 20h8l10 24h-7l-2-5H27l-2 5zm11-11h6l-3-8z" fill="#fff" />
      </svg>
      {!compact && <span>AppWebBuilder</span>}
    </span>
  );
}
