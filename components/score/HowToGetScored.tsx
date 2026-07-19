/**
 * HowToGetScored — step-by-step visual guide for both paths.
 *
 * Two columns:
 *   LEFT  = Manual upload (paste) — 3 steps with mini SVG visuals
 *   RIGHT = Agent install — 3 steps with mini SVG visuals
 *
 * Each step has a small inline SVG drawing showing what to do.
 * Pure server component. No client JS.
 */

const PASTE_STEPS = [
  {
    n: "1",
    title: "Open your AI usage dashboard",
    body: "Go to your platform's usage page. Claude Code: ~/.claude/usage.json. OpenAI: platform.openai.com/usage. Cursor: settings → usage.",
  },
  {
    n: "2",
    title: "Find your four token counts",
    body: "Look for: input tokens, output tokens, cache creation (write) tokens, cache read tokens. These are the four pillars. Copy each number.",
  },
  {
    n: "3",
    title: "Paste them into the calculator",
    body: "Drop the four numbers into the paste calculator. Instant result: Υ Yield, leverage, velocity, class tier, and your archetype.",
  },
];

const AGENT_STEPS = [
  {
    n: "1",
    title: "Install the SigRank CLI",
    body: "Run npm install -g sigrank. Bundles ccusage + tokscale + tokendash. Node ≥18, macOS + Linux. One install, everything you need.",
  },
  {
    n: "2",
    title: "Enroll your device",
    body: "Run sigrank enroll. Generates an ed25519 keypair for signed submissions. The agent reads your local logs on-device — never your prompts.",
  },
  {
    n: "3",
    title: "Submit to the board",
    body: "Run sigrank submit. The agent counts your four token pillars across all sessions, derives your cascade, and posts a signed snapshot. You're on the board.",
  },
];

/** Mini SVG for each paste step */
function PasteVisual({ step }: { step: string }) {
  if (step === "1") {
    // Dashboard window
    return (
      <svg viewBox="0 0 120 70" className="h-auto w-full" role="img" aria-label="Open your AI usage dashboard">
        <rect x="5" y="5" width="110" height="60" rx="6" fill="#15120c" stroke="#3a3a4e" strokeWidth="1" />
        <rect x="5" y="5" width="110" height="14" rx="6" fill="#1a1a2e" />
        <circle cx="12" cy="12" r="2" fill="#e74c3c" />
        <circle cx="18" cy="12" r="2" fill="#f5a020" />
        <circle cx="24" cy="12" r="2" fill="#2ec4a0" />
        <rect x="12" y="26" width="96" height="6" rx="2" fill="#2a2a3e" />
        <rect x="12" y="36" width="70" height="4" rx="2" fill="#2a2a3e" />
        <rect x="12" y="44" width="80" height="4" rx="2" fill="#2a2a3e" />
        <rect x="12" y="52" width="50" height="4" rx="2" fill="#2a2a3e" />
      </svg>
    );
  }
  if (step === "2") {
    // Four token counts
    return (
      <svg viewBox="0 0 120 70" className="h-auto w-full" role="img" aria-label="Find your four token counts">
        <rect x="5" y="8" width="24" height="54" rx="3" fill="#5b6472" fillOpacity="0.3" stroke="#5b6472" strokeWidth="1" />
        <text x="17" y="40" textAnchor="middle" fontSize="7" fill="#5b6472">I</text>
        <rect x="33" y="8" width="24" height="54" rx="3" fill="#c4923a" fillOpacity="0.3" stroke="#c4923a" strokeWidth="1" />
        <text x="45" y="40" textAnchor="middle" fontSize="7" fill="#c4923a">O</text>
        <rect x="61" y="8" width="24" height="54" rx="3" fill="#f07030" fillOpacity="0.3" stroke="#f07030" strokeWidth="1" />
        <text x="73" y="40" textAnchor="middle" fontSize="7" fill="#f07030">CW</text>
        <rect x="89" y="8" width="24" height="54" rx="3" fill="#2ec4a0" fillOpacity="0.3" stroke="#2ec4a0" strokeWidth="1" />
        <text x="101" y="40" textAnchor="middle" fontSize="7" fill="#2ec4a0">CR</text>
      </svg>
    );
  }
  // step 3: paste + result
  return (
    <svg viewBox="0 0 120 70" className="h-auto w-full" role="img" aria-label="Paste them and get your score">
      <rect x="5" y="5" width="110" height="60" rx="6" fill="#15120c" stroke="#3a3a4e" strokeWidth="1" />
      <rect x="12" y="12" width="96" height="8" rx="2" fill="#2a2a3e" />
      <text x="60" y="19" textAnchor="middle" fontSize="6" fill="#9e937c">paste four numbers</text>
      <rect x="12" y="26" width="96" height="1" fill="#3a3a4e" />
      <text x="60" y="42" textAnchor="middle" fontSize="14" fontWeight="700" fill="#c4923a">Υ=1,825</text>
      <text x="60" y="56" textAnchor="middle" fontSize="7" fill="#e17055">Cache Builder ★</text>
    </svg>
  );
}

/** Mini SVG for each agent step */
function AgentVisual({ step }: { step: string }) {
  if (step === "1") {
    // Terminal with install command
    return (
      <svg viewBox="0 0 120 70" className="h-auto w-full" role="img" aria-label="Install the SigRank CLI">
        <rect x="5" y="5" width="110" height="60" rx="6" fill="#0d0b08" stroke="#3a3a4e" strokeWidth="1" />
        <text x="10" y="20" fontSize="7" fill="#2ec4a0">$</text>
        <text x="18" y="20" fontSize="6" fill="#e9e3d5">npm install -g sigrank</text>
        <rect x="10" y="26" width="90" height="1" fill="#2a2a3e" />
        <text x="10" y="38" fontSize="6" fill="#9e937c">added 1 package in 2.3s</text>
        <text x="10" y="50" fontSize="6" fill="#2ec4a0">✓ sigrank installed</text>
        <text x="10" y="60" fontSize="6" fill="#9e937c">+ ccusage, tokscale, tokendash</text>
      </svg>
    );
  }
  if (step === "2") {
    // Key + scan
    return (
      <svg viewBox="0 0 120 70" className="h-auto w-full" role="img" aria-label="Enroll your device">
        <rect x="5" y="5" width="110" height="60" rx="6" fill="#0d0b08" stroke="#3a3a4e" strokeWidth="1" />
        <text x="10" y="20" fontSize="7" fill="#2ec4a0">$</text>
        <text x="18" y="20" fontSize="6" fill="#e9e3d5">sigrank enroll</text>
        {/* Key icon */}
        <circle cx="25" cy="40" r="5" fill="none" stroke="#c4923a" strokeWidth="1.5" />
        <rect x="28" y="38" width="12" height="4" rx="1" fill="#c4923a" />
        <text x="50" y="44" fontSize="6" fill="#9e937c">ed25519 keypair</text>
        {/* Scan icon */}
        <rect x="10" y="52" width="96" height="8" rx="2" fill="#1a1a2e" stroke="#2ec4a0" strokeWidth="0.5" />
        <text x="58" y="58" textAnchor="middle" fontSize="5" fill="#2ec4a0">scanning local logs...</text>
      </svg>
    );
  }
  // step 3: submit + board
  return (
    <svg viewBox="0 0 120 70" className="h-auto w-full" role="img" aria-label="Submit to the board">
      <rect x="5" y="5" width="110" height="60" rx="6" fill="#0d0b08" stroke="#3a3a4e" strokeWidth="1" />
      <text x="10" y="20" fontSize="7" fill="#2ec4a0">$</text>
      <text x="18" y="20" fontSize="6" fill="#e9e3d5">sigrank submit</text>
      {/* Signed + submitted */}
      <text x="10" y="36" fontSize="6" fill="#c4923a">✓ signed (ed25519)</text>
      <text x="10" y="46" fontSize="6" fill="#2ec4a0">✓ submitted to board</text>
      {/* Mini board row */}
      <rect x="10" y="52" width="96" height="8" rx="2" fill="#1a1a2e" />
      <text x="14" y="58" fontSize="5" fill="#c4923a">#42</text>
      <text x="40" y="58" fontSize="5" fill="#e9e3d5">you</text>
      <text x="90" y="58" fontSize="5" fill="#c4923a">Υ=1,825</text>
    </svg>
  );
}

export default function HowToGetScored() {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="font-mono text-xs uppercase tracking-widest text-gold">
        How to get scored
      </div>
      <p className="mx-auto max-w-xl font-sans text-sm leading-relaxed text-text-secondary">
        Two paths. Both get you scored. Pick the one that fits.
      </p>

      {/* Two columns */}
      <div className="grid w-full max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
        {/* ── LEFT: Manual upload (paste) ── */}
        <div className="flex flex-col gap-4 rounded-xl border border-bg-border bg-bg-surface p-5 text-left">
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg text-gold">⌨</span>
            <h3 className="font-mono text-sm font-bold uppercase tracking-wide text-text-primary">
              Manual upload
            </h3>
          </div>
          <p className="font-sans text-xs leading-relaxed text-text-muted">
            No install. No account. Paste four numbers, get your score.
            Takes 30 seconds.
          </p>
          {PASTE_STEPS.map((s) => (
            <div key={s.n} className="flex flex-col gap-2">
              <div className="flex items-start gap-3">
                <span className="font-mono text-sm font-bold text-gold">
                  {s.n}
                </span>
                <div className="flex flex-1 flex-col gap-1">
                  <h4 className="font-sans text-sm font-semibold text-text-primary">
                    {s.title}
                  </h4>
                  <p className="font-sans text-xs leading-relaxed text-text-secondary">
                    {s.body}
                  </p>
                </div>
              </div>
              <div className="ml-8 w-full max-w-[120px]">
                <PasteVisual step={s.n} />
              </div>
            </div>
          ))}
        </div>

        {/* ── RIGHT: Agent install ── */}
        <div className="flex flex-col gap-4 rounded-xl border border-bg-border bg-bg-surface p-5 text-left">
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg text-gold">⚡</span>
            <h3 className="font-mono text-sm font-bold uppercase tracking-wide text-text-primary">
              Agent install
            </h3>
          </div>
          <p className="font-sans text-xs leading-relaxed text-text-muted">
            Auto-reads your logs. Signed submissions. You're on the
            board. The real path.
          </p>
          {AGENT_STEPS.map((s) => (
            <div key={s.n} className="flex flex-col gap-2">
              <div className="flex items-start gap-3">
                <span className="font-mono text-sm font-bold text-gold">
                  {s.n}
                </span>
                <div className="flex flex-1 flex-col gap-1">
                  <h4 className="font-sans text-sm font-semibold text-text-primary">
                    {s.title}
                  </h4>
                  <p className="font-sans text-xs leading-relaxed text-text-secondary">
                    {s.body}
                  </p>
                </div>
              </div>
              <div className="ml-8 w-full max-w-[120px]">
                <AgentVisual step={s.n} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
