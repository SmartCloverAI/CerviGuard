import { redirect } from "next/navigation";
import { format } from "date-fns";
import { getCurrentAuthenticatedUser, listUsers } from "@/lib/services/userService";
import CreateUserForm from "./user-create-form";

export default async function AdminUsersPage() {
  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  const users = await listUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">User management</h1>
        <p className="mt-2 text-sm text-slate-500">
          Provision and monitor pilot accounts synchronized through decentralized, secure and privacy-oriented technology.
        </p>
      </div>
      <CreateUserForm />
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{u.username}</td>
                <td className="px-4 py-3 uppercase tracking-wide text-slate-500">{u.role}</td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {format(new Date(u.createdAt), "PPp")}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`badge ${
                      u.isActive
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : "bg-slate-200 text-slate-500 ring-slate-300"
                    }`}
                  >
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
