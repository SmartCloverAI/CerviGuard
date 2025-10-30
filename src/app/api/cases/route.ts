import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAuthenticatedUser, getUserById } from "@/lib/services/userService";
import { createCase, listCasesForUser, listCasesWithUsers } from "@/lib/services/caseService";

const CreateCaseSchema = z.object({
  notes: z.string().max(500).optional(),
});

export async function GET() {
  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role === "admin") {
    const cases = await listCasesWithUsers();
    return NextResponse.json({ cases });
  }

  const cases = await listCasesForUser(user);
  return NextResponse.json({ cases });
}

export async function POST(request: Request) {
  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("image");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Image file is required" }, { status: 400 });
  }

  const notes = formData.get("notes");
  const parsed = CreateCaseSchema.parse({ notes: notes?.toString() });

  const buffer = Buffer.from(await file.arrayBuffer());
  const created = await createCase({
    user,
    buffer,
    filename: file.name || "case-image",
    mimeType: file.type || "application/octet-stream",
    notes: parsed.notes,
  });

  const owner = await getUserById(created.userId);
  const responsePayload = {
    case: {
      ...created,
      user: owner ? { id: owner.id, username: owner.username, role: owner.role } : undefined,
    },
  };

  return NextResponse.json(responsePayload, { status: 201 });
}
