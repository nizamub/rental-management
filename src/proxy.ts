import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config"; // or "@/lib/auth.config" depending on your path setup
import { NextResponse } from "next/server";

// Initialize NextAuth with the Edge-safe config
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  // @ts-ignore - Ignore TS warning if you haven't globally extended the User type yet
  const role = req.auth?.user?.role;

  // Public routes
  if (pathname === "/login" || pathname.startsWith("/api/auth")) {
    if (isLoggedIn && pathname === "/login") {
      if (role === "OWNER") {
        return NextResponse.redirect(new URL("/owner/dashboard", req.url));
      }
      return NextResponse.redirect(new URL("/renter/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Redirect root to login or dashboard
  if (pathname === "/") {
    if (isLoggedIn) {
      if (role === "OWNER") {
        return NextResponse.redirect(new URL("/owner/dashboard", req.url));
      }
      return NextResponse.redirect(new URL("/renter/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Protect all routes
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Owner routes
  if (pathname.startsWith("/owner") && role !== "OWNER") {
    return NextResponse.redirect(new URL("/renter/dashboard", req.url));
  }

  // Renter routes
  if (pathname.startsWith("/renter") && role !== "RENTER") {
    return NextResponse.redirect(new URL("/owner/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};