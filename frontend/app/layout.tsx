import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { AppShell } from "@/components/AppShell";

// ─── Fonts loaded via next/font (no @import url() needed in CSS) ─────────────
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

// ─── SEO Metadata ─────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "CollateralGPT — Dispute Analysis Engine",
  description:
    "AI-powered financial dispute analysis and resolution recommendation dashboard for collateral management professionals.",
  keywords: [
    "dispute analysis",
    "financial AI",
    "collateral management",
    "ISDA",
    "CSA",
    "dispute resolution",
  ],
  openGraph: {
    title: "CollateralGPT — Dispute Analysis Engine",
    description: "AI-powered financial dispute analysis platform",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body
        className="bg-slate-950 text-slate-200 antialiased"
        style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
      >
        <Providers>
          <AppShell>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
