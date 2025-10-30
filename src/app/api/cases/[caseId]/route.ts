import { NextResponse, NextRequest } from "next/server";
import { getCurrentAuthenticatedUser, getUserById } from "@/lib/services/userService";
import { getCaseById } from "@/lib/services/caseService";

export async function GET(request: NextRequest, context: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await context.params;
  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const record = await getCaseById(caseId);
  if (!record) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  if (user.role !== "admin" && record.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const owner = await getUserById(record.userId);
  return NextResponse.json({
    case: {
      ...record,
      user: owner
        ? {
            id: owner.id,
            username: owner.username,
            role: owner.role,
          }
        : undefined,
    },
  });
}
