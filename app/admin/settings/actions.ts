"use server";

import { eq } from "drizzle-orm";
import { db, settings } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { uploadFile, deleteFile } from "@/lib/storage";
import { ok, fail, type ActionState } from "@/lib/action";

const KEYS = ["name", "tagline", "address", "phone", "email", "academicYear", "schoolLat", "schoolLng", "geofenceRadius"];

export async function saveSettings(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("settings.manage");
  for (const key of KEYS) {
    const value = String(fd.get(key) ?? "").trim();
    await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
  }
  return ok("Settings saved");
}

export async function saveLoginPhoto(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("settings.manage");
  try {
    const key = await uploadFile(fd.get("photo"), "settings");
    if (!key) return fail("Choose a photo to upload");
    const [old] = await db.select().from(settings).where(eq(settings.key, "loginPhotoKey"));
    await db.insert(settings).values({ key: "loginPhotoKey", value: key }).onConflictDoUpdate({ target: settings.key, set: { value: key } });
    if (old?.value) await deleteFile(old.value);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Upload failed");
  }
  return ok("Login photo updated");
}
