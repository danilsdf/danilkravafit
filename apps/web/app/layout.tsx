// app/layout.tsx
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script"
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Danil Kravchenko | Athlete & Coder",
  description: "Hybrid athlete & software engineer.",
};

const GA_ID = "G-64H6G758CS";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-black dark:bg-neutral-950 dark:text-white transition-colors">
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
        <SpeedInsights/>
        <Analytics/>
          <div className="min-h-screen bg-white text-black dark:bg-neutral-950 dark:text-white transition-colors">
            <div className="mx-auto flex min-h-screen flex-col pb-16">
              {children}
            </div>
          </div>
      </body>
    </html>
  );
}
