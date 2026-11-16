import { asc, gte } from "drizzle-orm";
import { Pin } from "lucide-react";
import { db, events } from "@/lib/db";
import { requireParent } from "@/lib/auth";
import { parentNotices } from "@/lib/parent-data";
import { PageHeader, Card, Badge, Empty } from "@/components/ui";
import { fmtDate, today } from "@/lib/utils";

export default async function Notices() {
  const s = await requireParent();
  const [notices, upcoming] = await Promise.all([parentNotices(s, 40), db.select().from(events).where(gte(events.date, today())).orderBy(asc(events.date)).limit(15)]);
  return (
    <>
      <PageHeader title="Notices & events" emoji="📣" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {notices.length ? notices.map((n) => (
            <article key={n.id} className={`card p-5 ${n.pinned ? "ring-2 ring-sun-500/50" : ""}`}>
              <h3 className="text-lg font-semibold">{n.pinned && <Pin className="mr-1 inline h-4 w-4 text-sun-600" />}{n.title}</h3>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{n.body}</p>
              <p className="mt-3 text-xs text-slate-400">{fmtDate(n.createdAt)}</p>
            </article>
          )) : <div className="card"><Empty title="No notices" emoji="📭" /></div>}
        </div>
        <Card title="Upcoming events" padded={false}>
          {upcoming.length ? <ul className="divide-y divide-slate-100">{upcoming.map((e) => (
            <li key={e.id} className="px-5 py-3 text-sm"><div className="flex items-center justify-between"><b>{e.title}</b><Badge tone={e.type === "holiday" ? "coral" : "sky"}>{e.type}</Badge></div>
              <p className="text-xs text-slate-500">{fmtDate(e.date, { weekday: "long", day: "numeric", month: "long" })}</p>{e.description && <p className="mt-1 text-slate-600">{e.description}</p>}</li>
          ))}</ul> : <Empty title="Nothing planned" emoji="📅" />}
        </Card>
      </div>
    </>
  );
}
