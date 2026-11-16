import Link from "next/link";
import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { CalendarCheck, BookOpen, IndianRupee, Utensils, Moon, Palette } from "lucide-react";
import { db, dailyReports, studentAttendance, homework, feeInvoices, events } from "@/lib/db";
import { requireParent } from "@/lib/auth";
import { childClass, parentNotices } from "@/lib/parent-data";
import { fileUrl } from "@/lib/storage";
import { Card, StatCard, Avatar, Empty, Badge } from "@/components/ui";
import { today, currentMonth, monthRange, fmtDate, inr, age, addDays } from "@/lib/utils";
import { MOOD_EMOJI, MEAL_LABEL } from "@/lib/constants";

export default async function ParentHome() {
  const s = await requireParent();
  const d = today();
  const { start, end } = monthRange(currentMonth());
  const cls = await childClass(s);
  const [[report], att, hw, invoices, notices, upcoming] = await Promise.all([
    db.select().from(dailyReports).where(eq(dailyReports.studentId, s.id)).orderBy(desc(dailyReports.date)).limit(1),
    db.select().from(studentAttendance).where(and(eq(studentAttendance.studentId, s.id), gte(studentAttendance.date, start), lte(studentAttendance.date, end))),
    s.classId ? db.select().from(homework).where(eq(homework.classId, s.classId)).orderBy(desc(homework.createdAt)).limit(3) : Promise.resolve([]),
    db.select().from(feeInvoices).where(and(eq(feeInvoices.studentId, s.id), inArray(feeInvoices.status, ["pending", "partial"]))),
    parentNotices(s, 3),
    db.select().from(events).where(and(gte(events.date, d), lte(events.date, addDays(d, 60)))).orderBy(asc(events.date)).limit(4),
  ]);
  const present = att.filter((a) => a.status === "present" || a.status === "late").length;
  const pct = att.length ? Math.round((present / att.length) * 100) : null;
  const due = invoices.reduce((a, i) => a + i.amount - i.discount - i.paidAmount, 0);
  const todayAtt = att.find((a) => a.date === d);
  const name = `${s.firstName} ${s.lastName ?? ""}`.trim();

  return (
    <>
      <div className="card relative mb-6 overflow-hidden bg-gradient-to-br from-coral-500 via-sun-500 to-sun-600 p-6 text-white sm:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/15" />
        <div className="absolute bottom-0 right-24 h-24 w-24 rounded-full bg-white/10" />
        <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <Avatar name={name} photoKey={s.photoKey} size={84} />
          <div>
            <p className="text-sm text-white/80">Hello! Here&apos;s how {s.firstName} is doing 💛</p>
            <h1 className="font-display text-3xl font-semibold text-white">{name}</h1>
            <p className="mt-1 text-sm text-white/90">{cls?.c.name ?? "Class not assigned"}{cls?.teacher ? ` · Teacher: ${cls.teacher}` : ""} · Age {age(s.dob)}</p>
          </div>
          <div className="sm:ml-auto">
            <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur">
              Today: {todayAtt ? <span className="capitalize">{todayAtt.status}</span> : "not marked yet"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Attendance this month" value={pct === null ? "—" : `${pct}%`} icon={CalendarCheck} tone="mint" hint={`${present} of ${att.length} days`} href="/parent/attendance" />
        <StatCard label="Homework" value={hw.length} icon={BookOpen} tone="brand" hint={hw[0] ? `Latest: ${hw[0].title}` : "Nothing yet"} href="/parent/homework" />
        <StatCard label="Fees due" value={inr(due)} icon={IndianRupee} tone={due ? "coral" : "mint"} hint={due ? `${invoices.length} invoice(s)` : "All paid 🎉"} href="/parent/fees" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card title={report ? `Daily update · ${fmtDate(report.date, { weekday: "short", day: "numeric", month: "short" })}` : "Daily update"} className="lg:col-span-3" action={<Link href="/parent/reports" className="text-sm font-semibold text-brand-700">See all →</Link>}>
          {report ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-5xl">{MOOD_EMOJI[report.mood ?? ""] ?? "🙂"}</span>
                <div><p className="text-xs font-semibold uppercase text-slate-400">Mood</p><p className="font-display text-xl font-semibold capitalize">{report.mood ?? "—"}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(["breakfast", "lunch", "snack"] as const).map((m) => (
                  <div key={m} className="rounded-xl bg-sun-100/60 p-3"><Utensils className="mb-1 h-4 w-4 text-sun-600" /><p className="text-xs capitalize text-slate-500">{m}</p><p className="text-sm font-semibold">{MEAL_LABEL[report[m] ?? ""] ?? "—"}</p></div>
                ))}
                <div className="rounded-xl bg-sky-100/60 p-3"><Moon className="mb-1 h-4 w-4 text-sky-600" /><p className="text-xs text-slate-500">Nap</p><p className="text-sm font-semibold">{report.napMinutes ? `${report.napMinutes} min` : "—"}</p></div>
              </div>
              {report.activities && <p className="flex gap-2 text-sm"><Palette className="h-4 w-4 shrink-0 text-brand-600" /><span><b>Activities:</b> {report.activities}</span></p>}
              {report.comment && <blockquote className="rounded-xl border-l-4 border-brand-400 bg-brand-50 p-4 text-sm italic text-slate-700">“{report.comment}”</blockquote>}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {report.photoKey && <img src={fileUrl(report.photoKey)!} alt="Today's photo" className="max-h-72 rounded-xl object-cover" />}
            </div>
          ) : <Empty title="No update yet" text="Your child's teacher will post how the day went." emoji="🌤️" />}
        </Card>
        <div className="space-y-6 lg:col-span-2">
          <Card title="Latest homework" padded={false}>
            {hw.length ? <ul className="divide-y divide-slate-100">{hw.map((h) => (
              <li key={h.id} className="px-5 py-3"><p className="font-semibold">{h.title}</p><p className="text-xs text-slate-500">{h.subject} · due {fmtDate(h.dueDate, { day: "numeric", month: "short" })}</p></li>
            ))}</ul> : <Empty title="No homework" emoji="🎈" />}
          </Card>
          <Card title="Coming up" padded={false}>
            {upcoming.length ? <ul className="divide-y divide-slate-100">{upcoming.map((e) => (
              <li key={e.id} className="flex items-center justify-between px-5 py-3 text-sm"><span><b>{e.title}</b><br /><span className="text-xs text-slate-500">{fmtDate(e.date, { weekday: "short", day: "numeric", month: "short" })}</span></span><Badge tone={e.type === "holiday" ? "coral" : "sky"}>{e.type}</Badge></li>
            ))}</ul> : <Empty title="Nothing planned" emoji="📅" />}
          </Card>
        </div>
      </div>

      {notices.length > 0 && (
        <Card title="📣 From the school" className="mt-6" action={<Link href="/parent/notices" className="text-sm font-semibold text-brand-700">All notices →</Link>}>
          <div className="grid gap-4 md:grid-cols-3">
            {notices.map((n) => <div key={n.id} className="rounded-xl bg-slate-50 p-4"><p className="font-semibold">{n.title}</p><p className="mt-1 line-clamp-3 text-sm text-slate-600">{n.body}</p><p className="mt-2 text-xs text-slate-400">{fmtDate(n.createdAt)}</p></div>)}
          </div>
        </Card>
      )}
    </>
  );
}
