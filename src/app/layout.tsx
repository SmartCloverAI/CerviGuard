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

const hostId =
  process.env.EE_HOST_ID ??
  process.env.NEXT_PUBLIC_EE_HOST_ID ??
  process.env.RATIO1_HOST_ID ??
  process.env.NEXT_PUBLIC_RATIO1_HOST_ID ??
  "unknown";

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
          <ServedBy hostId={hostId} />
          <VersionFooter />
          <GitHubLink />
        </ToastProvider>
      </body>
    </html>
  );
}
