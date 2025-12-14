import { redirect } from "next/navigation";
import { getCurrentAuthenticatedUser, listUsers } from "@/lib/services/userService";
import CreateUserForm from "./user-create-form";
import UsersTable from "./users-table";

export default async function AdminUsersPage() {
  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  let users: Awaited<ReturnType<typeof listUsers>> = [];
  let serviceError = false;

  try {
    users = await listUsers();
  } catch (error) {
    console.error("[AdminUsersPage] Failed to fetch users:", error instanceof Error ? error.message : error);
    serviceError = true;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">User management</h1>
        <p className="mt-2 text-sm text-slate-500">
          Provision and monitor pilot accounts synchronized through decentralized, secure and privacy-oriented technology.
        </p>
      </div>

      {serviceError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
          <h3 className="text-sm font-semibold text-rose-800">Services Unavailable</h3>
          <p className="mt-1 text-sm text-rose-700">
            Unable to connect to authentication services. User management is temporarily unavailable.
          </p>
        </div>
      )}

      <CreateUserForm />
      <UsersTable initialUsers={users} />
    </div>
  );
}
