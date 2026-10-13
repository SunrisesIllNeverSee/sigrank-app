"use client";

import { MedalHex } from "@/components/profile-v2/RecordMarks";
import { invalidateBoardSession } from "@/components/live/session";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PlatformPicker } from "@/components/auth/PlatformPicker";
import { PixelArtwork } from "@/components/profile-v2/BadgeArtwork";
import type { ProfileMarkOption } from "@/lib/profile/profile-marks";

/**
 * components/auth/ProfileEditForm.tsx — the editable profile surface
 * (AUTH_LAUNCH_DIRECTIVES D6: identity editing lives in the profile). OPTIONAL DEPTH:
 * nothing is required — the user fills as much or as little as they want.
 *
 * Public-by-default self-promotion surface (LOCKED 2026-06-22): display_name, optional
 * handle, bio, links, location, platforms. NO visibility toggles. The only private
 * datum is the auth email, which never appears here (P5). Submits to POST
 * /api/v1/profile (auth-resolved, column-allowlisted). github/x are stored as the
 * username/handle (the profile renders github.com/<v> and x.com/<v>); site is a URL.
 */
const inputCls =
  "w-full rounded-md border border-bg-border bg-bg-base px-3 py-2 font-sans text-sm text-text-primary placeholder:text-text-dim focus:border-gold/50 focus:outline-none";

export interface ProfileInitial {
  codename?: string;
  display_name: string;
  handle: string;
  location: string;
  bio: string;
  links: { github?: string; site?: string; x?: string };
  operator_domains: string[];
  avatar_url: string;
  profile_visibility?: "public" | "private";
  profile_pixel_badge?: string | null;
  profile_secondary_logo?: string | null;
  pixel_badges?: ProfileMarkOption[];
  secondary_logos?: ProfileMarkOption[];
  mark_settings_ready?: boolean;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-xs font-semibold uppercase tracking-wide text-text-secondary">
        {label}
        <span className="ml-2 font-sans text-[10px] normal-case tracking-normal text-text-dim">
          optional
        </span>
      </span>
      {children}
      {hint && (
        <span className="font-sans text-[11px] text-text-dim">{hint}</span>
      )}
    </label>
  );
}

export function ProfileEditForm({
  initial,
  onSaved,
}: {
  initial: ProfileInitial;
  /** Called after a successful save (e.g. to close a host modal). */
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initial.display_name);
  const [handle, setHandle] = useState(initial.handle);
  const [location, setLocation] = useState(initial.location);
  const [bio, setBio] = useState(initial.bio);
  const [github, setGithub] = useState(initial.links.github ?? "");
  const [site, setSite] = useState(initial.links.site ?? "");
  const [x, setX] = useState(initial.links.x ?? "");
  // operator_domains: any of the 15 known platforms + custom "Other" entries (PlatformPicker).
  const [platforms, setPlatforms] = useState<string[]>(
    initial.operator_domains,
  );
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<"public" | "private">(
    initial.profile_visibility ?? "public",
  );
  const [pixelBadge, setPixelBadge] = useState(initial.profile_pixel_badge ?? "");
  const [secondaryLogo, setSecondaryLogo] = useState(initial.profile_secondary_logo ?? "");
  const [codename, setCodename] = useState(initial.codename ?? "");
  const [codenameStatus, setCodenameStatus] = useState<
    "idle" | "checking" | "saving" | "saved" | "error"
  >("idle");
  const [codenameError, setCodenameError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarBusy(true);
    setAvatarError(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/v1/profile/avatar", {
        method: "POST",
        body: fd,
      });
      const d = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !d.url) {
        setAvatarError(d.error || "Upload failed — please try again.");
      } else {
        setAvatarUrl(d.url);
        router.refresh();
      }
    } catch {
      setAvatarError("Network error — please try again.");
    } finally {
      setAvatarBusy(false);
      e.target.value = ""; // allow re-selecting the same file
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError(null);

    const links: Record<string, string> = {};
    if (github.trim()) links.github = github.trim();
    if (site.trim()) links.site = site.trim();
    if (x.trim()) links.x = x.trim();

    try {
      const res = await fetch("/api/v1/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          handle,
          location,
          bio,
          links,
          operator_domains: platforms,
          profile_visibility: visibility,
          ...(initial.mark_settings_ready
            ? {
                profile_pixel_badge: pixelBadge || null,
                profile_secondary_logo: secondaryLogo || null,
              }
            : {}),
        }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setError(d.error || "Could not save — please try again.");
        setStatus("error");
        return;
      }
      setStatus("saved");
      invalidateBoardSession();
      router.refresh();
      onSaved?.();
    } catch {
      setError("Network error — please try again.");
      setStatus("error");
    }
  }

  async function onChangeCodename(e: React.FormEvent) {
    e.preventDefault();
    if (codenameStatus === "saving") return;
    setCodenameStatus("saving");
    setCodenameError(null);
    try {
      const res = await fetch("/api/v1/profile/codename", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ codename: codename.trim().toLowerCase() }),
      });
      const d = (await res.json().catch(() => ({}))) as {
        error?: string;
        codename?: string;
      };
      if (!res.ok) {
        setCodenameError(d.error || "Could not change codename.");
        setCodenameStatus("error");
        return;
      }
      setCodenameStatus("saved");
      // Navigate to the new profile URL
      if (d.codename) {
        router.push(`/user/${encodeURIComponent(d.codename)}`);
        router.refresh();
      }
    } catch {
      setCodenameError("Network error — please try again.");
      setCodenameStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {/* Codename (separate form — changes the URL key) */}
      <Field
        label="Codename"
        hint="Your permanent identity on the leaderboard. Changing this updates your profile URL. Lowercase letters, numbers, and hyphens only."
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={codename}
            onChange={(e) => {
              setCodename(e.target.value);
              setCodenameStatus("idle");
              setCodenameError(null);
            }}
            className={inputCls}
            placeholder="your-codename"
            pattern="[a-z0-9-]{3,30}"
            title="3-30 chars, lowercase letters/numbers/hyphens"
          />
          <button
            type="button"
            onClick={onChangeCodename}
            disabled={
              codenameStatus === "saving" ||
              !codename.trim() ||
              codename.trim().toLowerCase() === (initial.codename ?? "")
            }
            className="shrink-0 rounded-md border border-bg-border px-3 py-2 font-mono text-xs text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            {codenameStatus === "saving" ? "Changing…" : "Change"}
          </button>
        </div>
        {codenameStatus === "saved" && (
          <span className="font-sans text-[11px] text-gold">
            Codename updated. Your profile URL has changed.
          </span>
        )}
        {codenameStatus === "error" && codenameError && (
          <span className="font-sans text-[11px] text-red-400">
            {codenameError}
          </span>
        )}
      </Field>

      <Field
        label="Display name"
        hint="The display label on the board. Defaults to your codename until set."
      >
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={inputCls}
          placeholder="e.g. Ada L."
        />
      </Field>

      <Field
        label="Handle"
        hint="An opt-in @name. Separate from your display name; no reservation yet."
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-text-dim">@</span>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className={inputCls}
            placeholder="yourhandle"
          />
        </div>
      </Field>

      <Field label="Location" hint="Where you're from. Free text.">
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={inputCls}
          placeholder="e.g. Reykjavík, IS"
        />
      </Field>

      <Field label="Bio">
        <textarea
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className={inputCls}
          placeholder="A line or two about you."
        />
      </Field>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="font-mono text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Links
          <span className="ml-2 font-sans text-[10px] normal-case tracking-normal text-text-dim">
            self-promotion · optional
          </span>
        </legend>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={github}
            onChange={(e) => setGithub(e.target.value)}
            className={inputCls}
            placeholder="GitHub — username (e.g. torvalds)"
            aria-label="GitHub username"
          />
          <input
            type="text"
            value={x}
            onChange={(e) => setX(e.target.value)}
            className={inputCls}
            placeholder="X — handle (e.g. jack)"
            aria-label="X handle"
          />
          <input
            type="url"
            value={site}
            onChange={(e) => setSite(e.target.value)}
            className={inputCls}
            placeholder="Website — https://your.site"
            aria-label="Website URL"
          />
        </div>
      </fieldset>

      <PlatformPicker selected={platforms} onChange={setPlatforms} />

      {initial.mark_settings_ready ? <section id="profile-display" className="scroll-mt-6 border-y border-bg-border py-4">
        <div className="mb-4">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-text-secondary">Profile display</h2>
          <p className="mt-1 font-sans text-[11px] leading-relaxed text-text-dim">Choose from marks you have earned. Eligibility follows your current leaderboard and Hall records.</p>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-mono text-[10px] uppercase tracking-wider text-text-muted">Pixel badge</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 ${pixelBadge === "" ? "border-gold/60 bg-bg-elevated" : "border-bg-border"}`}>
              <input type="radio" name="profile-pixel-badge" checked={pixelBadge === ""} onChange={() => setPixelBadge("")} className="accent-gold" />
              <span className="font-sans text-xs text-text-secondary">No Pixel badge</span>
            </label>
            {(initial.pixel_badges ?? []).map((option) => (
              <label key={option.id} className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 ${pixelBadge === option.id ? "border-gold/60 bg-bg-elevated" : "border-bg-border"}`}>
                <input type="radio" name="profile-pixel-badge" checked={pixelBadge === option.id} onChange={() => setPixelBadge(option.id)} className="accent-gold" />
                <PixelArtwork pattern={option.pattern ?? ".../.../..."} size={36} />
                <span className="min-w-0"><span className="block font-mono text-[10px] uppercase text-text-primary">{option.label}</span><span className="mt-1 block font-sans text-[10px] text-text-muted">{option.detail}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="mt-5 flex flex-col gap-2">
          <legend className="mb-2 font-mono text-[10px] uppercase tracking-wider text-text-muted">Secondary earned badge</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 ${secondaryLogo === "" ? "border-gold/60 bg-bg-elevated" : "border-bg-border"}`}>
              <input type="radio" name="profile-secondary-logo" checked={secondaryLogo === ""} onChange={() => setSecondaryLogo("")} className="accent-gold" />
              <span className="font-sans text-xs text-text-secondary">No secondary badge</span>
            </label>
            {(initial.secondary_logos ?? []).map((option) => (
              <label key={option.id} className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 ${secondaryLogo === option.id ? "border-gold/60 bg-bg-elevated" : "border-bg-border"}`}>
                <input type="radio" name="profile-secondary-logo" checked={secondaryLogo === option.id} onChange={() => setSecondaryLogo(option.id)} className="accent-gold" />
                <MedalHex rank={option.rank} sigil={option.sigil ?? "★"} ink={option.accent} size={56} />
                <span className="min-w-0"><span className="block font-mono text-[10px] uppercase text-text-primary">{option.label}</span><span className="mt-1 block font-sans text-[10px] text-text-muted">{option.detail}</span></span>
              </label>
            ))}
          </div>
          {(initial.pixel_badges ?? []).length === 0 && (initial.secondary_logos ?? []).length === 0 && <p className="mt-2 font-sans text-[11px] text-text-muted">No eligible marks yet. Earn a leaderboard Pixel standing or a Hall/metric record to choose one.</p>}
        </fieldset>
      </section> : <p id="profile-display" className="border-y border-bg-border py-4 font-sans text-[11px] leading-relaxed text-text-muted">Badge display settings will appear here once this preview database has profile mark storage enabled.</p>}

      <Field
        label="Avatar"
        hint="PNG, JPG, WebP, or GIF — under 2 MB. Shown on your profile and board row."
      >
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- user avatar; tiny fixed size
            <img
              src={avatarUrl}
              alt="Your avatar"
              width={48}
              height={48}
              className="h-12 w-12 rounded-full border border-bg-border object-cover"
            />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-bg-border text-gold">
              ◎
            </span>
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            disabled={avatarBusy}
            onChange={onAvatar}
            className="font-sans text-xs text-text-dim file:mr-3 file:rounded-md file:border-0 file:bg-bg-elevated file:px-3 file:py-1.5 file:font-mono file:text-text-secondary disabled:opacity-60"
          />
        </div>
        {avatarBusy && (
          <span className="font-sans text-[11px] text-text-dim">
            Uploading…
          </span>
        )}
        {avatarError && (
          <span className="font-sans text-[11px] text-text-dim">
            {avatarError}
          </span>
        )}
      </Field>

      <div className="flex flex-col gap-2 border-t border-bg-border pt-4">
        {/* Profile visibility (migration 0021) — controls who can see the
            identity fields above (display name, handle, bio, location, links,
            avatar). Private = only codename + computed metrics are public. */}
        <fieldset className="flex flex-col gap-2">
          <legend className="font-mono text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Profile visibility
          </legend>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="profile-visibility"
                value="public"
                checked={visibility === "public"}
                onChange={() => setVisibility("public")}
                className="accent-gold"
              />
              <span className="font-sans text-sm text-text-primary">
                Public
              </span>
              <span className="font-sans text-[11px] text-text-dim">
                — all fields visible to everyone
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="profile-visibility"
                value="private"
                checked={visibility === "private"}
                onChange={() => setVisibility("private")}
                className="accent-gold"
              />
              <span className="font-sans text-sm text-text-primary">
                Private
              </span>
              <span className="font-sans text-[11px] text-text-dim">
                — only codename + rank + metrics visible
              </span>
            </label>
          </div>
          {visibility === "private" && (
            <p className="font-sans text-[11px] leading-relaxed text-text-dim">
              Your display name, handle, avatar, bio, location, and links will be
              hidden from other users. You&apos;ll still appear on the leaderboard
              with your codename and computed metrics (rank, Υ Yield, class).
            </p>
          )}
        </fieldset>

        <button
          type="submit"
          disabled={status === "saving"}
          className="w-fit rounded-md bg-gold px-5 py-2.5 font-semibold text-bg-base transition-colors hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "saving" ? "Saving…" : "Save profile"}
        </button>
        {status === "saved" && (
          <p className="rounded-md border border-bg-border bg-bg-base/50 px-3 py-2 font-sans text-xs text-text-secondary">
            Saved. Your profile and board row are updated.
          </p>
        )}
        {status === "error" && error && (
          <p className="rounded-md border border-bg-border bg-bg-base/50 px-3 py-2 font-sans text-xs text-text-secondary">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
