import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, authToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const submitted = String(form.get("password") ?? "");
  const rawNext = String(form.get("next") ?? "/");
  const redirectTo = rawNext.startsWith("/") ? rawNext : "/";

  const expectedPassword = process.env.READER_PASSWORD;

  if (!expectedPassword || submitted !== expectedPassword) {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "1");
    url.searchParams.set("next", redirectTo);
    return NextResponse.redirect(url, { status: 303 });
  }

  const response = NextResponse.redirect(new URL(redirectTo, request.url), {
    status: 303,
  });
  response.cookies.set(AUTH_COOKIE_NAME, await authToken(expectedPassword), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
