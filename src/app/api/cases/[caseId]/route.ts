import { NextResponse, NextRequest } from "next/server";
import { getCurrentAuthenticatedUser, getUserByUsername } from "@/lib/services/userService";
import {
  CaseDeletionUnavailableError,
  deleteCaseForUser,
  getCaseForUser,
} from "@/lib/services/caseService";

export async function GET(request: NextRequest, context: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await context.params;
  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const record = await getCaseForUser(caseId, user);
  if (!record) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
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

  try {
    const deleted = await deleteCaseForUser(caseId, user);
    if (!deleted) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof CaseDeletionUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 501 });
    }
    throw error;
  }
}
