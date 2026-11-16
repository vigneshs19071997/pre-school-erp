import Link from "next/link";
import { redirect } from "next/navigation";
import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { Users, UserPlus, CalendarCheck, IndianRupee, Receipt, Briefcase, AlertTriangle, Wallet } from "lucide-react";
import {
  db, students, classes, enquiries, studentAttendance, staffAttendance, users, feeInvoices, feePayments, expenses, payrolls, leaveRequests, events,
} from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchool } from "@/lib/school";
import { PageHeader, StatCard, Card, Badge, Avatar, Empty } from "@/components/ui";
import { FinanceChart, FunnelBars, ClassBars, Donut } from "@/components/charts";
import { today, currentMonth, inr, fmtDate, addDays } from "@/lib/utils";

const n = (v: unknown) => Number(v ?? 0);

export default async function Dashboard() {
  const me = await requireStaff();
  if (!can(me.permissions, "dashboard.view")) redirect("/admin/my");
  const school = await getSchool();
  const d = today();
  const month = currentMonth();
  const monthStart = `${month}-01`;

  // last 6 months labels
  const months: string[] = [];
  const base = new Date(month + "-01T00:00:00Z");
  for (let i = 5; i >= 0; i--) {
    const x = new Date(base); x.setUTCMonth(x.getUTCMonth() - i);
    months.push(x.toISOString().slice(0, 7));
  }

  const [
    [studentCount], [newAdmissions], attToday, [staffTotal], staffToday, [collected], [dues], [expMonth],
    incomeRows, expenseRows, salaryRows, funnel, classRows, recentPayments, [pendingLeaves], upcoming, followUps, birthdays,
  ] = await Promise.all([
    db.select({ c: sql<number>`count(*)` }).from(students).where(eq(students.status, "active")),
    db.select({ c: sql<number>`count(*)` }).from(students).where(gte(students.admissionDate, monthStart)),
    db.select({ status: studentAttendance.status, c: sql<number>`count(*)` }).from(studentAttendance).where(eq(studentAttendance.date, d)).groupBy(studentAttendance.status),
    db.select({ c: sql<number>`count(*)` }).from(users).where(eq(users.status, "active")),
    db.select({ status: staffAttendance.status, c: sql<number>`count(*)` }).from(staffAttendance).where(eq(staffAttendance.date, d)).groupBy(staffAttendance.status),
    db.select({ s: sql<number>`coalesce(sum(${feePayments.amount}),0)` }).from(feePayments).where(gte(feePayments.paidOn, monthStart)),
    db.select({ s: sql<number>`coalesce(sum(${feeInvoices.amount} - ${feeInvoices.discount} - ${feeInvoices.paidAmount}),0)`, overdue: sql<number>`count(*) filter (where ${feeInvoices.dueDate} < ${d})` })
      .from(feeInvoices).where(inArray(feeInvoices.status, ["pending", "partial"])),
    db.select({ s: sql<number>`coalesce(sum(${expenses.amount}),0)` }).from(expenses).where(gte(expenses.date, monthStart)),
    db.select({ m: sql<string>`to_char(${feePayments.paidOn}, 'YYYY-MM')`, s: sql<number>`sum(${feePayments.amount})` }).from(feePayments)
      .where(gte(feePayments.paidOn, `${months[0]}-01`)).groupBy(sql`1`),
    db.select({ m: sql<string>`to_char(${expenses.date}, 'YYYY-MM')`, s: sql<number>`sum(${expenses.amount})` }).from(expenses)
      .where(gte(expenses.date, `${months[0]}-01`)).groupBy(sql`1`),
    db.select({ m: payrolls.month, s: sql<number>`sum(${payrolls.netPay})` }).from(payrolls)
      .where(and(gte(payrolls.month, months[0]), eq(payrolls.status, "paid"))).groupBy(payrolls.month),
    db.select({ status: enquiries.status, c: sql<number>`count(*)` }).from(enquiries).groupBy(enquiries.status),
    db.select({ name: classes.name, capacity: classes.capacity, c: sql<number>`count(${students.id})` }).from(classes)
      .leftJoin(students, and(eq(students.classId, classes.id), eq(students.status, "active"))).groupBy(classes.id).orderBy(asc(classes.id)),
    db.select({ p: feePayments, st: students }).from(feePayments).innerJoin(feeInvoices, eq(feePayments.invoiceId, feeInvoices.id))
      .innerJoin(students, eq(feeInvoices.studentId, students.id)).orderBy(desc(feePayments.id)).limit(5),
    db.select({ c: sql<number>`count(*)` }).from(leaveRequests).where(eq(leaveRequests.status, "pending")),
    db.select().from(events).where(and(gte(events.date, d), lte(events.date, addDays(d, 45)))).orderBy(asc(events.date)).limit(5),
    db.select().from(enquiries).where(and(lte(enquiries.followUpDate, d), inArray(enquiries.status, ["new", "contacted", "visit"]))).limit(5),
    db.select().from(students).where(and(eq(students.status, "active"), sql`to_char(${students.dob}, 'MM') = ${month.slice(5)}`)).orderBy(sql`to_char(${students.dob}, 'DD')`).limit(6),
  ]);

  const att = Object.fromEntries(attToday.map((r) => [r.status, n(r.c)]));
  const marked = (att.present ?? 0) + (att.absent ?? 0) + (att.late ?? 0) + (att.leave ?? 0);
  const presentPct = marked ? Math.round((((att.present ?? 0) + (att.late ?? 0)) / marked) * 100) : 0;
  const staffAtt = Object.fromEntries(staffToday.map((r) => [r.status, n(r.c)]));
  const staffIn = (staffAtt.present ?? 0) + (staffAtt.half_day ?? 0);

  const map = (rows: { m: string; s: number }[]) => Object.fromEntries(rows.map((r) => [r.m, n(r.s)]));
  const inc = map(incomeRows), exp = map(expenseRows), sal = map(salaryRows);
  const finance = months.map((m) => ({
    month: new Date(m + "-01T00:00:00").toLocaleDateString("en-IN", { month: "short" }),
    income: inc[m] ?? 0, expense: exp[m] ?? 0, salary: sal[m] ?? 0,
  }));
  const f = Object.fromEntries(funnel.map((r) => [r.status, n(r.c)]));
  const funnelData = [
    { name: "New", value: f.new ?? 0 }, { name: "Contacted", value: f.contacted ?? 0 }, { name: "Visited", value: f.visit ?? 0 },
    { name: "Admitted", value: f.admitted ?? 0 }, { name: "Lost", value: f.lost ?? 0 },
  ];
  const totalEnq = funnelData.reduce((a, b) => a + b.value, 0);
  const conversion = totalEnq ? Math.round(((f.admitted ?? 0) / totalEnq) * 100) : 0;
  const net = (inc[month] ?? 0) - (exp[month] ?? 0) - (sal[month] ?? 0);

  const hour = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: process.env.APP_TIMEZONE || "Asia/Kolkata" }).format(new Date()));
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <PageHeader title={`${greet}, ${me.name.split(" ")[0]}`} emoji="☀️" subtitle={`${school.name} · ${fmtDate(d, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`}>
        <Link href="/admin/students/new" className="btn-primary"><UserPlus className="h-4 w-4" />New admission</Link>
        <Link href="/admin/attendance" className="btn-soft"><CalendarCheck className="h-4 w-4" />Take attendance</Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active students" value={n(studentCount.c)} icon={Users} tone="brand" hint={`+${n(newAdmissions.c)} admitted this month`} href="/admin/students" />
        <StatCard label="Present today" value={marked ? `${presentPct}%` : "—"} icon={CalendarCheck} tone="mint" hint={marked ? `${(att.present ?? 0) + (att.late ?? 0)} of ${marked} marked` : "Attendance not taken yet"} href="/admin/attendance" />
        <StatCard label="Fees collected" value={inr(n(collected.s))} icon={IndianRupee} tone="sun" hint={`${inr(n(dues.s))} still due`} href="/admin/fees" />
        <StatCard label="Staff in today" value={`${staffIn}/${n(staffTotal.c)}`} icon={Briefcase} tone="sky" hint={`${n(pendingLeaves.c)} leave request(s) pending`} href="/admin/staff-attendance" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Money in & out" className="xl:col-span-2"
          action={<span className={`rounded-full px-3 py-1 text-xs font-bold ${net >= 0 ? "bg-mint-100 text-mint-600" : "bg-coral-100 text-coral-600"}`}>This month {net >= 0 ? "surplus" : "deficit"} {inr(Math.abs(net))}</span>}>
          <FinanceChart data={finance} />
        </Card>
        <Card title="Today's attendance">
          <Donut center={marked ? `${presentPct}%` : "—"} sub="present" data={[
            { name: "Present", value: att.present ?? 0, color: "mint" }, { name: "Late", value: att.late ?? 0, color: "sun" },
            { name: "Absent", value: att.absent ?? 0, color: "coral" }, { name: "Leave", value: att.leave ?? 0, color: "sky" },
          ]} />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Admission funnel" action={<Badge tone="mint">{`${conversion}% converted`}</Badge>}>
          <FunnelBars data={funnelData} />
        </Card>
        <Card title="Class strength" className="xl:col-span-2">
          <ClassBars data={classRows.map((c) => ({ name: c.name, students: n(c.c), capacity: c.capacity }))} />
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Expenses this month" value={inr(n(expMonth.s))} icon={Receipt} tone="coral" href="/admin/expenses" />
        <StatCard label="Salaries paid" value={inr(sal[month] ?? 0)} icon={Wallet} tone="brand" href="/admin/payroll" />
        <StatCard label="Overdue invoices" value={n(dues.overdue)} icon={AlertTriangle} tone="sun" href="/admin/fees?status=overdue" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <Card title="Recent payments" className="xl:col-span-2" padded={false}>
          {recentPayments.length ? (
            <ul className="divide-y divide-slate-100">
              {recentPayments.map(({ p, st }) => (
                <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={st.firstName} photoKey={st.photoKey} size={34} />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{st.firstName} {st.lastName}</p><p className="text-xs text-slate-500">{fmtDate(p.paidOn)} · {p.method.toUpperCase()}</p></div>
                  <span className="font-semibold text-mint-600">+{inr(p.amount)}</span>
                </li>
              ))}
            </ul>
          ) : <Empty title="No payments yet" emoji="💸" />}
        </Card>
        <Card title="Upcoming" padded={false}>
          {upcoming.length ? (
            <ul className="divide-y divide-slate-100">
              {upcoming.map((e) => (
                <li key={e.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-center leading-none">
                    <span className="font-display text-base font-semibold text-brand-700">{e.date.slice(8)}</span>
                    <span className="text-[10px] uppercase text-brand-500">{fmtDate(e.date, { month: "short" })}</span>
                  </div>
                  <div className="min-w-0"><p className="truncate text-sm font-semibold">{e.title}</p><Badge tone={e.type === "holiday" ? "coral" : "sky"}>{e.type}</Badge></div>
                </li>
              ))}
            </ul>
          ) : <Empty title="Nothing scheduled" emoji="📅" />}
        </Card>
        <Card title="Today's to-do" padded={false}>
          <ul className="divide-y divide-slate-100 text-sm">
            {birthdays.map((b) => (
              <li key={`b${b.id}`} className="flex items-center gap-2 px-5 py-3">🎂 <span><b>{b.firstName}</b> — birthday {fmtDate(b.dob, { day: "numeric", month: "short" })}</span></li>
            ))}
            {followUps.map((e) => (
              <li key={`e${e.id}`} className="px-5 py-3">📞 Follow up <b>{e.parentName}</b> ({e.childName}) <span className="text-slate-400">{e.phone}</span></li>
            ))}
            {n(pendingLeaves.c) > 0 && <li className="px-5 py-3"><Link href="/admin/leaves" className="text-brand-700 hover:underline">✈️ {n(pendingLeaves.c)} leave request(s) to review</Link></li>}
            {!marked && <li className="px-5 py-3"><Link href="/admin/attendance" className="text-brand-700 hover:underline">📋 Student attendance not taken</Link></li>}
            {!birthdays.length && !followUps.length && !n(pendingLeaves.c) && marked > 0 && <li className="px-5 py-6 text-center text-slate-400">All caught up ✨</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
