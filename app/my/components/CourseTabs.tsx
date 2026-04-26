"use client";

import { useRouter } from "next/navigation";
import type { AccountKind } from "@/lib/account-kind";

// 사용 예시:
//   <CourseTabs accountKind={ctx.kind} planType={ctx.planType} />
//   민트 탭 클릭 시 id="course-topik1" / "course-topik2" / "course-eps" 영역으로 스크롤,
//   오렌지 탭 클릭 시 /pricing 으로 이동.

type PlanCode = "topik1" | "topik2" | "eps";

interface CourseTabsProps {
  accountKind: AccountKind;
  planType: PlanCode | null;
}

const COURSES: PlanCode[] = ["topik1", "topik2", "eps"];

const COURSE_META: Record<PlanCode, { label: string; sub: string }> = {
  topik1: { label: "TOPIK 1", sub: "한국어 기초 과정" },
  topik2: { label: "TOPIK 2", sub: "한국어 중급 과정" },
  eps: { label: "EPS-TOPIK", sub: "고용허가제 과정" },
};

function getTabState(
  accountKind: AccountKind,
  planType: PlanCode | null,
  course: PlanCode,
): "mint" | "orange" {
  if (accountKind === "trialing") return "mint";
  if (accountKind === "expired" || accountKind === "none") return "orange";
  // b2c_active / b2b → 본인 planType 만 민트, 나머지는 잠금
  return planType === course ? "mint" : "orange";
}

export default function CourseTabs({ accountKind, planType }: CourseTabsProps) {
  const router = useRouter();

  function handleClick(course: PlanCode, state: "mint" | "orange") {
    if (state === "orange") {
      router.push("/pricing");
      return;
    }
    const target = document.getElementById(`course-${course}`);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {COURSES.map((course) => {
        const state = getTabState(accountKind, planType, course);
        const meta = COURSE_META[course];
        const isMint = state === "mint";

        return (
          <button
            key={course}
            type="button"
            onClick={() => handleClick(course, state)}
            aria-label={`${meta.label} ${isMint ? "학습 가능" : "잠금"} 탭`}
            className={`rounded-[22px] p-6 text-left shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isMint
                ? "bg-[#27d3c3] text-white focus:ring-[#27d3c3]"
                : "bg-[#ff7d5a] text-white focus:ring-[#ff7d5a]"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-white/80">{meta.sub}</p>
                <h3 className="mt-1 text-2xl font-bold">{meta.label}</h3>
              </div>
              {!isMint && (
                <span className="text-lg" aria-hidden>
                  🔒
                </span>
              )}
            </div>

            <div className="mt-6">
              {isMint ? (
                <span className="inline-flex items-center rounded-[8px] bg-white/25 px-3 py-1 text-sm font-semibold">
                  학습 가능
                </span>
              ) : (
                <span className="inline-flex items-center rounded-[8px] bg-white px-3 py-1 text-sm font-bold text-[#ff7d5a]">
                  구독하고 시작하기 →
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
