import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { INDUSTRIAL_HOVER_DELAY_MS } from '../../lib/constants';

export interface IndustrialHoverCardProps {
  /** Lazy-Renderer: wird erst beim tatsaechlichen Oeffnen ausgefuehrt. */
  content: () => ReactNode;
  children: ReactNode;
  delayMs?: number;
}

/**
 * Verzoegerte Industrie-Hoverkarte (0,6 s) mit Portal-Rendering.
 * Die Karte erscheint erst nach `INDUSTRIAL_HOVER_DELAY_MS`; schnelles
 * Ueberfahren laesst das Interface ruhig. Datenintensive Details werden
 * erst beim Oeffnen geladen (Lazy Loading via `content()`).
 */
export function IndustrialHoverCard({
  content,
  children,
  delayMs = INDUSTRIAL_HOVER_DELAY_MS,
}: IndustrialHoverCardProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => clear, [clear]);

  return (
    <div
      className="contents"
      onMouseEnter={(event) => {
        setPos({ x: event.clientX, y: event.clientY });
        clear();
        timer.current = setTimeout(() => setOpen(true), delayMs);
      }}
      onMouseMove={(event) => setPos({ x: event.clientX, y: event.clientY })}
      onMouseLeave={() => {
        clear();
        setOpen(false);
      }}
    >
      {children}
      {open
        ? createPortal(
            <div
              role="tooltip"
              data-testid="industrial-hover-card"
              style={{
                left: Math.min(pos.x + 14, Math.max(8, window.innerWidth - 360)),
                top: Math.min(pos.y + 14, Math.max(8, window.innerHeight - 60)),
              }}
              className="fixed z-50 max-w-[340px] pointer-events-none rounded border border-slate-700/80 bg-slate-900/95 p-3 text-[12px] text-white shadow-md dark:bg-slate-800/95"
            >
              {content()}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
