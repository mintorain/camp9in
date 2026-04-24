import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import PageTracker from "@/components/PageTracker";
import AutoRefresh from "@/components/AutoRefresh";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "두온교육 강사지원 관리시스템",
  description:
    "두온교육 강사지원 관리시스템 - AI캠프 강사 모집 및 지원 현황을 관리합니다.",
  metadataBase: new URL("https://camp9in.duonedu.net"),
  openGraph: {
    title: "두온교육 강사지원 관리시스템",
    description: "두온교육 강사지원 관리시스템 - AI캠프 강사 모집 및 지원 현황",
    siteName: "두온교육 강사지원 관리시스템",
    locale: "ko_KR",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full antialiased`}>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      </head>
      <body className="min-h-full flex flex-col">
        <PageTracker />
        <AutoRefresh />
        {children}
      </body>
    </html>
  );
}
