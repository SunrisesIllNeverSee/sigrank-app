import type { Metadata } from 'next'
import {
  Roboto,
  Geist_Mono,
  Space_Grotesk,
  Bitter,
  Archivo_Black,
} from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/ui/Nav'
import { DemoBanner } from '@/components/ui/DemoBanner'
import { Footer } from '@/components/ui/Footer'

// Roboto — the LOCKED theme typeface (matches _HEADER_LOCKED.html, the design
// foundation). Wired to the existing --font-geist-sans var name so all
// globals.css + tailwind fontFamily references resolve to it app-wide.
const geistSans = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-geist-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

// Wordmark font pool — used ONLY by the landing RotatingWordmark, where each
// letter of SIGRANK cycles through these on a stagger. Kept off the global
// font-family chain (variables only) so they don't affect the locked theme.
const wmGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['700'], variable: '--wm-grotesk', display: 'swap' })
const wmSerif = Bitter({ subsets: ['latin'], weight: ['700'], variable: '--wm-serif', display: 'swap' })
const wmBlack = Archivo_Black({ subsets: ['latin'], weight: ['400'], variable: '--wm-black', display: 'swap' })

export const metadata: Metadata = {
  title: 'SigRank',
  description:
    'Privacy-preserving leaderboard scoring AI operators on canonical token-telemetry metrics.',
}

// No-flash theme init: applies the saved theme before the body content paints.
// Runs synchronously as the first child of <body>. data-theme="carbon" is the
// SSR default so dark renders correctly before this runs.
const THEME_INIT = `(function(){try{var t=localStorage.getItem('sigrank-theme');if(t){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      data-theme="carbon"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${wmGrotesk.variable} ${wmSerif.variable} ${wmBlack.variable} font-sans`}
    >
      <body className="min-h-screen bg-bg-base text-text-primary">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <Nav />
        <DemoBanner />
        <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
