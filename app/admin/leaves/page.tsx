import { desc, eq } from "drizzle-orm";
import { Check, X } from "lucide-react";
import { db, leaveRequests, users } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { PageHeader, Card, Badge, Avatar, Empty } from "@/components/ui";
import { ActionButton } from "@/components/client";
import { fmtDate } from "@/lib/utils";
import { reviewLeave } from "./actions";

const days = (a: string, b: string) => (new Date(b).getTime() - new Date(a).getTime()) / 86400000 + 1;

export default async function Leaves() {
  await requireStaff("leave.approve");
  const rows = await db.select({ l: leaveRequests, u: users }).from(leaveRequests).innerJoin(users, eq(leaveRequests.userId, users.id)).orderBy(desc(leaveRequests.createdAt)).limit(100);
  const pending = rows.filter((r) => r.l.status === "pending");
  const done = rows.filter((r) => r.l.status !== "pending");
  return (
    <>
      <PageHeader title="Leave requests" emoji="✈️" subtitle="Staff apply from My Desk. Approved days are marked in the staff register; unpaid leave reduces salary." />
      <Card title={`Waiting for you (${pending.length})`} padded={false} className="mb-6">
        {pending.length ? (
          <ul className="divide-y divide-slate-100">
            {pending.map(({ l, u }) => (
              <li key={l.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-3">
                  <Avatar name={u.name} photoKey={u.photoKey} size={40} />
                  <div><p className="font-semibold">{u.name} <Badge tone="sky">{l.type}</Badge></p>
                    <p className="text-sm text-slate-500">{fmtDate(l.fromDate)} → {fmtDate(l.toDate)} · {days(l.fromDate, l.toDate)} day(s)</p>
                    {l.reason && <p className="text-sm text-slate-600">“{l.reason}”</p>}</div>
                </div>
                <div className="flex gap-2">
                  <ActionButton action={reviewLeave} fields={{ id: l.id, decision: "approved" }} className="btn btn-sm bg-mint-500 text-white hover:bg-mint-600"><Check className="h-4 w-4" />Approve</ActionButton>
                  <ActionButton action={reviewLeave} fields={{ id: l.id, decision: "rejected" }} className="btn-danger btn-sm"><X className="h-4 w-4" />Reject</ActionButton>
                </div>
              </li>
            ))}
          </ul>
        ) : <Empty title="No pending requests" emoji="🏖️" />}
      </Card>
      <Card title="History" padded={false}>
        {done.length ? (
          <table className="table"><thead><tr><th>Staff</th><th>Type</th><th>Dates</th><th>Status</th></tr></thead>
            <tbody>{done.map(({ l, u }) => <tr key={l.id}><td className="font-semibold">{u.name}</td><td className="capitalize">{l.type}</td><td>{fmtDate(l.fromDate, { day: "numeric", month: "short" })} – {fmtDate(l.toDate, { day: "numeric", month: "short" })}</td><td><Badge>{l.status}</Badge></td></tr>)}</tbody></table>
        ) : <Empty title="No history yet" emoji="📜" />}
      </Card>
    </>
  );
}
