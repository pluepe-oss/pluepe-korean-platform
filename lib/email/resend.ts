import { Resend } from "resend";

let cached: Resend | null = null;

function client(): Resend {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY가 설정되지 않았습니다.");
  }
  cached = new Resend(key);
  return cached;
}

function fromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? "pluepe <onboarding@resend.dev>";
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ id: string }> {
  const { data, error } = await client().emails.send({
    from: fromAddress(),
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
  if (error) {
    throw new Error(`Resend 발송 실패: ${error.message}`);
  }
  if (!data?.id) {
    throw new Error("Resend가 메시지 ID를 반환하지 않았습니다.");
  }
  return { id: data.id };
}
