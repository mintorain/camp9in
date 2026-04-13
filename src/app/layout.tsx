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
  title: "AI캠프 강사 모집 | 두온교육",
  description:
    "초등학교 AI로 만나는 미래 교육 체험 캠프 강사를 모집합니다. 바이브코딩, AI동화, 로봇, AI이미지 등 8개 분야",
  metadataBase: new URL("https://camp9in.duonedu.net"),
  openGraph: {
    title: "AI캠프 강사 모집 | 두온교육",
    description: "초등학교 AI 미래 교육 체험 캠프 강사를 모집합니다. 미금초·정림초·청원초 3개교, 8개 체험 분야",
    siteName: "두온교육 AI캠프",
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
