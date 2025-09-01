import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/api/events") ||
    request.nextUrl.pathname.startsWith("/api/registrations")
  ) {
    const token =
      request.cookies.get("token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return handleUnauthorized(request)
    }

    try {
      const { payload } = await jwtVerify(token, secret)
      const userId = payload.userId as string

      if (!userId) {
        return handleUnauthorized(request)
      }

      const requestHeaders = new Headers(request.headers)
      requestHeaders.set("x-user-id", userId)

      return NextResponse.next({
        request: { headers: requestHeaders },
      })
    } catch (err) {
      console.error("JWT verify failed:", err)
      return handleUnauthorized(request)
    }
  }

  return NextResponse.next()
}

function handleUnauthorized(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return NextResponse.redirect(new URL("/auth/login", request.url))
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/events/:path*", "/api/registrations/:path*"],
}
