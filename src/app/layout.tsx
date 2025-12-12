import type { Metadata } from "next";
import "./globals.css";
import GitHubLink from "@/components/github-link";
import ServedBy from "@/components/served-by";
import VersionFooter from "@/components/version-footer";
import { ToastProvider } from "@/contexts/toast-context";
import { ToastContainer } from "@/components/toast";

export const metadata: Metadata = {
  title: "SmartClover CerviGuard Pilot",
  description:
    "Secure pilot console for SmartClover's cervical screening workflow, powered by decentralized, secure and privacy-oriented technology.",
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

const edgeNodeCount = parseChainstorePeers(chainstorePeersRaw).length + 1;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          {children}
          <ToastContainer />
          <ServedBy hostId={hostId} edgeNodeCount={edgeNodeCount} />
          <VersionFooter />
          <GitHubLink />
        </ToastProvider>
      </body>
    </html>
  );
}
