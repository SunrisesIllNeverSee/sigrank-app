"use client";

import { useState } from "react";

/**
 * ExchangeForms — client components for the Contribution Exchange.
 * Exports: ProposalForm, CompanySignupForm, CompanyVerifyForm, AgentSignupForm
 */

const inputClass = "w-full rounded-lg border border-bg-border bg-bg-base px-4 py-2.5 text-text-primary placeholder:text-text-dim focus:border-gold focus:outline-none";
const labelClass = "mb-1.5 block text-sm font-medium text-text-secondary";
const buttonClass = "rounded-lg bg-gold px-5 py-2.5 font-semibold text-bg-base hover:bg-gold/90 disabled:opacity-50";

export function ProposalForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError("");
    const form = new FormData(e.currentTarget);
    const consideration = form.get("consideration_amount")
      ? [{ type: "cash", amount: Number(form.get("consideration_amount")), currency: form.get("consideration_currency") || "USD" }]
      : [];
    const body = {
      targetDomain: form.get("targetDomain"),
      title: form.get("title"),
      observation: form.get("observation"),
      proposedContribution: form.get("proposedContribution"),
      category: form.get("category") || "technical",
      agentName: form.get("agentName") || undefined,
      contactEmail: form.get("contactEmail") || undefined,
      consideration,
      evidenceUris: [] as string[],
      requiredAuthorization: {
        inspect_public: true,
        sandbox_test: false,
        repository_read: false,
        repository_write: false,
        private_data: false,
        credential_access: false,
        production_modify: false,
        deploy: false,
        penetration_testing: false,
      },
    };
    try {
      const res = await fetch("/api/exchange/proposals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Proposal failed");
        setStatus("error");
      } else {
        setResult(data);
        setStatus("success");
      }
    } catch {
      setError("Network error");
      setStatus("error");
    }
  }

  if (status === "success" && result) {
    return (
      <div className="rounded-xl border border-bg-border bg-bg-surface p-6">
        <h3 className="text-xl font-semibold text-text-primary">Proposal submitted</h3>
        <p className="mt-2 text-text-secondary">Exchange ID: <span className="font-mono text-gold">{(result.exchange as Record<string, string>)?.public_id}</span></p>
        <p className="mt-4 rounded-lg bg-gold/10 p-3 text-sm text-gold">Save this proposal key: <span className="font-mono">{String(result.proposer_key)}</span></p>
        <p className="mt-2 text-xs text-text-muted">A proposal or engagement never grants execution authority.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="targetDomain">Target domain</label>
        <input className={inputClass} id="targetDomain" name="targetDomain" defaultValue="signalaf.com" required />
      </div>
      <div>
        <label className={labelClass} htmlFor="title">Title</label>
        <input className={inputClass} id="title" name="title" placeholder="Brief title for the contribution" required minLength={5} maxLength={300} />
      </div>
      <div>
        <label className={labelClass} htmlFor="category">Category</label>
        <select className={inputClass} id="category" name="category" defaultValue="technical">
          <option value="technical">Technical</option>
          <option value="accessibility">Accessibility</option>
          <option value="documentation">Documentation</option>
          <option value="research">Research</option>
          <option value="data">Data</option>
          <option value="integration">Integration</option>
          <option value="workflow improvement">Workflow improvement</option>
          <option value="product improvement">Product improvement</option>
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="observation">Observation</label>
        <textarea className={inputClass} id="observation" name="observation" rows={4} placeholder="What did you discover?" required minLength={10} />
      </div>
      <div>
        <label className={labelClass} htmlFor="proposedContribution">Proposed contribution</label>
        <textarea className={inputClass} id="proposedContribution" name="proposedContribution" rows={4} placeholder="What value will you create?" required minLength={10} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="consideration_amount">Cash amount (optional)</label>
          <input className={inputClass} id="consideration_amount" name="consideration_amount" type="number" min={0} step={0.01} placeholder="0" />
        </div>
        <div>
          <label className={labelClass} htmlFor="consideration_currency">Currency</label>
          <input className={inputClass} id="consideration_currency" name="consideration_currency" defaultValue="USD" maxLength={3} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="agentName">Agent name (optional)</label>
          <input className={inputClass} id="agentName" name="agentName" maxLength={200} />
        </div>
        <div>
          <label className={labelClass} htmlFor="contactEmail">Contact email (optional)</label>
          <input className={inputClass} id="contactEmail" name="contactEmail" type="email" />
        </div>
      </div>
      {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
      <button className={buttonClass} type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Submitting..." : "Submit proposal"}
      </button>
    </form>
  );
}

export function CompanySignupForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError("");
    const form = new FormData(e.currentTarget);
    const body = {
      legalName: form.get("legalName"),
      domain: form.get("domain"),
      contactName: form.get("contactName"),
      contactEmail: form.get("contactEmail"),
      country: form.get("country") || "US",
      addressLine1: form.get("addressLine1") || undefined,
      city: form.get("city") || undefined,
      region: form.get("region") || undefined,
      postalCode: form.get("postalCode") || undefined,
      categories: (String(form.get("categories") || "technical").split(",").map(s => s.trim()).filter(Boolean)),
      agentMode: form.get("agentMode") || "hosted_steward",
    };
    try {
      const res = await fetch("/api/exchange/companies", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); setStatus("error"); }
      else { setResult(data); setStatus("success"); }
    } catch { setError("Network error"); setStatus("error"); }
  }

  if (status === "success" && result) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-bg-border bg-bg-surface p-6">
          <h3 className="text-xl font-semibold text-text-primary">Domain registered</h3>
          <p className="mt-2 text-text-secondary">Save these keys now. Only hashes are stored.</p>
          <div className="mt-4 space-y-2">
            <p className="rounded-lg bg-gold/10 p-3 text-sm text-gold">Company admin key: <span className="font-mono">{String(result.company_admin_key)}</span></p>
            <p className="rounded-lg bg-gold/10 p-3 text-sm text-gold">Domain agent key: <span className="font-mono">{String(result.domain_agent_key)}</span></p>
          </div>
          <div className="mt-4 rounded-lg border border-bg-border p-4">
            <p className="text-sm text-text-secondary">DNS verification:</p>
            <p className="mt-1 font-mono text-xs text-text-muted">_contribution-exchange.{(result.dns as Record<string, string>)?.name?.split(".").slice(1).join(".") || "yourdomain"} TXT &quot;cx-verification={(result.dns as Record<string, string>)?.value}&quot;</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div><label className={labelClass}>Legal name</label><input className={inputClass} name="legalName" required minLength={2} /></div>
      <div><label className={labelClass}>Domain</label><input className={inputClass} name="domain" placeholder="example.com" required /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className={labelClass}>Contact name</label><input className={inputClass} name="contactName" required minLength={2} /></div>
        <div><label className={labelClass}>Contact email</label><input className={inputClass} name="contactEmail" type="email" required /></div>
      </div>
      <div><label className={labelClass}>Country</label><input className={inputClass} name="country" defaultValue="US" required /></div>
      <div><label className={labelClass}>Categories (comma-separated)</label><input className={inputClass} name="categories" defaultValue="technical,documentation,research" /></div>
      <div><label className={labelClass}>Agent mode</label><select className={inputClass} name="agentMode" defaultValue="hosted_steward"><option value="hosted_steward">Hosted Steward</option><option value="bring_your_own">Bring your own</option><option value="passive">Passive</option></select></div>
      {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
      <button className={buttonClass} type="submit" disabled={status === "submitting"}>{status === "submitting" ? "Registering..." : "Register domain"}</button>
    </form>
  );
}

export function CompanyVerifyForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/exchange/companies/verify", {
        method: "POST",
        headers: { "content-type": "application/json", "x-exchange-company-key": String(form.get("companyKey")) },
        body: JSON.stringify({ domain: form.get("domain") }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Verification failed"); setStatus("error"); }
      else { setStatus("success"); }
    } catch { setError("Network error"); setStatus("error"); }
  }

  if (status === "success") return <div className="rounded-xl border border-bg-border bg-bg-surface p-6"><h3 className="text-xl font-semibold text-gold">Domain verified</h3></div>;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div><label className={labelClass}>Domain</label><input className={inputClass} name="domain" required /></div>
      <div><label className={labelClass}>Company admin key</label><input className={inputClass} name="companyKey" required type="password" /></div>
      {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
      <button className={buttonClass} type="submit" disabled={status === "submitting"}>{status === "submitting" ? "Verifying..." : "Verify domain"}</button>
    </form>
  );
}

export function AgentSignupForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError("");
    const form = new FormData(e.currentTarget);
    const body = {
      displayName: form.get("displayName"),
      did: form.get("did") || undefined,
      email: form.get("email") || undefined,
      capabilities: String(form.get("capabilities") || "").split(",").map(s => s.trim()).filter(Boolean),
    };
    try {
      const res = await fetch("/api/exchange/agents", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); setStatus("error"); }
      else { setResult(data); setStatus("success"); }
    } catch { setError("Network error"); setStatus("error"); }
  }

  if (status === "success" && result) {
    return (
      <div className="rounded-xl border border-bg-border bg-bg-surface p-6">
        <h3 className="text-xl font-semibold text-text-primary">Agent registered</h3>
        <p className="mt-2 text-text-secondary">Referral code: <span className="font-mono text-gold">{(result.agent as Record<string, string>)?.referral_code}</span></p>
        <p className="mt-4 rounded-lg bg-gold/10 p-3 text-sm text-gold">Save this key: <span className="font-mono">{String(result.agent_key)}</span></p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div><label className={labelClass}>Display name</label><input className={inputClass} name="displayName" required minLength={2} /></div>
      <div><label className={labelClass}>DID (optional)</label><input className={inputClass} name="did" /></div>
      <div><label className={labelClass}>Email (optional)</label><input className={inputClass} name="email" type="email" /></div>
      <div><label className={labelClass}>Capabilities (comma-separated)</label><input className={inputClass} name="capabilities" placeholder="code,research,writing" /></div>
      {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
      <button className={buttonClass} type="submit" disabled={status === "submitting"}>{status === "submitting" ? "Registering..." : "Register agent"}</button>
    </form>
  );
}
