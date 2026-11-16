import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { db, users, roles, students } from "@/lib/db";
import { can, type Permission } from "@/lib/permissions";

const COOKIE = "ps_session";
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");

export type SessionPayload = { kind: "staff" | "parent"; id: number; v: string };

/** Short fingerprint of the password hash: changing/resetting a password logs out old sessions. */
export const fingerprint = (hash: string) => hash.slice(-12);

export async function createSession(p: SessionPayload) {
  const token = await new SignJWT(p).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function readSession(token?: string): Promise<SessionPayload | null> {
  const t = token ?? (await cookies()).get(COOKIE)?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, secret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getStaff() {
  const s = await readSession();
  if (!s || s.kind !== "staff") return null;
  const [row] = await db
    .select({ user: users, role: roles })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, s.id))
    .limit(1);
  if (!row || row.user.status !== "active" || fingerprint(row.user.passwordHash) !== s.v) return null;
  return { ...row.user, roleName: row.role.name, permissions: row.role.permissions ?? [] };
}
export type StaffSession = NonNullable<Awaited<ReturnType<typeof getStaff>>>;

/** Use in pages and server actions. Redirects to login, or to "My Desk" when permission is missing. */
export async function requireStaff(perm?: Permission) {
  const me = await getStaff();
  if (!me) redirect("/login");
  if (perm && !can(me.permissions, perm)) redirect("/admin/my?denied=1");
  return me;
}

export async function getParent() {
  const s = await readSession();
  if (!s || s.kind !== "parent") return null;
  const [st] = await db.select().from(students).where(eq(students.id, s.id)).limit(1);
  if (!st || !st.parentPasswordHash || fingerprint(st.parentPasswordHash) !== s.v || st.status !== "active") return null;
  return st;
}

export async function requireParent() {
  const p = await getParent();
  if (!p) redirect("/login?tab=parent");
  return p;
}
