import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, payrolls, users } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchool } from "@/lib/school";
import { PrintButton } from "@/components/client";
import { fmtMonth, fmtDate, inr } from "@/lib/utils";

export default async function Payslip({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireStaff();
  const { id } = await params;
  const [row] = await db.select({ p: payrolls, u: users }).from(payrolls).innerJoin(users, eq(payrolls.userId, users.id)).where(eq(payrolls.id, Number(id)));
  if (!row) notFound();
  if (!can(me.permissions, "payroll.manage") && (row.u.id !== me.id || row.p.status !== "paid")) redirect("/admin/my?denied=1");
  const school = await getSchool();
  const { p, u } = row;
  const earnings = p.basic + p.allowances + p.bonus;
  const ded = p.deductions + p.lopAmount;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex justify-end print:hidden"><PrintButton /></div>
      <div className="card p-8 print:shadow-none print:ring-0">
        <div className="flex items-start justify-between border-b border-slate-100 pb-5">
          <div><h1 className="text-2xl font-semibold">{school.name}</h1><p className="text-sm text-slate-500">{school.address}</p></div>
          <div className="text-right"><p className="text-xs font-bold uppercase tracking-wider text-brand-600">Payslip</p><p className="font-display text-lg font-semibold">{fmtMonth(p.month)}</p></div>
        </div>
        <div className="grid grid-cols-2 gap-y-2 py-5 text-sm">
          <span className="text-slate-500">Employee</span><span className="font-semibold">{u.name} ({u.employeeCode})</span>
          <span className="text-slate-500">Designation</span><span>{u.designation ?? "—"}</span>
          <span className="text-slate-500">Bank</span><span>{u.bankName ?? "—"} {u.bankAccount ? `· ••••${u.bankAccount.slice(-4)}` : ""}</span>
          <span className="text-slate-500">Status</span><span className="capitalize">{p.status}{p.paidOn ? ` on ${fmtDate(p.paidOn)}` : ""}{p.paymentRef ? ` · Ref ${p.paymentRef}` : ""}</span>
        </div>
        <div className="grid grid-cols-2 gap-6 border-t border-slate-100 pt-5 text-sm">
          <div>
            <p className="mb-2 font-semibold text-mint-600">Earnings</p>
            <Row k="Basic" v={p.basic} /><Row k="Allowances" v={p.allowances} /><Row k="Bonus" v={p.bonus} />
            <Row k="Total" v={earnings} bold />
          </div>
          <div>
            <p className="mb-2 font-semibold text-coral-600">Deductions</p>
            <Row k="Deductions (PF/ESI/Other)" v={p.deductions} /><Row k={`Loss of pay (${p.lopDays} days)`} v={p.lopAmount} />
            <Row k="Total" v={ded} bold />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between rounded-2xl bg-brand-50 px-5 py-4">
          <span className="font-semibold text-brand-700">Net pay</span>
          <span className="font-display text-2xl font-semibold text-brand-700">{inr(p.netPay)}</span>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">This is a system generated payslip.</p>
      </div>
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: number; bold?: boolean }) {
  return <div className={`flex justify-between py-1 ${bold ? "mt-1 border-t border-slate-100 pt-2 font-semibold" : ""}`}><span>{k}</span><span>{inr(v)}</span></div>;
}
