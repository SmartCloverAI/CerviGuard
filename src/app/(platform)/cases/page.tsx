import Link from "next/link";
import { format } from "date-fns";
import { redirect } from "next/navigation";
import { getCurrentAuthenticatedUser } from "@/lib/services/userService";
import { listCasesForUser, listCasesWithUsers } from "@/lib/services/caseService";
import type { CaseRecord, CaseWithUser } from "@/lib/types";

function isCaseWithUser(record: CaseRecord | CaseWithUser): record is CaseWithUser {
  return "user" in record;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;

interface PageProps {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}

export default async function CasesPage({ searchParams }: PageProps) {
  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const pageSize = PAGE_SIZE_OPTIONS.includes(parseInt(params.pageSize || "", 10))
    ? parseInt(params.pageSize!, 10)
    : DEFAULT_PAGE_SIZE;

  let allCases: (CaseRecord | CaseWithUser)[] = [];
  let serviceError = false;

  try {
    allCases = user.role === "admin" ? await listCasesWithUsers() : await listCasesForUser(user);
  } catch (error) {
    console.error("[CasesPage] Failed to fetch cases:", error instanceof Error ? error.message : error);
    serviceError = true;
  }

  // Sort by date (newest first)
  const sortedCases = [...allCases].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Pagination calculations
  const totalCases = sortedCases.length;
  const totalPages = Math.ceil(totalCases / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const cases = sortedCases.slice(startIndex, endIndex);

  // Ensure current page is valid
  const validPage = Math.min(currentPage, Math.max(1, totalPages));

  function buildUrl(page: number, size: number) {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", page.toString());
    if (size !== DEFAULT_PAGE_SIZE) params.set("pageSize", size.toString());
    const query = params.toString();
    return query ? `/cases?${query}` : "/cases";
  }

  return (
    <div className="space-y-6 pb-16">
      {serviceError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
          <h3 className="text-sm font-semibold text-rose-800">Services Unavailable</h3>
          <p className="mt-1 text-sm text-rose-700">
            Unable to connect to backend services. Cases cannot be loaded at this time.
          </p>
        </div>
      )}

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
                        : record.username}
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
                          : "bg-rose-50 text-rose-700 ring-rose-200"
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {record.result?.transformationZone?.topLabel ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {record.result?.lesion?.topLabel ?? "—"}
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

        {/* Pagination */}
        {totalCases > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Show</span>
              <div className="flex gap-1">
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <Link
                    key={size}
                    href={buildUrl(1, size)}
                    className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                      size === pageSize
                        ? "bg-teal-600 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {size}
                  </Link>
                ))}
              </div>
              <span>per page</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>
                Showing {startIndex + 1}–{Math.min(endIndex, totalCases)} of {totalCases}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Link
                href={buildUrl(1, pageSize)}
                className={`rounded px-2 py-1 text-xs font-medium ${
                  validPage === 1
                    ? "pointer-events-none text-slate-300"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
                aria-disabled={validPage === 1}
              >
                First
              </Link>
              <Link
                href={buildUrl(validPage - 1, pageSize)}
                className={`rounded px-2 py-1 text-xs font-medium ${
                  validPage === 1
                    ? "pointer-events-none text-slate-300"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
                aria-disabled={validPage === 1}
              >
                Prev
              </Link>
              <span className="px-2 py-1 text-xs text-slate-500">
                Page {validPage} of {totalPages || 1}
              </span>
              <Link
                href={buildUrl(validPage + 1, pageSize)}
                className={`rounded px-2 py-1 text-xs font-medium ${
                  validPage >= totalPages
                    ? "pointer-events-none text-slate-300"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
                aria-disabled={validPage >= totalPages}
              >
                Next
              </Link>
              <Link
                href={buildUrl(totalPages, pageSize)}
                className={`rounded px-2 py-1 text-xs font-medium ${
                  validPage >= totalPages
                    ? "pointer-events-none text-slate-300"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
                aria-disabled={validPage >= totalPages}
              >
                Last
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
