import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Apotek Ulebi | Sistem Kasir Modern",
  description: "Sistem Manajemen Apotek & POS Offline-Ready Premium",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Apotek Ulebi",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" href="/next.svg" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 selection:bg-blue-100 selection:text-blue-900">
        {children}
        <Toaster position="top-center" expand={true} richColors />
      </body>
    </html>
  );
}
