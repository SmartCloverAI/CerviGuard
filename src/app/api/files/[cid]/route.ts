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

  if (user.role !== "admin" && record.username !== user.username) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const r1fs = getR1FSClient();
  const result = await r1fs.getFile({ cid });

  // Handle Response format (streaming)
  if (result instanceof Response) {
    const mimeType = result.headers.get("content-type") ?? "application/octet-stream";
    const arrayBuffer = await result.arrayBuffer();
    return new Response(arrayBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, max-age=60",
      },
    });
  }

  // Handle base64 format
  if (result?.file_base64_str) {
    const buffer = Buffer.from(result.file_base64_str, "base64");
    const mimeType =
      result.meta?.filename && result.meta.filename.endsWith(".png")
        ? "image/png"
        : result.meta?.filename && (result.meta.filename.endsWith(".jpg") || result.meta.filename.endsWith(".jpeg"))
          ? "image/jpeg"
          : result.meta?.filename && result.meta.filename.endsWith(".webp")
            ? "image/webp"
            : "application/octet-stream";

    return new Response(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, max-age=60",
      },
    });
  }

  return NextResponse.json({ error: "Unexpected R1FS response format" }, { status: 500 });
}
