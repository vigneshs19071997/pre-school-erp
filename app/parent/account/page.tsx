import { requireParent } from "@/lib/auth";
import { PageHeader, Field } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/client";
import { changeParentPassword } from "../actions";

export default async function Account() {
  const s = await requireParent();
  return (
    <>
      <PageHeader title="Account" emoji="🔐" subtitle={`Username (Student ID): ${s.studentCode}`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <ActionForm action={changeParentPassword} className="card space-y-4 p-6">
          <h2 className="text-lg font-semibold">Change password</h2>
          <Field label="Current password"><input type="password" name="current" required className="input" /></Field>
          <Field label="New password"><input type="password" name="next" minLength={6} required className="input" /></Field>
          <Field label="Confirm new password"><input type="password" name="confirm" minLength={6} required className="input" /></Field>
          <SubmitButton>Update password</SubmitButton>
        </ActionForm>
        <div className="card space-y-2 p-6 text-sm">
          <h2 className="mb-2 text-lg font-semibold">Details on record</h2>
          <p><span className="text-slate-500">Father:</span> {s.fatherName ?? "—"}</p>
          <p><span className="text-slate-500">Mother:</span> {s.motherName ?? "—"}</p>
          <p><span className="text-slate-500">Mobile:</span> {s.parentPhone}</p>
          <p><span className="text-slate-500">Email:</span> {s.parentEmail ?? "—"}</p>
          <p><span className="text-slate-500">Address:</span> {s.address ?? "—"}</p>
          <p className="pt-3 text-xs text-slate-400">To change these details, please contact the school office.</p>
        </div>
      </div>
    </>
  );
}
