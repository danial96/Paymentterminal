import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const isLoginPage = pathname === "/login";
  const isPublicInvoice = pathname.startsWith("/invoice/");
  const isPublicApi = pathname.match(/^\/api\/invoices\/\d+\/checkout$/) || pathname.startsWith("/api/admin/");
  const isPublicJoin = pathname.startsWith("/join/");
  const isPortalLogin = pathname === "/portal/login";

  if (!isLoggedIn && !isLoginPage && !isPublicInvoice && !isPublicApi && !isPublicJoin && !isPortalLogin) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  // Pass pathname to server components via header
  const res = NextResponse.next();
  res.headers.set("x-pathname", pathname);
  return res;
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.webp|.*\\.ico|.*\\.gif).*)"],
};
