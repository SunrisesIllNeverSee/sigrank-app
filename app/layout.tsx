import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Roboto, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/ui/Nav";
import { NavNpxCTA } from "@/components/ui/NavNpxCTA";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { Footer } from "@/components/ui/Footer";
import { ThemeCycleShortcut } from "@/components/ui/ThemeCycleShortcut";
import { JsonLd } from "@/components/seo/JsonLd";
import { organization, website } from "@/lib/jsonld";
import { SITE_ORIGIN, siteMetadata } from "@/lib/seo";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { WebMcpRegistrar } from "@/components/webmcp/register-tools";

// Roboto — the LOCKED theme typeface (matches _HEADER_LOCKED.html, the design
// foundation). Wired to the existing --font-geist-sans var name so all
// globals.css + tailwind fontFamily references resolve to it app-wide.
const geistSans = Roboto({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-geist-sans",
  display: "swap",
  preload: false,
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-geist-mono",
  display: "swap",
});

// Inter — clean professional sans for long-form blog articles only.
// Scoped to --font-article so it only applies inside .prose-sigrank.
const articleSerif = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-article",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = siteMetadata;

// Viewport — themeColor matches the SSR default theme (terminal = #050605). The site
// defaults to dark regardless of OS preference (data-theme="terminal" is the SSR default
// + the no-flash THEME_INIT only overrides when a user has explicitly chosen a theme),
// so a single dark themeColor avoids the white browser-chrome flash a light-pref media
// branch would cause on the dark default. Users who switch to the paper (light) theme
// get a dark chrome — a minor mismatch, far better than flashing white on the dark site.
export const viewport: Viewport = {
  themeColor: "#050605",
  colorScheme: "dark light",
};

// No-flash theme init: applies the saved theme before the body content paints.
// Runs synchronously as the first child of <body>. data-theme="terminal" is the
// SSR default so dark renders correctly before this runs.
const THEME_INIT = `(function(){try{var t=localStorage.getItem('sigrank-theme');if(t){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const org = {
    ...organization(),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "hello@signalaf.com",
      url: `${SITE_ORIGIN}/contact`,
      availableLanguage: ["en"],
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "84 W Utica St",
      addressLocality: "Buffalo",
      addressRegion: "NY",
      postalCode: "14209",
      addressCountry: "US",
    },
  };

  return (
    <html
      lang="en"
      data-theme="terminal"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${articleSerif.variable} font-sans`}
    >
      <body className="min-h-screen bg-bg-base text-text-primary">
        <JsonLd data={[org, website()]} />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <PostHogProvider>
          <ThemeCycleShortcut />
          <Nav />
          <DemoBanner />
          <main className="mx-auto w-full max-w-[1600px] px-4 py-8">{children}</main>
          <Footer />
          <NavNpxCTA />
        </PostHogProvider>
        <SpeedInsights />
        <Analytics />
        <WebMcpRegistrar />
        {/* Google Analytics 4 (gtag.js) — measurement ID G-YQCKR06LBH */}
        <Script
          id="ga4-gtag-src"
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-YQCKR06LBH"
        />
        <Script
          id="ga4-gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-YQCKR06LBH');`,
          }}
        />
      </body>
    </html>
  );
}
