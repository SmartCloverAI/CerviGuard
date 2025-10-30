import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { SESSION_SECRET, TOKEN_TTL_SECONDS } from "../config";
import { SESSION_COOKIE } from "../constants";
import type { PublicUser, UserRecord } from "../types";

export interface SessionPayload {
  sub: string;
  username: string;
  role: "admin" | "user";
  exp: number;
  iat: number;
}

function getSecretKey() {
  return new TextEncoder().encode(SESSION_SECRET);
}

export async function createSessionToken(user: UserRecord | PublicUser) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + TOKEN_TTL_SECONDS;

  return new SignJWT({
    username: user.username,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}

export async function requireSessionUser() {
  const session = await getSessionUser();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
