import { desc, eq, inArray } from "drizzle-orm";
import { db, feeInvoices, feePayments } from "@/lib/db";
import { requireParent } from "@/lib/auth";
import { getSchool } from "@/lib/school";
import { PageHeader, Card, Badge, Empty } from "@/components/ui";
import { inr, fmtDate, today } from "@/lib/utils";

export default async function ParentFees() {
  const s = await requireParent();
  const school = await getSchool();
  const invoices = await db.select().from(feeInvoices).where(eq(feeInvoices.studentId, s.id)).orderBy(desc(feeInvoices.dueDate));
  const payments = invoices.length ? await db.select().from(feePayments).where(inArray(feePayments.invoiceId, invoices.map((i) => i.id))).orderBy(desc(feePayments.paidOn)) : [];
  const open = invoices.filter((i) => i.status === "pending" || i.status === "partial");
  const due = open.reduce((a, i) => a + i.amount - i.discount - i.paidAmount, 0);
  const d = today();
  return (
    <>
      <PageHeader title="Fees" emoji="💳" subtitle={school.phone ? `Questions? Call the office at ${school.phone}` : undefined} />
      <div className={`card mb-6 flex items-center justify-between p-6 ${due ? "bg-coral-100/60" : "bg-mint-100/60"}`}>
        <div><p className="text-sm font-semibold text-slate-600">Total due</p><p className="font-display text-4xl font-semibold text-slate-800">{inr(due)}</p></div>
        <span className="text-5xl">{due ? "🧾" : "🎉"}</span>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Invoices" padded={false}>
          {invoices.length ? <ul className="divide-y divide-slate-100">{invoices.filter((i) => i.status !== "cancelled").map((i) => {
            const late = (i.status === "pending" || i.status === "partial") && i.dueDate < d;
            return (
              <li key={i.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div><p className="font-semibold">{i.title}</p><p className="text-xs text-slate-500">{i.invoiceNo} · due {fmtDate(i.dueDate)}</p></div>
                <div className="text-right"><p className="font-semibold">{inr(i.amount - i.discount)}</p><Badge>{late ? "overdue" : i.status}</Badge></div>
              </li>
            );
          })}</ul> : <Empty title="No invoices" emoji="🧾" />}
        </Card>
        <Card title="Payments made" padded={false}>
          {payments.length ? <ul className="divide-y divide-slate-100">{payments.map((p) => (
            <li key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div><p className="font-semibold">RCPT-{String(p.id).padStart(5, "0")}</p><p className="text-xs text-slate-500">{fmtDate(p.paidOn)} · {p.method.toUpperCase()}</p></div>
              <b className="text-mint-600">{inr(p.amount)}</b>
            </li>
          ))}</ul> : <Empty title="No payments yet" emoji="💸" />}
        </Card>
      </div>
    </>
  );
}
