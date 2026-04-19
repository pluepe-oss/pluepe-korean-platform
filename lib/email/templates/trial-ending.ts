type Bucket = 3 | 1 | 0;

type TemplateInput = {
  recipientName: string;
  bucket: Bucket;
  planLabel: string;
  trialEndDate: string;
  nextBillingDate: string;
  manageUrl: string;
};

const SUBJECT: Record<Bucket, string> = {
  3: "무료체험이 3일 후 종료됩니다",
  1: "무료체험이 내일 종료됩니다",
  0: "오늘 무료체험이 종료됩니다",
};

const HEADLINE: Record<Bucket, string> = {
  3: "무료체험 3일 남았어요",
  1: "무료체험 종료까지 하루 남았어요",
  0: "무료체험이 오늘 종료됩니다",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderTrialEndingEmail(input: TemplateInput): {
  subject: string;
  html: string;
} {
  const name = escapeHtml(input.recipientName || "학습자");
  const planLabel = escapeHtml(input.planLabel);
  const trialEndDate = escapeHtml(input.trialEndDate);
  const nextBillingDate = escapeHtml(input.nextBillingDate);
  const manageUrl = escapeHtml(input.manageUrl);
  const subject = SUBJECT[input.bucket];
  const headline = HEADLINE[input.bucket];

  const html = `<!doctype html>
<html lang="ko">
<body style="margin:0;padding:0;background:#f5f6f8;font-family:-apple-system,BlinkMacSystemFont,'Pretendard','Noto Sans KR',sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:32px 28px 8px;">
              <div style="font-size:12px;font-weight:600;letter-spacing:0.08em;color:#2563eb;">PLUEPE</div>
              <h1 style="margin:12px 0 0;font-size:22px;line-height:1.35;color:#111827;">${headline}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 0;font-size:14px;line-height:1.7;color:#374151;">
              <p style="margin:0;">${name}님, 안녕하세요.</p>
              <p style="margin:12px 0 0;">
                현재 <strong>${planLabel}</strong>로 무료체험을 이용 중입니다.
                아래 일정에 따라 체험이 종료되고 정기 결제가 시작됩니다.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;">
                <tr>
                  <td style="padding:16px 18px;font-size:13px;color:#6b7280;">무료체험 종료일</td>
                  <td style="padding:16px 18px;font-size:14px;font-weight:600;color:#111827;text-align:right;">${trialEndDate}</td>
                </tr>
                <tr>
                  <td style="padding:0 18px 16px;font-size:13px;color:#6b7280;">다음 결제일</td>
                  <td style="padding:0 18px 16px;font-size:14px;font-weight:600;color:#111827;text-align:right;">${nextBillingDate}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 0;font-size:14px;line-height:1.7;color:#374151;">
              <p style="margin:0;">
                계속 이용하실 예정이라면 별도 조치가 필요 없습니다.
                원하지 않으실 경우, 아래 버튼에서 언제든 해지하실 수 있습니다.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;" align="center">
              <a href="${manageUrl}" style="display:inline-block;padding:14px 28px;border-radius:10px;background:#111827;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
                구독 관리 열기
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px;font-size:12px;color:#9ca3af;line-height:1.6;">
              해지 시 무료체험 기간 동안의 요금은 청구되지 않습니다.
              본 메일은 pluepe 서비스 이용자에게 자동 발송됩니다.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
