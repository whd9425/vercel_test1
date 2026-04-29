import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "해커스 학원 모바일",
  description: "해커스 학원 모바일 사이트",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function MtestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-amber-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-amber-200 bg-white px-4 py-3">
        <h1 className="text-base font-semibold text-amber-900">해커스 학원 (MO)</h1>
      </header>
      <main className="px-4 py-4">{children}</main>
    </div>
  );
}
