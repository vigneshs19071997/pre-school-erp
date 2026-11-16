import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import { signedUrl } from "@/lib/storage";

export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const session = await readSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const { key } = await params;
  const objectKey = key.map(decodeURIComponent).join("/");
  // Parents may only open learning files (homework, daily photos) and their child's own photo folder.
  if (session.kind === "parent" && !/^(homework|daily|students\/photos)\//.test(objectKey)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  return NextResponse.redirect(await signedUrl(objectKey));
}
