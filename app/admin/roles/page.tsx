import { asc, eq, sql } from "drizzle-orm";
import { Plus, Pencil, Trash2, ShieldCheck } from "lucide-react";
import { db, roles, users, type Role } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { PageHeader, Field, Badge } from "@/components/ui";
import { ActionForm, SubmitButton, Modal, ActionButton } from "@/components/client";
import { saveRole, deleteRole } from "./actions";

const groups = [...new Set(PERMISSIONS.map((p) => p.group))];

function RoleFields({ r }: { r?: Role }) {
  const has = new Set(r?.permissions ?? []);
  return (
    <div className="space-y-4">
      {r && <input type="hidden" name="id" value={r.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Role name *"><input name="name" required defaultValue={r?.name} className="input" placeholder="Class Teacher" /></Field>
        <Field label="Description"><input name="description" defaultValue={r?.description ?? ""} className="input" /></Field>
      </div>
      <p className="label">What can this role do?</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {groups.map((g) => (
          <div key={g} className="rounded-xl bg-slate-50 p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-600">{g}</p>
            {PERMISSIONS.filter((p) => p.group === g).map((p) => (
              <label key={p.key} className="flex items-center gap-2 py-1 text-sm">
                <input type="checkbox" name="perm" value={p.key} defaultChecked={has.has(p.key)} className="h-4 w-4 accent-brand-600" />{p.label}
              </label>
            ))}
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500">Every staff member can always use “My Desk” — check in/out, apply for leave and see their payslips.</p>
      <SubmitButton>Save role</SubmitButton>
    </div>
  );
}

export default async function Roles() {
  await requireStaff("roles.manage");
  const rows = await db.select({ r: roles, count: sql<number>`count(${users.id})` }).from(roles).leftJoin(users, eq(users.roleId, roles.id)).groupBy(roles.id).orderBy(asc(roles.id));
  return (
    <>
      <PageHeader title="Roles & access" emoji="🛡️" subtitle="Create roles like Teacher, Accountant, Front Office and choose exactly what each can do">
        <Modal title="New role" wide trigger={<><Plus className="h-4 w-4" />New role</>}><ActionForm action={saveRole}><RoleFields /></ActionForm></Modal>
      </PageHeader>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {rows.map(({ r, count }) => {
          const all = r.permissions.includes("*");
          return (
            <div key={r.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-100 text-brand-700"><ShieldCheck className="h-5 w-5" /></span>
                  <div><p className="font-display text-lg font-semibold">{r.name}</p><p className="text-xs text-slate-500">{Number(count)} staff</p></div></div>
                {r.isSystem && <Badge tone="sun">System</Badge>}
              </div>
              {r.description && <p className="mt-3 text-sm text-slate-600">{r.description}</p>}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {all ? <Badge tone="mint">Full access</Badge> : r.permissions.length ? r.permissions.map((p) => <span key={p} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{PERMISSIONS.find((x) => x.key === p)?.label ?? p}</span>) : <span className="text-xs text-slate-400">My Desk only</span>}
              </div>
              {!r.isSystem && (
                <div className="mt-auto flex gap-1 border-t border-slate-100 pt-3 [margin-top:auto]">
                  <Modal title={`Edit ${r.name}`} wide triggerClass="btn-ghost btn-sm" trigger={<><Pencil className="h-3.5 w-3.5" />Edit</>}><ActionForm action={saveRole} reset={false}><RoleFields r={r} /></ActionForm></Modal>
                  <ActionButton action={deleteRole} fields={{ id: r.id }} confirm="Delete this role?"><Trash2 className="h-3.5 w-3.5" />Delete</ActionButton>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
