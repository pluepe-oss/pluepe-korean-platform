import crypto from 'crypto'

const LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID!
const API_KEY    = process.env.BUNNY_STREAM_API_KEY!
const CDN_HOST   = process.env.BUNNY_CDN_HOSTNAME!
const TOKEN_KEY  = process.env.BUNNY_TOKEN_KEY!

export function signBunnyHlsUrl(videoId: string, ttlSeconds = 7200): string {
  const expires  = Math.floor(Date.now() / 1000) + ttlSeconds
  const path     = `/${videoId}/playlist.m3u8`
  const hashBase = TOKEN_KEY + path + expires
  const token    = crypto
    .createHash('sha256')
    .update(hashBase)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  return `https://${CDN_HOST}${path}?token=${token}&expires=${expires}`
}

export async function getBunnyVideo(videoId: string) {
  const res = await fetch(
    `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${videoId}`,
    { headers: { AccessKey: API_KEY, accept: 'application/json' }, cache: 'no-store' }
  )
  if (!res.ok) throw new Error(`Bunny API error: ${res.status}`)
  return res.json()
}
