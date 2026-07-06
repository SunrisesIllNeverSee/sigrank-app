/**
 * app/indexnow-key.txt/route.ts — IndexNow key verification file.
 *
 * IndexNow engines verify site ownership by fetching this key file.
 * The key must match the `key` field in the POST to /api/indexnow.
 * Served as text/plain at /indexnow-key.txt.
 */

export const revalidate = 86400 // 24h (key doesn't change often)

const KEY = 'a3f7b2c9e1d4f6a8b0c2e4d6f8a0b2c4e6d8f0a2b4c6d8e0f2a4b6c8d0e2f4a6'

export async function GET() {
  return new Response(KEY, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=86400',
    },
  })
}
