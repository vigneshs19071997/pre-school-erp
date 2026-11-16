import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("ps_session")?.value;
  let kind: string | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret());
      kind = (payload as { kind?: string }).kind ?? null;
    } catch { /* invalid */ }
  }
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin") && kind !== "staff") {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (pathname.startsWith("/parent") && kind !== "parent") {
    return NextResponse.redirect(new URL("/login?tab=parent", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/parent/:path*"] };
