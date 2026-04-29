import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "해커스 학원",
  description: "해커스 학원 PC 사이트",
};

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-white text-slate-900">
      <header className="border-b border-amber-200 bg-amber-50 px-8 py-4">
        <h1 className="text-xl font-semibold text-amber-900">해커스 학원 (PC)</h1>
      </header>
      <main className="mx-auto max-w-6xl px-8 py-8">{children}</main>
    </div>
  );
}
