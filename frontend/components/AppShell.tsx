"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Chatbot } from "@/components/chat/Chatbot";
import { AuthGuard } from "@/components/AuthGuard";

const PUBLIC_ROUTES = ["/login", "/register"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  // Auth pages: no sidebar, no header, no chatbot
  if (isPublic) {
    return <AuthGuard>{children}</AuthGuard>;
  }

  // App pages: full layout
  return (
    <AuthGuard>
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
      <Chatbot />
    </AuthGuard>
  );
}
