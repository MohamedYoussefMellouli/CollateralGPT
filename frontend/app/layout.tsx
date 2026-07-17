import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Chatbot } from "@/components/chat/Chatbot";

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
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex flex-col flex-1 lg:ml-64 min-w-0">
              <Header />
              <main
                className="flex-1 p-4 sm:p-6 max-w-screen-2xl w-full mx-auto"
                id="main-content"
                aria-label="Main content"
              >
                {children}
              </main>
            </div>
          </div>
          {/* Floating Chatbot Widget */}
          <Chatbot />
        </Providers>
      </body>
    </html>
  );
}
