import { NextResponse, NextRequest } from "next/server";
import { getCurrentAuthenticatedUser, getUserByUsername } from "@/lib/services/userService";
import { getCaseById, deleteCase } from "@/lib/services/caseService";

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

  if (user.role !== "admin" && record.username !== user.username) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const owner = await getUserByUsername(record.username);
  return NextResponse.json({
    case: {
      ...record,
      user: owner
        ? {
            username: owner.username,
            role: owner.role,
          }
        : undefined,
    },
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await context.params;
  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const record = await getCaseById(caseId);
  if (!record) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  // Allow admins or case owner to delete
  if (user.role !== "admin" && record.username !== user.username) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteCase(caseId);

  return NextResponse.json({ success: true });
}
