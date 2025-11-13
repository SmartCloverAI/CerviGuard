import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { notFound, redirect } from "next/navigation";
import { getCurrentAuthenticatedUser, getUserByUsername } from "@/lib/services/userService";
import { getCaseById } from "@/lib/services/caseService";

export default async function CaseDetailPage({ params }: { params: Promise<{ caseId: string }> }) {
  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  const { caseId } = await params;
  const record = await getCaseById(caseId);
  if (!record) {
    notFound();
  }

  if (user.role !== "admin" && record.username !== user.username) {
    redirect("/cases");
  }

  const owner = await getUserByUsername(record.username);

  return (
    <div className="space-y-6">
      <Link href="/cases" className="text-sm text-teal-600 hover:text-teal-800">
        ← Back to cases
      </Link>

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
          <p className="mt-3 text-xs text-slate-500">
            CID: <span className="font-mono text-slate-600">{record.imageCid}</span>
          </p>
        </div>
        <div className="flex-1 space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900">Case metadata</h2>
            <dl className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex justify-between">
                <dt>Status</dt>
                <dd className="badge">
                  {record.status === "completed"
                    ? "Analysis complete"
                    : record.status === "processing"
                      ? "Processing"
                      : "Error"}
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

          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900">AI analysis</h2>
            {record.result ? (
              <div className="mt-4 space-y-4 text-sm text-slate-600">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Transformation Zone
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{record.result.tzType}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Lesion assessment
                  </p>
                  <p className="mt-1 text-base font-semibold capitalize text-rose-600">
                    {record.result.lesionAssessment}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{record.result.lesionSummary}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Risk score
                  </p>
                  <div className="mt-2 h-2 rounded-full bg-slate-200">
                    <div
                      className={`h-2 rounded-full ${
                        record.result.riskScore >= 70
                          ? "bg-rose-500"
                          : record.result.riskScore >= 40
                            ? "bg-amber-400"
                            : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(record.result.riskScore, 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {record.result.riskScore} / 100 risk score derived from combined models.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                This case is still processing. Refresh the page or return in a few minutes.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
