"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * components/auth/PlatformPicker.tsx — the profile "Platforms" selector as a popup.
 *
 * Owner 2026-06-26: the inline 4-pill picker was too narrow. Show ALL 15 platforms
 * SigRank's local agent can read (mirrors sigrank-mcp ALL_PLATFORMS / PLATFORM_COUNT=15)
 * as checkboxes in a modal, plus a 16th "Other" escape hatch so a platform we don't list
 * can still be declared by name. Selection is generative (it tells the agent where to
 * read), never a gate — nothing is required.
 *
 * Stateless on its own: holds the selected domains in the parent (ProfileEditForm) and
 * reports changes via onChange. The selected set is `operator_domains` — known domains
 * plus any custom strings the user typed under Other.
 */

// The 15 known platforms (popular first, then the rest). Mirrors the MCP adapter
// registry; keep in sync with sigrank-mcp `ALL_PLATFORMS` when adapters are added.
const KNOWN_PLATFORMS: { domain: string; label: string }[] = [
  { domain: "claude", label: "Claude" },
  { domain: "codex", label: "Codex" },
  { domain: "gemini", label: "Gemini" },
  { domain: "copilot", label: "Copilot" },
  { domain: "amp", label: "Amp" },
  { domain: "opencode", label: "OpenCode" },
  { domain: "goose", label: "Goose" },
  { domain: "droid", label: "Droid" },
  { domain: "kimi", label: "Kimi" },
  { domain: "qwen", label: "Qwen" },
  { domain: "pi", label: "Pi" },
  { domain: "openclaw", label: "OpenClaw" },
  { domain: "codebuff", label: "Codebuff" },
  { domain: "kilo", label: "Kilo" },
  { domain: "hermes", label: "Hermes" },
];
const KNOWN_SET = new Set(KNOWN_PLATFORMS.map((p) => p.domain));
const labelFor = (domain: string): string =>
  KNOWN_PLATFORMS.find((p) => p.domain === domain)?.label ?? domain;

export function PlatformPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");

  // Escape closes the popup (mirrors ProfileEditModal).
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const toggle = (domain: string) =>
    onChange(
      selected.includes(domain)
        ? selected.filter((d) => d !== domain)
        : [...selected, domain],
    );

  const addCustom = () => {
    const v = custom.trim().toLowerCase();
    setCustom("");
    if (!v || selected.includes(v)) return;
    onChange([...selected, v]);
  };

  // Custom (Other) entries = selected domains that aren't in the known 15.
  const customSelected = selected.filter((d) => !KNOWN_SET.has(d));

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-mono text-xs font-semibold uppercase tracking-wide text-text-secondary">
        Platforms
        <span className="ml-2 font-sans text-[10px] normal-case tracking-normal text-text-dim">
          what you run · optional
        </span>
      </legend>

      {/* Selected summary + the trigger that opens the popup. */}
      <div className="flex flex-wrap items-center gap-2">
        {selected.length === 0 ? (
          <span className="font-sans text-xs text-text-dim">
            None selected yet.
          </span>
        ) : (
          selected.map((d) => (
            <span
              key={d}
              className="inline-flex items-center gap-1 rounded-md border border-gold/40 bg-gold/10 px-2 py-1 font-mono text-xs text-gold"
            >
              {labelFor(d)}
              <button
                type="button"
                aria-label={`Remove ${labelFor(d)}`}
                onClick={() => toggle(d)}
                className="text-gold/70 transition-colors hover:text-gold"
              >
                ✕
              </button>
            </span>
          ))
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md border border-bg-border px-3 py-1.5 font-mono text-xs text-text-secondary transition-colors hover:bg-bg-elevated"
        >
          + Select platforms
        </button>
      </div>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Select platforms"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="my-4 w-full max-w-md rounded-lg border border-bg-border bg-bg-base p-6 shadow-xl sm:my-8"
            >
              <div className="mb-1 flex items-center justify-between">
                <h2 className="font-mono text-sm font-semibold uppercase tracking-wide text-text-primary">
                  Select your platforms
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="rounded px-2 py-1 font-mono text-sm text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
                >
                  ✕
                </button>
              </div>
              <p className="mb-4 font-sans text-xs text-text-dim">
                The tools you run — SigRank&rsquo;s local agent reads usage from
                these. Pick all that apply.
              </p>

              {/* The 15 known platforms as checkboxes. */}
              <div className="grid grid-cols-2 gap-1.5">
                {KNOWN_PLATFORMS.map((p) => {
                  const on = selected.includes(p.domain);
                  return (
                    <button
                      key={p.domain}
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => toggle(p.domain)}
                      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left font-mono text-xs transition-colors ${
                        on
                          ? "border-gold/50 bg-gold/10 text-gold"
                          : "border-bg-border text-text-secondary hover:bg-bg-elevated"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-sm border text-[9px] ${
                          on
                            ? "border-gold bg-gold text-bg-base"
                            : "border-bg-border"
                        }`}
                      >
                        {on ? "✓" : ""}
                      </span>
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {/* The 16th: Other — a free-text escape hatch for unlisted platforms. */}
              <div className="mt-4 border-t border-bg-border pt-3">
                <span className="font-mono text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  Other
                </span>
                <p className="mb-2 mt-1 font-sans text-[11px] text-text-dim">
                  Not listed? Add it by name.
                </p>
                {customSelected.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {customSelected.map((d) => (
                      <span
                        key={d}
                        className="inline-flex items-center gap-1 rounded-md border border-gold/40 bg-gold/10 px-2 py-1 font-mono text-xs text-gold"
                      >
                        {d}
                        <button
                          type="button"
                          aria-label={`Remove ${d}`}
                          onClick={() => toggle(d)}
                          className="text-gold/70 transition-colors hover:text-gold"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustom();
                      }
                    }}
                    placeholder="e.g. my-agent"
                    aria-label="Custom platform name"
                    className="w-full rounded-md border border-bg-border bg-bg-base px-3 py-2 font-sans text-sm text-text-primary placeholder:text-text-dim focus:border-gold/50 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addCustom}
                    className="flex-shrink-0 rounded-md border border-bg-border px-3 py-2 font-mono text-xs text-text-secondary transition-colors hover:bg-bg-elevated"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md bg-gold px-4 py-2 font-semibold text-bg-base transition-colors hover:bg-gold/90"
                >
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </fieldset>
  );
}
