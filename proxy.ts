import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";

export const config = {
  matcher: [
    // Match everything except next internals, manifest, icons, sw, and /unlock
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|sw.js|unlock|healthz).*)",
  ],
};

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const ok = await verifyToken(token);
  if (ok) return NextResponse.next();

  // Return a tiny 401 with a hint to use /unlock?key=...
  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><title>Locked</title>
<style>body{font-family:system-ui;background:#09090b;color:#fafafa;display:grid;place-items:center;min-height:100vh;margin:0}main{text-align:center;padding:2rem}code{background:#27272a;padding:.25rem .5rem;border-radius:.375rem}</style>
<main><h1>Locked</h1><p>Append <code>/unlock?key=YOUR_SECRET</code> to the URL.</p></main>`,
    {
      status: 401,
      headers: { "content-type": "text/html; charset=utf-8" },
    }
  );
}
