import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});

export const metadata: Metadata = {
  title: "EduWeb - Hệ thống Quản lý & Luyện thi chất lượng cao",
  description: "Nền tảng quản lý khóa học, giảng dạy và luyện thi trực quan hàng đầu.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/icon.svg"],
    apple: [
      { url: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  },
};

import ToastContainer from "@/components/Toast";
import DisclaimerModal from "@/components/DisclaimerModal";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink font-sans">
        {children}
        <ToastContainer />
        <DisclaimerModal />
      </body>
    </html>
  );
}
