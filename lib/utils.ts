import clsx, { type ClassValue } from "clsx";

export const cn = (...c: ClassValue[]) => clsx(c);

export const TZ = process.env.APP_TIMEZONE || "Asia/Kolkata";

/** YYYY-MM-DD in school time zone */
export function today(d: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
export function currentMonth() {
  return today().slice(0, 7);
}
export function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { start: `${month}-01`, end: `${month}-${String(last).padStart(2, "0")}`, days: last };
}
/** The given day-of-month within `month`, clamped to that month's last day (e.g. the 31st in February becomes the 28th/29th). */
export function monthDate(month: string, day: number) {
  const { days } = monthRange(month);
  return `${month}-${String(Math.min(day, days)).padStart(2, "0")}`;
}
export function fmtDate(iso?: string | Date | null, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso.length === 10 ? iso + "T00:00:00" : iso) : iso;
  return d.toLocaleDateString("en-IN", opts);
}
export function fmtTime(d?: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
}
export function fmtMonth(month: string) {
  return new Date(month + "-01T00:00:00").toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}
export function inr(n: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n ?? 0);
}
export function age(dob?: string | null) {
  if (!dob) return "—";
  const b = new Date(dob), n = new Date();
  let months = (n.getFullYear() - b.getFullYear()) * 12 + n.getMonth() - b.getMonth();
  if (n.getDate() < b.getDate()) months--;
  return `${Math.floor(months / 12)}y ${months % 12}m`;
}
export function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]!.toUpperCase()).join("");
}
export const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
};
export const num = (fd: FormData, k: string) => {
  const v = str(fd, k);
  return v === null ? 0 : Number(v);
};
