import type { Metadata } from "next";
import "./globals.css";
import GitHubLink from "@/components/github-link";
import HuggingFaceLink from "@/components/huggingface-link";
import ModelPublicationNote from "@/components/model-publication-note";
import ServedBy from "@/components/served-by";
import VersionFooter from "@/components/version-footer";
import { ToastProvider } from "@/contexts/toast-context";
import { ToastContainer } from "@/components/toast";

export const metadata: Metadata = {
  title: "SmartClover CerviGuard",
  description:
    "CerviGuard workspace for structured cervical-screening intake, AI-assisted model review, and case history.",
};

const parseChainstorePeers = (value?: string) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const hostId =
  process.env.EE_HOST_ID ??
  process.env.NEXT_PUBLIC_EE_HOST_ID ??
  process.env.RATIO1_HOST_ID ??
  process.env.NEXT_PUBLIC_RATIO1_HOST_ID ??
  "unknown";

const chainstorePeersRaw =
  process.env.R1EN_CHAINSTORE_PEERS ??
  process.env.NEXT_PUBLIC_R1EN_CHAINSTORE_PEERS ??
  process.env.EE_CHAINSTORE_PEERS ??
  process.env.NEXT_PUBLIC_EE_CHAINSTORE_PEERS ??
  process.env.CHAINSTORE_PEERS ??
  process.env.NEXT_PUBLIC_CHAINSTORE_PEERS;

const edgeNodeCount = parseChainstorePeers(chainstorePeersRaw).length || 1;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isEvidenceDemo = process.env.NEXT_PUBLIC_EVIDENCE_DEMO_MODE === "true";

  return (
    <html lang="en">
      <body>
        <ToastProvider>
          {children}
          <ToastContainer />
          <div className="runtime-dock">
            <ServedBy hostId={hostId} edgeNodeCount={edgeNodeCount} />
            <VersionFooter />
          </div>
          {!isEvidenceDemo && (
            <div className="publication-dock">
              <ModelPublicationNote />
              <div className="publication-dock__links">
                <HuggingFaceLink />
                <GitHubLink />
              </div>
            </div>
          )}
        </ToastProvider>
      </body>
    </html>
  );
}
