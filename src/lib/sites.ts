export type SiteKey = "etest" | "emtest" | "test" | "mtest";

export type SiteMeta = {
  key: SiteKey;
  label: string;
  category: "ingang" | "academy";
  device: "pc" | "mo";
  prodHost: string;
  localHost: string;
  vercelHost: string;
};

export const SITES: Record<SiteKey, SiteMeta> = {
  etest: {
    key: "etest",
    label: "해커스 인강 (PC)",
    category: "ingang",
    device: "pc",
    prodHost: "etest.hackers.com",
    localHost: "etest.hackers.local",
    vercelHost: "etest-vercel-test1.vercel.app",
  },
  emtest: {
    key: "emtest",
    label: "해커스 인강 (모바일)",
    category: "ingang",
    device: "mo",
    prodHost: "emtest.hackers.com",
    localHost: "emtest.hackers.local",
    vercelHost: "emtest-vercel-test1.vercel.app",
  },
  test: {
    key: "test",
    label: "해커스 학원 (PC)",
    category: "academy",
    device: "pc",
    prodHost: "test.hackers.com",
    localHost: "test.hackers.local",
    vercelHost: "test-vercel-test1.vercel.app",
  },
  mtest: {
    key: "mtest",
    label: "해커스 학원 (모바일)",
    category: "academy",
    device: "mo",
    prodHost: "mtest.hackers.com",
    localHost: "mtest.hackers.local",
    vercelHost: "mtest-vercel-test1.vercel.app",
  },
};

export const SITE_KEYS = Object.keys(SITES) as SiteKey[];

const HOST_TO_SITE: Record<string, SiteKey> = (() => {
  const map: Record<string, SiteKey> = {};
  for (const site of Object.values(SITES)) {
    map[site.prodHost] = site.key;
    map[site.localHost] = site.key;
    map[site.vercelHost] = site.key;
  }
  return map;
})();

export function resolveSiteFromHost(rawHost: string | null | undefined): SiteKey | null {
  const forced = process.env.NEXT_PUBLIC_FORCE_SITE as SiteKey | undefined;
  if (forced && SITES[forced]) return forced;

  if (!rawHost) {
    const fallback = process.env.NEXT_PUBLIC_DEFAULT_SITE as SiteKey | undefined;
    return fallback && SITES[fallback] ? fallback : null;
  }
  const host = rawHost.toLowerCase().split(":")[0];
  if (HOST_TO_SITE[host]) return HOST_TO_SITE[host];

  const fallback = process.env.NEXT_PUBLIC_DEFAULT_SITE as SiteKey | undefined;
  if (fallback && SITES[fallback]) return fallback;
  return null;
}

export function isSiteKey(value: string): value is SiteKey {
  return value in SITES;
}
