import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";
import { QueryProvider } from "@/components/providers/QueryProvider";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Sentinel | University Access Control",
  description: "High-security access control system for university campuses",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sentinel",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FFFFFF",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} light`}
      suppressHydrationWarning
    >
      <body
        className={`${figtree.variable} font-sans antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <NextTopLoader
          color="#4f39f6"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #4f39f6,0 0 5px #4f39f6"
        />
        <QueryProvider>{children}</QueryProvider>
        <Toaster position="top-right" theme="light" richColors closeButton />
      </body>
    </html>
  );
}
