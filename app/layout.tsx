import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk, Source_Serif_4 } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "Adamiani.ai — Healthcare coordination, organized and clear",
  description: "Adamiani.ai helps patients structure their medical case, explore treatment options, and keep their records in one private Health Passport. AI organizes — doctors decide.",
};
export const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${space.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
