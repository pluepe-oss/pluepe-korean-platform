export type SectionKey = "session" | "words" | "patterns" | "test" | "ai";

export interface UnitData {
  unit_id: string;
  unit_number: number;
  exam_type: string;
  topic: string;
  topic_vi: string;
  level: number;
  duration_min: number;
  bunny_library_id: string;
  bunny_video_id: string;
  is_free: boolean;
  key_expressions: { ko: string; vi: string }[];
  session: {
    step_videos?: Record<string, string>;
    step1_quiz: {
      question: string;
      hint_vi: string;
      options: string[];
      answer: number;
    };
    step2_blanks: {
      sentence: string;
      hint_vi: string;
      options: string[];
      answer: number;
    }[];
    step3_sentences: { ko: string; vi: string }[];
    step4_words: { korean: string; vietnamese: string; example: string }[];
    step5_review: {
      situation: string;
      options: string[];
      answer: number;
    }[];
  };
  words: {
    korean: string;
    vietnamese: string;
    example_ko: string;
    example_vi: string;
  }[];
  words_quiz: {
    word: string;
    question: string;
    options: string[];
    answer: number;
  }[];
  patterns: {
    pattern: string;
    meaning_vi: string;
    situation: string;
    examples: string[];
    blank_quiz: {
      sentence: string;
      answer: number;
      options: string[];
    };
  }[];
  mini_test: (
    | {
        type: "listening";
        script: string;
        question: string;
        options: string[];
        answer: number;
        explanation: string;
      }
    | {
        type: "reading";
        text: string;
        question: string;
        options: string[];
        answer: number;
        explanation: string;
      }
    | {
        type: "situation";
        sentence: string;
        question: string;
        options: string[];
        answer: number;
        explanation: string;
      }
  )[];
  ai_extension: string[];
}

export const SECTION_ORDER: SectionKey[] = [
  "session",
  "words",
  "patterns",
  "test",
  "ai",
];

export const SECTION_LABEL: Record<SectionKey, { ko: string; kicker: string }> =
  {
    session: { ko: "세션", kicker: "SESSION" },
    words: { ko: "단어", kicker: "WORDS" },
    patterns: { ko: "표현", kicker: "EXPRESSIONS" },
    test: { ko: "테스트", kicker: "TEST" },
    ai: { ko: "AI 확장", kicker: "AI" },
  };

export type StepKey = 1 | 2 | 3 | 4 | 5;
export type SessionStepsDone = Record<StepKey, boolean>;
