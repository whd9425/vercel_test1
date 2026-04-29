import Link from "next/link";
import { SITES } from "@/lib/sites";

export default function RootHome() {
  return (
    <div className="mx-auto max-w-3xl px-8 py-16">
      <h1 className="text-3xl font-bold">호스트 라우팅 진입점</h1>
      <p className="mt-2 text-slate-600">
        이 화면은 호스트 매칭이 되지 않은 직접 접속에서만 보입니다. 운영 환경에서는 도메인별로 분기됩니다.
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {Object.values(SITES).map((site) => (
          <li key={site.key} className="rounded-lg border border-slate-200 p-4">
            <Link href={`/${site.key}`} className="text-base font-semibold text-blue-600 hover:underline">
              {site.label}
            </Link>
            <p className="mt-1 text-xs text-slate-500">
              prod: {site.prodHost}
              <br />
              local: {site.localHost}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
