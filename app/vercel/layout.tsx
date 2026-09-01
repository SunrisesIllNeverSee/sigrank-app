import Link from "next/link";

/**
 * app/vercel/layout.tsx — sidebar layout for the Vercel integration section.
 *
 * Wraps all pages under /vercel/* with a persistent sidebar that links to
 * every page in the integration surface. The sidebar is hidden on mobile
 * (below md breakpoint) where the content takes full width.
 */

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { href: "/vercel", label: "Integration Home" },
      { href: "/vercel/config", label: "Configuration" },
    ],
  },
  {
    label: "Documentation",
    items: [
      { href: "/docs/integrations/vercel", label: "Integration Guide" },
      { href: "/mcp", label: "MCP Tools" },
      { href: "/developers", label: "Developer Docs" },
    ],
  },
  {
    label: "Legal",
    items: [
      { href: "/eula", label: "EULA" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
    ],
  },
  {
    label: "Support",
    items: [
      { href: "/support", label: "Support Center" },
      { href: "/contact", label: "Contact Form" },
    ],
  },
] as const;

export default function VercelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8 sm:py-12">
      {/* Sidebar — hidden on mobile, visible on md+ */}
      <aside className="hidden w-56 shrink-0 md:block">
        <nav className="sticky top-20 flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">
              SigRank × Vercel
            </p>
            <Link
              href="/vercel"
              className="font-mono text-sm font-bold text-text-primary hover:text-gold"
            >
              Integration
            </Link>
          </div>

          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="flex flex-col gap-1.5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                {section.label}
              </p>
              <ul className="flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block font-sans text-sm text-text-secondary transition-colors hover:text-text-primary"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="border-t border-bg-border pt-4">
            <a
              href="https://vercel.com/integrations"
              className="font-mono text-xs text-text-muted transition-colors hover:text-text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Vercel Marketplace ↗
            </a>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
