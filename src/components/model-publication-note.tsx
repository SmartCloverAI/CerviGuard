import Link from "next/link";

const huggingFaceOrgUrl = "https://huggingface.co/smartclover";

export default function ModelPublicationNote() {
  return (
    <aside className="publication-dock__note max-w-[18rem] rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-[11px] leading-tight text-slate-700 shadow-lg shadow-slate-900/10 backdrop-blur sm:max-w-xs sm:text-xs">
      Public CerviGuard model artifacts are available in SmartClover&apos;s{" "}
      <Link href={huggingFaceOrgUrl} target="_blank" rel="noopener noreferrer" aria-label="Open SmartClover Hugging Face organization">
        Hugging Face repositories
      </Link>
      .
    </aside>
  );
}
