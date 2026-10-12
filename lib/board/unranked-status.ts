/**
 * UR — registered, but without a qualifying ranked snapshot.
 * UR is a membership status, never a fourth workflow filter, score,
 * zero-token snapshot, performance rank or autonomous assessment.
 */
export const UR_STATUS = "UR" as const;

export interface URMember {
  position: number;
  board_status: "unranked";
  rank_status: typeof UR_STATUS;
  performance_eligible: false;
  metrics: null;
  workflow_mode: null;
  display_group: "autonomous";
  workflow_provenance: "unassessed_grouping";
  identity_status: "not_publicly_listed";
  display_label: "SIGNED-UP OPERATOR";
}

export function registeredURMember(position: number): URMember {
  if (!Number.isSafeInteger(position) || position < 1) {
    throw new RangeError("UR membership position must be a positive integer");
  }
  return {
    position,
    board_status: "unranked",
    rank_status: UR_STATUS,
    performance_eligible: false,
    metrics: null,
    workflow_mode: null,
    display_group: "autonomous",
    workflow_provenance: "unassessed_grouping",
    identity_status: "not_publicly_listed",
    display_label: "SIGNED-UP OPERATOR",
  };
}
