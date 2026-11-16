import Link from "next/link";
import { asc, desc } from "drizzle-orm";
import { Plus, Phone, ChevronRight, Trash2, Pencil, GraduationCap } from "lucide-react";
import { db, enquiries, classes } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { PageHeader, Field, Badge } from "@/components/ui";
import { ActionForm, SubmitButton, Modal, ActionButton } from "@/components/client";
import { fmtDate, today, cn } from "@/lib/utils";
import { saveEnquiry, moveEnquiry, deleteEnquiry } from "./actions";

const STAGES = [
  { key: "new", label: "New enquiry", emoji: "✨", tone: "bg-brand-50 ring-brand-100" },
  { key: "contacted", label: "Contacted", emoji: "📞", tone: "bg-sky-100/50 ring-sky-100" },
  { key: "visit", label: "Campus visit", emoji: "🏫", tone: "bg-sun-100/50 ring-sun-100" },
  { key: "admitted", label: "Admitted", emoji: "🎉", tone: "bg-mint-100/50 ring-mint-100" },
  { key: "lost", label: "Not joining", emoji: "🍂", tone: "bg-slate-100 ring-slate-200" },
];

type Enq = typeof enquiries.$inferSelect;

function EnquiryFields({ e, programs }: { e?: Enq; programs: string[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {e && <input type="hidden" name="id" value={e.id} />}
      <Field label="Child's name *"><input name="childName" required defaultValue={e?.childName} className="input" /></Field>
      <Field label="Child's DOB"><input type="date" name="childDob" defaultValue={e?.childDob ?? ""} className="input" /></Field>
      <Field label="Parent name *"><input name="parentName" required defaultValue={e?.parentName} className="input" /></Field>
      <Field label="Phone *"><input name="phone" required defaultValue={e?.phone} className="input" /></Field>
      <Field label="Email"><input type="email" name="email" defaultValue={e?.email ?? ""} className="input" /></Field>
      <Field label="Program"><select name="programInterest" defaultValue={e?.programInterest ?? ""} className="input"><option value="">—</option>{programs.map((p) => <option key={p}>{p}</option>)}</select></Field>
      <Field label="Source"><select name="source" defaultValue={e?.source ?? "walk-in"} className="input">{["walk-in", "website", "referral", "social media", "hoarding / flyer", "other"].map((s) => <option key={s}>{s}</option>)}</select></Field>
      <Field label="Follow-up date"><input type="date" name="followUpDate" defaultValue={e?.followUpDate ?? ""} className="input" /></Field>
      <Field label="Stage"><select name="status" defaultValue={e?.status ?? "new"} className="input">{STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select></Field>
      <Field label="Notes" className="sm:col-span-2"><textarea name="notes" rows={2} defaultValue={e?.notes ?? ""} className="input" /></Field>
      <div className="sm:col-span-2"><SubmitButton>{e ? "Save" : "Add enquiry"}</SubmitButton></div>
    </div>
  );
}

export default async function Admissions() {
  await requireStaff("admissions.manage");
  const [rows, cls] = await Promise.all([
    db.select().from(enquiries).orderBy(desc(enquiries.createdAt)),
    db.select({ name: classes.name }).from(classes).orderBy(asc(classes.id)),
  ]);
  const programs = cls.map((c) => c.name);
  const d = today();
  return (
    <>
      <PageHeader title="Admissions" emoji="🌟" subtitle="Track every enquiry from first call to admission">
        <Modal title="New enquiry" wide trigger={<><Plus className="h-4 w-4" />New enquiry</>}>
          <ActionForm action={saveEnquiry}><EnquiryFields programs={programs} /></ActionForm>
        </Modal>
      </PageHeader>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage, si) => {
          const list = rows.filter((r) => r.status === stage.key);
          return (
            <div key={stage.key} className={cn("w-72 shrink-0 rounded-2xl p-3 ring-1", stage.tone)}>
              <div className="mb-3 flex items-center justify-between px-1">
                <p className="font-display font-semibold text-slate-700">{stage.emoji} {stage.label}</p>
                <span className="rounded-full bg-white px-2 text-xs font-bold text-slate-500">{list.length}</span>
              </div>
              <div className="space-y-2.5">
                {list.map((e) => {
                  const overdue = e.followUpDate && e.followUpDate <= d && !["admitted", "lost"].includes(e.status);
                  const next = STAGES[si + 1];
                  return (
                    <div key={e.id} className="card p-3.5 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div><p className="font-semibold text-slate-800">{e.childName}</p><p className="text-xs text-slate-500">{e.parentName}</p></div>
                        {e.programInterest && <Badge tone="brand">{e.programInterest}</Badge>}
                      </div>
                      <a href={`tel:${e.phone}`} className="mt-2 flex items-center gap-1.5 text-xs text-slate-600 hover:text-brand-700"><Phone className="h-3 w-3" />{e.phone}</a>
                      {e.followUpDate && <p className={cn("mt-1 text-xs", overdue ? "font-semibold text-coral-600" : "text-slate-500")}>Follow-up {fmtDate(e.followUpDate, { day: "numeric", month: "short" })}</p>}
                      {e.notes && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{e.notes}</p>}
                      <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-2">
                        <Modal title="Edit enquiry" wide trigger={<Pencil className="h-3.5 w-3.5" />} triggerClass="btn-ghost btn-sm">
                          <ActionForm action={saveEnquiry} reset={false}><EnquiryFields e={e} programs={programs} /></ActionForm>
                        </Modal>
                        <ActionButton action={deleteEnquiry} fields={{ id: e.id }} confirm="Delete this enquiry?"><Trash2 className="h-3.5 w-3.5" /></ActionButton>
                        <span className="flex-1" />
                        {stage.key === "visit" || stage.key === "contacted" || stage.key === "new" ? (
                          <Link href={`/admin/students/new?enquiry=${e.id}`} className="btn-ghost btn-sm text-mint-600" title="Admit"><GraduationCap className="h-3.5 w-3.5" /></Link>
                        ) : null}
                        {next && stage.key !== "admitted" && next.key !== "admitted" && (
                          <ActionButton action={moveEnquiry} fields={{ id: e.id, status: next.key }} className="btn-soft btn-sm whitespace-nowrap">{next.label}<ChevronRight className="h-3 w-3" /></ActionButton>
                        )}
                      </div>
                    </div>
                  );
                })}
                {!list.length && <p className="py-6 text-center text-xs text-slate-400">Nothing here</p>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
