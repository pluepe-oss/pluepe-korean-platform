import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  prompt?: string;
  unitTitle?: string;
  language?: string;
};

const SYSTEM_PROMPTS: Record<string, (unitTitle: string) => string> = {
  vi: (unitTitle) => `너는 한국어 선생님이야. 학습자는 베트남 사람이고 "${unitTitle}" 표현을 배웠어.
짧고 명확하게 답해줘.
한국어 표현과 베트남어 설명을 같이 써줘.
TOPIK1 초급 수준을 유지하고, 300자 이내로 답해.`,
  en: (unitTitle) => `You are a Korean language teacher. The learner is an English speaker who has studied expressions for "${unitTitle}".
Reply concisely.
Include Korean expressions with English explanations.
Keep the level at TOPIK 1 beginner and answer within 300 characters.`,
  zh: (unitTitle) => `你是韩语老师。学习者是中文母语者，已学习"${unitTitle}"相关表达。
请简洁回答，同时提供韩语表达和中文说明。
保持TOPIK1初级水平，回答控制在300字以内。`,
  id: (unitTitle) => `Kamu adalah guru bahasa Korea. Pelajar berbahasa Indonesia dan telah mempelajari ekspresi "${unitTitle}".
Jawab dengan singkat.
Sertakan ekspresi Korea dengan penjelasan bahasa Indonesia.
Pertahankan level TOPIK 1 pemula dan jawab dalam 300 karakter.`,
};

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const prompt = (body.prompt ?? "").trim();
  const unitTitle = (body.unitTitle ?? "한국어 표현").trim();
  const language = (body.language ?? "vi").toLowerCase();

  if (!prompt) {
    return NextResponse.json(
      { error: "prompt가 필요합니다." },
      { status: 400 },
    );
  }
  if (prompt.length > 500) {
    return NextResponse.json(
      { error: "prompt가 너무 깁니다 (최대 500자)." },
      { status: 400 },
    );
  }

  const systemBuilder = SYSTEM_PROMPTS[language] ?? SYSTEM_PROMPTS.vi;
  const system = systemBuilder(unitTitle);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Claude API 오류 (${res.status})`, detail: errText.slice(0, 200) },
        { status: 502 },
      );
    }

    const data = (await res.json()) as {
      content?: { type: string; text: string }[];
    };
    const text =
      data.content
        ?.filter((c) => c.type === "text")
        .map((c) => c.text)
        .join("\n")
        .trim() ?? "";

    if (!text) {
      return NextResponse.json(
        { error: "응답을 받아오지 못했습니다." },
        { status: 502 },
      );
    }

    return NextResponse.json({ content: text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json(
      { error: "Claude API 호출 실패", detail: msg },
      { status: 502 },
    );
  }
}
