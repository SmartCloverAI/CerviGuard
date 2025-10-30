import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { createUserAccount, listUsers } from "@/lib/services/userService";

const CreateUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
  role: z.enum(["admin", "user"]).default("user"),
});

async function ensureAdmin() {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await ensureAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await listUsers();
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const session = await ensureAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const payload = await request.json();
    const parsed = CreateUserSchema.parse(payload);
    const newUser = await createUserAccount(parsed);
    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create user" },
      { status: 400 },
    );
  }
}
