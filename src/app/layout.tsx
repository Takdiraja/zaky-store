import { Hanken_Grotesk } from "next/font/google";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/shared/providers";
import ThemeScript from "@/themes/ThemeScript";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  display: "swap",
});

const APP_NAME = "ZAKY STORE";
const APP_DEFAULT_TITLE = "ZAKY STORE";
const APP_DESCRIPTION = "Aplikasi kasir dan pembukuan sederhana untuk warung kecil.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: "%s - ZAKY STORE",
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: "%s - ZAKY STORE",
    },
    description: APP_DESCRIPTION,
    images: "/icons/logo_zaky_store.png",
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: "%s - ZAKY STORE",
    },
    description: APP_DESCRIPTION,
    images: "/icons/logo_zaky_store.png",
  },
  icons: {
    icon: [
      { url: "/icons/favicon_io/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon_io/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon_io/favicon.ico", sizes: "48x48" },
    ],
    apple: [
      { url: "/icons/favicon_io/apple-touch-icon.png", sizes: "180x180" },
    ],
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
    <html lang="id" className={`h-full antialiased ${hanken.className}`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col bg-surface text-on-surface">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
