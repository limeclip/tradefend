
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeColorSync } from "@/components/ThemeColorSync";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next"


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://www.tradefend.xyz'),
  title: "Tradefend - Pre-Trade Risk Checker",
  description: "Fast and minimal pre-trade risk checks for crypto assets.",
  manifest: "/manifest.json",
  icons: {
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Tradefend",
  },
  openGraph: {
    title: "Tradefend - AI Crypto Risk Management",
    description: "Protect your capital with real-time risk analysis, watchlist alerts, and AI position builder.",
    url: "https://tradefend.xyz",
    siteName: "Tradefend",
    images: [
      {
        url: "https://tradefend.xyz/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tradefend - AI Crypto Risk Management",
    description: "Protect your capital with real-time risk analysis, watchlist alerts, and AI position builder.",
    images: ["https://tradefend.xyz/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* PWA: replace icons in public/icons/ — see docs/pwa-icons.md */}
        <meta name="theme-color" content="#000000" />
        <meta name="google-site-verification" content="kwYLCxhrCccVMGUQ5jDNwRSznGDvqb6yC8Orl62e4No" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
         {/* Google Analytics */}
         <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-KS4L0T0P13"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-KS4L0T0P13');
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col font-sans ">
        <TooltipProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ThemeColorSync />
            {children}
          </ThemeProvider>
        </TooltipProvider>
        <Toaster />
        <Analytics/>
      </body>
    </html>
  );
}
