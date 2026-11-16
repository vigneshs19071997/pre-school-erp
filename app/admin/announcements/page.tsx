import { asc, desc, eq } from "drizzle-orm";
import { Plus, Pin, Trash2 } from "lucide-react";
import { db, announcements, classes, users } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { PageHeader, Field, Badge, Empty } from "@/components/ui";
import { ActionForm, SubmitButton, Modal, ActionButton } from "@/components/client";
import { fmtDate } from "@/lib/utils";
import { postAnnouncement, deleteAnnouncement } from "./actions";

export default async function Announcements() {
  await requireStaff("announcements.manage");
  const [rows, cls] = await Promise.all([
    db.select({ a: announcements, c: classes.name, by: users.name }).from(announcements).leftJoin(classes, eq(announcements.classId, classes.id))
      .leftJoin(users, eq(announcements.createdBy, users.id)).orderBy(desc(announcements.pinned), desc(announcements.createdAt)).limit(50),
    db.select().from(classes).orderBy(asc(classes.id)),
  ]);
  return (
    <>
      <PageHeader title="Announcements" emoji="📣" subtitle="Share news with parents, staff or a single class">
        <Modal title="New announcement" trigger={<><Plus className="h-4 w-4" />New</>}>
          <ActionForm action={postAnnouncement} className="space-y-4">
            <Field label="Title *"><input name="title" required className="input" placeholder="Annual Day on 20th Dec 🎭" /></Field>
            <Field label="Message *"><textarea name="body" rows={5} required className="input" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Who sees it"><select name="audience" className="input"><option value="all">Everyone</option><option value="parents">Parents only</option><option value="staff">Staff only</option></select></Field>
              <Field label="Only one class?"><select name="classId" className="input"><option value="">All classes</option>{cls.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="pinned" className="h-4 w-4 accent-brand-600" />Pin to top</label>
            <SubmitButton>Publish</SubmitButton>
          </ActionForm>
        </Modal>
      </PageHeader>
      {rows.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map(({ a, c, by }) => (
            <article key={a.id} className={`card p-5 ${a.pinned ? "ring-2 ring-sun-500/50" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold">{a.pinned && <Pin className="mr-1 inline h-4 w-4 text-sun-600" />}{a.title}</h3>
                <ActionButton action={deleteAnnouncement} fields={{ id: a.id }} confirm="Delete announcement?"><Trash2 className="h-3.5 w-3.5" /></ActionButton>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{a.body}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <Badge tone="brand">{a.audience === "all" ? "Everyone" : a.audience}</Badge>{c && <Badge tone="sky">{c}</Badge>}
                <span>{by ?? ""} · {fmtDate(a.createdAt)}</span>
              </div>
            </article>
          ))}
        </div>
      ) : <div className="card"><Empty title="No announcements yet" emoji="📭" /></div>}
    </>
  );
}
