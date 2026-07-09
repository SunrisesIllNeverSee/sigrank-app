import React from "react";

interface Props {
  /** The placeholder value to display. */
  value: React.ReactNode;
  /** Tooltip text explaining why this value is a placeholder. */
  title?: string;
}

/**
 * Placeholder marker. Renders a value followed by a gold star superscript
 * indicating the number is not yet a real, verified value. The optional title
 * surfaces as a native tooltip on hover.
 */
export function Placeholder({
  value,
  title = "Placeholder — not a verified value",
}: Props) {
  return (
    <span title={title}>
      {value}
      <span className="ph">★</span>
    </span>
  );
}
