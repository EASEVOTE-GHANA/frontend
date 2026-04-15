import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // --- Dashboard routes (unified) ---
    if (pathname.startsWith("/dashboard")) {
      if (!token?.role) {
        return NextResponse.redirect(new URL("/sign-in", req.url));
      }

      // Check if the backend JWT (accessToken) is expired
      if (token.accessToken && typeof token.accessToken === "string") {
        try {
          const payload = JSON.parse(
            Buffer.from((token.accessToken as string).split(".")[1], "base64").toString()
          );
          const now = Math.floor(Date.now() / 1000);

          if (payload.exp && payload.exp < now) {
            // Token expired → clear session and redirect straight to sign-in
            const signInUrl = new URL("/sign-in", req.url);
            signInUrl.searchParams.set("callbackUrl", pathname);
            const response = NextResponse.redirect(signInUrl);
            // Delete all possible NextAuth session cookies
            response.cookies.delete("next-auth.session-token");
            response.cookies.delete("next-auth.callback-url");
            response.cookies.delete("next-auth.csrf-token");
            response.cookies.delete("__Secure-next-auth.session-token");
            response.cookies.delete("__Secure-next-auth.callback-url");
            response.cookies.delete("__Secure-next-auth.csrf-token");
            return response;
          }
        } catch {
          // If token can't be decoded, let the page handle it
        }
      }
    }

    // --- Legacy routes (redirect to unified dashboard) ---
    if (pathname.startsWith("/super-admin")) {
      if (token?.role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (pathname.startsWith("/admin")) {
      if (token?.role !== "SUPER_ADMIN" && token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (pathname.startsWith("/organizer")) {
      if (!token?.role) {
        return NextResponse.redirect(new URL("/sign-in", req.url));
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        if (
          pathname.startsWith("/dashboard") ||
          pathname.startsWith("/super-admin") ||
          pathname.startsWith("/admin") ||
          pathname.startsWith("/organizer")
        ) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/super-admin/:path*",
    "/admin/:path*",
    "/organizer/:path*",
  ],
};
