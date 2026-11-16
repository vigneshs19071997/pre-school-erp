import Link from "next/link";
import { and, asc, desc, eq, gte, inArray, lt, sql, type SQL } from "drizzle-orm";
import { Plus, IndianRupee, AlertTriangle, CheckCircle2, Receipt, Ban, Printer } from "lucide-react";
import { db, feeInvoices, feePayments, students, classes } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { PageHeader, Card, Badge, Field, Empty, StatCard, Avatar, TableWrap } from "@/components/ui";
import { ActionForm, SubmitButton, Modal, ActionButton, AutoSubmit } from "@/components/client";
import { inr, fmtDate, today, currentMonth } from "@/lib/utils";
import { createInvoices, recordPayment, cancelInvoice } from "./actions";

export default async function Fees({ searchParams }: { searchParams: Promise<{ status?: string; class?: string; student?: string }> }) {
  await requireStaff("fees.manage");
  const sp = await searchParams;
  const status = sp.status ?? "open";
  const d = today();
  const where: SQL[] = [];
  if (status === "open") where.push(inArray(feeInvoices.status, ["pending", "partial"]));
  else if (status === "overdue") where.push(inArray(feeInvoices.status, ["pending", "partial"]), lt(feeInvoices.dueDate, d));
  else if (status !== "all") where.push(eq(feeInvoices.status, status));
  if (sp.class) where.push(eq(students.classId, Number(sp.class)));
  if (sp.student) where.push(eq(feeInvoices.studentId, Number(sp.student)));

  const [rows, cls, kids, [stats], [collected]] = await Promise.all([
    db.select({ i: feeInvoices, s: students, c: classes.name }).from(feeInvoices).innerJoin(students, eq(feeInvoices.studentId, students.id))
      .leftJoin(classes, eq(students.classId, classes.id)).where(and(...where)).orderBy(asc(feeInvoices.dueDate), desc(feeInvoices.id)).limit(300),
    db.select().from(classes).orderBy(asc(classes.id)),
    db.select({ id: students.id, firstName: students.firstName, lastName: students.lastName, code: students.studentCode }).from(students).where(eq(students.status, "active")).orderBy(asc(students.firstName)),
    db.select({
      due: sql<number>`coalesce(sum(${feeInvoices.amount} - ${feeInvoices.discount} - ${feeInvoices.paidAmount}) filter (where ${feeInvoices.status} in ('pending','partial')),0)`,
      overdue: sql<number>`coalesce(sum(${feeInvoices.amount} - ${feeInvoices.discount} - ${feeInvoices.paidAmount}) filter (where ${feeInvoices.status} in ('pending','partial') and ${feeInvoices.dueDate} < ${d}),0)`,
    }).from(feeInvoices),
    db.select({ s: sql<number>`coalesce(sum(${feePayments.amount}),0)` }).from(feePayments).where(gte(feePayments.paidOn, `${currentMonth()}-01`)),
  ]);
  const recent = await db.select({ p: feePayments, s: students }).from(feePayments).innerJoin(feeInvoices, eq(feePayments.invoiceId, feeInvoices.id))
    .innerJoin(students, eq(feeInvoices.studentId, students.id)).orderBy(desc(feePayments.id)).limit(8);

  return (
    <>
      <PageHeader title="Fees" emoji="💰" subtitle="Bill families, record payments and print receipts">
        <Modal title="Create fee invoice" trigger={<><Plus className="h-4 w-4" />New invoice</>}>
          <ActionForm action={createInvoices} className="space-y-4">
            <Field label="Bill to *">
              <select name="target" required className="input">
                <option value="all">All active students</option>
                <optgroup label="Whole class">{cls.map((c) => <option key={c.id} value={`class:${c.id}`}>{c.name}</option>)}</optgroup>
                <optgroup label="One student">{kids.map((k) => <option key={k.id} value={`student:${k.id}`}>{k.firstName} {k.lastName} ({k.code})</option>)}</optgroup>
              </select>
            </Field>
            <Field label="Title *"><input name="title" required className="input" placeholder="Tuition fee – June" /></Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Amount ₹ *"><input type="number" name="amount" min={1} required className="input" /></Field>
              <Field label="Discount ₹"><input type="number" name="discount" min={0} defaultValue={0} className="input" /></Field>
              <Field label="Due date *"><input type="date" name="dueDate" required defaultValue={d} className="input" /></Field>
            </div>
            <SubmitButton>Create invoice(s)</SubmitButton>
          </ActionForm>
        </Modal>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Collected this month" value={inr(Number(collected.s))} icon={CheckCircle2} tone="mint" />
        <StatCard label="Outstanding" value={inr(Number(stats.due))} icon={IndianRupee} tone="sun" href="/admin/fees?status=open" />
        <StatCard label="Overdue" value={inr(Number(stats.overdue))} icon={AlertTriangle} tone="coral" href="/admin/fees?status=overdue" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card padded={false} className="xl:col-span-2">
          <AutoSubmit className="flex flex-wrap gap-3 border-b border-slate-100 p-4">
            <select name="status" defaultValue={status} className="input w-auto">
              <option value="open">Unpaid</option><option value="overdue">Overdue</option><option value="paid">Paid</option><option value="cancelled">Cancelled</option><option value="all">All</option>
            </select>
            <select name="class" defaultValue={sp.class ?? ""} className="input w-auto"><option value="">All classes</option>{cls.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            {sp.student && <input type="hidden" name="student" value={sp.student} />}
          </AutoSubmit>
          {rows.length ? (
            <TableWrap>
              <table className="table">
                <thead><tr><th>Student</th><th>Invoice</th><th>Due</th><th>Balance</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {rows.map(({ i, s, c }) => {
                    const bal = i.amount - i.discount - i.paidAmount;
                    const late = (i.status === "pending" || i.status === "partial") && i.dueDate < d;
                    return (
                      <tr key={i.id}>
                        <td><div className="flex items-center gap-2.5"><Avatar name={s.firstName} photoKey={s.photoKey} size={32} /><div><p className="font-semibold">{s.firstName} {s.lastName}</p><p className="text-xs text-slate-500">{c ?? ""}</p></div></div></td>
                        <td><p className="font-medium">{i.title}</p><p className="font-mono text-xs text-slate-400">{i.invoiceNo}</p></td>
                        <td className={late ? "font-semibold text-coral-600" : ""}>{fmtDate(i.dueDate, { day: "numeric", month: "short" })}</td>
                        <td><b>{inr(bal)}</b><p className="text-xs text-slate-400">of {inr(i.amount - i.discount)}</p></td>
                        <td><Badge>{late ? "overdue" : i.status}</Badge></td>
                        <td className="whitespace-nowrap text-right">
                          {(i.status === "pending" || i.status === "partial") && (
                            <>
                              <Modal title={`Record payment · ${s.firstName}`} triggerClass="btn-soft btn-sm" trigger={<><Receipt className="h-3.5 w-3.5" />Pay</>}>
                                <ActionForm action={recordPayment} className="space-y-4">
                                  <input type="hidden" name="invoiceId" value={i.id} />
                                  <p className="rounded-xl bg-slate-50 p-3 text-sm">{i.title} · Balance <b>{inr(bal)}</b></p>
                                  <div className="grid grid-cols-2 gap-3">
                                    <Field label="Amount ₹"><input type="number" name="amount" step="0.01" defaultValue={bal} max={bal} required className="input" /></Field>
                                    <Field label="Date"><input type="date" name="paidOn" defaultValue={d} className="input" /></Field>
                                    <Field label="Method"><select name="method" className="input"><option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="bank">Bank transfer</option><option value="cheque">Cheque</option></select></Field>
                                    <Field label="Reference"><input name="reference" className="input" placeholder="UTR / cheque no." /></Field>
                                  </div>
                                  <SubmitButton>Save payment</SubmitButton>
                                </ActionForm>
                              </Modal>
                              {i.paidAmount === 0 && <ActionButton action={cancelInvoice} fields={{ id: i.id }} confirm="Cancel this invoice?"><Ban className="h-3.5 w-3.5" /></ActionButton>}
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
          ) : <Empty title="No invoices here" emoji="🧾" />}
        </Card>
        <Card title="Latest receipts" padded={false}>
          {recent.length ? (
            <ul className="divide-y divide-slate-100">
              {recent.map(({ p, s }) => (
                <li key={p.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0 flex-1"><p className="truncate font-semibold">{s.firstName} {s.lastName}</p><p className="text-xs text-slate-500">{fmtDate(p.paidOn)} · {p.method.toUpperCase()}</p></div>
                  <b className="text-mint-600">{inr(p.amount)}</b>
                  <Link href={`/admin/fees/receipt/${p.id}`} className="btn-ghost btn-sm" title="Receipt"><Printer className="h-3.5 w-3.5" /></Link>
                </li>
              ))}
            </ul>
          ) : <Empty title="No payments yet" emoji="💸" />}
        </Card>
      </div>
    </>
  );
}
