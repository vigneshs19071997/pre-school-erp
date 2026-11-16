import { asc, eq } from "drizzle-orm";
import { Plus, Pencil, Phone, Mail } from "lucide-react";
import { db, users, roles, type User } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { PageHeader, Badge, Field, Avatar, Empty } from "@/components/ui";
import { ActionForm, SubmitButton, Modal } from "@/components/client";
import { inr, fmtDate, today } from "@/lib/utils";
import { saveStaff } from "./actions";

function StaffFields({ u, roleList }: { u?: User; roleList: { id: number; name: string }[] }) {
  return (
    <div className="space-y-5">
      {u && <input type="hidden" name="id" value={u.id} />}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Full name *"><input name="name" required defaultValue={u?.name} className="input" /></Field>
        <Field label="Email (login) *"><input type="email" name="email" required defaultValue={u?.email} className="input" /></Field>
        <Field label={u ? "New password (optional)" : "Password *"}><input type="text" name="password" minLength={6} required={!u} className="input" autoComplete="off" /></Field>
        <Field label="Role *"><select name="roleId" required defaultValue={u?.roleId} className="input">{roleList.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></Field>
        <Field label="Designation"><input name="designation" defaultValue={u?.designation ?? ""} className="input" placeholder="Class Teacher" /></Field>
        <Field label="Department"><select name="department" defaultValue={u?.department ?? "Teaching"} className="input"><option>Teaching</option><option>Administration</option><option>Support</option><option>Transport</option><option>Housekeeping</option></select></Field>
        <Field label="Phone"><input name="phone" defaultValue={u?.phone ?? ""} className="input" /></Field>
        <Field label="Joining date"><input type="date" name="joinDate" defaultValue={u?.joinDate ?? today()} className="input" /></Field>
        <Field label="Status"><select name="status" defaultValue={u?.status ?? "active"} className="input"><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>
        <Field label="Address" className="sm:col-span-2"><input name="address" defaultValue={u?.address ?? ""} className="input" /></Field>
        <Field label="Emergency contact"><input name="emergencyContact" defaultValue={u?.emergencyContact ?? ""} className="input" /></Field>
        <Field label="Photo"><input type="file" name="photo" accept="image/*" className="input text-xs" /></Field>
      </div>
      <div className="rounded-2xl bg-brand-50/60 p-4">
        <p className="mb-3 font-display font-semibold text-brand-700">💼 Salary & bank (monthly)</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Basic ₹"><input type="number" name="basicSalary" defaultValue={u?.basicSalary ?? 0} className="input" /></Field>
          <Field label="Allowances ₹"><input type="number" name="allowances" defaultValue={u?.allowances ?? 0} className="input" /></Field>
          <Field label="Deductions ₹ (PF/ESI)"><input type="number" name="deductions" defaultValue={u?.deductions ?? 0} className="input" /></Field>
          <Field label="Bank"><input name="bankName" defaultValue={u?.bankName ?? ""} className="input" /></Field>
          <Field label="Account no."><input name="bankAccount" defaultValue={u?.bankAccount ?? ""} className="input" /></Field>
          <Field label="IFSC"><input name="ifsc" defaultValue={u?.ifsc ?? ""} className="input uppercase" /></Field>
        </div>
      </div>
      <SubmitButton>{u ? "Save changes" : "Add staff member"}</SubmitButton>
    </div>
  );
}

export default async function Staff() {
  await requireStaff("staff.manage");
  const [rows, roleList] = await Promise.all([
    db.select({ u: users, role: roles.name }).from(users).innerJoin(roles, eq(users.roleId, roles.id)).orderBy(asc(users.status), asc(users.name)),
    db.select({ id: roles.id, name: roles.name }).from(roles).orderBy(asc(roles.id)),
  ]);
  const payroll = rows.filter((r) => r.u.status === "active").reduce((a, r) => a + r.u.basicSalary + r.u.allowances - r.u.deductions, 0);
  return (
    <>
      <PageHeader title="Staff" emoji="🧑‍🏫" subtitle={`${rows.filter((r) => r.u.status === "active").length} active · monthly payroll ≈ ${inr(payroll)}`}>
        <Modal title="Add staff member" wide trigger={<><Plus className="h-4 w-4" />Add staff</>}><ActionForm action={saveStaff}><StaffFields roleList={roleList} /></ActionForm></Modal>
      </PageHeader>
      {rows.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ u, role }) => (
            <div key={u.id} className={`card p-5 ${u.status !== "active" ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-3">
                <Avatar name={u.name} photoKey={u.photoKey} size={52} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg font-semibold text-slate-800">{u.name}</p>
                  <p className="text-sm text-slate-500">{u.designation ?? "—"} · <span className="font-mono text-xs">{u.employeeCode}</span></p>
                  <div className="mt-1.5 flex gap-1.5"><Badge tone="brand">{role}</Badge>{u.status !== "active" && <Badge>{u.status}</Badge>}</div>
                </div>
              </div>
              <div className="mt-4 space-y-1.5 text-sm text-slate-600">
                <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" />{u.email}</p>
                {u.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" />{u.phone}</p>}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                <span>Net <b>{inr(u.basicSalary + u.allowances - u.deductions)}</b>/mo · since {fmtDate(u.joinDate, { month: "short", year: "numeric" })}</span>
                <Modal title={`Edit ${u.name}`} wide triggerClass="btn-ghost btn-sm" trigger={<Pencil className="h-3.5 w-3.5" />}><ActionForm action={saveStaff} reset={false}><StaffFields u={u} roleList={roleList} /></ActionForm></Modal>
              </div>
            </div>
          ))}
        </div>
      ) : <div className="card"><Empty title="No staff yet" emoji="🧑‍🏫" /></div>}
    </>
  );
}
