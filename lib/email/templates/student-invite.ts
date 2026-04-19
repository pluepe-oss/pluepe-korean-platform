type TemplateInput = {
  academyName: string;
  inviterName: string;
  inviteUrl: string;
  expiresAt: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderStudentInviteEmail(input: TemplateInput): {
  subject: string;
  html: string;
} {
  const academyName = escapeHtml(input.academyName);
  const inviterName = escapeHtml(input.inviterName || "담당 선생님");
  const inviteUrl = escapeHtml(input.inviteUrl);
  const expiresAt = escapeHtml(input.expiresAt);
  const subject = `[pluepe] ${academyName} 학원에서 학습 초대가 도착했어요`;

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
              <h1 style="margin:12px 0 0;font-size:22px;line-height:1.35;color:#111827;">학습 초대가 도착했어요</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 0;font-size:14px;line-height:1.7;color:#374151;">
              <p style="margin:0;">안녕하세요.</p>
              <p style="margin:12px 0 0;">
                <strong>${academyName}</strong> 학원의 <strong>${inviterName}</strong>님이
                pluepe 한국어 학습 플랫폼에 초대했어요.
                아래 버튼을 눌러 비밀번호를 설정하면 바로 학습을 시작할 수 있습니다.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;" align="center">
              <a href="${inviteUrl}" style="display:inline-block;padding:14px 28px;border-radius:10px;background:#2563eb;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
                초대 수락하고 시작하기
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0;font-size:12px;color:#6b7280;line-height:1.6;" align="center">
              버튼이 동작하지 않으면 아래 링크를 브라우저에 붙여넣어 주세요.
              <br />
              <span style="word-break:break-all;color:#2563eb;">${inviteUrl}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;">
                <tr>
                  <td style="padding:16px 18px;font-size:13px;color:#6b7280;">만료일</td>
                  <td style="padding:16px 18px;font-size:14px;font-weight:600;color:#111827;text-align:right;">${expiresAt}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;font-size:12px;color:#9ca3af;line-height:1.6;">
              초대 링크는 본인만 사용할 수 있으며, 만료일이 지나면 무효화됩니다.
              초대 요청을 받지 않으신 경우 이 메일을 무시해 주세요.
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
