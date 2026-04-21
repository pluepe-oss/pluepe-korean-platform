import { notFound } from "next/navigation";
import type { UnitData } from "./types";
import UnitClient from "./UnitClient";

async function loadUnit(unitId: string): Promise<UnitData | null> {
  // JSON import 결과의 mini_test 리터럴 타입을 좁힐 수 없어 unknown 경유로 캐스팅
  const map: Record<string, () => Promise<{ default: unknown }>> = {
    "1": () => import("@/data/topik1/u01_convenience.json"),
  };
  const loader = map[unitId];
  if (!loader) return null;
  const mod = await loader();
  const unit = mod.default as UnitData;
  // Bunny Library ID는 server 전용 env에서 런타임 주입 (JSON/빌드 출력물 literal 제거)
  return {
    ...unit,
    bunny_library_id: process.env.BUNNY_LIBRARY_ID ?? "",
  };
}

export default async function UnitPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;
  const unit = await loadUnit(unitId);
  if (!unit) notFound();
  return <UnitClient unit={unit} />;
}
