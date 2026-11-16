import { and, asc, eq, inArray } from "drizzle-orm";
import { db, students, progressReports } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { allowedClasses } from "@/lib/scope";
import { PageHeader, Card, Avatar, Empty } from "@/components/ui";
import { ActionForm, SubmitButton, AutoSubmit } from "@/components/client";
import { ProgressRadar } from "@/components/charts";
import { AREAS, TERMS, RATING_LABELS } from "@/lib/constants";
import { saveProgress } from "./actions";

export default async function Progress({ searchParams }: { searchParams: Promise<{ class?: string; student?: string; term?: string }> }) {
  const me = await requireStaff("progress.manage");
  const sp = await searchParams;
  const cls = await allowedClasses(me);
  if (!cls.length) return <Card><Empty title="Create a class first" emoji="🏫" /></Card>;
  let classId = Number(sp.class ?? cls[0].id);
  if (sp.student && !sp.class) {
    const [s] = await db.select({ c: students.classId }).from(students).where(eq(students.id, Number(sp.student)));
    if (s?.c) classId = s.c;
  }
  const kids = await db.select().from(students).where(and(eq(students.classId, classId), eq(students.status, "active"))).orderBy(asc(students.firstName));
  const studentId = Number(sp.student ?? kids[0]?.id ?? 0);
  const term = sp.term ?? TERMS[0];
  const kid = kids.find((k) => k.id === studentId);
  const rows = kid ? await db.select().from(progressReports).where(and(eq(progressReports.studentId, studentId), inArray(progressReports.term, [term]))) : [];
  const byArea = new Map(rows.map((r) => [r.area, r]));
  return (
    <>
      <PageHeader title="Progress reports" emoji="⭐" subtitle="Rate each learning area from 1 (Beginning) to 5 (Excelling). Parents see this as a chart." />
      <AutoSubmit className="mb-5 flex flex-wrap gap-3">
        <select name="class" defaultValue={classId} className="input w-auto">{cls.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select name="student" defaultValue={studentId} className="input w-auto">{kids.map((k) => <option key={k.id} value={k.id}>{k.firstName} {k.lastName}</option>)}</select>
        <select name="term" defaultValue={term} className="input w-auto">{TERMS.map((t) => <option key={t}>{t}</option>)}</select>
      </AutoSubmit>
      {kid ? (
        <div className="grid gap-6 xl:grid-cols-5">
          <ActionForm action={saveProgress} reset={false} key={`${studentId}-${term}`} className="card p-5 xl:col-span-3">
            <input type="hidden" name="studentId" value={studentId} />
            <input type="hidden" name="term" value={term} />
            <div className="mb-4 flex items-center gap-3"><Avatar name={kid.firstName} photoKey={kid.photoKey} size={42} /><div><p className="font-semibold">{kid.firstName} {kid.lastName}</p><p className="text-xs text-slate-500">{term}</p></div></div>
            <div className="space-y-4">
              {AREAS.map((area, i) => {
                const cur = byArea.get(area);
                return (
                  <div key={area} className="rounded-xl bg-slate-50 p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-slate-700">{area}</p>
                      <div className="flex flex-row-reverse justify-end gap-1">
                        {[5, 4, 3, 2, 1].map((n) => (
                          <label key={n} className="cursor-pointer" title={RATING_LABELS[n]}>
                            <input type="radio" name={`r_${i}`} value={n} defaultChecked={cur?.rating === n} className="peer sr-only" />
                            <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-sm font-bold text-slate-400 ring-1 ring-slate-200 transition peer-checked:bg-sun-500 peer-checked:text-white peer-checked:ring-sun-500">{n}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <input name={`m_${i}`} defaultValue={cur?.remarks ?? ""} placeholder="Remarks (optional)" className="input mt-2 bg-white" />
                  </div>
                );
              })}
            </div>
            <div className="mt-5 flex items-center justify-between"><p className="text-xs text-slate-500">1 Beginning · 2 Developing · 3 Progressing · 4 Achieved · 5 Excelling</p><SubmitButton>Save progress</SubmitButton></div>
          </ActionForm>
          <Card title="Preview" className="xl:col-span-2">
            {rows.length ? <ProgressRadar data={AREAS.map((a) => ({ area: a.split(" ")[0], rating: byArea.get(a)?.rating ?? 0 }))} /> : <Empty title="No ratings yet for this term" emoji="🌱" />}
          </Card>
        </div>
      ) : <Card><Empty title="No students in this class" emoji="🧸" /></Card>}
    </>
  );
}
