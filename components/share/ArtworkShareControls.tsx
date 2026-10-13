"use client";

import { useState } from "react";
import "./artwork-share.css";

export function ArtworkShareControls({ target, title, filename, href, animated = false, backgroundColor = "#0b100b" }: {
  target: string; title: string; filename: string; href: string; animated?: boolean; backgroundColor?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const download = async (share: boolean, gif = false) => {
    const node = document.getElementById(target) ?? document.querySelector<HTMLElement>(target);
    if (!node || busy) return;
    setBusy(true);
    setMessage("");
    const restoreImages: (() => void)[] = [];
    node.setAttribute("data-artwork-export", gif ? "gif" : "true");
    try {
      await document.fonts.ready;
      for (const original of node.querySelectorAll<HTMLImageElement>("img")) {
        if (!original.currentSrc || new URL(original.currentSrc, location.href).origin === location.origin) continue;
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.src = original.currentSrc;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Image capture unavailable");
        context.drawImage(image, 0, 0);
        const source = original.getAttribute("src");
        const sourceSet = original.getAttribute("srcset");
        const embedded = canvas.toDataURL("image/png");
        restoreImages.push(() => {
          if (source !== null) original.setAttribute("src", source); else original.removeAttribute("src");
          if (sourceSet !== null) original.setAttribute("srcset", sourceSet);
        });
        original.removeAttribute("srcset");
        original.src = embedded;
        await original.decode();
      }
      const { toBlob } = await import("html-to-image");
      const options = { pixelRatio: 3, backgroundColor, cacheBust: false };
      if (navigator.vendor.includes("Apple")) await toBlob(node, options);
      const blob = await toBlob(node, options);
      if (!blob) throw new Error("Image could not be rendered");
      const output = gif ? await (await import("./holocard-gif")).holocardGif(blob) : blob;
      const file = new File([output], `${filename}.${gif ? "gif" : "png"}`, { type: output.type });
      if (share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ title, files: [file] });
          return;
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") return;
        }
      }
      const url = URL.createObjectURL(output);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setMessage(share ? "Image downloaded—ready to share." : `${gif ? "GIF" : "PNG"} downloaded.`);
    } catch (error) {
      console.warn("Artwork export failed", error);
      if (!(error instanceof Error && error.name === "AbortError")) setMessage("Could not render the image. Please try again.");
    } finally {
      restoreImages.forEach(restore => restore());
      node.removeAttribute("data-artwork-export");
      setBusy(false);
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(new URL(href, "https://signalaf.com").href);
      setMessage("Link copied.");
    } catch { setMessage("Clipboard unavailable. Copy this page’s address."); }
  };
  return <div className="artwork-share-controls">
    <button type="button" disabled={busy} onClick={() => download(true)}>{busy ? "Rendering…" : `Share ${title}`}</button>
    <button type="button" disabled={busy} onClick={() => download(false)}>Download PNG</button>
    {animated && <button type="button" disabled={busy} onClick={() => download(false, true)}>Download GIF</button>}
    <button type="button" onClick={copy}>Copy link</button>
    <span role="status">{message}</span>
  </div>;
}
