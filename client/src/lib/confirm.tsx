import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type Ask = { message: string; action: string; resolve: (ok: boolean) => void };
const Ctx = createContext<(message: string, action?: string) => Promise<boolean>>(async () => false);

/** In-page replacement for window.confirm(), which some embeds (and the demo host) block. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [ask, setAsk] = useState<Ask | null>(null);
  const confirm = useCallback((message: string, action = 'Delete') => new Promise<boolean>((resolve) => setAsk({ message, action, resolve })), []);
  const done = (ok: boolean) => {
    ask?.resolve(ok);
    setAsk(null);
  };
  return (
    <Ctx.Provider value={confirm}>
      {children}
      {ask && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && done(false)} onKeyDown={(e) => e.key === 'Escape' && done(false)}>
          <div role="alertdialog" aria-labelledby="cf-msg" className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <p id="cf-msg" className="text-sm text-slate-700">{ask.message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => done(false)}>Cancel</button>
              <button className="btn-danger" autoFocus onClick={() => done(true)}>{ask.action}</button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export const useConfirm = () => useContext(Ctx);
