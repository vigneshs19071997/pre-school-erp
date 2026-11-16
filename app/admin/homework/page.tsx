import { desc, eq, inArray } from "drizzle-orm";
import { Plus, Paperclip, Trash2, CalendarDays } from "lucide-react";
import { db, homework, classes, users } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { allowedClasses } from "@/lib/scope";
import { fileUrl } from "@/lib/storage";
import { PageHeader, Field, Empty, Badge } from "@/components/ui";
import { ActionForm, SubmitButton, Modal, ActionButton, AutoSubmit } from "@/components/client";
import { fmtDate, today } from "@/lib/utils";
import { createHomework, deleteHomework } from "./actions";

const SUBJECTS = ["English", "Maths", "EVS", "Tamil", "Hindi", "Art & Craft", "Rhymes", "General"];

export default async function Homework({ searchParams }: { searchParams: Promise<{ class?: string }> }) {
  const me = await requireStaff("homework.manage");
  const { class: cls } = await searchParams;
  const allowed = await allowedClasses(me);
  const ids = cls ? [Number(cls)] : allowed.map((c) => c.id);
  const rows = ids.length ? await db.select({ h: homework, c: classes.name, by: users.name }).from(homework)
    .innerJoin(classes, eq(homework.classId, classes.id)).leftJoin(users, eq(homework.createdBy, users.id))
    .where(inArray(homework.classId, ids)).orderBy(desc(homework.createdAt)).limit(60) : [];
  const d = today();
  return (
    <>
      <PageHeader title="Homework" emoji="📚" subtitle="Posted homework shows up instantly in the parent app">
        <Modal title="Post homework" trigger={<><Plus className="h-4 w-4" />Post homework</>}>
          <ActionForm action={createHomework} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Class *"><select name="classId" required defaultValue={cls ?? allowed[0]?.id} className="input">{allowed.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
              <Field label="Subject"><select name="subject" className="input">{SUBJECTS.map((s) => <option key={s}>{s}</option>)}</select></Field>
            </div>
            <Field label="Title *"><input name="title" required className="input" placeholder="Colour the apple worksheet" /></Field>
            <Field label="Instructions"><textarea name="description" rows={3} className="input" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Due date"><input type="date" name="dueDate" defaultValue={d} className="input" /></Field>
              <Field label="Attachment (optional)"><input type="file" name="file" className="input text-xs" /></Field>
            </div>
            <SubmitButton pendingText="Posting…">Post homework</SubmitButton>
          </ActionForm>
        </Modal>
      </PageHeader>
      <AutoSubmit className="mb-5">
        <select name="class" defaultValue={cls ?? ""} className="input w-auto"><option value="">All my classes</option>{allowed.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      </AutoSubmit>
      {rows.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ h, c, by }) => (
            <div key={h.id} className="card flex flex-col p-5">
              <div className="flex items-center gap-2"><Badge tone="brand">{c}</Badge>{h.subject && <Badge tone="sky">{h.subject}</Badge>}</div>
              <h3 className="mt-3 text-lg font-semibold">{h.title}</h3>
              {h.description && <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{h.description}</p>}
              {h.attachmentKey && <a href={fileUrl(h.attachmentKey)!} target="_blank" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"><Paperclip className="h-4 w-4" />{h.attachmentName ?? "Attachment"}</a>}
              <div className="mt-auto flex items-center justify-between pt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />Due {fmtDate(h.dueDate, { day: "numeric", month: "short" })} · by {by ?? "—"}</span>
                <ActionButton action={deleteHomework} fields={{ id: h.id }} confirm="Delete this homework?"><Trash2 className="h-3.5 w-3.5" /></ActionButton>
              </div>
            </div>
          ))}
        </div>
      ) : <div className="card"><Empty title="No homework posted yet" emoji="📒" /></div>}
    </>
  );
}
