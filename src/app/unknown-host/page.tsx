import { headers } from "next/headers";
import { SITES } from "@/lib/sites";

export default async function UnknownHostPage() {
  const headerList = await headers();
  const host = headerList.get("host") ?? "(unknown)";
  return (
    <div className="mx-auto max-w-3xl px-8 py-16">
      <h1 className="text-2xl font-bold text-rose-700">알 수 없는 호스트</h1>
      <p className="mt-2 text-slate-700">
        현재 접속한 host(<code className="rounded bg-slate-100 px-1.5 py-0.5">{host}</code>)는 등록된 사이트 목록에 없습니다.
      </p>
      <p className="mt-2 text-sm text-slate-500">등록된 호스트 목록:</p>
      <ul className="mt-3 space-y-2 text-sm text-slate-700">
        {Object.values(SITES).map((s) => (
          <li key={s.key} className="rounded border border-slate-200 p-3">
            <strong className="block text-slate-900">{s.label}</strong>
            <span className="block text-xs text-slate-500">prod: {s.prodHost}</span>
            <span className="block text-xs text-slate-500">vercel: {s.vercelHost}</span>
            <span className="block text-xs text-slate-500">local: {s.localHost}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
