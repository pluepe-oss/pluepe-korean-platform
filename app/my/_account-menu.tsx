"use client";

// 계정 설정 메뉴 — "곧 오픈 예정" 알럿을 띄우기 위해 클라이언트 컴포넌트로 분리.
// 메뉴가 실제 기능으로 연결되면 각 메뉴를 별도 라우팅/모달로 교체한다.

const MENUS = ["프로필 수정", "알림 설정"] as const;

export default function AccountMenu() {
  const handleClick = () => {
    // 베타 단계 임시 알럿 — 추후 각 메뉴의 실제 페이지로 교체.
    alert("곧 오픈 예정이에요 😊");
  };

  return (
    <>
      {MENUS.map((menu) => (
        <button
          key={menu}
          type="button"
          onClick={handleClick}
          className="flex w-full items-center justify-between rounded-lg border-b border-gray-50 px-2 py-3 text-left hover:bg-gray-50"
        >
          <span className="text-base font-semibold text-[#122c4f]">
            {menu}
          </span>
          <span className="text-[#64748b]">→</span>
        </button>
      ))}
    </>
  );
}
