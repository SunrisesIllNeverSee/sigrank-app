"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArtworkShareControls } from "./ArtworkShareControls";

export function UnifiedShare({ href, title = "SignalAF", imageHref, screenshotTarget, markdown = false, editorial = false, compact = false, label = "SHARE ↗", extras }: {
  href?: string; title?: string; imageHref?: string; screenshotTarget?: string; markdown?: boolean; editorial?: boolean; compact?: boolean; label?: string; extras?: ReactNode;
}) {
  const [open, setOpen] = useState(false), [status, setStatus] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({top: 0, left: 0});
  const toggle = () => {
    if (!open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: Math.min(Math.max(8, r.bottom + 6), window.innerHeight - 150),
        left: Math.max(8, Math.min(window.innerWidth - 268, r.right - 260)),
      });
    }
    setOpen(!open);
  };
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node) && !menuRef.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); root.current?.querySelector<HTMLButtonElement>("button")?.focus(); } };
    document.addEventListener("pointerdown", close); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, [open]);
  const link = () => new URL(href || window.location.pathname + window.location.search, window.location.href).href;
  const image = () => {
    const og = document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content;
    const source = imageHref || og;
    return source ? new URL(source, window.location.origin).href : "";
  };
  const shareTitle = () => editorial && title === "SignalAF · Article" ? document.title : title;
  const copy = async (value: string, message: string) => {
    try { await navigator.clipboard.writeText(value); setStatus(message); } catch { setStatus("Clipboard unavailable."); }
  };
  const go = (u: string) => { window.open(u, "_blank", "noopener,noreferrer"); setStatus("Opened share composer."); };
  const capture = async (asFile: boolean) => {
    const node = document.querySelector<HTMLElement>(screenshotTarget || "main.stage");
    if (!node) { setStatus("No screenshot surface available."); return; }
    try {
      setStatus("Rendering screenshot…");
      await document.fonts.ready;
      const { toBlob } = await import("html-to-image");
      const blob = await toBlob(node, { pixelRatio: 2, backgroundColor: "#0a100c", cacheBust: false });
      if (!blob) throw Error("Empty screenshot");
      const file = new File([blob], "signalaf-stage.png", { type: "image/png" });
      if (asFile && navigator.canShare?.({files:[file]})) {
        try { await navigator.share({title, files:[file]}); setStatus("Shared screenshot."); return; }
        catch (e) { if (e instanceof Error && e.name === "AbortError") return; }
      }
      const u = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = u; a.download = file.name; a.click();
      setTimeout(() => URL.revokeObjectURL(u), 60000); setStatus("Screenshot downloaded.");
    } catch { setStatus("Screenshot failed. Existing image export remains available."); }
  };
  const actions = [
    { name: "X", icon: "𝕏", act: () => go("https://twitter.com/intent/tweet?text=" + encodeURIComponent(shareTitle()) + "&url=" + encodeURIComponent(link())) },
    { name: "LinkedIn", icon: "in", act: () => go("https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(link())) },
    { name: "Facebook", icon: "f", act: () => go("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(link())) },
    { name: "Pinterest", icon: "P", act: () => image() ? go("https://pinterest.com/pin/create/button/?url=" + encodeURIComponent(link()) + "&media=" + encodeURIComponent(image()) + "&description=" + encodeURIComponent(shareTitle())) : setStatus("Pinterest requires a public share image.") },
    { name: "Instagram", icon: "◎", act: () => { void capture(true); } },
    { name: "GitHub", icon: "⌘", act: () => { void copy(image() ? "[![" + shareTitle() + "](" + image() + ")](" + link() + ")" : "[" + shareTitle() + "](" + link() + ")", "Markdown embed copied."); } },
    { name: "Email", icon: "✉", act: () => { window.location.href = "mailto:?subject=" + encodeURIComponent(shareTitle()) + "&body=" + encodeURIComponent(link()); } },
    { name: "Copy Link", icon: "🔗", act: () => { void copy(link(), "Link copied."); } },
  ];
  return <div ref={root} className="unified-share" style={{ position:"relative", display:"inline-block" }}>
    <button ref={triggerRef} type="button" aria-expanded={open} aria-haspopup="true" onClick={toggle}
      style={{ border:"1px solid #536b50", borderRadius:4, color:"inherit", background:"transparent", padding:compact?"5px 7px":"7px 10px", font:"inherit", cursor:"pointer" }}>{label}</button>
    {open && typeof document !== "undefined" && createPortal(<div ref={menuRef} role="group" aria-label="Share destinations" className="unified-share-menu"
      style={{ display:"block", position:"fixed", top:coords.top, left:coords.left, zIndex:2147483000, padding:8, width:260, maxWidth:"90vw", maxHeight:"70vh", overflowY:"auto", color:"#e8eedf", background:"#0c140e", border:"1px solid #526b4e", borderRadius:4 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:3 }}>
        {actions.filter(a => !editorial || ["X", "LinkedIn", "Email", "Copy Link"].includes(a.name)).map(a=><button key={a.name} type="button" title={a.name} aria-label={"Share via "+a.name} onClick={a.act}
          style={{ border:0, background:"transparent", color:"inherit", minHeight:48, cursor:"pointer" }}><b style={{ display:"block", fontSize:19 }}>{a.icon}</b><span style={{ fontSize:9 }}>{a.name}</span></button>)}
      </div>
      {markdown && <button type="button" onClick={() => { void copy("["+shareTitle()+"]("+link()+")", "Markdown copied."); }}
        style={{ background:"transparent", border:"1px solid #536b50", color:"inherit", padding:7, width:"100%" }}>COPY MARKDOWN</button>}
      {screenshotTarget && <ArtworkShareControls target={screenshotTarget} title="stage screenshot"
        filename="signalaf-stage-screenshot" href={href || "/board/all"} />}
      {extras && <div className="unified-share-extras" style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6, borderTop: "1px solid #3a503b", paddingTop: 6 }}>{extras}</div>}
      <p role="status" style={{ fontSize:10, margin:"5px 0 0" }}>{status || "Choose a destination"}</p>
    </div>, document.body)}
  </div>;
}
