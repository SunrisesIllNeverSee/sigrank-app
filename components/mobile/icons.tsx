/** Small stroke icons for the phone chrome (currentColor, 22px box). */
const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 22 22",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
  focusable: false as const,
};

export const IconBoard = () => (
  <svg {...base}>
    <path d="M4 18V11M9.7 18V4M15.3 18V8M20 18H2" />
  </svg>
);
export const IconCompare = () => (
  <svg {...base}>
    <path d="M3.5 7h14M14 3.5 17.5 7 14 10.5M18.5 15h-14M8 11.5 4.5 15 8 18.5" />
  </svg>
);
export const IconProfile = () => (
  <svg {...base}>
    <circle cx="11" cy="7.5" r="3.6" />
    <path d="M3.8 19c.8-3.6 3.6-5.4 7.2-5.4s6.4 1.8 7.2 5.4" />
  </svg>
);
export const IconSearch = () => (
  <svg {...base}>
    <circle cx="9.5" cy="9.5" r="5.8" />
    <path d="m14 14 5 5" />
  </svg>
);
export const IconMenu = () => (
  <svg {...base}>
    <path d="M3.5 6h15M3.5 11h15M3.5 16h15" />
  </svg>
);
export const IconTheme = () => (
  <svg {...base}>
    <circle cx="11" cy="11" r="7" />
    <path d="M11 4a7 7 0 0 1 0 14Z" fill="currentColor" stroke="none" />
  </svg>
);
export const IconPanel = () => (
  <svg {...base}>
    <rect x="3" y="4" width="16" height="14" rx="2" />
    <path d="M13.5 4v14" />
  </svg>
);
