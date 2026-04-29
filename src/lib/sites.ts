export type SiteKey = "etest" | "emtest" | "test" | "mtest";

export type SiteMeta = {
  key: SiteKey;
  label: string;
  category: "ingang" | "academy";
  device: "pc" | "mo";
  prodHost: string;
  localHost: string;
};

export const SITES: Record<SiteKey, SiteMeta> = {
  etest: {
    key: "etest",
    label: "해커스 인강 (PC)",
    category: "ingang",
    device: "pc",
    prodHost: "etest.hackers.com",
    localHost: "etest.hackers.local",
  },
  emtest: {
    key: "emtest",
    label: "해커스 인강 (모바일)",
    category: "ingang",
    device: "mo",
    prodHost: "emtest.hackers.com",
    localHost: "emtest.hackers.local",
  },
  test: {
    key: "test",
    label: "해커스 학원 (PC)",
    category: "academy",
    device: "pc",
    prodHost: "test.hackers.com",
    localHost: "test.hackers.local",
  },
  mtest: {
    key: "mtest",
    label: "해커스 학원 (모바일)",
    category: "academy",
    device: "mo",
    prodHost: "mtest.hackers.com",
    localHost: "mtest.hackers.local",
  },
};

export const SITE_KEYS = Object.keys(SITES) as SiteKey[];

const HOST_TO_SITE: Record<string, SiteKey> = (() => {
  const map: Record<string, SiteKey> = {};
  for (const site of Object.values(SITES)) {
    map[site.prodHost] = site.key;
    map[site.localHost] = site.key;
  }
  return map;
})();

export function resolveSiteFromHost(rawHost: string | null | undefined): SiteKey | null {
  if (!rawHost) return null;
  const host = rawHost.toLowerCase().split(":")[0];
  if (HOST_TO_SITE[host]) return HOST_TO_SITE[host];

  const dev = process.env.NODE_ENV !== "production";
  if (dev) {
    const fallback = process.env.NEXT_PUBLIC_DEFAULT_SITE as SiteKey | undefined;
    if (fallback && SITES[fallback]) return fallback;
  }
  return null;
}

export function isSiteKey(value: string): value is SiteKey {
  return value in SITES;
}
