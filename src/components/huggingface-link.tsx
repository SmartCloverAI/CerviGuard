import Image from "next/image";
import Link from "next/link";

const huggingFaceOrgUrl = "https://huggingface.co/smartclover";
const huggingFaceLogoSrc = "/branding/huggingface-logo-noborder.svg";

export default function HuggingFaceLink() {
  return (
    <Link
      href={huggingFaceOrgUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="View SmartClover models on Hugging Face"
      className="fixed bottom-16 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 sm:text-sm"
    >
      <Image src={huggingFaceLogoSrc} alt="" aria-hidden width={17} height={16} className="h-4 w-[17px]" />
      <span className="hidden sm:inline">View on Hugging Face</span>
    </Link>
  );
}
