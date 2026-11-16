import { and, asc, eq, inArray } from "drizzle-orm";
import { db, students, dailyReports } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { allowedClasses } from "@/lib/scope";
import { PageHeader, Card, Avatar, Empty } from "@/components/ui";
import { ActionForm, SubmitButton, AutoSubmit } from "@/components/client";
import { today, fmtDate, cn } from "@/lib/utils";
import { saveDailyReport } from "./actions";
import { MOODS } from "@/lib/constants";

const MEALS = [["all", "Ate all"], ["some", "Ate some"], ["none", "Didn't eat"]];

export default async function DailyReports({ searchParams }: { searchParams: Promise<{ class?: string; date?: string }> }) {
  const me = await requireStaff("daily_reports.manage");
  const sp = await searchParams;
  const cls = await allowedClasses(me);
  if (!cls.length) return <Card><Empty title="Create a class first" emoji="🏫" /></Card>;
  const classId = Number(sp.class ?? cls[0].id);
  const date = sp.date ?? today();
  const kids = await db.select().from(students).where(and(eq(students.classId, classId), eq(students.status, "active"))).orderBy(asc(students.firstName));
  const reports = kids.length ? await db.select().from(dailyReports).where(and(eq(dailyReports.date, date), inArray(dailyReports.studentId, kids.map((k) => k.id)))) : [];
  const byKid = new Map(reports.map((r) => [r.studentId, r]));
  return (
    <>
      <PageHeader title="Daily reports" emoji="🌻" subtitle={`Tell parents about their child's day · ${reports.length}/${kids.length} done for ${fmtDate(date, { day: "numeric", month: "short" })}`} />
      <AutoSubmit className="mb-5 flex flex-wrap gap-3">
        <select name="class" defaultValue={classId} className="input w-auto">{cls.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <input type="date" name="date" defaultValue={date} max={today()} className="input w-auto" />
      </AutoSubmit>
      {kids.length ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {kids.map((k) => {
            const r = byKid.get(k.id);
            return (
              <ActionForm key={`${k.id}-${date}`} action={saveDailyReport} reset={false} className={cn("card p-5", r && "ring-2 ring-mint-500/40")}>
                <input type="hidden" name="studentId" value={k.id} />
                <input type="hidden" name="date" value={date} />
                <input type="hidden" name="name" value={k.firstName} />
                <div className="mb-4 flex items-center gap-3">
                  <Avatar name={`${k.firstName} ${k.lastName ?? ""}`} photoKey={k.photoKey} size={42} />
                  <div className="flex-1"><p className="font-semibold text-slate-800">{k.firstName} {k.lastName}</p><p className="text-xs text-slate-400">{r ? "✓ Report saved" : "Not filled yet"}</p></div>
                </div>
                <p className="label">Mood</p>
                <div className="mb-4 flex gap-2">
                  {MOODS.map((m) => (
                    <label key={m.v} className="cursor-pointer" title={m.v}>
                      <input type="radio" name="mood" value={m.v} defaultChecked={r?.mood === m.v} className="peer sr-only" />
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-50 text-2xl grayscale transition peer-checked:bg-sun-100 peer-checked:ring-2 peer-checked:ring-sun-500 peer-checked:grayscale-0 hover:grayscale-0">{m.e}</span>
                    </label>
                  ))}
                </div>
                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(["breakfast", "lunch", "snack"] as const).map((meal) => (
                    <label key={meal}><span className="label">{meal}</span>
                      <select name={meal} defaultValue={r?.[meal] ?? ""} className="input px-2"><option value="">—</option>{MEALS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                    </label>
                  ))}
                  <label><span className="label">Nap (min)</span><input type="number" name="napMinutes" min={0} defaultValue={r?.napMinutes ?? ""} className="input" /></label>
                </div>
                <label className="mb-3 block"><span className="label">Activities</span><input name="activities" defaultValue={r?.activities ?? ""} className="input" placeholder="Clay modelling, story time, sand play" /></label>
                <label className="mb-3 block"><span className="label">Teacher&apos;s comment</span><textarea name="comment" rows={2} defaultValue={r?.comment ?? ""} className="input" placeholder="Shared toys with friends and sang the new rhyme!" /></label>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <input type="file" name="photo" accept="image/*" className="text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-brand-700" />
                  <SubmitButton className="btn-primary btn-sm">{r ? "Update" : "Save"}</SubmitButton>
                </div>
              </ActionForm>
            );
          })}
        </div>
      ) : <Card><Empty title="No students in this class" emoji="🧸" /></Card>}
    </>
  );
}
