import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to login page
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // Check for better-auth session cookie
  // Better-auth can use different cookie names, check for common ones
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("session_token") ||
    request.cookies.get("better_auth.session_token") ||
    request.cookies.get("auth_session");

  // If no session cookie, redirect to login with callback URL
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    // Store the original URL they were trying to access
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Configure which routes to protect
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
