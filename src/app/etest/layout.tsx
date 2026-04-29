import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "해커스 인강",
  description: "해커스 인강 PC 사이트",
};

export default function EtestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-white text-slate-900">
      <header className="border-b border-slate-200 px-8 py-4">
        <h1 className="text-xl font-semibold">해커스 인강 (PC)</h1>
      </header>
      <main className="mx-auto max-w-6xl px-8 py-8">{children}</main>
    </div>
  );
}
