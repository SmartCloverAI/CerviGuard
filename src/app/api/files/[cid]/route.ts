import { NextResponse, NextRequest } from "next/server";
import { getCurrentAuthenticatedUser } from "@/lib/services/userService";
import { getCaseById } from "@/lib/services/caseService";
import { getR1FSClient } from "@/lib/ratio1/r1fs";

export async function GET(request: NextRequest, context: { params: Promise<{ cid: string }> }) {
  const { cid } = await context.params;
  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const caseId = url.searchParams.get("caseId");
  if (!caseId) {
    return NextResponse.json({ error: "caseId is required" }, { status: 400 });
  }

  const record = await getCaseById(caseId);
  if (!record) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  if (record.imageCid !== cid) {
    return NextResponse.json({ error: "Case does not own this CID" }, { status: 400 });
  }

  if (user.role !== "admin" && record.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const r1fs = await getR1FSClient();
  const { buffer, mimeType } = await r1fs.fetch(cid);
  const body = new Uint8Array(buffer);
  return new Response(body, {
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "private, max-age=60",
    },
  });
}
