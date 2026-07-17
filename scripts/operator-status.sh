#!/usr/bin/env bash
# operator-status.sh — internal admin script for tracking claimed/retired operators.
# Queries Supabase directly and prints a summary. Run locally, never deployed.
#
# Usage: bash scripts/operator-status.sh
#
# Requires: .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
#           (or vercel-prod.env for production data)

set -euo pipefail

# ── Load env ──
ENV_FILE="${1:-.env.local}"
if [ ! -f "$ENV_FILE" ]; then
  # Try vercel-prod.env as fallback
  if [ -f "vercel-prod.env" ]; then
    ENV_FILE="vercel-prod.env"
  else
    echo "Error: No env file found. Pass path as arg or ensure .env.local exists."
    exit 1
  fi
fi

SB_URL=$(grep NEXT_PUBLIC_SUPABASE_URL "$ENV_FILE" | head -1 | sed 's/.*=//' | tr -d '"')
SB_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY "$ENV_FILE" | head -1 | sed 's/.*=//' | tr -d '"')

if [ -z "$SB_URL" ] || [ -z "$SB_KEY" ]; then
  echo "Error: Could not find Supabase URL or service key in $ENV_FILE"
  exit 1
fi

AUTH_HEADERS=(-H "apikey: $SB_KEY" -H "Authorization: Bearer $SB_KEY")

# ── Fetch data ──
echo "Fetching operator data from Supabase..."
echo ""

# All claimed operators
CLAIMED=$(curl -s "$SB_URL/rest/v1/operators?select=operator_id,codename,display_name,handle,claimed_at,status,verification_status,privacy_level,created_at&claimed=eq.true&order=claimed_at.asc" "${AUTH_HEADERS[@]}")

# All retired operators
RETIRED=$(curl -s "$SB_URL/rest/v1/operators?select=operator_id,codename,display_name,handle,status,privacy_level,created_at,claimed_at&status=eq.retired&order=created_at.asc" "${AUTH_HEADERS[@]}")

# All snapshots (paginate)
SNAP_PAGE1=$(curl -s "$SB_URL/rest/v1/metric_snapshots?select=operator_id,generated_at&order=generated_at.desc" "${AUTH_HEADERS[@]}" -H "Range: 0-999")
SNAP_PAGE2=$(curl -s "$SB_URL/rest/v1/metric_snapshots?select=operator_id,generated_at&order=generated_at.desc" "${AUTH_HEADERS[@]}" -H "Range: 1000-1999")
SNAP_PAGE3=$(curl -s "$SB_URL/rest/v1/metric_snapshots?select=operator_id,generated_at&order=generated_at.desc" "${AUTH_HEADERS[@]}" -H "Range: 2000-2999")

# Save snapshots to temp
echo "$SNAP_PAGE1" > /tmp/_snap1.json
echo "$SNAP_PAGE2" > /tmp/_snap2.json
echo "$SNAP_PAGE3" > /tmp/_snap3.json
jq -s 'add' /tmp/_snap1.json /tmp/_snap2.json /tmp/_snap3.json > /tmp/_all_snaps.json
rm -f /tmp/_snap1.json /tmp/_snap2.json /tmp/_snap3.json

# Counts
TOTAL_OPS=$(curl -s -I "$SB_URL/rest/v1/operators?select=operator_id" "${AUTH_HEADERS[@]}" -H "Prefer: count=exact" | grep -i content-range | sed 's/.*\///' | tr -d '\r')
TOTAL_SNAPS=$(jq 'length' /tmp/_all_snaps.json)

# ── Print summary ──
echo "═══════════════════════════════════════════════════════════════"
echo "  SigRank Operator Status — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Total operators:     $TOTAL_OPS"
echo "  Total snapshots:     $TOTAL_SNAPS"
echo "  Claimed (enrolled):  $(echo "$CLAIMED" | jq 'length')"
echo "  Retired:             $(echo "$RETIRED" | jq 'length')"
echo ""

# ── Funnel: claimed → submitted → active ──
echo "─── ENROLLMENT FUNNEL ───"
echo ""

# Get claimed operator IDs that have snapshots
CLAIMED_IDS=$(echo "$CLAIMED" | jq -r '[.[].operator_id]')

# Get operator IDs that have snapshots
SUBMITTED_IDS=$(jq -r 'group_by(.operator_id) | map(.[0].operator_id) | .[]' /tmp/_all_snaps.json)

# Claimed operators with submissions
echo "$CLAIMED" | jq -r --arg submitted "$SUBMITTED_IDS" '
  ($submitted | split("\n")) as $s |
  .[] | select(.operator_id as $id | $s | index($id)) |
  "\(.codename)\t\(.display_name // "—")\t\(.handle // "—")"
' > /tmp/_claimed_submitted.txt

# Claimed operators without submissions
echo "$CLAIMED" | jq -r --arg submitted "$SUBMITTED_IDS" '
  ($submitted | split("\n")) as $s |
  .[] | select(.operator_id as $id | $s | index($id) | not) |
  "\(.codename)\t\(.display_name // "—")\t\(.handle // "—")"
' > /tmp/_claimed_nosub.txt

SUBMITTED_COUNT=$(wc -l < /tmp/_claimed_submitted.txt | tr -d ' ')
NOSUB_COUNT=$(wc -l < /tmp/_claimed_nosub.txt | tr -d ' ')

echo "  Claimed + submitted via MCP:  $SUBMITTED_COUNT"
echo "  Claimed but no submission:    $NOSUB_COUNT"
echo ""

echo "  ✓ Successfully submitted ($SUBMITTED_COUNT):"
echo ""
while IFS=$'\t' read -r codename name handle; do
  # Get submission stats
  OP_ID=$(echo "$CLAIMED" | jq -r --arg cn "$codename" '.[] | select(.codename == $cn) | .operator_id')
  DAYS=$(jq -r --arg id "$OP_ID" 'group_by(.operator_id) | map(select(.[0].operator_id == $id)) | map([.[].generated_at[:10]] | unique | length) | .[0] // 0' /tmp/_all_snaps.json)
  SUBS=$(jq -r --arg id "$OP_ID" 'group_by(.operator_id) | map(select(.[0].operator_id == $id)) | map(length) | .[0] // 0' /tmp/_all_snaps.json)
  LAST=$(jq -r --arg id "$OP_ID" 'group_by(.operator_id) | map(select(.[0].operator_id == $id)) | map([.[].generated_at[:10]] | sort | .[-1]) | .[0] // "—"' /tmp/_all_snaps.json)
  printf "    %-30s %-25s @%-20s days=%s subs=%s last=%s\n" "$name" "$codename" "$handle" "$DAYS" "$SUBS" "$LAST"
done < /tmp/_claimed_submitted.txt

echo ""
echo "  ✗ Enrolled but no MCP submission ($NOSUB_COUNT):"
echo ""
while IFS=$'\t' read -r codename name handle; do
  printf "    %-30s %-25s @%-20s\n" "$name" "$codename" "$handle"
done < /tmp/_claimed_nosub.txt

echo ""

# ── Retired operators ──
echo "─── RETIRED / REMOVED OPERATORS ───"
echo ""

# Categorize retired: seed→claim (has display_name + handle) vs opt-out (anonymous)
SEED_RETIRE=$(echo "$RETIRED" | jq -r '[.[] | select(.privacy_level == "public" and .display_name != null)] | length')
OPTOUT_RETIRE=$(echo "$RETIRED" | jq -r '[.[] | select(.privacy_level == "anonymous" or .display_name == null)] | length')

echo "  Seed→claim retirements (claim process):  $SEED_RETIRE"
echo "  Opt-out / removal requests:              $OPTOUT_RETIRE"
echo ""

echo "  Seed profiles retired when claimed ($SEED_RETIRE):"
echo ""
echo "$RETIRED" | jq -r '.[] | select(.privacy_level == "public" and .display_name != null) | "\(.codename)\t\(.display_name)\t\(.handle // "—")"' | while IFS=$'\t' read -r codename name handle; do
  printf "    %-30s @%-20s (was: %s)\n" "$name" "$handle" "$codename"
done

echo ""
echo "  Opt-out / removal requests ($OPTOUT_RETIRE):"
echo ""
echo "$RETIRED" | jq -r '.[] | select(.privacy_level == "anonymous" or .display_name == null) | "\(.codename)\t\(.display_name // "—")\t\(.handle // "—")\t\(.created_at[:10])"' | while IFS=$'\t' read -r codename name handle created; do
  printf "    %-30s @%-20s created=%s\n" "$codename" "$handle" "$created"
done

echo ""
echo "═══════════════════════════════════════════════════════════════"

# Cleanup
rm -f /tmp/_all_snaps.json /tmp/_claimed_submitted.txt /tmp/_claimed_nosub.txt
