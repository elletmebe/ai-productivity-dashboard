/* DataTable.jsx — API 权威：recipes/components/DataTable.md
   本组件「自己就是一张卡」：直接放，或在需要卡头/分页条时包一层卡并传 embedded
   （DESIGN.md 组件嵌套 — 一个边界只画一次）。
   heat 列按 --th-heat-0…4 上色，用量列一眼读出轻重；表头 --color-table-head。 */
import React from "react";

const HEAT = ["var(--th-heat-0)", "var(--th-heat-1)", "var(--th-heat-2)", "var(--th-heat-3)", "var(--th-heat-4)"];

export function DataTable({
  columns, rows, rowKey = "id", density = "comfortable",
  striped = false, hoverable = true, animate = true, embedded = false,
}) {
  const compact = density === "compact";
  const rowH = compact ? 36 : 44;
  const padY = compact ? 7 : 12;
  const padX = compact ? 12 : 16;

  const heatScale = React.useMemo(() => {
    const out = {};
    columns.forEach((c) => {
      if (!c.heat) return;
      const read = c.heatValue || ((r) => Number(r[c.key]) || 0);
      const vals = rows.map(read);
      const cfg = typeof c.heat === "object" ? c.heat : {};
      out[c.key] = { min: cfg.min ?? Math.min(...vals, 0), max: cfg.max ?? Math.max(...vals, 1), read };
    });
    return out;
  }, [columns, rows]);

  const tracks = columns.map((c) => c.width || "1fr").join(" ");

  const shell = embedded ? {} : {
    background: "var(--color-surface-raised)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--th-radius-md)",
    boxShadow: "var(--th-shadow-card)",
    overflow: "hidden",
  };

  return (
    <div role="table" style={{ ...shell, minWidth: 0, width: "100%" }}>
      <div role="row" style={{
        display: "grid", gridTemplateColumns: tracks, alignItems: "center",
        background: "var(--color-table-head)",
        borderBottom: "1px solid var(--color-border)",
        height: compact ? 32 : 38, padding: `0 ${padX}px`, gap: 12,
      }}>
        {columns.map((c) => (
          <span key={c.key} role="columnheader" style={{
            fontFamily: "var(--th-font-cn)", fontSize: "var(--th-text-xs)",
            color: "var(--color-fg-muted)", fontWeight: 500,
            textAlign: c.align || (c.heat ? "right" : "left"),
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{c.label}</span>
        ))}
      </div>

      <div className={animate ? "th-stagger" : undefined}>
        {rows.map((r, ri) => (
          <div
            key={r[rowKey] ?? ri} role="row"
            style={{
              display: "grid", gridTemplateColumns: tracks, alignItems: "center",
              minHeight: rowH, padding: `${padY}px ${padX}px`, gap: 12,
              borderBottom: ri === rows.length - 1 ? "none" : "1px solid var(--color-divider)",
              background: striped && ri % 2 ? "var(--color-table-head)" : "transparent",
              transition: "background var(--th-dur-1) var(--th-ease)",
            }}
            onMouseEnter={(e) => { if (hoverable) e.currentTarget.style.background = "var(--color-row-hover)"; }}
            onMouseLeave={(e) => {
              if (hoverable) e.currentTarget.style.background = striped && ri % 2 ? "var(--color-table-head)" : "transparent";
            }}
          >
            {columns.map((c) => {
              const content = c.render ? c.render(r) : r[c.key];
              const align = c.align || (c.heat ? "right" : "left");
              if (c.heat) {
                const s = heatScale[c.key];
                const v = s.read(r);
                const step = v <= s.min ? 0 : Math.min(4, Math.max(1, Math.ceil(((v - s.min) / ((s.max - s.min) || 1)) * 4)));
                return (
                  <span key={c.key} role="cell" style={{ display: "flex", justifyContent: "flex-end", minWidth: 0 }}>
                    <span className="th-nums" style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "flex-end",
                      background: HEAT[step], color: "var(--th-gray-900)",
                      padding: "3px 8px", borderRadius: "var(--th-radius-xs)",
                      fontSize: "var(--th-text-xs)", fontWeight: 500,
                      whiteSpace: "nowrap", lineHeight: 1.2, minWidth: 52,
                    }}>{content}</span>
                  </span>
                );
              }
              return (
                <span key={c.key} role="cell" style={{
                  fontFamily: "var(--th-font-cn)", fontSize: "var(--th-text-xs)",
                  color: "var(--color-fg)", textAlign: align,
                  justifySelf: align === "right" ? "end" : align === "center" ? "center" : "stretch",
                  minWidth: 0, overflow: "hidden", textOverflow: "ellipsis",
                  display: "flex", alignItems: "center", gap: 6,
                  justifyContent: align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start",
                }}>{content}</span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
