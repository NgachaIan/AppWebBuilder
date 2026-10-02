import { useEffect, useMemo, useRef, useState } from 'react';
import { editorShell } from '@shared/render';

export type Device = 'desktop' | 'tablet' | 'mobile';
const WIDTH: Record<Device, string> = { desktop: '100%', tablet: '820px', mobile: '390px' };
const DESKTOP_W = 1200;

export type CanvasMessage =
  | { type: 'ready' }
  | { type: 'select'; id: string | null }
  | { type: 'navigate'; slug: string; anchor: string }
  | { type: 'action'; action: 'up' | 'down' | 'duplicate' | 'delete'; id: string }
  | { type: 'key'; key: string; mod: boolean; shift: boolean }
  | { type: 'lead'; data: Record<string, string> };

interface Props {
  payload: { html: string; css: string; fonts: string; bodyClass: string; preview: boolean };
  selectedId: string | null;
  device: Device;
  scrollToId: { id: string; n: number } | null;
  scrollToAnchor: { anchor: string; n: number } | null;
  onMessage: (m: CanvasMessage) => void;
}

export default function Canvas({ payload, selectedId, device, scrollToId, scrollToAnchor, onMessage }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const shell = useMemo(() => editorShell(), []);
  const handler = useRef(onMessage);
  handler.current = onMessage;

  const post = (msg: object) => frame.current?.contentWindow?.postMessage({ source: 'awb-editor', ...msg }, '*');

  useEffect(() => {
    const listen = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || e.data?.source !== 'awb-canvas') return;
      if (e.data.type === 'ready') setReady(true);
      handler.current(e.data);
    };
    window.addEventListener('message', listen);
    return () => window.removeEventListener('message', listen);
  }, []);

  // Push content into the iframe without reloading it (keeps scroll position).
  useEffect(() => {
    if (ready) post({ type: 'render', ...payload, selectedId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, payload]);

  useEffect(() => {
    if (ready) post({ type: 'select', id: selectedId });
  }, [ready, selectedId]);

  useEffect(() => {
    if (ready && scrollToId) post({ type: 'select', id: scrollToId.id, scroll: true });
  }, [ready, scrollToId]);

  useEffect(() => {
    if (ready && scrollToAnchor) setTimeout(() => post({ type: 'scrollTo', anchor: scrollToAnchor.anchor }), 30);
  }, [ready, scrollToAnchor]);

  // Desktop view renders at a real desktop width and scales down to fit the available space.
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    if (!box.current) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);
  const framed = device !== 'desktop';
  const scale = !framed && size.w > 0 && size.w < DESKTOP_W ? size.w / DESKTOP_W : 1;
  return (
    <div className="scroll-thin flex h-full justify-center overflow-auto bg-slate-200/70 p-4 sm:p-6">
      <div
        ref={box}
        className={`relative h-full shrink-0 overflow-hidden bg-white transition-[width] duration-300 ${framed ? 'rounded-[28px] border-[10px] border-slate-900 shadow-2xl' : 'rounded-xl shadow-lg ring-1 ring-slate-900/5'}`}
        style={{ width: WIDTH[device], maxWidth: '100%', maxHeight: framed ? 880 : undefined }}
      >
        <iframe
          ref={frame}
          title="Page canvas"
          srcDoc={shell}
          className="border-0"
          style={scale < 1 ? { width: DESKTOP_W, height: size.h / scale, transform: `scale(${scale})`, transformOrigin: '0 0' } : { width: '100%', height: '100%' }}
        />
        {!ready && <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">Loading canvas…</div>}
      </div>
    </div>
  );
}
