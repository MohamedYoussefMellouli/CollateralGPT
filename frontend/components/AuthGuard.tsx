"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const PUBLIC_ROUTES = ["/login", "/register"];

interface AuthGuardProps {
  children: React.ReactNode;
  shell: React.ReactNode;  // sidebar + header wrapper
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  useEffect(() => {
    if (isPublic) { setReady(true); return; }
    const token = localStorage.getItem("cgpt_token");
    if (!token) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [pathname]);

  if (!ready && !isPublic) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
