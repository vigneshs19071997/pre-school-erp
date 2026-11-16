import Link from "next/link";
import { and, asc, eq, ilike, or, type SQL } from "drizzle-orm";
import { Plus, Search } from "lucide-react";
import { db, students, classes } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { PageHeader, Card, Badge, Avatar, Empty, TableWrap } from "@/components/ui";
import { AutoSubmit } from "@/components/client";
import { age } from "@/lib/utils";

export default async function Students({ searchParams }: { searchParams: Promise<{ q?: string; class?: string; status?: string }> }) {
  await requireStaff("students.manage");
  const { q, class: cls, status = "active" } = await searchParams;
  const where: SQL[] = [];
  if (status !== "all") where.push(eq(students.status, status));
  if (cls) where.push(eq(students.classId, Number(cls)));
  if (q) where.push(or(ilike(students.firstName, `%${q}%`), ilike(students.lastName, `%${q}%`), ilike(students.studentCode, `%${q}%`), ilike(students.parentPhone, `%${q}%`))!);
  const [rows, allClasses] = await Promise.all([
    db.select({ s: students, c: classes }).from(students).leftJoin(classes, eq(students.classId, classes.id)).where(and(...where)).orderBy(asc(students.firstName)),
    db.select().from(classes).orderBy(asc(classes.id)),
  ]);
  return (
    <>
      <PageHeader title="Students" emoji="🧒" subtitle={`${rows.length} student(s)`}>
        <Link href="/admin/students/new" className="btn-primary"><Plus className="h-4 w-4" />New admission</Link>
      </PageHeader>
      <Card padded={false}>
        <AutoSubmit className="flex flex-wrap gap-3 border-b border-slate-100 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input name="q" defaultValue={q} placeholder="Search name, Student ID, phone…" className="input pl-9" />
          </div>
          <select name="class" defaultValue={cls ?? ""} className="input w-auto"><option value="">All classes</option>{allClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <select name="status" defaultValue={status} className="input w-auto"><option value="active">Active</option><option value="withdrawn">Withdrawn</option><option value="graduated">Graduated</option><option value="all">All</option></select>
        </AutoSubmit>
        {rows.length ? (
          <TableWrap>
            <table className="table">
              <thead><tr><th>Student</th><th>Student ID</th><th>Class</th><th>Age</th><th>Parent</th><th>Parent login</th><th>Status</th></tr></thead>
              <tbody>
                {rows.map(({ s, c }) => (
                  <tr key={s.id}>
                    <td><Link href={`/admin/students/${s.id}`} className="flex items-center gap-3 font-semibold text-slate-800 hover:text-brand-700">
                      <Avatar name={`${s.firstName} ${s.lastName ?? ""}`} photoKey={s.photoKey} size={36} />{s.firstName} {s.lastName}</Link></td>
                    <td className="font-mono text-xs">{s.studentCode}</td>
                    <td>{c?.name ?? "—"}</td>
                    <td>{age(s.dob)}</td>
                    <td><div className="text-sm">{s.fatherName || s.motherName || "—"}</div><div className="text-xs text-slate-500">{s.parentPhone}</div></td>
                    <td>{s.parentPasswordHash ? <Badge tone="mint">Active</Badge> : <Badge tone="slate">Not set</Badge>}</td>
                    <td><Badge>{s.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        ) : <Empty title="No students found" text="Try a different search, or add a new admission." />}
      </Card>
    </>
  );
}
