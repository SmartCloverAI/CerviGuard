import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { notFound, redirect } from "next/navigation";
import { getCurrentAuthenticatedUser, getUserByUsername } from "@/lib/services/userService";
import { getCaseById } from "@/lib/services/caseService";
import { DeleteCaseButton } from "./DeleteCaseButton";

export default async function CaseDetailPage({ params }: { params: Promise<{ caseId: string }> }) {
  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  const { caseId } = await params;

  let record;
  let owner;
  let serviceError = false;

  try {
    record = await getCaseById(caseId);
    if (!record) {
      notFound();
    }

    if (user.role !== "admin" && record.username !== user.username) {
      redirect("/cases");
    }

    owner = await getUserByUsername(record.username);
  } catch (error) {
    console.error("[CaseDetailPage] Failed to fetch case:", error instanceof Error ? error.message : error);
    serviceError = true;
  }

  if (serviceError || !record) {
    return (
      <div className="space-y-6">
        <Link href="/cases" className="text-sm text-teal-600 hover:text-teal-800">
          ← Back to cases
        </Link>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-6">
          <h2 className="text-lg font-semibold text-rose-800">Unable to Load Case</h2>
          <p className="mt-2 text-sm text-rose-700">
            The case details could not be retrieved. This may be because backend services are unavailable.
            Please try again later or contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/cases" className="text-sm text-teal-600 hover:text-teal-800">
          ← Back to cases
        </Link>
        {(user.role === "admin" || record.username === user.username) && (
          <DeleteCaseButton caseId={record.id} />
        )}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="card lg:w-2/3">
          <p className="badge mb-3">Case imagery</p>
          <div className="relative h-[420px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <Image
              src={`/api/files/${record.imageCid}?caseId=${record.id}`}
              alt="Cervical screening case"
              fill
              sizes="(max-width: 768px) 100vw, 640px"
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900">Case metadata</h2>
            <dl className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex justify-between">
                <dt>Status</dt>
                <dd className={`badge ${record.status === "error" ? "bg-rose-100 text-rose-700" : ""}`}>
                  {record.status === "completed" ? "Analysis complete" : "Error"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Uploaded</dt>
                <dd>{format(new Date(record.createdAt), "PPpp")}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Clinician</dt>
                <dd>{owner ? owner.username : record.username}</dd>
              </div>
              {record.notes && (
                <div>
                  <dt className="font-medium text-slate-700">Notes</dt>
                  <dd className="mt-1 whitespace-pre-line text-slate-600">{record.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          {record.result?.imageInfo && (
            <div className="card">
              <h2 className="text-lg font-semibold text-slate-900">Image file metadata</h2>
              <dl className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex justify-between">
                  <dt>Dimensions</dt>
                  <dd className="font-mono">{record.result.imageInfo.width} × {record.result.imageInfo.height} px</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Color channels</dt>
                  <dd>{record.result.imageInfo.channels === 3 ? "RGB" : record.result.imageInfo.channels === 1 ? "Grayscale" : record.result.imageInfo.channels}</dd>
                </div>
              </dl>
            </div>
          )}

          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900">AI analysis</h2>
            {record.result?.status === "error" ? (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4">
                <p className="font-medium text-rose-800">Image Validation Failed</p>
                <p className="mt-2 text-sm text-rose-700">
                  {record.result.errorMessage || record.result.error || "The uploaded image could not be analyzed."}
                </p>
                {record.result.processedAt && (
                  <p className="mt-3 text-xs text-rose-500">
                    Processed at {new Date(record.result.processedAt * 1000).toLocaleString()}
                  </p>
                )}
              </div>
            ) : record.result?.transformationZone && record.result?.lesion ? (
              <div className="mt-4 space-y-6 text-sm text-slate-600">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Transformation Zone
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {record.result.transformationZone.topLabel}
                  </p>
                  <p className="text-xs text-slate-500">
                    Confidence: {(record.result.transformationZone.topConfidence * 100).toFixed(1)}%
                  </p>
                  <div className="mt-2 space-y-1">
                    {record.result.transformationZone.predictions.map((pred) => (
                      <div key={pred.classId} className="flex items-center gap-2">
                        <span className="w-16 text-xs text-slate-500">{pred.label}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-slate-200">
                          <div
                            className="h-1.5 rounded-full bg-teal-500"
                            style={{ width: `${pred.confidence * 100}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-xs text-slate-500">
                          {(pred.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Lesion Classification
                  </p>
                  <p className={`mt-1 text-lg font-semibold ${
                    record.result.lesion.topLabel === "Cancer"
                      ? "text-rose-600"
                      : record.result.lesion.topLabel === "HSIL"
                        ? "text-orange-600"
                        : record.result.lesion.topLabel === "LSIL"
                          ? "text-amber-600"
                          : "text-emerald-600"
                  }`}>
                    {record.result.lesion.topLabel}
                  </p>
                  <p className="text-xs text-slate-500">
                    Confidence: {(record.result.lesion.topConfidence * 100).toFixed(1)}%
                  </p>
                  <div className="mt-2 space-y-1">
                    {record.result.lesion.predictions.map((pred) => (
                      <div key={pred.classId} className="flex items-center gap-2">
                        <span className="w-16 text-xs text-slate-500">{pred.label}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-slate-200">
                          <div
                            className={`h-1.5 rounded-full ${
                              pred.label === "Cancer"
                                ? "bg-rose-500"
                                : pred.label === "HSIL"
                                  ? "bg-orange-500"
                                  : pred.label === "LSIL"
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                            }`}
                            style={{ width: `${pred.confidence * 100}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-xs text-slate-500">
                          {(pred.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {record.result.processedAt && (
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-xs text-slate-400">
                      Processed at {new Date(record.result.processedAt * 1000).toLocaleString()}
                      {record.result.processorVersion && ` · v${record.result.processorVersion}`}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                No analysis data available. The case may have been analyzed with an older version.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
