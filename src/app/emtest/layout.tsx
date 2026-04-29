import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "해커스 인강 모바일",
  description: "해커스 인강 모바일 사이트",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function EmtestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3">
        <h1 className="text-base font-semibold">해커스 인강 (MO)</h1>
      </header>
      <main className="px-4 py-4">{children}</main>
    </div>
  );
}
