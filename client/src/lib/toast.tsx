import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

type Toast = { id: number; text: string; kind: 'ok' | 'error' };
const Ctx = createContext<(text: string, kind?: Toast['kind']) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, kind: Toast['kind'] = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 6000 : 3000);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div key={t.id} role="status" className={`pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg ${t.kind === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'}`}>
            {t.kind === 'error' ? <AlertTriangle className="size-4" /> : <CheckCircle2 className="size-4 text-emerald-400" />}
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
