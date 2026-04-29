import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SITE_KEYS, resolveSiteFromHost } from "@/lib/sites";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (
    pathname === "/unknown-host" ||
    SITE_KEYS.some((key) => pathname === `/${key}` || pathname.startsWith(`/${key}/`))
  ) {
    return NextResponse.next();
  }

  const host = request.headers.get("host");
  const site = resolveSiteFromHost(host);

  if (!site) {
    const url = request.nextUrl.clone();
    url.pathname = "/unknown-host";
    url.search = "";
    return NextResponse.rewrite(url);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${site}${pathname === "/" ? "" : pathname}`;
  url.search = search;

  const response = NextResponse.rewrite(url);
  response.headers.set("x-site", site);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
