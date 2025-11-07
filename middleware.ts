import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/constants";
import { DEMO_SESSION_SECRET, readSessionSecretFromEnv } from "@/lib/constants/session";

const PUBLIC_PATHS = ["/login"];

const envSecret = readSessionSecretFromEnv(process.env as Record<string, string | undefined>);
const secret = envSecret ?? DEMO_SESSION_SECRET;

if (!envSecret) {
  console.warn(
    "[middleware] SESSION_SECRET* env vars are missing; using demo fallback. TODO: replace with a secure secret before deploying.",
  );
}

const secretKey = new TextEncoder().encode(secret);

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify<{ role?: string }>(token, secretKey, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (token) {
      const session = await verifyToken(token);
      if (session) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const session = await verifyToken(token);
  if (!session) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  if (pathname.startsWith("/admin") && session.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/cases/:path*", "/admin/:path*", "/login"],
};
