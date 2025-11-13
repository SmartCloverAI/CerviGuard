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
      <UsersTable initialUsers={users} />
    </div>
  );
}
