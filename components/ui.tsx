import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { fileUrl } from "@/lib/storage";

export function PageHeader({ title, subtitle, children, emoji }: { title: string; subtitle?: string; children?: React.ReactNode; emoji?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{emoji && <span className="mr-2">{emoji}</span>}{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

const tones = {
  brand: "bg-brand-100 text-brand-700",
  coral: "bg-coral-100 text-coral-600",
  sun: "bg-sun-100 text-sun-600",
  mint: "bg-mint-100 text-mint-600",
  sky: "bg-sky-100 text-sky-600",
  slate: "bg-slate-100 text-slate-600",
} as const;
export type Tone = keyof typeof tones;

export function StatCard({ label, value, icon: Icon, tone = "brand", hint, href }: {
  label: string; value: React.ReactNode; icon: LucideIcon; tone?: Tone; hint?: React.ReactNode; href?: string;
}) {
  const body = (
    <div className="card group flex items-center gap-4 p-5 transition hover:-translate-y-0.5">
      <div className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl", tones[tone])}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="font-display text-2xl font-semibold text-slate-800">{value}</p>
        {hint && <p className="truncate text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function Card({ title, action, children, className, padded = true }: {
  title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string; padded?: boolean;
}) {
  return (
    <section className={cn("card", className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          {action}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

const statusTone: Record<string, Tone> = {
  active: "mint", present: "mint", paid: "mint", approved: "mint", admitted: "mint", happy: "mint",
  pending: "sun", partial: "sun", draft: "sun", late: "sun", half_day: "sun", visit: "sky", contacted: "sky", new: "brand",
  absent: "coral", rejected: "coral", lost: "coral", inactive: "slate", withdrawn: "slate", cancelled: "slate", leave: "sky",
  graduated: "brand", overdue: "coral",
};
export function Badge({ children, tone }: { children: React.ReactNode; tone?: Tone }) {
  const t = tone ?? statusTone[String(children).toLowerCase()] ?? "slate";
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", tones[t])}>{String(children).replace("_", " ")}</span>;
}

export function Empty({ title, text, emoji = "🌱" }: { title: string; text?: string; emoji?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 text-5xl">{emoji}</div>
      <p className="font-display text-lg font-semibold text-slate-700">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
    </div>
  );
}

const avatarTones = ["bg-brand-100 text-brand-700", "bg-coral-100 text-coral-600", "bg-sun-100 text-sun-600", "bg-mint-100 text-mint-600", "bg-sky-100 text-sky-600"];
export function Avatar({ name, photoKey, size = 40 }: { name: string; photoKey?: string | null; size?: number }) {
  const url = fileUrl(photoKey);
  const tone = avatarTones[name.length % avatarTones.length];
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={name} width={size} height={size} className="shrink-0 rounded-full object-cover ring-2 ring-white" style={{ width: size, height: size }} />
  ) : (
    <span className={cn("grid shrink-0 place-items-center rounded-full font-display font-semibold ring-2 ring-white", tone)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}>{initials(name)}</span>
  );
}

export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={cn("block", className)}><span className="label">{label}</span>{children}</label>;
}

export function Pills({ items, active }: { items: { href: string; label: string; key: string }[]; active: string }) {
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {items.map((i) => (
        <Link key={i.key} href={i.href}
          className={cn("rounded-full px-4 py-1.5 text-sm font-semibold transition",
            i.key === active ? "bg-brand-600 text-white shadow-sm" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-brand-50")}>
          {i.label}
        </Link>
      ))}
    </div>
  );
}

export function TableWrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("overflow-x-auto", className)}>{children}</div>;
}
