import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">404</p>
      <h1 className="mt-3 font-mono text-3xl font-bold text-text-primary">
        Page not found
      </h1>
      <p className="mt-4 max-w-2xl font-sans text-base leading-relaxed text-text-secondary">
        The requested SignalAF resource does not exist. Humans can use the links
        below; agents can use the recovery map for deterministic next steps.
      </p>

      <div className="mt-8 rounded-lg border border-bg-border bg-bg-surface p-5">
        <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-text-secondary">
{`# SignalAF 404 recovery

- Sitemap: https://signalaf.com/sitemap.xml
- Agent index: https://signalaf.com/llms.txt
- Developer portal: https://signalaf.com/developers
- OpenAPI: https://signalaf.com/openapi.json
- Documentation: https://signalaf.com/wiki
- MCP: https://signalaf.com/.well-known/mcp.json`}
        </pre>
      </div>

      <nav className="mt-8 flex flex-wrap gap-3" aria-label="404 recovery">
        <Link href="/" className="font-mono text-sm text-gold hover:text-text-primary">
          Home
        </Link>
        <Link href="/wiki" className="font-mono text-sm text-gold hover:text-text-primary">
          Wiki
        </Link>
        <Link href="/developers" className="font-mono text-sm text-gold hover:text-text-primary">
          Developers
        </Link>
      </nav>
    </div>
  );
}
