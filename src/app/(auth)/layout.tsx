import type { ReactNode } from "react";
import Image from "next/image";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-teal-50 via-white to-teal-100">
      <div className="pointer-events-none absolute -left-16 top-8 h-56 w-56 rounded-full bg-teal-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-cyan-200/40 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10">
        <div className="grid w-full gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-2xl border border-teal-100 bg-white/85 p-7 shadow-sm backdrop-blur sm:p-8">
            <div className="flex items-center gap-3">
              <Image
                src="/branding/smartclover-logo.jpg"
                alt="SmartClover logo"
                width={44}
                height={44}
                className="rounded-xl border border-slate-200 bg-white object-cover shadow-sm"
                priority
              />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Powered by</p>
                <p className="text-base font-semibold text-slate-900">SmartClover</p>
              </div>
            </div>
            <p className="badge mt-4 normal-case">CerviGuard — Live MVP / Private Beta</p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              Structured cervical-screening workflows, from intake to clinician review.
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-slate-600 sm:text-base">
              CerviGuard brings de-identified image intake, AI-assisted model outputs, and case history into one
              authenticated workspace.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Intake</p>
                <p className="mt-1.5 text-sm font-medium text-slate-800">Structure case submissions</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Review</p>
                <p className="mt-1.5 text-sm font-medium text-slate-800">Inspect model-generated outputs</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Control</p>
                <p className="mt-1.5 text-sm font-medium text-slate-800">Keep decisions with qualified professionals</p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600">
              Designed for authorized clinicians and administrators, with owner-scoped case access and explicit
              professional review boundaries.
            </div>
          </section>

          <div className="card h-fit">
            <div className="mb-6">
              <p className="badge">Secure Access</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">
                Sign In to CerviGuard
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Access the workspace to manage cases, model outputs, and review history.
              </p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
