"use client";

import React from "react";
import { colors, fonts, radius } from "./tokens";
import type { MetricView } from "./types";

interface Tab {
  id: MetricView;
  label: string;
}

interface Props {
  active: MetricView;
  onChange: (view: MetricView) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const TABS: Tab[] = [
  { id: "yield", label: "Υ Yield" },
  { id: "leverage", label: "Leverage" },
  { id: "snr", label: "SNR" },
  { id: "dev10x", label: "10xDEV" },
  { id: "compression-ratio", label: "Compression" },
  { id: "message-volume", label: "Messages" },
  { id: "session-depth", label: "Depth" },
];

export function MetricTabs({
  active,
  onChange,
  page = 1,
  totalPages = 3,
  onPageChange,
}: Props) {
  return (
    <div style={styles.wrapper}>
      <div style={styles.tabRow}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              ...styles.tab,
              ...(active === tab.id ? styles.tabActive : styles.tabInactive),
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            style={styles.pageBtn}
            onClick={() => onPageChange?.(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            ‹
          </button>
          <span style={styles.pageLabel}>
            Page {page} of {totalPages}
          </span>
          <button
            style={styles.pageBtn}
            onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    padding: "8px 0",
    borderBottom: `1px solid ${colors.bg.border}`,
    flexWrap: "wrap",
  },
  tabRow: {
    display: "flex",
    gap: "4px",
    flexWrap: "wrap",
  },
  tab: {
    fontFamily: fonts.sans,
    fontSize: "12px",
    fontWeight: 500,
    padding: "5px 12px",
    borderRadius: radius.sm,
    border: "none",
    cursor: "pointer",
    transition: "all 0.15s",
    letterSpacing: "0.02em",
  },
  tabActive: {
    background: colors.bg.elevated,
    color: colors.text.accent,
    border: `1px solid ${colors.bg.border}`,
    outline: `1px solid ${colors.text.accent}30`,
  },
  tabInactive: {
    background: "transparent",
    color: colors.text.secondary,
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  pageBtn: {
    background: colors.bg.elevated,
    border: `1px solid ${colors.bg.border}`,
    color: colors.text.secondary,
    borderRadius: radius.sm,
    width: "22px",
    height: "22px",
    cursor: "pointer",
    fontFamily: fonts.sans,
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  pageLabel: {
    fontFamily: fonts.mono,
    fontSize: "11px",
    color: colors.text.muted,
  },
};
