import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

const PUBLIC_PATHS = ["/login", "/register", "/api/auth/login", "/api/auth/register", "/api/auth/logout"];
const PUBLIC_PREFIXES = ["/_next/", "/favicon.ico", "/logo.jpg", "/api/auth/"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    return NextResponse.json(
      { error: "Server misconfigured: JWT_SECRET must contain at least 32 characters" },
      { status: 500 }
    );
  }

  const token = request.cookies.get("email-token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.jpg|.*\\.png$|.*\\.svg$).*)"],
};
