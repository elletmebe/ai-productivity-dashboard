/* MetricStrip.jsx — API 权威：recipes/components/MetricStrip.md
   3–4 个指标（信息量预算：第 5 个通常是凑数的）。本组件「自己就是一张卡」，
   放在别的卡内时传 embedded。
   Sparkline 默认中性数据墨色 —— 一条 strip 上逐条上色会凭空暗示分类含义。
   数字 count-up 560ms 是唯一允许超过 280ms 的动效，只跑一次不循环。 */
import React from "react";
import { Sparkline, TrendDelta, nf } from "./dataviz.jsx";
import { Tooltip } from "./atoms.jsx";

const reduceMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function useCountUp(target, run) {
  const [v, setV] = React.useState(run ? 0 : target);
  React.useEffect(() => {
    if (!run || reduceMotion() || typeof target !== "number") { setV(target); return; }
    const t0 = performance.now(), dur = 560;
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setV(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);
  return v;
}

export function MetricStrip({ items, density = "comfortable", animate = true, embedded = false, style }) {
  const compact = density === "compact";
  const shell = embedded ? { padding: 0 } : {
    background: "var(--color-surface-raised)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--th-radius-md)",
    boxShadow: "var(--th-shadow-card)",
    padding: compact ? 12 : 16,
  };
  return (
    <div style={{
      ...shell, display: "grid",
      gridTemplateColumns: `repeat(auto-fit, minmax(${compact ? 150 : 176}px, 1fr))`,
      gap: compact ? 12 : 16, minWidth: 0, ...style,
    }}>
      {items.map((it, i) => (
        <Metric key={it.key || it.label} item={it} animate={animate} compact={compact}
                divided={i > 0} />
      ))}
    </div>
  );
}

function Metric({ item, animate, compact, divided }) {
  const isNum = typeof item.value === "number";
  const shown = useCountUp(item.value, animate && isNum);
  const text = isNum ? (item.format ? item.format(shown) : nf(Math.round(shown))) : item.value;

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: compact ? 4 : 6, minWidth: 0,
      paddingLeft: divided ? 16 : 0,
      borderLeft: divided ? "1px solid var(--color-divider)" : "none",
    }}>
      <span style={{
        display: "flex", alignItems: "center", gap: 5,
        fontSize: "var(--th-text-xs)", color: "var(--color-fg-muted)", minWidth: 0,
      }}>
        {item.icon && <i className={item.icon} aria-hidden="true" style={{ fontSize: 14 }} />}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
        {item.hint && (
          <Tooltip text={item.hint}>
            <i className="ri-information-line" aria-label="指标口径"
               style={{ fontSize: 13, color: "var(--color-fg-subtle)", cursor: "help" }} />
          </Tooltip>
        )}
      </span>

      <span style={{ display: "flex", alignItems: "baseline", gap: 4, minWidth: 0 }}>
        {item.prefix && <span style={{ fontSize: "var(--th-text-sm)", color: "var(--color-fg-muted)" }}>{item.prefix}</span>}
        <span className="th-nums" style={{
          fontSize: "var(--th-text-xl)", fontWeight: 600, color: "var(--color-fg)",
          lineHeight: 1.15, letterSpacing: "-0.01em",
        }}>{text}</span>
        {item.suffix && <span style={{ fontSize: "var(--th-text-xs)", color: "var(--color-fg-muted)" }}>{item.suffix}</span>}
      </span>

      <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, minHeight: 20 }}>
        {item.delta != null && <TrendDelta value={item.delta} tone={item.deltaTone} />}
        {item.caption && (
          <span style={{ fontSize: "var(--th-text-2xs)", color: "var(--color-fg-subtle)", whiteSpace: "nowrap" }}>
            {item.caption}
          </span>
        )}
        {item.series?.length > 1 && (
          <span style={{ marginLeft: "auto", flexShrink: 0 }}>
            <Sparkline data={item.series} tone={item.sparkTone || "neutral"} width={compact ? 52 : 64} height={20} />
          </span>
        )}
      </span>
    </div>
  );
}
