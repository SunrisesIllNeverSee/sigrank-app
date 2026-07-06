/**
 * app/board/[window]/og/route.tsx — per-board-window OG image.
 *
 * Next.js 15 has a known bug where opengraph-image.tsx in dynamic routes
 * 500s on Vercel (github.com/vercel/next.js/issues/57349). ImageResponse
 * in a route handler also 500s on Vercel for dynamic segments.
 *
 * Pragmatic fix: redirect to the static site OG image. The board page's
 * generateMetadata links here via og:image. Not dynamic per-window, but
 * at least the OG card works for social shares instead of 500ing.
 *
 * TODO: revisit when Next.js 15 bug is fixed or upgrade to Next.js 16.
 */

export const runtime = 'nodejs'

export async function GET() {
  return new Response(null, {
    status: 302,
    headers: { Location: '/og-v2.png' },
  })
}

