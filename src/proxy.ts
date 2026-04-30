import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SITE_KEYS, isSiteKey, resolveSiteFromHost, type SiteKey } from "@/lib/sites";

const SITE_OVERRIDE_COOKIE = "site_override";

export function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;

  if (
    pathname === "/unknown-host" ||
    SITE_KEYS.some((key) => pathname === `/${key}` || pathname.startsWith(`/${key}/`))
  ) {
    return NextResponse.next();
  }

  const queryOverride = searchParams.get("site");
  const cookieOverride = request.cookies.get(SITE_OVERRIDE_COOKIE)?.value;
  const overrideSite: SiteKey | null =
    queryOverride && isSiteKey(queryOverride)
      ? queryOverride
      : cookieOverride && isSiteKey(cookieOverride)
        ? cookieOverride
        : null;

  const host = request.headers.get("host");
  const site = overrideSite ?? resolveSiteFromHost(host);

  if (!site) {
    const url = request.nextUrl.clone();
    url.pathname = "/unknown-host";
    url.search = "";
    return NextResponse.rewrite(url);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${site}${pathname === "/" ? "" : pathname}`;
  if (queryOverride) {
    searchParams.delete("site");
    url.search = searchParams.toString() ? `?${searchParams.toString()}` : "";
  } else {
    url.search = search;
  }

  const response = NextResponse.rewrite(url);
  response.headers.set("x-site", site);
  if (queryOverride && isSiteKey(queryOverride)) {
    response.cookies.set(SITE_OVERRIDE_COOKIE, queryOverride, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
