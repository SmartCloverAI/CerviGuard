import Link from "next/link";
import { format } from "date-fns";
import { redirect } from "next/navigation";
import { getCurrentAuthenticatedUser } from "@/lib/services/userService";
import { listCasesForUser, listCasesWithUsers } from "@/lib/services/caseService";
import type { CaseRecord, CaseWithUser } from "@/lib/types";

function isCaseWithUser(record: CaseRecord | CaseWithUser): record is CaseWithUser {
  return "user" in record;
}

export default async function CasesPage() {
  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  const cases: (CaseRecord | CaseWithUser)[] =
    user.role === "admin" ? await listCasesWithUsers() : await listCasesForUser(user);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Case history</h1>
          <p className="text-sm text-slate-500">
            {user.role === "admin"
              ? "Full ledger of analyses across all pilot clinicians."
              : "View every cervical screening case you have submitted."}
          </p>
        </div>
        <Link href="/cases/new" className="inline-flex items-center gap-2 text-sm font-semibold">
          <span className="rounded-full bg-teal-600 px-3 py-1 text-white">+ New case</span>
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Case ID</th>
              {user.role === "admin" && <th className="px-4 py-3">Clinician</th>}
              <th className="px-4 py-3">Uploaded</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">TZ</th>
              <th className="px-4 py-3">Lesion</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {cases.length === 0 ? (
              <tr>
                <td colSpan={user.role === "admin" ? 7 : 6} className="px-4 py-6 text-center text-sm">
                  No cases yet.{" "}
                  <Link href="/cases/new" className="text-teal-600 hover:text-teal-800">
                    Upload an image to get started.
                  </Link>
                </td>
              </tr>
            ) : (
              cases.map((record) => (
                <tr key={record.id} className="hover:bg-teal-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {record.id.slice(-12)}
                  </td>
                  {user.role === "admin" && (
                    <td className="px-4 py-3 text-xs">
                      {isCaseWithUser(record) && record.user
                        ? record.user.username
                        : record.userId}
                    </td>
                  )}
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {format(new Date(record.createdAt), "PPp")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${
                        record.status === "completed"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : record.status === "processing"
                            ? "bg-amber-50 text-amber-700 ring-amber-200"
                            : "bg-rose-50 text-rose-700 ring-rose-200"
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {record.result?.tzType ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {record.result?.lesionAssessment ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/cases/${record.id}`}
                      className="text-xs font-medium text-teal-600 hover:text-teal-800"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
