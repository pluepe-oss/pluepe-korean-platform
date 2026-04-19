"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/learn",
    label: "강의",
    match: (p: string) =>
      p === "/learn" ||
      p.startsWith("/learn/topik") ||
      p.startsWith("/learn/eps-topik"),
  },
  { href: "/learn/exam",  label: "시험보기",   match: (p: string) => p.startsWith("/learn/exam") },
  { href: "/learn/vocab", label: "단어외우기", match: (p: string) => p.startsWith("/learn/vocab") },
  { href: "/learn/me",    label: "마이페이지", match: (p: string) => p.startsWith("/learn/me") },
];

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-gray-50 pb-20">
      {children}
      <nav
        className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-10"
        aria-label="학습 내비게이션"
      >
        <ul className="mx-auto flex max-w-xl">
          {TABS.map((tab) => {
            const active = tab.match(pathname);
            return (
              <li key={tab.href} className="flex-1">
                <Link
                  href={tab.href}
                  className={`flex flex-col items-center py-2.5 text-xs ${
                    active ? "text-blue-600 font-semibold" : "text-gray-500"
                  }`}
                >
                  <span
                    className={`h-1 w-6 rounded-full mb-1 ${
                      active ? "bg-blue-600" : "bg-transparent"
                    }`}
                    aria-hidden="true"
                  />
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
