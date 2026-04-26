"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "대시보드",
    match: (p: string) => p === "/admin",
  },
  {
    href: "/admin/students",
    label: "학생 관리",
    match: (p: string) => p.startsWith("/admin/students"),
  },
];

export default function AdminNav({
  academyName,
  userLabel,
  userRole,
}: {
  academyName: string | null;
  userLabel: string;
  userRole: "admin" | "master" | "student";
}) {
  const pathname = usePathname();
  const roleLabel = userRole === "master" ? "마스터" : "원장·강사";

  return (
    <>
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:flex md:w-56 md:flex-col md:border-r md:border-gray-200 md:bg-white">
        <div className="border-b border-gray-200 px-5 py-5">
          <div className="text-sm font-bold text-blue-600">pluepe admin</div>
          <div
            className="mt-1 truncate text-xs text-gray-500"
            title={academyName ?? "학원 미지정"}
          >
            {academyName ?? "학원 미지정"}
          </div>
        </div>
        <nav aria-label="관리자 네비게이션" className="flex-1 p-3">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = item.match(pathname);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-gray-200 p-4">
          <div className="text-[11px] font-medium text-gray-500">
            {roleLabel}
          </div>
          <div
            className="mt-0.5 truncate text-xs font-semibold text-gray-900"
            title={userLabel}
          >
            {userLabel}
          </div>
          <Link
            href="/my"
            className="mt-3 inline-block text-[11px] font-medium text-gray-500 hover:text-gray-700"
          >
            학습자 화면으로
          </Link>
        </div>
      </aside>

      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-blue-600">pluepe admin</div>
            <div
              className="truncate text-sm font-semibold text-gray-900"
              title={academyName ?? "학원 미지정"}
            >
              {academyName ?? "학원 미지정"}
            </div>
          </div>
          <Link
            href="/my"
            className="shrink-0 text-[11px] font-medium text-gray-500"
          >
            학습자 화면
          </Link>
        </div>
        <nav
          aria-label="관리자 네비게이션"
          className="flex gap-1 overflow-x-auto px-2 pb-2"
        >
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                  active
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
