import { type NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  // Protect dashboard and API routes that require authentication
  if (
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/api/events") ||
    request.nextUrl.pathname.startsWith("/api/registrations")
  ) {
    const token = request.cookies.get("token")?.value || request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }

    try {
      // Try to decode the JWT token to get user ID
      const payload = JSON.parse(atob(token.split(".")[1]))
      const userId = payload.userId

      if (!userId) {
        if (request.nextUrl.pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Invalid token" }, { status: 401 })
        }
        return NextResponse.redirect(new URL("/auth/login", request.url))
      }

      // Set user ID header for API routes
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set("x-user-id", userId)

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } catch (error) {
      // If token decoding fails, redirect to login
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/events/:path*", "/api/registrations/:path*"],
}
