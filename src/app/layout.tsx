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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <PageTracker />
        <AutoRefresh />
        {children}
      </body>
    </html>
  );
}
