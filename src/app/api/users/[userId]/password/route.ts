import { NextResponse } from "next/server";
import { getCurrentAuthenticatedUser } from "@/lib/services/userService";

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
export async function PATCH() {
  const user = await getCurrentAuthenticatedUser();
  if (!user || user.role !== "admin") {
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
