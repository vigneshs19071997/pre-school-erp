import Link from "next/link";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { LogIn, LogOut, Plane, KeyRound, FileText } from "lucide-react";
import { db, staffAttendance, leaveRequests, payrolls } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { PageHeader, Card, Badge, Field, Empty } from "@/components/ui";
import { ActionForm, SubmitButton, Modal, GeoSubmitButton } from "@/components/client";
import { today, currentMonth, monthRange, fmtDate, fmtTime, fmtMonth, inr, cn } from "@/lib/utils";
import { checkIn, checkOut, applyLeave, changeMyPassword } from "./actions";

export default async function MyDesk({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const me = await requireStaff();
  const { denied } = await searchParams;
  const d = today();
  const month = currentMonth();
  const { start, end, days } = monthRange(month);
  const [att, leaves, slips] = await Promise.all([
    db.select().from(staffAttendance).where(and(eq(staffAttendance.userId, me.id), gte(staffAttendance.date, start), lte(staffAttendance.date, end))),
    db.select().from(leaveRequests).where(eq(leaveRequests.userId, me.id)).orderBy(desc(leaveRequests.id)).limit(8),
    db.select().from(payrolls).where(and(eq(payrolls.userId, me.id), eq(payrolls.status, "paid"))).orderBy(desc(payrolls.month)).limit(12),
  ]);
  const byDate = Object.fromEntries(att.map((a) => [a.date, a]));
  const todayRow = byDate[d];
  const presentDays = att.filter((a) => a.status === "present").length + att.filter((a) => a.status === "half_day").length / 2;
  const firstDow = new Date(start + "T00:00:00").getDay();

  return (
    <>
      {denied && <p className="mb-4 rounded-xl bg-sun-100 px-4 py-3 text-sm font-medium text-sun-600">You don&apos;t have access to that page. Ask the admin to update your role.</p>}
      <PageHeader title={`Hi ${me.name.split(" ")[0]}`} emoji="👋" subtitle={`${me.designation ?? me.roleName} · Employee ID ${me.employeeCode}`}>
        <Modal title="Change password" trigger={<><KeyRound className="h-4 w-4" />Password</>} triggerClass="btn-ghost">
          <ActionForm action={changeMyPassword} className="space-y-4">
            <Field label="Current password"><input name="current" type="password" required className="input" /></Field>
            <Field label="New password"><input name="next" type="password" minLength={6} required className="input" /></Field>
            <SubmitButton>Update password</SubmitButton>
          </ActionForm>
        </Modal>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card relative overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <p className="text-sm text-brand-100">{fmtDate(d, { weekday: "long", day: "numeric", month: "long" })}</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-white">
            {!todayRow?.checkIn ? "You haven't checked in" : !todayRow.checkOut ? "You're checked in ✅" : "Day complete 🎉"}
          </h2>
          <div className="mt-4 flex gap-6 text-sm">
            <div><p className="text-brand-200">In</p><p className="text-lg font-semibold">{fmtTime(todayRow?.checkIn)}</p></div>
            <div><p className="text-brand-200">Out</p><p className="text-lg font-semibold">{fmtTime(todayRow?.checkOut)}</p></div>
          </div>
          <div className="mt-5">
            {!todayRow?.checkIn ? (
              <GeoSubmitButton action={checkIn} pendingText="Checking your location…" className="btn w-full bg-white text-brand-700 hover:bg-brand-50"><LogIn className="h-4 w-4" />Check in now</GeoSubmitButton>
            ) : !todayRow.checkOut ? (
              <GeoSubmitButton action={checkOut} pendingText="Checking your location…" className="btn w-full bg-white/15 text-white hover:bg-white/25"><LogOut className="h-4 w-4" />Check out</GeoSubmitButton>
            ) : null}
          </div>
        </div>

        <Card title={`My attendance · ${fmtMonth(month)}`} className="lg:col-span-2" action={<Badge tone="mint">{`${presentDays} days present`}</Badge>}>
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
            {["S", "M", "T", "W", "T", "F", "S"].map((x, i) => <span key={i} className="pb-1 font-semibold text-slate-400">{x}</span>)}
            {Array.from({ length: firstDow }).map((_, i) => <span key={`e${i}`} />)}
            {Array.from({ length: days }).map((_, i) => {
              const day = `${month}-${String(i + 1).padStart(2, "0")}`;
              const s = byDate[day]?.status;
              return (
                <span key={day} title={s ?? ""} className={cn("grid h-9 place-items-center rounded-lg font-semibold",
                  s === "present" ? "bg-mint-100 text-mint-600" : s === "absent" ? "bg-coral-100 text-coral-600" : s === "leave" ? "bg-sky-100 text-sky-600" : s === "half_day" ? "bg-sun-100 text-sun-600" : day === d ? "ring-2 ring-brand-400" : "bg-slate-50 text-slate-400")}>
                  {i + 1}
                </span>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Leave" action={
          <Modal title="Apply for leave" trigger={<><Plane className="h-4 w-4" />Apply</>} triggerClass="btn-soft btn-sm">
            <ActionForm action={applyLeave} className="space-y-4">
              <Field label="Type"><select name="type" className="input"><option value="casual">Casual</option><option value="sick">Sick</option><option value="earned">Earned</option><option value="unpaid">Unpaid</option></select></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="From"><input type="date" name="fromDate" required defaultValue={d} className="input" /></Field>
                <Field label="To"><input type="date" name="toDate" required defaultValue={d} className="input" /></Field>
              </div>
              <Field label="Reason"><textarea name="reason" rows={3} className="input" /></Field>
              <SubmitButton>Send request</SubmitButton>
            </ActionForm>
          </Modal>} padded={false}>
          {leaves.length ? (
            <ul className="divide-y divide-slate-100">
              {leaves.map((l) => (
                <li key={l.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span><b className="capitalize">{l.type}</b> · {fmtDate(l.fromDate, { day: "numeric", month: "short" })} – {fmtDate(l.toDate, { day: "numeric", month: "short" })}</span>
                  <Badge>{l.status}</Badge>
                </li>
              ))}
            </ul>
          ) : <Empty title="No leave requests" emoji="🏖️" />}
        </Card>

        <Card title="My payslips" padded={false}>
          {slips.length ? (
            <ul className="divide-y divide-slate-100">
              {slips.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="font-semibold">{fmtMonth(p.month)}</span>
                  <span className="flex items-center gap-3"><b>{inr(p.netPay)}</b><Badge>{p.status}</Badge>
                    <Link href={`/admin/payslip/${p.id}`} className="btn-ghost btn-sm"><FileText className="h-4 w-4" /></Link></span>
                </li>
              ))}
            </ul>
          ) : <Empty title="No payslips yet" emoji="🧾" />}
        </Card>
      </div>
    </>
  );
}
