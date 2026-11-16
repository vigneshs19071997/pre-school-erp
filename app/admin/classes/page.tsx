import { and, asc, eq, sql } from "drizzle-orm";
import { Plus, Pencil, Trash2, DoorOpen, UserRound } from "lucide-react";
import { db, classes, students, users } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { PageHeader, Field, Empty } from "@/components/ui";
import { ActionForm, SubmitButton, Modal, ActionButton } from "@/components/client";
import { cn } from "@/lib/utils";
import { saveClass, deleteClass } from "./actions";

const COLORS = { brand: "from-brand-400 to-brand-600", coral: "from-coral-500 to-coral-600", sun: "from-sun-500 to-sun-600", mint: "from-mint-500 to-mint-600", sky: "from-sky-500 to-sky-600" };

type Cls = typeof classes.$inferSelect;
function ClassFields({ c, teachers }: { c?: Cls; teachers: { id: number; name: string }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {c && <input type="hidden" name="id" value={c.id} />}
      <Field label="Class name *"><input name="name" required defaultValue={c?.name} className="input" placeholder="e.g. LKG - A" /></Field>
      <Field label="Age group"><input name="ageGroup" defaultValue={c?.ageGroup ?? ""} className="input" placeholder="3 - 4 years" /></Field>
      <Field label="Room"><input name="room" defaultValue={c?.room ?? ""} className="input" /></Field>
      <Field label="Capacity"><input type="number" name="capacity" defaultValue={c?.capacity ?? 20} className="input" /></Field>
      <Field label="Class teacher"><select name="teacherId" defaultValue={c?.teacherId ?? ""} className="input"><option value="">—</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
      <Field label="Colour"><select name="color" defaultValue={c?.color ?? "brand"} className="input">{Object.keys(COLORS).map((k) => <option key={k} value={k}>{k}</option>)}</select></Field>
      <div className="sm:col-span-2"><SubmitButton>Save class</SubmitButton></div>
    </div>
  );
}

export default async function Classes() {
  await requireStaff("classes.manage");
  const [rows, teachers] = await Promise.all([
    db.select({ c: classes, t: users.name, count: sql<number>`count(${students.id})` }).from(classes)
      .leftJoin(users, eq(classes.teacherId, users.id))
      .leftJoin(students, and(eq(students.classId, classes.id), eq(students.status, "active")))
      .groupBy(classes.id, users.name).orderBy(asc(classes.id)),
    db.select({ id: users.id, name: users.name }).from(users).where(eq(users.status, "active")).orderBy(asc(users.name)),
  ]);
  return (
    <>
      <PageHeader title="Classes" emoji="🏫" subtitle="Groups, rooms and class teachers. Teachers only see their own classes.">
        <Modal title="New class" trigger={<><Plus className="h-4 w-4" />New class</>}><ActionForm action={saveClass}><ClassFields teachers={teachers} /></ActionForm></Modal>
      </PageHeader>
      {rows.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ c, t, count }) => {
            const filled = Math.min(100, Math.round((Number(count) / (c.capacity || 1)) * 100));
            return (
              <div key={c.id} className="card overflow-hidden">
                <div className={cn("bg-gradient-to-br p-5 text-white", COLORS[c.color as keyof typeof COLORS] ?? COLORS.brand)}>
                  <p className="text-sm text-white/80">{c.ageGroup ?? " "}</p>
                  <h3 className="font-display text-2xl font-semibold text-white">{c.name}</h3>
                </div>
                <div className="space-y-3 p-5 text-sm">
                  <p className="flex items-center gap-2 text-slate-600"><UserRound className="h-4 w-4" />{t ?? "No class teacher"}</p>
                  <p className="flex items-center gap-2 text-slate-600"><DoorOpen className="h-4 w-4" />{c.room ?? "—"}</p>
                  <div>
                    <div className="mb-1 flex justify-between text-xs font-semibold"><span>{Number(count)} / {c.capacity} seats</span><span>{filled}%</span></div>
                    <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand-500" style={{ width: `${filled}%` }} /></div>
                  </div>
                  <div className="flex gap-1 border-t border-slate-100 pt-3">
                    <Modal title="Edit class" triggerClass="btn-ghost btn-sm" trigger={<><Pencil className="h-3.5 w-3.5" />Edit</>}><ActionForm action={saveClass} reset={false}><ClassFields c={c} teachers={teachers} /></ActionForm></Modal>
                    <ActionButton action={deleteClass} fields={{ id: c.id }} confirm="Delete this class?"><Trash2 className="h-3.5 w-3.5" />Delete</ActionButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : <div className="card"><Empty title="No classes yet" text="Create Playgroup, Nursery, LKG, UKG…" emoji="🏫" /></div>}
    </>
  );
}
