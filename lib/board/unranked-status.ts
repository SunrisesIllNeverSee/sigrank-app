/**
 * UR — registered but without a qualifying ranked snapshot.
 * A UR member occupies one unranked position but never enters score, podium,
 * percentile or performance-aggregate populations.
 *
 * Profile identity follows the existing operator profile-visibility preference.
 * Public profiles carry their chosen display name (or public codename fallback);
 * private/opted-out profiles cannot leak identity through this public route.
 */
export const UR_STATUS = "UR" as const;

export interface URPublicIdentity {
  codename: string | null;
  display_name: string | null;
  handle: string | null;
  avatar_url: string | null;
  location: string | null;
  profile_visibility: string | null;
  data_opt_out: boolean | null;
}

export interface URMember {
  position: number;
  board_status: "unranked";
  rank_status: typeof UR_STATUS;
  performance_eligible: false;
  metrics: null;
  workflow_mode: null;
  display_group: "autonomous";
  workflow_provenance: "unassessed_grouping";
  identity_status: "public_profile" | "not_publicly_listed";
  display_label: string;
  profile_slug: string | null;
  handle: string | null;
  avatar_url: string | null;
  location: string | null;
}

/** This is the same display-name precedence as operatorDisplayName:
 * chosen public display_name first, public codename otherwise. */
export function registeredURMember(position: number, profile?: URPublicIdentity): URMember {
  if (!Number.isSafeInteger(position) || position < 1) {
    throw new RangeError("UR membership position must be a positive integer");
  }
  const publicProfile = profile?.profile_visibility === "public" &&
    profile?.data_opt_out !== true &&
    typeof profile?.codename === "string" &&
    profile.codename.trim().length > 0;
  const code = publicProfile ? profile.codename!.trim() : null;
  const chosenName = publicProfile ? profile.display_name?.trim() : null;
  return {
    position,
    board_status: "unranked",
    rank_status: UR_STATUS,
    performance_eligible: false,
    metrics: null,
    workflow_mode: null,
    display_group: "autonomous",
    workflow_provenance: "unassessed_grouping",
    identity_status: publicProfile ? "public_profile" : "not_publicly_listed",
    display_label: chosenName || code || "PRIVATE OPERATOR",
    profile_slug: code,
    handle: publicProfile ? profile.handle?.trim() || null : null,
    avatar_url: publicProfile ? profile.avatar_url || null : null,
    location: publicProfile ? profile.location?.trim() || null : null,
  };
}
