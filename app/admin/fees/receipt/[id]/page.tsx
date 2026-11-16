import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, feePayments, feeInvoices, students, classes, users } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getSchool } from "@/lib/school";
import { Logo } from "@/components/logo";
import { PrintButton } from "@/components/client";
import { fmtDate, inr } from "@/lib/utils";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("fees.manage");
  const { id } = await params;
  const [row] = await db.select({ p: feePayments, i: feeInvoices, s: students, c: classes.name, by: users.name }).from(feePayments)
    .innerJoin(feeInvoices, eq(feePayments.invoiceId, feeInvoices.id)).innerJoin(students, eq(feeInvoices.studentId, students.id))
    .leftJoin(classes, eq(students.classId, classes.id)).leftJoin(users, eq(feePayments.receivedBy, users.id)).where(eq(feePayments.id, Number(id)));
  if (!row) notFound();
  const school = await getSchool();
  const { p, i, s, c, by } = row;
  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex justify-end"><PrintButton /></div>
      <div className="card p-8 print:shadow-none print:ring-0">
        <div className="flex items-start justify-between border-b border-dashed border-slate-200 pb-5">
          <div className="flex items-start gap-3">
            <Logo initial={school.name[0]?.toUpperCase()} size={32} />
            <div><h1 className="text-2xl font-semibold">{school.name}</h1><p className="text-sm text-slate-500">{school.address}</p><p className="text-sm text-slate-500">{school.phone}</p></div>
          </div>
          <div className="text-right"><p className="text-xs font-bold uppercase tracking-wider text-mint-600">Fee receipt</p><p className="font-mono text-sm">RCPT-{String(p.id).padStart(5, "0")}</p><p className="text-sm text-slate-500">{fmtDate(p.paidOn)}</p></div>
        </div>
        <div className="grid grid-cols-2 gap-y-2 py-5 text-sm">
          <span className="text-slate-500">Student</span><span className="font-semibold">{s.firstName} {s.lastName}</span>
          <span className="text-slate-500">Student ID</span><span className="font-mono">{s.studentCode}</span>
          <span className="text-slate-500">Class</span><span>{c ?? "—"}</span>
          <span className="text-slate-500">For</span><span>{i.title} ({i.invoiceNo})</span>
          <span className="text-slate-500">Payment mode</span><span className="uppercase">{p.method}{p.reference ? ` · ${p.reference}` : ""}</span>
          <span className="text-slate-500">Balance after payment</span><span>{inr(i.amount - i.discount - i.paidAmount)}</span>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-mint-100 px-5 py-4">
          <span className="font-semibold text-mint-600">Amount received</span>
          <span className="font-display text-2xl font-semibold text-mint-600">{inr(p.amount)}</span>
        </div>
        <p className="mt-8 text-right text-sm text-slate-500">Received by {by ?? "—"}</p>
      </div>
    </div>
  );
}
