import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, students } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { allowedClasses } from "@/lib/scope";
import { PageHeader } from "@/components/ui";
import { StudentForm } from "../../student-form";
import { updateStudent } from "../../actions";

export default async function EditStudent({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireStaff("students.manage");
  const { id } = await params;
  const [s] = await db.select().from(students).where(eq(students.id, Number(id)));
  if (!s) notFound();
  return (
    <>
      <PageHeader title={`Edit ${s.firstName}`} emoji="✏️" subtitle={`Student ID ${s.studentCode}`} />
      <StudentForm action={updateStudent} student={s} classes={await allowedClasses(me)} />
    </>
  );
}
