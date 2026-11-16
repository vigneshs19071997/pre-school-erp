import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, gte } from "drizzle-orm";
import { Pencil, Phone, Mail, MapPin, KeyRound, HeartPulse } from "lucide-react";
import { db, students, classes, studentAttendance, feeInvoices, progressReports, dailyReports } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { PageHeader, Card, Badge, Avatar, Empty, StatCard } from "@/components/ui";
import { ActionButton } from "@/components/client";
import { ProgressRadar } from "@/components/charts";
import { age, fmtDate, inr, today, addDays } from "@/lib/utils";
import { resetParentPassword } from "../actions";
import { CalendarCheck, IndianRupee, Smile } from "lucide-react";

export default async function StudentProfile({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requireStaff("students.manage");
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const sid = Number(id);
  const [row] = await db.select({ s: students, c: classes }).from(students).leftJoin(classes, eq(students.classId, classes.id)).where(eq(students.id, sid));
  if (!row) notFound();
  const { s, c } = row;
  const since = addDays(today(), -90);
  const [att, invoices, progress, reports] = await Promise.all([
    db.select().from(studentAttendance).where(and(eq(studentAttendance.studentId, sid), gte(studentAttendance.date, since))),
    db.select().from(feeInvoices).where(eq(feeInvoices.studentId, sid)).orderBy(desc(feeInvoices.dueDate)),
    db.select().from(progressReports).where(eq(progressReports.studentId, sid)).orderBy(desc(progressReports.createdAt)),
    db.select().from(dailyReports).where(eq(dailyReports.studentId, sid)).orderBy(desc(dailyReports.date)).limit(5),
  ]);
  const present = att.filter((a) => a.status === "present" || a.status === "late").length;
  const pct = att.length ? Math.round((present / att.length) * 100) : 0;
  const due = invoices.filter((i) => i.status !== "paid" && i.status !== "cancelled").reduce((a, i) => a + i.amount - i.discount - i.paidAmount, 0);
  const latestTerm = progress[0]?.term;
  const radar = progress.filter((p) => p.term === latestTerm).map((p) => ({ area: p.area, rating: p.rating }));
  const name = `${s.firstName} ${s.lastName ?? ""}`.trim();

  return (
    <>
      {created && <p className="mb-4 rounded-xl bg-mint-100 px-4 py-3 text-sm font-medium text-mint-600">🎉 Admission saved! Share Student ID <b>{s.studentCode}</b> with the parent — they create their own password at first login using the registered mobile number.</p>}
      <PageHeader title={name} subtitle={`${c?.name ?? "No class"} · Age ${age(s.dob)}`}>
        <Link href={`/admin/students/${s.id}/edit`} className="btn-soft"><Pencil className="h-4 w-4" />Edit</Link>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-brand-400 via-coral-500 to-sun-500" />
          <div className="-mt-10 px-6 pb-6">
            <Avatar name={name} photoKey={s.photoKey} size={80} />
            <div className="mt-3 flex items-center gap-2"><h2 className="text-xl font-semibold">{name}</h2><Badge>{s.status}</Badge></div>
            <p className="font-mono text-sm text-brand-700">{s.studentCode}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Date of birth</dt><dd>{fmtDate(s.dob)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Gender</dt><dd>{s.gender ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Blood group</dt><dd>{s.bloodGroup ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Admitted</dt><dd>{fmtDate(s.admissionDate)}</dd></div>
            </dl>
            {s.medicalNotes && <p className="mt-4 flex gap-2 rounded-xl bg-coral-100 p-3 text-sm text-coral-600"><HeartPulse className="h-4 w-4 shrink-0" />{s.medicalNotes}</p>}
            <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <p className="font-semibold">{[s.fatherName, s.motherName].filter(Boolean).join(" & ") || "Parents"}</p>
              <p className="flex items-center gap-2 text-slate-600"><Phone className="h-4 w-4" />{s.parentPhone}</p>
              {s.parentEmail && <p className="flex items-center gap-2 text-slate-600"><Mail className="h-4 w-4" />{s.parentEmail}</p>}
              {s.address && <p className="flex items-center gap-2 text-slate-600"><MapPin className="h-4 w-4" />{s.address}</p>}
            </div>
            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm">
              <p className="flex items-center gap-2 font-semibold"><KeyRound className="h-4 w-4" />Parent login</p>
              <p className="mt-1 text-slate-500">Username: <b className="font-mono text-slate-700">{s.studentCode}</b></p>
              <p className="text-slate-500">{s.parentPasswordHash ? `Password set · last login ${fmtDate(s.parentLastLoginAt)}` : "Parent hasn't created a password yet"}</p>
              {s.parentPasswordHash && (
                <div className="mt-2"><ActionButton action={resetParentPassword} fields={{ id: s.id }} className="btn-danger btn-sm" confirm="Reset this parent's password? They will create a new one at next login.">Reset password</ActionButton></div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Attendance (90 days)" value={att.length ? `${pct}%` : "—"} icon={CalendarCheck} tone="mint" hint={`${present}/${att.length} days`} />
            <StatCard label="Fees due" value={inr(due)} icon={IndianRupee} tone={due > 0 ? "coral" : "mint"} href={`/admin/fees?student=${s.id}`} />
            <StatCard label="Daily reports" value={reports.length ? fmtDate(reports[0].date, { day: "numeric", month: "short" }) : "—"} icon={Smile} tone="sun" hint="Latest update" />
          </div>
          <Card title={`Progress${latestTerm ? ` · ${latestTerm}` : ""}`} action={<Link href={`/admin/progress?student=${s.id}`} className="btn-soft btn-sm">Update</Link>}>
            {radar.length ? <ProgressRadar data={radar} /> : <Empty title="No progress recorded yet" emoji="⭐" />}
          </Card>
          <Card title="Recent daily reports" padded={false}>
            {reports.length ? (
              <ul className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <li key={r.id} className="px-5 py-3 text-sm">
                    <div className="flex items-center justify-between"><b>{fmtDate(r.date, { weekday: "short", day: "numeric", month: "short" })}</b>{r.mood && <Badge tone="sun">{r.mood}</Badge>}</div>
                    {r.comment && <p className="mt-1 text-slate-600">{r.comment}</p>}
                  </li>
                ))}
              </ul>
            ) : <Empty title="No daily reports yet" emoji="📝" />}
          </Card>
          <Card title="Fee invoices" padded={false}>
            {invoices.length ? (
              <table className="table"><thead><tr><th>Invoice</th><th>Title</th><th>Due</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>{invoices.map((i) => (
                  <tr key={i.id}><td className="font-mono text-xs">{i.invoiceNo}</td><td>{i.title}</td><td>{fmtDate(i.dueDate)}</td><td>{inr(i.amount - i.discount)}</td><td><Badge>{i.status}</Badge></td></tr>
                ))}</tbody></table>
            ) : <Empty title="No invoices" emoji="🧾" />}
          </Card>
        </div>
      </div>
    </>
  );
}
