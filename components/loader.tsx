"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Logo } from "@/components/logo";

type LoaderCtx = { show: () => void; hide: () => void };
const Ctx = createContext<LoaderCtx | null>(null);

/** Wraps the app so any component can show/hide the global "working" overlay with useApiLoader(). Ref-counted, so overlapping calls don't flicker. */
export function LoaderProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);
  const count = useRef(0);

  const show = useCallback(() => {
    count.current += 1;
    setActive(true);
  }, []);
  const hide = useCallback(() => {
    count.current = Math.max(0, count.current - 1);
    if (count.current === 0) setActive(false);
  }, []);

  return (
    <Ctx.Provider value={{ show, hide }}>
      {children}
      {active && (
        <div className="fixed inset-0 z-[200] grid place-items-center bg-brand-900/35 backdrop-blur-sm" role="status" aria-live="polite" aria-label="Working">
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-20 w-20">
              <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-gold-200/30 border-t-gold-400" style={{ animationDuration: "1s" }} />
              <span className="absolute inset-[6px] grid place-items-center rounded-full bg-white/5">
                <Logo size={44} />
              </span>
            </div>
            <p className="font-display text-sm font-medium tracking-wide text-white/90">Please wait…</p>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useApiLoader() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApiLoader must be used within LoaderProvider");
  return ctx;
}
