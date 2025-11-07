const APP_VERSION = "CerviGuard v0.3.1";

export default function VersionFooter() {
  return (
    <div className="fixed bottom-4 left-1/2 z-40 inline-flex -translate-x-1/2 items-center rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs font-medium text-slate-700 shadow-lg shadow-slate-900/10 backdrop-blur">
      <span>Version</span>
      <span className="ml-1 font-semibold text-slate-900">{APP_VERSION}</span>
    </div>
  );
}
