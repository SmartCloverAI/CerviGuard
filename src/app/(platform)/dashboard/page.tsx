import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { getCurrentAuthenticatedUser } from "@/lib/services/userService";
import { listCasesForUser } from "@/lib/services/caseService";

export default async function DashboardPage() {
  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }
  const cases = await listCasesForUser(user);
  const totalCases = cases.length;
  const completedCases = cases.filter((record) => record.status === "completed").length;
  const inProgressCases = cases.filter((record) => record.status === "processing").length;

  const recentCases = [...cases]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const highRiskCases = cases.filter(
    (record) => record.result?.lesionAssessment === "high" || (record.result?.riskScore ?? 0) >= 70,
  );

  return (
    <div className="space-y-8">
      <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-sm font-medium text-slate-500">Total Cases</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{totalCases}</p>
          <p className="mt-1 text-xs text-slate-500">Historical uploads linked to your account</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-slate-500">Completed Analyses</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-600">{completedCases}</p>
          <p className="mt-1 text-xs text-slate-500">Cases with both TZ & lesion models finished</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-slate-500">Processing</p>
          <p className="mt-2 text-3xl font-semibold text-amber-600">{inProgressCases}</p>
          <p className="mt-1 text-xs text-slate-500">Awaiting inference or storage confirmation</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-slate-500">High-Risk Alerts</p>
          <p className="mt-2 text-3xl font-semibold text-rose-600">{highRiskCases.length}</p>
          <p className="mt-1 text-xs text-slate-500">
            Lesion assessment flagged as high-priority review
          </p>
        </div>
      </section>

      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Recent cases</h2>
            <p className="text-sm text-slate-500">
              Track the most recent uploads and their automated results.
            </p>
          </div>
          <Link href="/cases" className="text-sm font-medium text-teal-700 hover:text-teal-900">
            View all
          </Link>
        </div>
        {recentCases.length === 0 ? (
          <p className="text-sm text-slate-500">
            No cases yet.{" "}
            <Link href="/cases/new" className="text-teal-600 hover:text-teal-800">
              Create your first case.
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 text-sm">
            {recentCases.map((record) => (
              <li key={record.id} className="flex items-center justify-between py-3">
                <div>
                  <Link
                    href={`/cases/${record.id}`}
                    className="font-semibold text-slate-800 hover:text-teal-700"
                  >
                    Case {record.id.slice(-6)}
                  </Link>
                  <p className="text-xs text-slate-500">
                    Uploaded {format(new Date(record.createdAt), "PPpp")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {record.status.toUpperCase()}
                  </p>
                  {record.result && (
                    <p className="text-xs text-slate-500">
                      TZ {record.result.tzType} · Lesion {record.result.lesionAssessment}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
