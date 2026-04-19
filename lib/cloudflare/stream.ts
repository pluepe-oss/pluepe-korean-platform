import jwt from "jsonwebtoken";

const DEFAULT_TTL_SECONDS = 60 * 60 * 6;

function readPrivateKey(): string {
  const b64 = process.env.CLOUDFLARE_STREAM_SIGNING_KEY_PEM;
  if (!b64) {
    throw new Error("CLOUDFLARE_STREAM_SIGNING_KEY_PEM이 설정되지 않았습니다.");
  }
  return Buffer.from(b64, "base64").toString("utf-8");
}

export function signStreamToken(
  videoId: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): string {
  const kid = process.env.CLOUDFLARE_STREAM_SIGNING_KEY_ID;
  if (!kid) {
    throw new Error("CLOUDFLARE_STREAM_SIGNING_KEY_ID가 설정되지 않았습니다.");
  }
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      sub: videoId,
      kid,
      exp: now + ttlSeconds,
      nbf: now - 60,
    },
    readPrivateKey(),
    { algorithm: "RS256" },
  );
}
