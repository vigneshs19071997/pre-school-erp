import { and, asc, gte, lte } from "drizzle-orm";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { db, events } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { PageHeader, Field, Card } from "@/components/ui";
import { ActionForm, SubmitButton, Modal, ActionButton } from "@/components/client";
import { currentMonth, monthRange, fmtMonth, today, cn } from "@/lib/utils";
import { addEvent, deleteEvent } from "./actions";

const TYPE: Record<string, string> = { holiday: "bg-coral-100 text-coral-600", event: "bg-brand-100 text-brand-700", ptm: "bg-sky-100 text-sky-600", celebration: "bg-sun-100 text-sun-600" };
const shift = (m: string, n: number) => { const d = new Date(m + "-01T00:00:00Z"); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 7); };

export default async function Events({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requireStaff("events.manage");
  const month = (await searchParams).month ?? currentMonth();
  const { start, end, days } = monthRange(month);
  const rows = await db.select().from(events).where(and(gte(events.date, start), lte(events.date, end))).orderBy(asc(events.date));
  const firstDow = new Date(start + "T00:00:00").getDay();
  const d = today();
  return (
    <>
      <PageHeader title="Events & holidays" emoji="📅" subtitle="Parents see these on their calendar">
        <Modal title="Add to calendar" trigger={<><Plus className="h-4 w-4" />Add</>}>
          <ActionForm action={addEvent} className="space-y-4">
            <Field label="Title *"><input name="title" required className="input" placeholder="Diwali holiday" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date *"><input type="date" name="date" required defaultValue={d} className="input" /></Field>
              <Field label="Type"><select name="type" className="input"><option value="event">Event</option><option value="holiday">Holiday</option><option value="ptm">Parent-teacher meeting</option><option value="celebration">Celebration</option></select></Field>
            </div>
            <Field label="Details"><textarea name="description" rows={3} className="input" /></Field>
            <SubmitButton>Add</SubmitButton>
          </ActionForm>
        </Modal>
      </PageHeader>
      <Card title={fmtMonth(month)} action={<div className="flex gap-1"><Link href={`?month=${shift(month, -1)}`} className="btn-ghost btn-sm"><ChevronLeft className="h-4 w-4" /></Link><Link href={`?month=${shift(month, 1)}`} className="btn-ghost btn-sm"><ChevronRight className="h-4 w-4" /></Link></div>}>
        <div className="grid grid-cols-7 gap-1.5">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((x) => <div key={x} className="pb-1 text-center text-xs font-bold uppercase text-slate-400">{x}</div>)}
          {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: days }).map((_, i) => {
            const day = `${month}-${String(i + 1).padStart(2, "0")}`;
            const list = rows.filter((r) => r.date === day);
            return (
              <div key={day} className={cn("min-h-[92px] rounded-xl border border-slate-100 p-1.5", day === d && "border-brand-400 bg-brand-50/40")}>
                <p className="px-1 text-xs font-bold text-slate-500">{i + 1}</p>
                {list.map((e) => (
                  <div key={e.id} className={cn("group mt-1 flex items-center justify-between gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold", TYPE[e.type] ?? TYPE.event)} title={e.description ?? ""}>
                    <span className="truncate">{e.title}</span>
                    <span className="hidden group-hover:block"><ActionButton action={deleteEvent} fields={{ id: e.id }} className="p-0" confirm="Remove?"><Trash2 className="h-3 w-3" /></ActionButton></span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}
