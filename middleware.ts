import { type NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

const protectedRoutes = ["/dashboard", "/history", "/favorites", "/settings"];
const authRoutes = ["/login", "/register"];

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  const hasAuthToken =
    request.cookies.has("sb-access-token") ||
    request.cookies.has("sb-refresh-token") ||
    request.cookies.getAll().some((cookie) => cookie.name.includes("sb-"));

  const { pathname } = request.nextUrl;

  if (matchesRoute(pathname, protectedRoutes) && !hasAuthToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (matchesRoute(pathname, authRoutes) && hasAuthToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
