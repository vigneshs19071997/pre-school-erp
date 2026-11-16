import { eq } from "drizzle-orm";
import { db, enquiries } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { allowedClasses } from "@/lib/scope";
import { PageHeader } from "@/components/ui";
import { StudentForm } from "../student-form";
import { createStudent } from "../actions";

export default async function NewStudent({ searchParams }: { searchParams: Promise<{ enquiry?: string }> }) {
  const me = await requireStaff("students.manage");
  const { enquiry } = await searchParams;
  const cls = await allowedClasses(me);
  let prefill = {};
  if (enquiry) {
    const [e] = await db.select().from(enquiries).where(eq(enquiries.id, Number(enquiry)));
    if (e) {
      const [firstName, ...rest] = e.childName.split(" ");
      prefill = { firstName, lastName: rest.join(" ") || null, dob: e.childDob, fatherName: e.parentName, parentPhone: e.phone, parentEmail: e.email };
    }
  }
  return (
    <>
      <PageHeader title="New admission" emoji="🎒" subtitle="A Student ID is created automatically — parents use it to log in." />
      <StudentForm action={createStudent} classes={cls} prefill={prefill} enquiryId={enquiry ? Number(enquiry) : undefined} />
    </>
  );
}
