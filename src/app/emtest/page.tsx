import { SiteBadge } from "@/shared/components/SiteBadge";

export default function EmtestHome() {
  return (
    <section className="space-y-3">
      <SiteBadge siteKey="emtest" />
      <h2 className="text-2xl font-bold">인강 모바일 메인</h2>
      <p className="text-sm text-slate-600">emtest.hackers.com 으로 접속한 사용자에게 노출되는 화면입니다.</p>
    </section>
  );
}
