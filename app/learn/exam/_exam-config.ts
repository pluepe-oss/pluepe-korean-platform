export const EXAM_TYPES = ["topik1", "topik2", "eps-topik"] as const;
export type ExamType = (typeof EXAM_TYPES)[number];

export type ExamInfo = {
  type: ExamType;
  title: string;
  description: string;
  difficulty: string;
  timeLimitMinutes: number;
  passingScore: number;
};

export const EXAM_CONFIG: Record<ExamType, ExamInfo> = {
  topik1: {
    type: "topik1",
    title: "TOPIK 1",
    description: "한국어능력시험 초급 (1·2급) 모의고사",
    difficulty: "초급 A1-A2",
    timeLimitMinutes: 40,
    passingScore: 60,
  },
  topik2: {
    type: "topik2",
    title: "TOPIK 2",
    description: "한국어능력시험 중고급 (3~6급) 모의고사",
    difficulty: "중고급 B1-C2",
    timeLimitMinutes: 110,
    passingScore: 60,
  },
  "eps-topik": {
    type: "eps-topik",
    title: "EPS-TOPIK",
    description: "고용허가제 한국어능력시험 근로자용",
    difficulty: "근로자 전용",
    timeLimitMinutes: 50,
    passingScore: 60,
  },
};

export const EXAM_TYPE_LABEL: Record<ExamType, string> = {
  topik1: "TOPIK 1",
  topik2: "TOPIK 2",
  "eps-topik": "EPS-TOPIK",
};

export const SECTION_LABEL: Record<"listening" | "reading", string> = {
  listening: "듣기",
  reading: "읽기",
};

export const CATEGORY_LABEL: Record<string, string> = {
  grammar: "문법",
  vocabulary: "어휘",
  passage_comprehension: "독해",
  conversation: "대화",
  inference: "추론",
  greeting: "인사",
  situation: "상황",
  workplace_safety: "작업 안전",
  sign_comprehension: "표지판",
  workplace_vocabulary: "작업 어휘",
  etc: "기타",
};

export function categoryLabel(key: string | null | undefined): string {
  if (!key) return "기타";
  return CATEGORY_LABEL[key] ?? key;
}
