import { NextRequest, NextResponse } from "next/server";
import {
  COOKIE_NAME,
  COOKIE_MAX_AGE_SECONDS,
  getSharedSecret,
  signToken,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key || key !== getSharedSecret()) {
    return new NextResponse("Wrong key", { status: 401 });
  }
  const token = await signToken(`v1:${Date.now()}`);
  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
  return res;
}
