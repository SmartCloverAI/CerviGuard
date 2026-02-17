import Link from "next/link";

const huggingFaceOrgUrl = "https://huggingface.co/smartclover";

export default function ModelPublicationNote() {
  return (
    <aside className="fixed bottom-28 right-4 z-40 max-w-[18rem] rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-[11px] leading-tight text-slate-700 shadow-lg shadow-slate-900/10 backdrop-blur sm:max-w-xs sm:text-xs">
      Most CerviGuard models are already published on{" "}
      <Link href={huggingFaceOrgUrl} target="_blank" rel="noopener noreferrer" aria-label="Open SmartClover Hugging Face organization">
        Hugging Face
      </Link>{" "}
      under SmartClover organization repositories.
    </aside>
  );
}
