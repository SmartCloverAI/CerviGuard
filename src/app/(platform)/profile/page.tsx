import { redirect } from "next/navigation";
import { format } from "date-fns";
import { getCurrentAuthenticatedUser } from "@/lib/services/userService";
import ProfileClient from "./profile-client";

export default async function ProfilePage() {
  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">My Profile</h1>
        <p className="mt-2 text-sm text-slate-500">
          View and manage your account settings
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Account Information</h2>
        </div>

        <div className="p-6">
          <div className="flex items-center space-x-6 mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{user.username}</h3>
              <div className="mt-1">
                <span className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-teal-700 ring-1 ring-inset ring-teal-200">
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="flex items-center space-x-2 text-slate-600 mb-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm font-semibold">Username</span>
              </div>
              <p className="text-lg font-medium text-slate-900">{user.username}</p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <div className="flex items-center space-x-2 text-slate-600 mb-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-sm font-semibold">Role</span>
              </div>
              <p className="text-lg font-medium text-slate-900 capitalize">{user.role}</p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <div className="flex items-center space-x-2 text-slate-600 mb-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-semibold">Member Since</span>
              </div>
              <p className="text-lg font-medium text-slate-900">
                {format(new Date(user.createdAt), "MMMM d, yyyy")}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <div className="flex items-center space-x-2 text-slate-600 mb-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-semibold">Last Updated</span>
              </div>
              <p className="text-lg font-medium text-slate-900">
                {format(new Date(user.updatedAt), "MMMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Card - Client Component */}
      <ProfileClient username={user.username} />
    </div>
  );
}
