import { NextResponse, NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";

/**
 * Admin password reset endpoint
 *
 * NOTE: The @ratio1/cstore-auth-ts library does not support admin-initiated
 * password resets without the current password. Users must change their own
 * passwords using the changePassword method which requires the current password.
 *
 * This endpoint returns a 501 Not Implemented status to indicate that
 * admin password resets are not available when using the auth library.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(
    {
      error: "Admin password reset is not supported",
      message: "Users must change their own passwords. The auth library requires the current password for security."
    },
    { status: 501 }
  );
}
