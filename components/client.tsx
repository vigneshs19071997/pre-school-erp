"use client";

import { createContext, useActionState, useContext, useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useFormStatus } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { CheckCircle2, Loader2, X, AlertCircle, AlertTriangle, MapPin } from "lucide-react";
import type { ActionState } from "@/lib/action";
import { cn } from "@/lib/utils";
import { useApiLoader } from "@/components/loader";

/* ---------------- Toasts ---------------- */
type Toast = { id: number; ok: boolean; text: string };
export function toast(ok: boolean, text: string) {
  window.dispatchEvent(new CustomEvent("app-toast", { detail: { ok, text } }));
}
export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    const h = (e: Event) => {
      const { ok, text } = (e as CustomEvent).detail;
      const id = Date.now() + Math.random();
      setItems((s) => [...s, { id, ok, text }]);
      setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 3500);
    };
    window.addEventListener("app-toast", h);
    return () => window.removeEventListener("app-toast", h);
  }, []);
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
      {items.map((t) => (
        <div key={t.id} className={cn("animate-pop flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg",
          t.ok ? "bg-mint-600" : "bg-coral-600")}>
          {t.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {t.text}
        </div>
      ))}
    </div>
  );
}

/* ---------------- Buttons & forms ---------------- */
export function SubmitButton({ children, className = "btn-primary", pendingText }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

type FormAction = (prev: ActionState, fd: FormData) => Promise<ActionState>;

export function ActionForm({ action, children, className, reset = true, onDone, formRef }: {
  action: FormAction; children: React.ReactNode; className?: string; reset?: boolean; onDone?: () => void; formRef?: React.RefObject<HTMLFormElement | null>;
}) {
  const { show, hide } = useApiLoader();
  const [state, run, actionPending] = useActionState(action, null);
  const [refreshPending, startRefresh] = useTransition();
  const ref = useRef<HTMLFormElement>(null);
  const modal = useContext(ModalCtx);
  const router = useRouter();
  useEffect(() => {
    if (!actionPending && !refreshPending) return;
    show();
    return () => hide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionPending, refreshPending]);
  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      if (state.message) toast(true, state.message);
      if (reset) ref.current?.reset();
      modal?.close();
      onDone?.();
      startRefresh(() => router.refresh());
    } else if (state.error) toast(false, state.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <form ref={(node) => { ref.current = node; if (formRef) formRef.current = node; }} action={run} className={className}>
      {children}
    </form>
  );
}

/** Centered confirm/cancel popup — the app's own replacement for window.confirm(). */
export function ConfirmDialog({ open, message, onConfirm, onCancel, confirmLabel = "Delete" }: {
  open: boolean; message: string; onConfirm: () => void; onCancel: () => void; confirmLabel?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onCancel]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[150] grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="animate-pop card w-full max-w-sm p-6 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-coral-100 text-coral-600"><AlertTriangle className="h-6 w-6" /></div>
        <p className="font-display text-lg font-semibold text-slate-800">{message}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Small one-click action (delete, approve…) with optional confirm prompt. */
export function ActionButton({ action, fields, children, className = "btn-ghost btn-sm", confirm }: {
  action: FormAction; fields: Record<string, string | number>; children: React.ReactNode; className?: string; confirm?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [asking, setAsking] = useState(false);
  return (
    <>
      <ActionForm action={action} className="inline" formRef={formRef}>
        {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        <button type="submit" className={className}
          onClick={(e) => { if (confirm) { e.preventDefault(); setAsking(true); } }}>
          {children}
        </button>
      </ActionForm>
      {confirm && (
        <ConfirmDialog open={asking} message={confirm}
          onCancel={() => setAsking(false)}
          onConfirm={() => { setAsking(false); formRef.current?.requestSubmit(); }} />
      )}
    </>
  );
}

/* ---------------- Modal ---------------- */
const ModalCtx = createContext<{ close: () => void } | null>(null);

export function Modal({ trigger, title, children, wide, triggerClass = "btn-primary" }: {
  trigger: React.ReactNode; title: string; children: React.ReactNode; wide?: boolean; triggerClass?: string;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open]);
  return (
    <>
      <button type="button" className={triggerClass} onClick={() => setOpen(true)}>{trigger}</button>
      {open && createPortal(
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 text-left backdrop-blur-sm sm:items-center"
          onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className={cn("animate-pop card my-8 w-full p-6", wide ? "max-w-3xl" : "max-w-lg")}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-semibold">{title}</h3>
              <button className="btn-ghost btn-sm" onClick={() => setOpen(false)} aria-label="Close"><X className="h-4 w-4" /></button>
            </div>
            <ModalCtx.Provider value={{ close: () => setOpen(false) }}>{children}</ModalCtx.Provider>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

/* ---------------- Filter bar: navigates with the form's fields as query params on change ---------------- */
export function AutoSubmit({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { show, hide } = useApiLoader();
  const [isPending, startTransition] = useTransition();
  useEffect(() => {
    if (!isPending) return;
    show();
    return () => hide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending]);
  function submit() {
    if (!ref.current) return;
    const params = new URLSearchParams(new FormData(ref.current) as unknown as Record<string, string>).toString();
    startTransition(() => router.push(params ? `${pathname}?${params}` : pathname));
  }
  return (
    <form ref={ref} className={className} onChange={submit}>
      {children}
    </form>
  );
}

export function PrintButton({ label = "Print / Save PDF" }: { label?: string }) {
  return <button type="button" className="btn-soft print:hidden" onClick={() => window.print()}>{label}</button>;
}

/* ---------------- Geolocation ---------------- */
function locate(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("This browser doesn't support location"));
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
  });
}
function locationErrorMessage(e: unknown) {
  if (e && typeof e === "object" && "code" in e) {
    const code = (e as GeolocationPositionError).code;
    if (code === 1) return "Location access denied — enable it in your browser settings and try again.";
    if (code === 3) return "Location request timed out. Try again.";
  }
  return e instanceof Error ? e.message : "Couldn't get your location.";
}

/** Check-in/out button: captures the staff member's current location and submits it with the action. */
export function GeoSubmitButton({ action, children, pendingText, className = "btn-primary" }: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>; children: React.ReactNode; pendingText?: string; className?: string;
}) {
  const [pending, setPending] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [refreshPending, startRefresh] = useTransition();
  const router = useRouter();
  const { show, hide } = useApiLoader();
  useEffect(() => {
    if (!actionPending && !refreshPending) return;
    show();
    return () => hide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionPending, refreshPending]);
  async function handle() {
    setPending(true);
    try {
      const pos = await locate();
      const fd = new FormData();
      fd.set("lat", String(pos.coords.latitude));
      fd.set("lng", String(pos.coords.longitude));
      setActionPending(true);
      try {
        const res = await action(null, fd);
        if (res?.ok) { if (res.message) toast(true, res.message); startRefresh(() => router.refresh()); }
        else if (res?.error) toast(false, res.error);
      } finally {
        setActionPending(false);
      }
    } catch (e) {
      toast(false, locationErrorMessage(e));
    } finally {
      setPending(false);
    }
  }
  return (
    <button type="button" onClick={handle} disabled={pending} className={className}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

/** Settings form fields for the school's attendance geofence, with a button to fill lat/lng from the browser's location. */
export function GeofenceFields({ defaultLat, defaultLng, defaultRadius }: { defaultLat: string; defaultLng: string; defaultRadius: string }) {
  const latRef = useRef<HTMLInputElement>(null);
  const lngRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  async function useCurrent() {
    setBusy(true);
    try {
      const pos = await locate();
      if (latRef.current) latRef.current.value = String(pos.coords.latitude);
      if (lngRef.current) lngRef.current.value = String(pos.coords.longitude);
      toast(true, "Location captured — remember to save");
    } catch (e) {
      toast(false, locationErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <label className="block"><span className="label">Latitude</span><input ref={latRef} name="schoolLat" type="number" step="any" defaultValue={defaultLat} className="input" /></label>
      <label className="block"><span className="label">Longitude</span><input ref={lngRef} name="schoolLng" type="number" step="any" defaultValue={defaultLng} className="input" /></label>
      <label className="block"><span className="label">Radius (meters)</span><input name="geofenceRadius" type="number" min={5} defaultValue={defaultRadius} className="input" /></label>
      <button type="button" onClick={useCurrent} disabled={busy} className="btn-soft btn-sm sm:col-span-3 sm:w-fit">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}Use my current location
      </button>
    </div>
  );
}
