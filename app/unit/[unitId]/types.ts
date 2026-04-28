export type SectionKey = "session" | "words" | "patterns" | "test" | "ai";

export type UnitLanguage = "vi" | "en" | "zh" | "id" | "th";

export interface UnitData {
  unit_id: string;
  unit_number: number;
  language: UnitLanguage;
  exam_type: string;
  topic: string;
  topic_translation: string;
  level: number;
  duration_min: number;
  bunny_library_id: string;
  bunny_video_id: string;
  // u02 처럼 STEP 별로 서로 다른 영상을 최상위에서 제공하는 포맷 대응
  bunny_video_ids?: {
    step1?: string;
    step2?: string;
    step3?: string;
  };
  is_free: boolean;
  key_expressions: { ko: string; translation: string }[];
  session: {
    step_videos?: Record<string, string>;
    step1_quiz: {
      question: string;
      hint?: string;
      options: string[];
      answer: number;
    };
    step2_blanks: {
      sentence: string;
      hint?: string;
      options: string[];
      answer: number;
    }[];
    step3_sentences: { ko: string; translation: string }[];
    step4_words: { korean: string; translation: string; example: string }[];
    step5_review: {
      ko: string;
      translation: string;
      context: string;
    }[];
  };
  words: {
    korean: string;
    translation: string;
    example_ko: string;
    example: string;
  }[];
  words_quiz: {
    type: "situation" | "meaning" | "fill";
    question: string;
    options: string[];
    answer: number;
    hint?: string;
    hint_translation?: string;
    hint_vi?: string;
  }[];
  patterns: {
    pattern: string;
    meaning: string;
    examples: string[];
    blank_quiz: {
      sentence: string;
      answer: string;
      options: string[];
    };
  }[];
  // 문장 뱅크: 문형별 문장 모음 (콘텐츠 라이브러리 v2)
  sentence_bank?: {
    pattern: string;
    sentences: string[];
  }[];
  // 패턴 퀴즈: 문형 훈련 (blank/transform/situation 3유형)
  patterns_quiz?: (
    | {
        type: "blank";
        sentence: string;
        answer: string;
        options: string[];
        hint?: string;
        hint_translation?: string;
      }
    | {
        type: "transform";
        base_pattern: string;
        question: string;
        options: string[];
        answer: number;
        hint?: string;
        hint_translation?: string;
      }
    | {
        type: "situation";
        context: string;
        options: string[];
        answer: number;
        hint?: string;
        hint_translation?: string;
      }
  )[];
  // 듣기 문항: dialogue/number/next 3유형
  listening?: {
    type: "listening_dialogue" | "listening_number" | "listening_next";
    script: string;
    question: string;
    options: string[];
    answer: number;
    audio_tts: string;
  }[];
  // 읽기 문항: sign/notice/dialogue 3유형
  reading?: {
    type: "reading_sign" | "reading_notice" | "reading_dialogue";
    text: string;
    question: string;
    options: string[];
    answer: number;
  }[];
  // 복습 문항: 실패한 단어/패턴 재노출
  review?: (
    | {
        type: "review_word";
        failed_word: string;
        question: string;
        options: string[];
        answer: number;
      }
    | {
        type: "review_pattern";
        failed_pattern: string;
        question: string;
        options: string[];
        answer: number;
      }
  )[];
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
    session: { ko: "오늘의 학습", kicker: "SESSION" },
    words: { ko: "단어 학습", kicker: "WORDS" },
    patterns: { ko: "문장 연습", kicker: "EXPRESSIONS" },
    test: { ko: "실력 테스트", kicker: "TEST" },
    ai: { ko: "AI 확장", kicker: "AI" },
  };

export type StepKey = 1 | 2 | 3 | 4 | 5;
export type SessionStepsDone = Record<StepKey, boolean>;
