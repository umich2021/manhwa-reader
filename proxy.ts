import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, authToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const password = process.env.READER_PASSWORD;

  // No password configured (e.g. local dev without env set) -> don't lock
  // anyone out.
  if (!password) {
    return NextResponse.next();
  }

  const cookieValue = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const expected = await authToken(password);

  if (cookieValue === expected) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!login|api/login|_next/static|_next/image|favicon.ico).*)"],
};
