import type { Student } from "@/lib/db";
import { Field } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/client";
import type { ActionState } from "@/lib/action";
import { today } from "@/lib/utils";

export function StudentForm({ action, student, classes, prefill, enquiryId }: {
  action: (p: ActionState, fd: FormData) => Promise<ActionState>;
  student?: Student; classes: { id: number; name: string }[];
  prefill?: Partial<Student>; enquiryId?: number;
}) {
  const s = { ...prefill, ...student };
  return (
    <ActionForm action={action} reset={false} className="space-y-6">
      {student && <input type="hidden" name="id" value={student.id} />}
      {enquiryId && <input type="hidden" name="enquiryId" value={enquiryId} />}
      <section className="card p-6">
        <h2 className="mb-4 text-lg font-semibold">🧒 Child details</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="First name *"><input name="firstName" required defaultValue={s.firstName ?? ""} className="input" /></Field>
          <Field label="Last name"><input name="lastName" defaultValue={s.lastName ?? ""} className="input" /></Field>
          <Field label="Date of birth"><input type="date" name="dob" defaultValue={s.dob ?? ""} className="input" /></Field>
          <Field label="Gender"><select name="gender" defaultValue={s.gender ?? ""} className="input"><option value="">—</option><option>Boy</option><option>Girl</option></select></Field>
          <Field label="Class"><select name="classId" defaultValue={s.classId ?? ""} className="input"><option value="">Not assigned</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label="Admission date"><input type="date" name="admissionDate" defaultValue={s.admissionDate ?? today()} className="input" /></Field>
          <Field label="Blood group"><input name="bloodGroup" defaultValue={s.bloodGroup ?? ""} className="input" placeholder="e.g. B+" /></Field>
          <Field label="Photo"><input type="file" name="photo" accept="image/*" className="input file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1 file:text-brand-700" /></Field>
          {student && <Field label="Status"><select name="status" defaultValue={student.status} className="input"><option value="active">Active</option><option value="withdrawn">Withdrawn</option><option value="graduated">Graduated</option></select></Field>}
          <Field label="Allergies / medical notes" className="sm:col-span-2 lg:col-span-3"><textarea name="medicalNotes" rows={2} defaultValue={s.medicalNotes ?? ""} className="input" placeholder="Anything teachers should know" /></Field>
        </div>
      </section>
      <section className="card p-6">
        <h2 className="mb-4 text-lg font-semibold">👨‍👩‍👧 Parent details</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Father's name"><input name="fatherName" defaultValue={s.fatherName ?? ""} className="input" /></Field>
          <Field label="Mother's name"><input name="motherName" defaultValue={s.motherName ?? ""} className="input" /></Field>
          <Field label="Parent mobile * (used to verify parent login)"><input name="parentPhone" required inputMode="tel" defaultValue={s.parentPhone ?? ""} className="input" /></Field>
          <Field label="Parent email"><input type="email" name="parentEmail" defaultValue={s.parentEmail ?? ""} className="input" /></Field>
          <Field label="Address" className="sm:col-span-2"><input name="address" defaultValue={s.address ?? ""} className="input" /></Field>
        </div>
      </section>
      <div className="flex justify-end"><SubmitButton pendingText="Saving…">{student ? "Save changes" : "Admit student"}</SubmitButton></div>
    </ActionForm>
  );
}
