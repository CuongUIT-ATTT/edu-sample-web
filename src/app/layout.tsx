import type { Metadata } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";

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
      className="h-full antialiased"
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
