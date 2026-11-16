import Link from "next/link";
import { and, eq, gte, lte } from "drizzle-orm";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { db, studentAttendance, events } from "@/lib/db";
import { requireParent } from "@/lib/auth";
import { PageHeader, Card } from "@/components/ui";
import { currentMonth, monthRange, fmtMonth, today, cn } from "@/lib/utils";

const C: Record<string, string> = { present: "bg-mint-100 text-mint-600", late: "bg-sun-100 text-sun-600", absent: "bg-coral-100 text-coral-600", leave: "bg-sky-100 text-sky-600" };
const shift = (m: string, n: number) => { const d = new Date(m + "-01T00:00:00Z"); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 7); };

export default async function ParentAttendance({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const s = await requireParent();
  const month = (await searchParams).month ?? currentMonth();
  const { start, end, days } = monthRange(month);
  const [rows, hol] = await Promise.all([
    db.select().from(studentAttendance).where(and(eq(studentAttendance.studentId, s.id), gte(studentAttendance.date, start), lte(studentAttendance.date, end))),
    db.select().from(events).where(and(eq(events.type, "holiday"), gte(events.date, start), lte(events.date, end))),
  ]);
  const by = new Map(rows.map((r) => [r.date, r]));
  const holidays = new Map(hol.map((h) => [h.date, h.title]));
  const count = (st: string) => rows.filter((r) => r.status === st).length;
  const pct = rows.length ? Math.round(((count("present") + count("late")) / rows.length) * 100) : 0;
  const firstDow = new Date(start + "T00:00:00").getDay();
  const d = today();
  return (
    <>
      <PageHeader title="Attendance" emoji="🗓️" subtitle={`${fmtMonth(month)} · ${rows.length ? `${pct}% attendance` : "no records"}`} />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {["present", "late", "absent", "leave"].map((st) => <div key={st} className={cn("rounded-2xl p-4", C[st])}><p className="text-xs font-bold uppercase">{st}</p><p className="font-display text-3xl font-semibold">{count(st)}</p></div>)}
      </div>
      <Card title={fmtMonth(month)} action={<div className="flex gap-1"><Link href={`?month=${shift(month, -1)}`} className="btn-ghost btn-sm"><ChevronLeft className="h-4 w-4" /></Link><Link href={`?month=${shift(month, 1)}`} className="btn-ghost btn-sm"><ChevronRight className="h-4 w-4" /></Link></div>}>
        <div className="grid grid-cols-7 gap-2 text-center">
          {["S", "M", "T", "W", "T", "F", "S"].map((x, i) => <span key={i} className="text-xs font-bold text-slate-400">{x}</span>)}
          {Array.from({ length: firstDow }).map((_, i) => <span key={`e${i}`} />)}
          {Array.from({ length: days }).map((_, i) => {
            const day = `${month}-${String(i + 1).padStart(2, "0")}`;
            const r = by.get(day);
            const h = holidays.get(day);
            return (
              <div key={day} title={h ?? r?.note ?? r?.status ?? ""} className={cn("flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-semibold",
                r ? C[r.status] : h ? "bg-brand-50 text-brand-600" : "bg-slate-50 text-slate-400", day === d && "ring-2 ring-brand-400")}>
                {i + 1}
                {h && <span className="text-[10px]">🎉</span>}
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}
