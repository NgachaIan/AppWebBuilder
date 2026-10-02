import { useCallback, useRef, useState } from 'react';

/**
 * Undoable state. Rapid edits sharing the same `group` key (e.g. typing in one field)
 * are merged into a single undo step.
 */
export function useHistory<T>(initial: T, limit = 100) {
  const [state, setState] = useState({ present: initial, past: [] as T[], future: [] as T[] });
  const last = useRef<{ group?: string; at: number }>({ at: 0 });

  const set = useCallback(
    (updater: T | ((prev: T) => T), group?: string) => {
      setState((s) => {
        const next = typeof updater === 'function' ? (updater as (p: T) => T)(s.present) : updater;
        if (next === s.present) return s;
        const now = Date.now();
        const merge = group && last.current.group === group && now - last.current.at < 1200;
        last.current = { group, at: now };
        return {
          present: next,
          past: merge ? s.past : [...s.past, s.present].slice(-limit),
          future: [],
        };
      });
    },
    [limit],
  );

  const undo = useCallback(() => {
    last.current = { at: 0 };
    setState((s) => (s.past.length ? { present: s.past[s.past.length - 1], past: s.past.slice(0, -1), future: [s.present, ...s.future] } : s));
  }, []);

  const redo = useCallback(() => {
    last.current = { at: 0 };
    setState((s) => (s.future.length ? { present: s.future[0], past: [...s.past, s.present], future: s.future.slice(1) } : s));
  }, []);

  /** Replace state without creating history (e.g. server response). */
  const reset = useCallback((value: T) => setState({ present: value, past: [], future: [] }), []);

  return { value: state.present, set, undo, redo, reset, canUndo: state.past.length > 0, canRedo: state.future.length > 0 };
}
