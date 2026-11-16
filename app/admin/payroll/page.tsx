import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { Sparkles, Banknote, FileText, Pencil, Trash2, Wallet, Clock } from "lucide-react";
import { db, payrolls, users } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { PageHeader, Card, Badge, Field, Empty, Avatar, StatCard, TableWrap } from "@/components/ui";
import { ActionForm, SubmitButton, Modal, ActionButton, AutoSubmit } from "@/components/client";
import { inr, currentMonth, fmtMonth, fmtDate, today } from "@/lib/utils";
import { generatePayroll, updatePayroll, markPaid, deleteDraft } from "./actions";

export default async function Payroll({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requireStaff("payroll.manage");
  const month = (await searchParams).month ?? currentMonth();
  const rows = await db.select({ p: payrolls, u: users }).from(payrolls).innerJoin(users, eq(payrolls.userId, users.id)).where(eq(payrolls.month, month)).orderBy(asc(users.name));
  const total = rows.reduce((a, r) => a + r.p.netPay, 0);
  const paid = rows.filter((r) => r.p.status === "paid");
  const drafts = rows.filter((r) => r.p.status === "draft");
  return (
    <>
      <PageHeader title="Payroll" emoji="💼" subtitle={`${fmtMonth(month)} salaries — loss of pay is worked out from attendance & unpaid leave`}>
        <AutoSubmit><input type="month" name="month" defaultValue={month} className="input w-auto" /></AutoSubmit>
        <ActionForm action={generatePayroll}><input type="hidden" name="month" value={month} /><SubmitButton pendingText="Calculating…"><Sparkles className="h-4 w-4" />Generate payroll</SubmitButton></ActionForm>
      </PageHeader>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total net pay" value={inr(total)} icon={Wallet} tone="brand" hint={`${rows.length} staff`} />
        <StatCard label="Credited" value={inr(paid.reduce((a, r) => a + r.p.netPay, 0))} icon={Banknote} tone="mint" hint={`${paid.length} paid`} />
        <StatCard label="Pending" value={inr(drafts.reduce((a, r) => a + r.p.netPay, 0))} icon={Clock} tone="sun" hint={`${drafts.length} to pay`} />
      </div>
      <Card padded={false} title="Salary sheet" action={drafts.length > 0 && (
        <Modal title={`Credit salary to ${drafts.length} staff`} trigger={<><Banknote className="h-4 w-4" />Mark all paid</>} triggerClass="btn-primary btn-sm">
          <ActionForm action={markPaid} className="space-y-4">
            <input type="hidden" name="ids" value={drafts.map((d) => d.p.id).join(",")} />
            <p className="rounded-xl bg-slate-50 p-3 text-sm">Total to credit: <b>{inr(drafts.reduce((a, r) => a + r.p.netPay, 0))}</b></p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Paid on"><input type="date" name="paidOn" defaultValue={today()} className="input" /></Field>
              <Field label="Bank batch / ref"><input name="paymentRef" className="input" /></Field>
            </div>
            <SubmitButton>Confirm salary credit</SubmitButton>
          </ActionForm>
        </Modal>)}>
        {rows.length ? (
          <TableWrap>
            <table className="table">
              <thead><tr><th>Staff</th><th>Basic + Allow.</th><th>Bonus</th><th>Deductions</th><th>LOP</th><th>Net pay</th><th>Status</th><th /></tr></thead>
              <tbody>
                {rows.map(({ p, u }) => (
                  <tr key={p.id}>
                    <td><div className="flex items-center gap-2.5"><Avatar name={u.name} photoKey={u.photoKey} size={32} /><div><p className="font-semibold">{u.name}</p><p className="text-xs text-slate-500">{u.bankName ? `${u.bankName} ••${(u.bankAccount ?? "").slice(-4)}` : "No bank details"}</p></div></div></td>
                    <td>{inr(p.basic + p.allowances)}</td>
                    <td className="text-mint-600">{p.bonus ? `+${inr(p.bonus)}` : "—"}</td>
                    <td className="text-coral-600">{p.deductions ? `-${inr(p.deductions)}` : "—"}</td>
                    <td className="text-coral-600">{p.lopDays ? `${p.lopDays}d · -${inr(p.lopAmount)}` : "—"}</td>
                    <td className="font-display text-base font-semibold">{inr(p.netPay)}</td>
                    <td><Badge>{p.status}</Badge>{p.paidOn && <p className="text-xs text-slate-400">{fmtDate(p.paidOn, { day: "numeric", month: "short" })}</p>}</td>
                    <td className="whitespace-nowrap text-right">
                      <Link href={`/admin/payslip/${p.id}`} className="btn-ghost btn-sm" title="Payslip"><FileText className="h-3.5 w-3.5" /></Link>
                      {p.status === "draft" && (
                        <>
                          <Modal title={`Adjust · ${u.name}`} triggerClass="btn-ghost btn-sm" trigger={<Pencil className="h-3.5 w-3.5" />}>
                            <ActionForm action={updatePayroll} reset={false} className="space-y-4">
                              <input type="hidden" name="id" value={p.id} />
                              <div className="grid grid-cols-2 gap-3">
                                <Field label="Bonus ₹"><input type="number" name="bonus" defaultValue={p.bonus} className="input" /></Field>
                                <Field label="Deductions ₹"><input type="number" name="deductions" defaultValue={p.deductions} className="input" /></Field>
                                <Field label="LOP days"><input type="number" step="0.5" name="lopDays" defaultValue={p.lopDays} className="input" /></Field>
                                <Field label="LOP amount ₹"><input type="number" name="lopAmount" defaultValue={p.lopAmount} className="input" /></Field>
                              </div>
                              <SubmitButton>Save</SubmitButton>
                            </ActionForm>
                          </Modal>
                          <ActionButton action={markPaid} fields={{ ids: p.id }} className="btn-soft btn-sm">Pay</ActionButton>
                          <ActionButton action={deleteDraft} fields={{ id: p.id }} confirm="Remove this draft?"><Trash2 className="h-3.5 w-3.5" /></ActionButton>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        ) : <Empty title="No payroll for this month yet" text="Click “Generate payroll” to draft salaries from staff records and attendance." emoji="💼" />}
      </Card>
    </>
  );
}
