#!/usr/bin/env node

// Service-role-only operator assessment. No telemetry payload is printed.
import { createClient } from "@supabase/supabase-js";

const [action, arg, evidence] = process.argv.slice(2);
const usage = "Usage: node scripts/assess-board-workflow.mjs list <codename> | link <metric-uuid> <submission-uuid> | set-agentic <submission-uuid> <https-evidence-url> | clear <submission-uuid>";
if (!["list", "link", "set-agentic", "clear"].includes(action) || !arg) {
  console.error(usage);
  process.exit(2);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Supabase URL and service role key are required in the local environment.");
  process.exit(2);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

if (action === "list") {
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(arg)) throw new Error("Invalid codename");
  const { data: op, error: opError } = await sb.from("operators_public")
    .select("operator_id").ilike("codename", arg).limit(1).maybeSingle();
  if (opError) throw opError;
  if (!op) throw new Error("Operator not found");
  const { data, error } = await sb.from("snapshot_submissions")
    .select("submission_id, submitted_at, window_type, platform, workflow_mode, workflow_evidence_url")
    .eq("operator_id", op.operator_id).eq("status", "scored")
    .order("submitted_at", { ascending: false }).limit(100);
  if (error) throw error;
  console.table(data ?? []);
  const { data: boardRows, error: boardError } = await sb.from("metric_snapshots")
    .select("metric_snapshot_id, snapshot_date, window_type, platform, source_submission_id")
    .eq("operator_id", op.operator_id).order("snapshot_date", { ascending: false }).limit(100);
  if (boardError) throw boardError;
  console.table(boardRows ?? []);
} else if (action === "link") {
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(arg) ||
      !evidence || !/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(evidence))
    throw new Error("Exact metric and submission UUIDs are required");
  const [{ data: m, error: me }, { data: s, error: se }] = await Promise.all([
    sb.from("metric_snapshots")
      .select("metric_snapshot_id, operator_id, snapshot_date, window_type, platform, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens")
      .eq("metric_snapshot_id", arg).maybeSingle(),
    sb.from("snapshot_submissions")
      .select("submission_id, operator_id, window_type, window_start, window_end, platform, status, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, workflow_mode, workflow_evidence_url, workflow_mode_version, mode_assessed_at")
      .eq("submission_id", evidence).maybeSingle(),
  ]);
  if (me || se) throw me ?? se;
  if (!m || !s || s.status !== "scored" || m.operator_id !== s.operator_id ||
      m.window_type !== s.window_type || m.platform !== s.platform ||
      m.snapshot_date !== s.window_end.slice(0, 10) ||
      ["input_tokens", "output_tokens", "cache_creation_tokens", "cache_read_tokens"]
        .some((field) => m[field] !== s[field]))
    throw new Error("The board row and scored submission do not match exactly");
  const { error } = await sb.from("metric_snapshots").update({
    source_submission_id: s.submission_id,
    window_start: s.window_start,
    window_end: s.window_end,
    workflow_mode: s.workflow_mode,
    workflow_evidence_url: s.workflow_evidence_url,
    workflow_mode_version: s.workflow_mode_version,
    mode_assessed_at: s.mode_assessed_at,
  }).eq("metric_snapshot_id", m.metric_snapshot_id);
  if (error) throw error;
  console.log(`${m.metric_snapshot_id}: linked to selected scored submission`);
} else {
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(arg)) throw new Error("Invalid submission UUID");
  if (action === "set-agentic") {
    if (!evidence || new URL(evidence).protocol !== "https:")
      throw new Error("An HTTPS workflow-evidence URL is required");
  }
  const values = action === "clear"
    ? { workflow_mode: null, workflow_evidence_url: null, workflow_mode_version: null, mode_assessed_at: null }
    : { workflow_mode: "agentic", workflow_evidence_url: evidence,
        workflow_mode_version: "board-mode/1", mode_assessed_at: new Date().toISOString() };
  const { data, error } = await sb.from("snapshot_submissions")
    .update(values).eq("submission_id", arg).eq("status", "scored")
    .select("submission_id, workflow_mode, workflow_evidence_url, mode_assessed_at").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Scored submission not found");
  console.log(`${data.submission_id}: ${data.workflow_mode ?? "unassigned"}`);
}
