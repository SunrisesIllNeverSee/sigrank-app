"use client";

import { useSyncExternalStore } from "react";
import { ICON_SETS, type IconSetName } from "./PixelIcon";

const key = "lbw-icon-set";
const event = "lbw-icon-set-change";
let fallback: IconSetName = "pixel";
const serverSnapshot = (): IconSetName => "pixel";
const snapshot = (): IconSetName => {
  try {
    const saved = window.localStorage.getItem(key);
    return ICON_SETS.includes(saved as IconSetName) ? saved as IconSetName : fallback;
  } catch { return fallback; }
};
const subscribe = (update: () => void) => {
  window.addEventListener(event, update);
  window.addEventListener("storage", update);
  return () => { window.removeEventListener(event, update); window.removeEventListener("storage", update); };
};
const select = (value: IconSetName) => {
  fallback = value;
  try { window.localStorage.setItem(key, value); } catch { fallback = value; }
  window.dispatchEvent(new Event(event));
};
export function useRailIconSet(): readonly [IconSetName, (value: IconSetName) => void] {
  return [useSyncExternalStore(subscribe, snapshot, serverSnapshot), select];
}
