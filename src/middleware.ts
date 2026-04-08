import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/events/create", "/organized-events", "/certificates", "/admin", "/profile", "/notifications", "/check-in", "/my-registrations", "/announcements"];
const authRoutes = ["/login", "/register"];
// Routes that require a verified organizer (or admin)
const organizerRoutes = ["/events/create", "/organized-events", "/check-in", "/admin"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Allow access to verification-pending page
  if (pathname === "/verification-pending") {
    return NextResponse.next();
  }

  // Redirect logged-in users away from auth pages
  if (authRoutes.some((route) => pathname.startsWith(route)) && isLoggedIn) {
    // Unverified organizers should go to pending page, not dashboard
    const user = req.auth?.user as any;
    if (user?.role === "ORGANIZER" && !user?.isVerified) {
      return NextResponse.redirect(new URL("/verification-pending", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Redirect unauthenticated users to login
  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Block unverified organizers from organizer-only routes
  if (isLoggedIn) {
    const user = req.auth?.user as any;
    if (user?.role === "ORGANIZER" && !user?.isVerified) {
      if (organizerRoutes.some((route) => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL("/verification-pending", req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logo.svg).*)"],
};
