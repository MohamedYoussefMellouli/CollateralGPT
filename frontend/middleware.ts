import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Check token in cookies (set at login) or skip if not present (client-side check handles it)
  const token = request.cookies.get("cgpt_token")?.value;

  // We rely on client-side redirect for localStorage-based auth
  // Middleware only handles cookie-based token if present
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.png|api).*)"],
};
