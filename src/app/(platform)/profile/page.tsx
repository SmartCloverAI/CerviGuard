"use client";

import { useState } from "react";
import { redirect } from "next/navigation";
import ChangePasswordModal from "@/components/change-password-modal";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch current user info from session
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUsername(data.user.username);
          setRole(data.user.role);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-teal-500 border-t-transparent mx-auto"></div>
          <p className="text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!username) {
    router.push("/login");
    return null;
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
              <h3 className="text-2xl font-bold text-slate-900">{username}</h3>
              <div className="mt-1">
                <span className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-teal-700 ring-1 ring-inset ring-teal-200">
                  {role}
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
              <p className="text-lg font-medium text-slate-900">{username}</p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <div className="flex items-center space-x-2 text-slate-600 mb-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-sm font-semibold">Role</span>
              </div>
              <p className="text-lg font-medium text-slate-900 capitalize">{role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Security Settings</h2>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Password</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Change your password to keep your account secure
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsChangePasswordOpen(true)}
              className="inline-flex items-center space-x-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span>Change Password</span>
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        username={username}
      />
    </div>
  );
}
