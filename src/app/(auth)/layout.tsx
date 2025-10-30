import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-fuchsia-100 p-6">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="mb-6">
            <p className="badge">SmartClover Cervical Screening Pilot</p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-900">
              Secure Access Portal
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Authorized clinicians and admins can sign in to manage cervical screening cases.
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
