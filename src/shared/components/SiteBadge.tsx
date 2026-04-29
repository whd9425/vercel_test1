import { SITES, type SiteKey } from "@/lib/sites";

export function SiteBadge({ siteKey }: { siteKey: SiteKey }) {
  const site = SITES[siteKey];
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700">
      <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white">
        {site.device}
      </span>
      {site.label}
    </div>
  );
}
