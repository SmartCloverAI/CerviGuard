import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { resetUserPassword } from "@/lib/services/userService";

const ResetPasswordSchema = z.object({
  newPassword: z.string().min(8),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const { userId } = await context.params;
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const payload = await request.json();
    const { newPassword } = ResetPasswordSchema.parse(payload);
    const user = await resetUserPassword(userId, newPassword);
    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reset password" },
      { status: 400 },
    );
  }
}
