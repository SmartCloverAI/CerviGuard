import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { resetUserPassword } from "@/lib/services/userService";

const ResetPasswordSchema = z.object({
  username: z.string().min(3),
  newPassword: z.string().min(8),
});

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const payload = await request.json();
    const parsed = ResetPasswordSchema.parse(payload);

    await resetUserPassword(parsed.username, parsed.newPassword);
    return NextResponse.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.flatten() }, { status: 400 });
    }
    console.error("[POST /api/users/reset-password] Error resetting password:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reset password" },
      { status: 400 },
    );
  }
}
