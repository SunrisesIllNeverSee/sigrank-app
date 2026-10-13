"use client";

import { useEffect, useRef, useState } from "react";
import "./review-editor.css";

type Note = { id: string; path: string; selector: string; target: string; text: string; created: string; viewport: string; status: "Open" | "Fixed" };
type Pick = Omit<Note, "id" | "text" | "created" | "status">;
const storageKey = "signalaf-review-notes-v1";
function selectorFor(element: Element) {
  if (element.id) return `#${CSS.escape(element.id)}`;
  const parts: string[] = [];
  let current: Element | null = element;
  while (current && current.tagName !== "BODY" && parts.length < 5) {
    const siblings = current.parentElement ? Array.from(current.parentElement.children).filter(e => e.tagName === current!.tagName) : [];
    parts.unshift(`${current.tagName.toLowerCase()}:nth-of-type(${siblings.indexOf(current) + 1})`);
    current = current.parentElement;
  }
  return parts.join(" > ");
}
function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function MiniPreview({ path }: { path: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!container.current) return;
    const observer = new IntersectionObserver(entries => setVisible(entries[0].isIntersecting), { rootMargin: "160px" });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  return <div className="review-mini" ref={container}>{visible && <iframe src={path} title={`Mini preview ${path}`} tabIndex={-1} aria-hidden="true" sandbox="allow-same-origin allow-scripts" />}</div>;
}
export function ReviewEditor({ routes }: { routes: string[] }) {
  const [path, setPath] = useState("/");
  const [query, setQuery] = useState("");
  const [custom, setCustom] = useState("");
  const [mode, setMode] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [ready, setReady] = useState(false);
  const [pick, setPick] = useState<Pick | null>(null);
  const [draft, setDraft] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [loaded, setLoaded] = useState(0);
  const [selected, setSelected] = useState<{ element: Element; x: number; y: number; width: number; height: number } | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(saved)) setNotes(saved.filter(n => n && typeof n.path === "string" && typeof n.text === "string" && typeof n.id === "string"));
    } catch { setNotice("Could not read saved notes. Export your notes regularly."); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(storageKey, JSON.stringify(notes)); }
    catch { setNotice("Browser storage unavailable. Export notes before closing."); }
  }, [notes, ready]);
  useEffect(() => {
    const iframe = frame.current;
    if (!iframe) return;
    let doc: Document | null;
    try { doc = iframe.contentDocument; } catch { doc = null; }
    if (!doc) return;
    const click = (event: MouseEvent) => {
      if (!mode) return;
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
      const target = event.target as Element;
      if (!target?.tagName) return;
      const rect = target.getBoundingClientRect();
      const win = iframe.contentWindow;
      if (!win) return;
      setSelected({ element: target, x: rect.x, y: rect.y, width: rect.width, height: rect.height });
      setPick({ path: win.location.pathname + win.location.search + win.location.hash, selector: selectorFor(target), target: (target.textContent || target.getAttribute("aria-label") || target.tagName).trim().slice(0, 180), viewport: `${win.innerWidth}×${win.innerHeight}` });
      setDraft(""); setEditId(null);
    };
    const move = () => setSelected(prev => {
      if (!prev || !prev.element.isConnected) return null;
      const r = prev.element.getBoundingClientRect();
      return { ...prev, x: r.x, y: r.y, width: r.width, height: r.height };
    });
    doc.addEventListener("click", click, true);
    doc.addEventListener("scroll", move, true);
    iframe.contentWindow?.addEventListener("resize", move);
    return () => {
      doc?.removeEventListener("click", click, true);
      doc?.removeEventListener("scroll", move, true);
      iframe.contentWindow?.removeEventListener("resize", move);
    };
  }, [mode, loaded]);
  const save = () => {
    if (!pick || !draft.trim()) return;
    setNotes(prev => editId ? prev.map(n => n.id === editId ? { ...n, ...pick, text: draft.trim() } : n) : [...prev, { ...pick, id: crypto.randomUUID(), text: draft.trim(), created: new Date().toISOString(), status: "Open" }]);
    setPick(null); setSelected(null); setDraft(""); setEditId(null);
  };
  const open = (value: string) => {
    try {
      const url = new URL(value, location.origin);
      if (url.origin !== location.origin || url.pathname.startsWith("/editor")) throw new Error("invalid");
      setPath(url.pathname + url.search + url.hash); setPick(null); setSelected(null); setNotice("");
    } catch { setNotice("Enter a page path on this site, such as /compare?a=…"); }
  };
  const exportMarkdown = () => download("signalaf-review.md", `# SignalAF page review\n\nExported ${new Date().toISOString()}\n\n` + notes.map((n, i) => `## ${i + 1}. ${n.path} — ${n.status}\n\n${n.text}\n\nTarget: ${n.target}\nSelector: \`${n.selector}\`\nViewport: ${n.viewport}\nRecorded: ${n.created}\n\n- Resolution / answer:\n- Code location / commit:\n- Verification:\n`).join("\n"), "text/markdown");
  return <div className="review-editor">
    <aside className="review-pages">
      <h1>Site review</h1><p>{routes.length} page entries · local editor</p>
      <input aria-label="Find a page" placeholder="Find a page…" value={query} onChange={e => setQuery(e.target.value)} />
      <form onSubmit={e => { e.preventDefault(); open(custom); }}><input aria-label="Custom page path" placeholder="Add a page or query…" value={custom} onChange={e => setCustom(e.target.value)} /><button>Open</button></form>
      <div className="review-page-list">{routes.filter(r => r.toLowerCase().includes(query.toLowerCase())).map(route => <button key={route} className={route === path ? "is-active" : ""} onClick={() => open(route)}>
        <MiniPreview path={route} />
        <strong>{route}</strong><span>{notes.filter(n => n.path.split(/[?#]/)[0] === route.split(/[?#]/)[0]).length} notes</span>
      </button>)}</div>
    </aside>
    <section className="review-canvas">
      <header><strong>{path}</strong><button aria-pressed={!mode} onClick={() => setMode(false)}>Browse</button><button aria-pressed={mode} onClick={() => setMode(true)}>Annotate</button><a href={path} target="_blank" rel="noreferrer">Open page ↗</a></header>
      <div className="review-frame">
        <iframe ref={frame} src={path} title="Page under review" onLoad={() => { setLoaded(v => v + 1); setSelected(null); }} />
        {selected && mode && <div className="review-selection" style={{ left: selected.x, top: selected.y, width: selected.width, height: selected.height }} />}
      </div>
    </section>
    <aside className="review-notes">
      <h2>Edits · {notes.length}</h2><p>Notes stay in this browser. Export to preserve them and hand off the fixes.</p>
      <div className="review-exports"><button onClick={exportMarkdown}>Export checklist</button><button onClick={() => download("signalaf-review.json", JSON.stringify(notes, null, 2), "application/json")}>Export JSON</button></div>
      {notice && <p role="status">{notice}</p>}
      {pick ? <form onSubmit={e => { e.preventDefault(); save(); }}><h3>Selected element</h3><p>{pick.target}</p><textarea aria-label="Edit instruction" placeholder="Describe what needs changing…" value={draft} onChange={e => setDraft(e.target.value)} autoFocus required /><button>Save edit</button><button type="button" onClick={() => { setPick(null); setSelected(null); }}>Cancel</button></form> : <p>{mode ? "Click an element in the page to add an edit." : "Browse links normally. Switch to Annotate to mark an element."}</p>}
      <div className="review-note-list">{notes.map((n, i) => <article key={n.id}><h3>{i + 1}. {n.path}</h3><p>{n.text}</p><small>{n.target}</small><label>Status<select value={n.status} onChange={e => setNotes(prev => prev.map(item => item.id === n.id ? { ...item, status: e.target.value as Note["status"] } : item))}><option>Open</option><option>Fixed</option></select></label><button onClick={() => open(n.path)}>Review page</button><button onClick={() => { setPick(n); setDraft(n.text); setEditId(n.id); }}>Edit note</button></article>)}</div>
    </aside>
  </div>;
}
