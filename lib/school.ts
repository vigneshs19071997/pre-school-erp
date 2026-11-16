import { eq } from "drizzle-orm";
import { db, settings } from "@/lib/db";
import { signedUrl } from "@/lib/storage";

export type SchoolInfo = { name: string; tagline: string; address: string; phone: string; email: string; academicYear: string };

export async function getSchool(): Promise<SchoolInfo> {
  const base: SchoolInfo = {
    name: process.env.SCHOOL_NAME || "Little Sprouts Preschool",
    tagline: "Where little minds grow big",
    address: "", phone: "", email: "",
    academicYear: `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(2)}`,
  };
  try {
    const rows = await db.select().from(settings);
    for (const r of rows) if (r.key in base) (base as Record<string, string>)[r.key] = r.value;
  } catch { /* DB not ready yet */ }
  return base;
}

/** The staff-uploadable photo shown behind the login page, if one has been set. */
export async function getLoginPhotoUrl(): Promise<string | null> {
  try {
    const [row] = await db.select().from(settings).where(eq(settings.key, "loginPhotoKey"));
    if (!row?.value) return null;
    return await signedUrl(row.value);
  } catch {
    return null;
  }
}
