import { NextResponse } from "next/server";
import { getCurrentAuthenticatedUser } from "@/lib/services/userService";

export async function GET() {
  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}
