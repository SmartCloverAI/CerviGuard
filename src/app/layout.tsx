import type { Metadata } from "next";
import "./globals.css";
import GitHubLink from "@/components/github-link";

export const metadata: Metadata = {
  title: "SmartClover CerviGuard Pilot",
  description:
    "Secure pilot console for SmartClover's cervical screening workflow, powered by decentralized, secure and privacy-oriented technology.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <GitHubLink />
      </body>
    </html>
  );
}
