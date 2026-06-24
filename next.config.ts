import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Note (owner 2026-06-22): the /operators → /leaderboard + /user redirects were REMOVED
  // (owner wants a clean slate — old /operators[...] bookmarks now 404, by design). All
  // internal links already point at the new /leaderboard + /user/<codename> routes.
}

export default nextConfig
