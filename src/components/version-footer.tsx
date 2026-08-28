const APP_VERSION = `CerviGuard v${process.env.NEXT_PUBLIC_APP_VERSION || "0.1.1"}`;

export default function VersionFooter() {
  return (
    <div className="runtime-dock__version inline-flex items-center rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs font-medium text-slate-700 shadow-lg shadow-slate-900/10 backdrop-blur">
      <span>Version</span>
      <span className="ml-1 font-semibold text-slate-900">{APP_VERSION}</span>
    </div>
  );
}
