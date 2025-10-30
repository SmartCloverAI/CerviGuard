import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateUser } from "@/lib/services/userService";
import { setSessionCookie } from "@/lib/auth/session";

const LoginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { username, password } = LoginSchema.parse(payload);

    const authResult = await authenticateUser(username, password);
    if (!authResult) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await setSessionCookie(authResult.sessionToken);

    const publicUser = (({ passwordHash, ...rest }) => {
      void passwordHash;
      return rest;
    })(authResult.user);
    return NextResponse.json({ user: publicUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.flatten() }, { status: 400 });
    }
    console.error("Login error", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
