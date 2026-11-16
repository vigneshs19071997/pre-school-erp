import { desc, eq } from "drizzle-orm";
import { Paperclip, CalendarDays } from "lucide-react";
import { db, homework } from "@/lib/db";
import { requireParent } from "@/lib/auth";
import { fileUrl } from "@/lib/storage";
import { PageHeader, Empty, Badge } from "@/components/ui";
import { fmtDate, today } from "@/lib/utils";

export default async function ParentHomework() {
  const s = await requireParent();
  const rows = s.classId ? await db.select().from(homework).where(eq(homework.classId, s.classId)).orderBy(desc(homework.createdAt)).limit(60) : [];
  const d = today();
  return (
    <>
      <PageHeader title="Homework" emoji="📚" subtitle="Little tasks to enjoy together at home" />
      {rows.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((h) => (
            <div key={h.id} className="card p-5">
              <div className="flex items-center justify-between">{h.subject && <Badge tone="sky">{h.subject}</Badge>}{h.dueDate && h.dueDate >= d && <Badge tone="sun">Upcoming</Badge>}</div>
              <h3 className="mt-2 text-lg font-semibold">{h.title}</h3>
              {h.description && <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{h.description}</p>}
              {h.attachmentKey && <a href={fileUrl(h.attachmentKey)!} target="_blank" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"><Paperclip className="h-4 w-4" />{h.attachmentName ?? "Download"}</a>}
              <p className="mt-3 flex items-center gap-1 text-xs text-slate-500"><CalendarDays className="h-3.5 w-3.5" />Given {fmtDate(h.createdAt, { day: "numeric", month: "short" })} · Due {fmtDate(h.dueDate, { day: "numeric", month: "short" })}</p>
            </div>
          ))}
        </div>
      ) : <div className="card"><Empty title="No homework yet" emoji="🎈" /></div>}
    </>
  );
}
