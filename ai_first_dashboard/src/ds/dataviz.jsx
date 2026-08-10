/* dataviz.jsx — Sparkline / TrendDelta / RingGauge / Progress / Heatgrid /
                  TokenMeter / CostBreakdown
   API 权威：recipes/components/{Sparkline,RingGauge,Progress,Heatgrid,CostBreakdown}.md。

   取色分工（DESIGN.md 六类色分工，越界即违规）：
     微图表描边 / 空轨道 → --color-data-line / --color-data-track（不是 gray-300/50）
     一个总量被切开     → --color-stack-1…4 + --color-stack-0
     强度「多/少」      → --th-heat-0…4（冷紫单色阶）
     互不相干的系列条   → --th-chart-1…12 按序取色 */
import React from "react";

const reduceMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export const nf = (n, d = 0) =>
  Number(n).toLocaleString("zh-CN", { minimumFractionDigits: d, maximumFractionDigits: d });

/** 万 / 亿 紧凑格式，用于坐标轴、金额与代码行数。 */
export function compact(v) {
  const a = Math.abs(v);
  if (a >= 1e8) return (v / 1e8).toFixed(a >= 1e9 ? 0 : 1) + "亿";
  if (a >= 1e4) return (v / 1e4).toFixed(a >= 1e5 ? 0 : 1) + "万";
  return nf(v);
}

/** K / M / B 紧凑格式，只用于 token 数 —— PRD 全篇把 token 写成
 *  「16.5M 入」「12.4 M」「1.82 B」，这是该领域的既定读法，
 *  不转成万/亿。金额与代码行数仍走 compact()。 */
export function compactTokens(v) {
  const a = Math.abs(v);
  if (a >= 1e9) return { n: (v / 1e9).toFixed(2), u: "B" };
  if (a >= 1e6) return { n: (v / 1e6).toFixed(1), u: "M" };
  if (a >= 1e3) return { n: (v / 1e3).toFixed(1), u: "K" };
  return { n: nf(v), u: "" };
}
export const tokenText = (v) => {
  const { n, u } = compactTokens(v);
  return u ? `${n} ${u}` : n;
};

/* ── Sparkline ─────────────────────────────────────────────────────*/
const toneStroke = (tone) => {
  if (!tone || tone === "neutral") return "var(--color-data-line)";
  if (tone === "accent") return "var(--color-accent)";
  if (["success", "warning", "danger"].includes(tone)) return `var(--color-${tone}-solid)`;
  return `var(${tone})`;
};

export function Sparkline({ data = [], width = 64, height = 20, tone = "neutral", fill = false, dot = true }) {
  const pts = data.map((p) => (typeof p === "number" ? p : p.v));
  if (pts.length < 2) return <span style={{ display: "inline-block", width, height }} />;
  const min = Math.min(...pts), max = Math.max(...pts), span = max - min || 1;
  const pad = 2;
  const x = (i) => (i / (pts.length - 1)) * (width - pad * 2) + pad;
  const y = (v) => height - pad - ((v - min) / span) * (height - pad * 2);
  const d = pts.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(" ");
  const stroke = toneStroke(tone);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true"
         style={{ display: "block", overflow: "visible" }}>
      {fill && (
        <path d={`${d} L${x(pts.length - 1)},${height} L${x(0)},${height} Z`}
              fill={tone === "neutral" ? "var(--color-data-fill)" : stroke} opacity={tone === "neutral" ? 1 : 0.12} />
      )}
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {dot && <circle cx={x(pts.length - 1)} cy={y(pts[pts.length - 1])} r="2" fill={stroke} />}
    </svg>
  );
}

/* ── TrendDelta ────────────────────────────────────────────────────
   涨跌是「好/坏」判断 → 状态色的 -fg 档（写在文字上，不填形状）。
   成本 / 延迟 / 返工率这类「越高越差」的指标必须传 tone="inverse"。 */
export function TrendDelta({ value, tone = "auto", suffix = "", style }) {
  if (value == null) return null;
  const num = typeof value === "number" ? value : parseFloat(String(value));
  const up = num > 0;
  const good = tone === "neutral" ? null : tone === "inverse" ? !up : up;
  const color = good === null ? "var(--color-fg-muted)"
    : good ? "var(--color-success-fg)" : "var(--color-danger-fg)";
  const text = typeof value === "number"
    ? `${up ? "+" : ""}${nf(Math.abs(num) < 100 ? num : num, 1)}${suffix || "%"}`
    : value;
  return (
    <span className="th-nums" style={{
      display: "inline-flex", alignItems: "center", gap: 2, color,
      fontSize: "var(--th-text-xs)", fontWeight: 500, lineHeight: 1,
      whiteSpace: "nowrap", flexShrink: 0, ...style,
    }}>
      <i className={up ? "ri-arrow-up-line" : "ri-arrow-down-line"} aria-hidden="true" style={{ fontSize: 12 }} />
      {String(text).replace(/^[+-]/, "")}
    </span>
  );
}

/* ── RingGauge ─────────────────────────────────────────────────────*/
const HEAT = ["var(--th-heat-0)", "var(--th-heat-1)", "var(--th-heat-2)", "var(--th-heat-3)", "var(--th-heat-4)"];

export function RingGauge({ value = 0, size = 64, thickness = 6, tone = "accent", label = "%", animate = true, children }) {
  const [shown, setShown] = React.useState(animate && !reduceMotion() ? 0 : value);
  React.useEffect(() => {
    if (!animate || reduceMotion()) { setShown(value); return; }
    const t0 = performance.now(), dur = 560;
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      setShown(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, animate]);

  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, shown));
  const stroke = tone === "heat" ? HEAT[Math.min(4, Math.floor((value / 100) * 5))]
    : tone === "accent" ? "var(--color-accent)"
    : ["success", "warning", "danger"].includes(tone) ? `var(--color-${tone}-solid)`
    : `var(${tone})`;

  return (
    <span style={{ position: "relative", display: "inline-flex", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke="var(--color-data-track)" strokeWidth={thickness} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={stroke} strokeWidth={thickness} strokeLinecap="round"
                strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
      </svg>
      <span style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 0,
      }}>
        {children ?? (
          <span className="th-nums" style={{
            fontSize: size >= 72 ? "var(--th-text-md)" : "var(--th-text-sm)",
            fontWeight: 600, color: "var(--color-fg)", lineHeight: 1,
          }}>{Math.round(pct)}<span style={{ fontSize: "var(--th-text-2xs)", fontWeight: 500 }}>{label}</span></span>
        )}
      </span>
    </span>
  );
}

/* ── Progress ──────────────────────────────────────────────────────*/
export function Progress({ value = 0, max = 100, label, caption, showValue = false, tone = "accent", size = "md", style }) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  const fill = tone === "accent" ? "var(--color-accent)" : `var(--color-${tone}-solid)`;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0, ...style }}>
      {(label || caption || showValue) && (
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
          {label && <span style={{ fontSize: "var(--th-text-xs)", color: "var(--color-fg-muted)" }}>{label}</span>}
          {(caption || showValue) && (
            <span className="th-nums" style={{ fontSize: "var(--th-text-xs)", color: "var(--color-fg)", fontWeight: 500 }}>
              {caption ?? `${Math.round(pct)}%`}
            </span>
          )}
        </div>
      )}
      <div style={{
        height: size === "sm" ? 4 : 8, borderRadius: 999,
        background: "var(--color-data-track)", overflow: "hidden",
      }}>
        <div style={{
          width: `${pct}%`, height: "100%", background: fill, borderRadius: 999,
          transition: "width var(--th-dur-3) var(--th-ease-out)",
        }} />
      </div>
    </div>
  );
}

/* ── Heatgrid ──────────────────────────────────────────────────────
   强度色阶：整屏 ≤1 处（视觉预算）。 */
export function Heatgrid({ data = [], columns = 7, cellSize = 12, gap = 3, min, max }) {
  const cells = data.map((d) => (typeof d === "number" ? { v: d } : d));
  const vals = cells.map((c) => c.v);
  const lo = min ?? Math.min(...vals, 0);
  const hi = max ?? Math.max(...vals, 1);
  const step = (v) => (v <= lo ? 0 : Math.min(4, Math.max(1, Math.ceil(((v - lo) / ((hi - lo) || 1)) * 4))));
  return (
    <div style={{
      display: "grid", gridTemplateColumns: `repeat(${columns}, ${cellSize}px)`,
      gap, width: "max-content",
    }}>
      {cells.map((c, i) => (
        <span key={i} title={c.label ?? String(c.v)} style={{
          width: cellSize, height: cellSize, borderRadius: 2,
          background: HEAT[step(c.v)], display: "block",
        }} />
      ))}
    </div>
  );
}

/** 热力图例：Less → More 共 5 档（PRD 个人看板明确要求）。 */
export function HeatLegend({ lessLabel = "少", moreLabel = "多", cellSize = 10 }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: "var(--th-text-2xs)", color: "var(--color-fg-muted)" }}>{lessLabel}</span>
      {HEAT.map((c, i) => (
        <span key={i} style={{ width: cellSize, height: cellSize, borderRadius: 2, background: c, display: "block" }} />
      ))}
      <span style={{ fontSize: "var(--th-text-2xs)", color: "var(--color-fg-muted)" }}>{moreLabel}</span>
    </span>
  );
}

/* ── TokenMeter ────────────────────────────────────────────────────
   一个总量被切开 → 构成色阶，按阅读顺序由浅到深；上限 4 段 + 余量。 */
const STACK = ["var(--color-stack-1)", "var(--color-stack-2)", "var(--color-stack-3)", "var(--color-stack-4)"];

export function TokenMeter({
  segments = [], residual, residualLabel = "缓存命中",
  height = 8, unit = "tokens", showTotal = true,
}) {
  const segs = segments.slice(0, 4);
  const total = segs.reduce((s, x) => s + x.value, 0) + (residual || 0);
  const pct = (v) => (total ? (v / total) * 100 : 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
      <div style={{ display: "flex", height, borderRadius: 999, overflow: "hidden", background: "var(--color-data-track)" }}>
        {segs.map((s, i) => (
          <span key={s.label} title={`${s.label} ${compact(s.value)}`}
                style={{ width: `${pct(s.value)}%`, background: STACK[i], display: "block" }} />
        ))}
        {residual > 0 && (
          <span title={`${residualLabel} ${compact(residual)}`}
                style={{ width: `${pct(residual)}%`, background: "var(--color-stack-0)", display: "block" }} />
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
        {segs.map((s, i) => (
          <LegendRow key={s.label} color={STACK[i]} label={s.label}
                     value={`${compact(s.value)} · ${pct(s.value).toFixed(1)}%`} />
        ))}
        {residual > 0 && (
          <LegendRow color="var(--color-stack-0)" label={residualLabel}
                     value={`${compact(residual)} · ${pct(residual).toFixed(1)}%`} />
        )}
      </div>
      {showTotal && (
        <span style={{ fontSize: "var(--th-text-2xs)", color: "var(--color-fg-subtle)" }}>
          合计 {compact(total)} {unit}
        </span>
      )}
    </div>
  );
}

function LegendRow({ color, label, value }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{ fontSize: "var(--th-text-xs)", color: "var(--color-fg-muted)", whiteSpace: "nowrap" }}>{label}</span>
      <span className="th-nums" style={{ fontSize: "var(--th-text-xs)", color: "var(--color-fg)", whiteSpace: "nowrap" }}>{value}</span>
    </span>
  );
}

/* ── CostBreakdown ─────────────────────────────────────────────────
   占比条按行序取图表色板，合计行取 --color-table-total。 */
export function CostBreakdown({ items = [], currency = "¥", total, density = "comfortable", totalLabel = "合计" }) {
  const sum = total ?? items.reduce((s, i) => s + i.value, 0);
  const rowPad = density === "compact" ? 6 : 8;
  const slot = (tone, i) => {
    if (!tone) return `var(--th-chart-${(i % 12) + 1})`;
    if (tone.startsWith("--")) return `var(${tone})`;
    const n = String(tone).replace(/[^0-9]/g, "");
    return `var(--th-chart-${n || (i % 12) + 1})`;
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
      {items.map((it, i) => {
        const pct = sum ? (it.value / sum) * 100 : 0;
        return (
          <div key={it.label} style={{ display: "flex", flexDirection: "column", gap: 4, padding: `${rowPad}px 0` }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontSize: "var(--th-text-xs)", color: "var(--color-fg)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.label}</span>
              <span className="th-nums" style={{ fontSize: "var(--th-text-xs)", color: "var(--color-fg)", fontWeight: 500, flexShrink: 0 }}>
                {currency}{nf(it.value, 2)}
                <span style={{ color: "var(--color-fg-muted)", fontWeight: 400, marginLeft: 6 }}>{pct.toFixed(1)}%</span>
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: "var(--color-data-track)", overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: slot(it.tone, i), borderRadius: 999 }} />
            </div>
          </div>
        );
      })}
      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
        marginTop: 8, padding: "8px 10px", borderRadius: "var(--th-radius-xs)",
        background: "var(--color-table-total)",
      }}>
        <span style={{ fontSize: "var(--th-text-xs)", color: "var(--color-fg-muted)" }}>{totalLabel}</span>
        <span className="th-nums" style={{ fontSize: "var(--th-text-sm)", fontWeight: 600, color: "var(--color-fg)" }}>
          {currency}{nf(sum, 2)}
        </span>
      </div>
    </div>
  );
}
