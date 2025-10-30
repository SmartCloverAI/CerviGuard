import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartClover CerviGuard Pilot",
  description:
    "Secure pilot console for SmartClover's cervical screening workflow powered by Ratio1.ai.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
