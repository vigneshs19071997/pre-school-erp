import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";
import { db, students, studentAttendance } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { allowedClasses } from "@/lib/scope";
import { PageHeader, Card, Avatar, Empty, Pills } from "@/components/ui";
import { ActionForm, SubmitButton, AutoSubmit } from "@/components/client";
import { today, currentMonth, monthRange, fmtDate, cn } from "@/lib/utils";
import { saveStudentAttendance } from "./actions";

const OPTIONS = [
  { v: "present", label: "Present", cls: "peer-checked:bg-mint-500 peer-checked:text-white peer-checked:ring-mint-500" },
  { v: "late", label: "Late", cls: "peer-checked:bg-sun-500 peer-checked:text-white peer-checked:ring-sun-500" },
  { v: "absent", label: "Absent", cls: "peer-checked:bg-coral-500 peer-checked:text-white peer-checked:ring-coral-500" },
  { v: "leave", label: "Leave", cls: "peer-checked:bg-sky-500 peer-checked:text-white peer-checked:ring-sky-500" },
];
const DOT: Record<string, string> = { present: "bg-mint-500", late: "bg-sun-500", absent: "bg-coral-500", leave: "bg-sky-500" };

export default async function Attendance({ searchParams }: { searchParams: Promise<{ class?: string; date?: string; view?: string; month?: string }> }) {
  const me = await requireStaff("student_attendance.mark");
  const sp = await searchParams;
  const cls = await allowedClasses(me);
  if (!cls.length) return <Card><Empty title="Create a class first" emoji="🏫" /></Card>;
  const classId = Number(sp.class ?? cls[0].id);
  const date = sp.date ?? today();
  const view = sp.view === "register" ? "register" : "mark";
  const month = sp.month ?? currentMonth();
  const kids = await db.select().from(students).where(and(eq(students.classId, classId), eq(students.status, "active"))).orderBy(asc(students.firstName));
  const ids = kids.map((k) => k.id);

  const tabs = [
    { key: "mark", label: "📋 Take attendance", href: `/admin/attendance?class=${classId}&date=${date}` },
    { key: "register", label: "🗓️ Monthly register", href: `/admin/attendance?view=register&class=${classId}&month=${month}` },
  ];

  if (view === "register") {
    const { start, end, days } = monthRange(month);
    const rows = ids.length ? await db.select().from(studentAttendance).where(and(inArray(studentAttendance.studentId, ids), gte(studentAttendance.date, start), lte(studentAttendance.date, end))) : [];
    const map = new Map(rows.map((r) => [`${r.studentId}_${r.date}`, r.status]));
    return (
      <>
        <PageHeader title="Student attendance" emoji="✅" />
        <Pills items={tabs} active="register" />
        <Card padded={false}>
          <AutoSubmit className="flex flex-wrap gap-3 border-b border-slate-100 p-4">
            <input type="hidden" name="view" value="register" />
            <select name="class" defaultValue={classId} className="input w-auto">{cls.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <input type="month" name="month" defaultValue={month} className="input w-auto" />
          </AutoSubmit>
          <div className="overflow-x-auto">
            <table className="text-xs">
              <thead><tr><th className="sticky left-0 bg-white px-4 py-2 text-left">Student</th>
                {Array.from({ length: days }, (_, i) => <th key={i} className="w-7 px-0.5 py-2 text-center font-semibold text-slate-400">{i + 1}</th>)}
                <th className="px-3 text-center">%</th></tr></thead>
              <tbody>
                {kids.map((k) => {
                  let p = 0, t = 0;
                  return (
                    <tr key={k.id} className="border-t border-slate-100">
                      <td className="sticky left-0 whitespace-nowrap bg-white px-4 py-2 font-semibold">{k.firstName} {k.lastName}</td>
                      {Array.from({ length: days }, (_, i) => {
                        const s = map.get(`${k.id}_${month}-${String(i + 1).padStart(2, "0")}`);
                        if (s) { t++; if (s === "present" || s === "late") p++; }
                        return <td key={i} className="text-center"><span title={s} className={cn("mx-auto block h-3.5 w-3.5 rounded-full", s ? DOT[s] : "bg-slate-100")} /></td>;
                      })}
                      <td className="px-3 text-center font-bold">{t ? Math.round((p / t) * 100) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-4 border-t border-slate-100 p-4 text-xs">{Object.entries(DOT).map(([k, c]) => <span key={k} className="flex items-center gap-1.5 capitalize"><i className={cn("h-3 w-3 rounded-full", c)} />{k}</span>)}</div>
        </Card>
      </>
    );
  }

  const existing = ids.length ? await db.select().from(studentAttendance).where(and(inArray(studentAttendance.studentId, ids), eq(studentAttendance.date, date))) : [];
  const saved = new Map(existing.map((e) => [e.studentId, e]));
  return (
    <>
      <PageHeader title="Student attendance" emoji="✅" subtitle={fmtDate(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} />
      <Pills items={tabs} active="mark" />
      <Card padded={false}>
        <AutoSubmit className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <select name="class" defaultValue={classId} className="input w-auto">{cls.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <input type="date" name="date" defaultValue={date} max={today()} className="input w-auto" />
          {existing.length > 0 && <span className="rounded-full bg-mint-100 px-3 py-1 text-xs font-bold text-mint-600">Already marked · you can update</span>}
        </AutoSubmit>
        {kids.length ? (
          <ActionForm action={saveStudentAttendance} reset={false} key={`${classId}-${date}`}>
            <input type="hidden" name="classId" value={classId} />
            <input type="hidden" name="date" value={date} />
            <ul className="divide-y divide-slate-100">
              {kids.map((k) => {
                const cur = saved.get(k.id)?.status ?? "present";
                return (
                  <li key={k.id} className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center">
                    <div className="flex flex-1 items-center gap-3">
                      <Avatar name={`${k.firstName} ${k.lastName ?? ""}`} photoKey={k.photoKey} size={38} />
                      <div><p className="font-semibold text-slate-800">{k.firstName} {k.lastName}</p><p className="font-mono text-xs text-slate-400">{k.studentCode}</p></div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {OPTIONS.map((o) => (
                        <label key={o.v} className="cursor-pointer">
                          <input type="radio" name={`s_${k.id}`} value={o.v} defaultChecked={cur === o.v} className="peer sr-only" />
                          <span className={cn("block rounded-full px-3.5 py-1.5 text-xs font-bold text-slate-500 ring-1 ring-slate-200 transition", o.cls)}>{o.label}</span>
                        </label>
                      ))}
                    </div>
                    <input name={`n_${k.id}`} defaultValue={saved.get(k.id)?.note ?? ""} placeholder="Note" className="input sm:w-44" />
                  </li>
                );
              })}
            </ul>
            <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-slate-100 bg-white/90 p-4 backdrop-blur">
              <span className="text-sm text-slate-500">{kids.length} students · everyone starts as Present</span>
              <SubmitButton pendingText="Saving…">Save attendance</SubmitButton>
            </div>
          </ActionForm>
        ) : <Empty title="No students in this class" emoji="🧸" />}
      </Card>
    </>
  );
}
