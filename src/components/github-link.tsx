import Link from "next/link";
import type { ComponentProps } from "react";

const githubRepoUrl = "https://github.com/SmartCloverAI/CerviGuard";

function GitHubIcon(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M8 0a8 8 0 0 0-2.53 15.6c.4.07.55-.17.55-.38 0-.19 0-.69-.01-1.35-2 .37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52 0-.53.63 0 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.11 0 0 .67-.21 2.2.82a7.53 7.53 0 0 1 4.01 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.91.08 2.11.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8 8 0 0 0 8 0Z"
      />
    </svg>
  );
}

export default function GitHubLink() {
  return (
    <Link
      href={githubRepoUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="View the CerviGuard repository on GitHub"
      className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 sm:text-sm"
    >
      <GitHubIcon className="h-4 w-4" />
      <span className="hidden sm:inline">View on GitHub</span>
    </Link>
  );
}
