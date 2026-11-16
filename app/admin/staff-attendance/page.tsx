import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { db, users, staffAttendance } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { PageHeader, Card, Avatar } from "@/components/ui";
import { ActionForm, SubmitButton, AutoSubmit } from "@/components/client";
import { today, fmtTime, fmtDate, monthRange, cn } from "@/lib/utils";
import { saveStaffRegister } from "./actions";

const OPTS = [["present", "Present", "peer-checked:bg-mint-500"], ["half_day", "Half day", "peer-checked:bg-sun-500"], ["absent", "Absent", "peer-checked:bg-coral-500"], ["leave", "Leave", "peer-checked:bg-sky-500"]];

export default async function StaffAttendance({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  await requireStaff("staff_attendance.manage");
  const date = (await searchParams).date ?? today();
  const { start, end } = monthRange(date.slice(0, 7));
  const [staff, rows, monthly] = await Promise.all([
    db.select().from(users).where(eq(users.status, "active")).orderBy(asc(users.name)),
    db.select().from(staffAttendance).where(eq(staffAttendance.date, date)),
    db.select({ u: staffAttendance.userId, p: sql<number>`count(*) filter (where ${staffAttendance.status} = 'present') + 0.5 * count(*) filter (where ${staffAttendance.status} = 'half_day')`, a: sql<number>`count(*) filter (where ${staffAttendance.status} = 'absent')` })
      .from(staffAttendance).where(and(gte(staffAttendance.date, start), lte(staffAttendance.date, end))).groupBy(staffAttendance.userId),
  ]);
  const byUser = new Map(rows.map((r) => [r.userId, r]));
  const mon = new Map(monthly.map((m) => [m.u, m]));
  return (
    <>
      <PageHeader title="Staff attendance" emoji="🕘" subtitle={`Staff check in from "My Desk". Correct or fill in the register here · ${fmtDate(date, { weekday: "long", day: "numeric", month: "long" })}`} />
      <Card padded={false}>
        <AutoSubmit className="flex gap-3 border-b border-slate-100 p-4"><input type="date" name="date" defaultValue={date} max={today()} className="input w-auto" /></AutoSubmit>
        <ActionForm action={saveStaffRegister} reset={false} key={date}>
          <input type="hidden" name="date" value={date} />
          <ul className="divide-y divide-slate-100">
            {staff.map((s) => {
              const r = byUser.get(s.id);
              const m = mon.get(s.id);
              return (
                <li key={s.id} className="flex flex-col gap-3 px-5 py-3 lg:flex-row lg:items-center">
                  <div className="flex flex-1 items-center gap-3">
                    <Avatar name={s.name} photoKey={s.photoKey} size={38} />
                    <div><p className="font-semibold">{s.name}</p><p className="text-xs text-slate-500">In {fmtTime(r?.checkIn)} · Out {fmtTime(r?.checkOut)} · This month {Number(m?.p ?? 0)}P / {Number(m?.a ?? 0)}A</p></div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {OPTS.map(([v, l, c]) => (
                      <label key={v} className="cursor-pointer">
                        <input type="radio" name={`s_${s.id}`} value={v} defaultChecked={r?.status === v} className="peer sr-only" />
                        <span className={cn("block rounded-full px-3 py-1.5 text-xs font-bold text-slate-500 ring-1 ring-slate-200 peer-checked:text-white peer-checked:ring-transparent", c)}>{l}</span>
                      </label>
                    ))}
                  </div>
                  <input name={`n_${s.id}`} defaultValue={r?.note ?? ""} placeholder="Note" className="input lg:w-40" />
                </li>
              );
            })}
          </ul>
          <div className="flex justify-end border-t border-slate-100 p-4"><SubmitButton>Save register</SubmitButton></div>
        </ActionForm>
      </Card>
    </>
  );
}
