"use client";

import { useEffect, useRef, useState } from "react";

export function usePixelWordmark<T extends HTMLElement>() {
  const themeRef = useRef<T>(null);
  const [isPixel, setIsPixel] = useState(false);

  useEffect(() => {
    const root = themeRef.current?.closest(".lbw-root") ?? document.documentElement;
    const check = () => {
      const theme = root.getAttribute("data-theme");
      setIsPixel(theme === "green" || theme === "gold" || theme === "terminal" || theme === "carbon");
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return { isPixel, themeRef };
}
