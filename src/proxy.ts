import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getMiddlewareSession } from "./lib/auth";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve the session from the cookie via jose verify
  const session = await getMiddlewareSession(request);

  // Define route protection rules
  const isProtectedPath = 
    pathname.startsWith("/admin") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/parent");

  // If it's a private dashboard and the user is not authenticated
  if (isProtectedPath && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If authenticated, check role access
  if (session) {
    const role = session.role;

    // Prevent cross-dashboard access
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    if (pathname.startsWith("/teacher") && role !== "TEACHER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    if (pathname.startsWith("/student") && role !== "STUDENT" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    if (pathname.startsWith("/parent") && role !== "PARENT" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    // If authenticated user tries to access /login, redirect to their dashboard
    if (pathname === "/login") {
      const dashboardPath = `/${role.toLowerCase()}`;
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/parent/:path*",
    "/login",
  ],
};
