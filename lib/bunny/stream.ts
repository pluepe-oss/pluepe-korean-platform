import crypto from 'crypto'

const LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID!
const API_KEY    = process.env.BUNNY_STREAM_API_KEY!

/**
 * Bunny Stream embed URL 생성 (공식 방식)
 * token = SHA256(API_KEY + videoId + expires) → HEX
 */
export function signBunnyEmbedUrl(videoId: string, ttlSeconds = 7200): string {
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds
  const token = crypto
    .createHash('sha256')
    .update(API_KEY + videoId + expires)
    .digest('hex')
  return `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${videoId}?token=${token}&expires=${expires}&autoplay=false&preload=false`
}
