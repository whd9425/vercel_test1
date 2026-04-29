import { SiteBadge } from "@/shared/components/SiteBadge";

export default function EtestHome() {
  return (
    <section className="space-y-4">
      <SiteBadge siteKey="etest" />
      <h2 className="text-3xl font-bold">인강 PC 메인</h2>
      <p className="text-slate-600">etest.hackers.com 으로 접속한 사용자에게 노출되는 화면입니다.</p>
    </section>
  );
}
