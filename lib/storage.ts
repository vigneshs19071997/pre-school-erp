import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let client: S3Client | null = null;
function r2() {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
      },
    });
  }
  return client;
}
const bucket = () => process.env.R2_BUCKET ?? "";

const MAX = 8 * 1024 * 1024;

/** Upload a File from a form to Cloudflare R2. Returns the object key, or null if no file was chosen. */
export async function uploadFile(file: FormDataEntryValue | null, folder: string) {
  if (!file || typeof file === "string" || file.size === 0) return null;
  if (file.size > MAX) throw new Error("File is larger than 8 MB");
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
  await r2().send(new PutObjectCommand({
    Bucket: bucket(), Key: key, Body: Buffer.from(await file.arrayBuffer()),
    ContentType: file.type || "application/octet-stream",
  }));
  return key;
}

export async function signedUrl(key: string) {
  return getSignedUrl(r2(), new GetObjectCommand({ Bucket: bucket(), Key: key }), { expiresIn: 600 });
}

export async function deleteFile(key?: string | null) {
  if (!key) return;
  try { await r2().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key })); } catch { /* ignore */ }
}

/** Files are private: served through /api/files which checks the login, then redirects to a short-lived R2 link. */
export const fileUrl = (key?: string | null) => (key ? `/api/files/${key}` : null);
