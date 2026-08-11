/* Chart.jsx — SVG 图表集（API 权威：recipes/components/Chart.md）
   系列色恒由 --th-chart-1…12 按序取；网格与空轨取 --color-data-track；
   坐标标签 11px --color-fg-muted，数值等宽。
   禁令（DESIGN.md 图表禁令）：不做 3D、不做阴影与渐变填充、柱圆角 ≤2px、
   饼图 >6 片改 hbar、图表里不手写 hex、不从状态色借色。
   已有专用组件的场景不在这里重造：热力网格→Heatgrid，单一比率→RingGauge，
   单条进度→Progress，行内趋势→Sparkline，token 构成→TokenMeter，
   成本占比→CostBreakdown。 */
import React from "react";
import { compact, nf } from "./dataviz.jsx";

const SLOT = (i) => `var(--th-chart-${(i % 12) + 1})`;

function useWidth() {
  const ref = React.useRef(null);
  const [w, setW] = React.useState(0);
  React.useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    setW(ref.current.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

const AXIS = { fontSize: 11, fill: "var(--color-fg-muted)", fontFamily: "var(--th-font-cn)" };

export function Chart({
  type = "line", data = [], series, xKey = "label", height = 240,
  showLegend = true, showGrid = true, showValues = false,
  yFormat, y2Format, unit = "", unit2 = "", smooth = false, donutLabel = "合计",
  emptyText = "暂无数据", animate = true, refLine, style,
}) {
  const [ref, W] = useWidth();
  const fmt = React.useCallback((v) => `${(yFormat || compact)(v)}${unit}`, [yFormat, unit]);
  const fmt2 = React.useCallback((v) => `${(y2Format || yFormat || compact)(v)}${unit2}`, [y2Format, yFormat, unit2]);

  const keys = React.useMemo(() => {
    if (series?.length) return series;
    const row = data[0] || {};
    return Object.keys(row)
      .filter((k) => k !== xKey && typeof row[k] === "number")
      .map((k) => ({ key: k }));
  }, [series, data, xKey]);

  if (!data.length) {
    return (
      <div ref={ref} style={{ height, display: "flex", alignItems: "center", justifyContent: "center", ...style }}>
        <span style={{ fontSize: "var(--th-text-xs)", color: "var(--color-fg-subtle)" }}>{emptyText}</span>
      </div>
    );
  }

  const cls = animate ? "th-in-fade" : undefined;
  const shared = { data, keys, xKey, height, showGrid, showValues, fmt, fmt2, smooth, W, type, refLine };

  let body = null;
  if (["pie", "donut"].includes(type)) body = <PieBody {...shared} donut={type === "donut"} donutLabel={donutLabel} />;
  else if (type === "funnel") body = <FunnelBody {...shared} />;
  else if (["hbar", "stackedHbar"].includes(type)) body = <HBarBody {...shared} stacked={type === "stackedHbar"} />;
  else body = <CartesianBody {...shared} />;

  return (
    <div ref={ref} className={cls} style={{ width: "100%", minWidth: 0, ...style }}>
      {W > 0 && body}
      {showLegend && keys.length > 1 && !["pie", "donut", "funnel"].includes(type) && (
        <Legend items={keys.map((s, i) => ({ label: s.name || s.key, color: s.color ? `var(${s.color})` : SLOT(i) }))} />
      )}
    </div>
  );
}

function Legend({ items }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 10 }}>
      {items.map((it) => (
        <span key={it.label} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: it.color, flexShrink: 0 }} />
          <span style={{ fontSize: "var(--th-text-xs)", color: "var(--color-fg-muted)", whiteSpace: "nowrap" }}>{it.label}</span>
        </span>
      ))}
    </div>
  );
}

/* ── 直角坐标系：line / spline / area / stackedArea / bar / groupedBar /
      stackedBar / combo ───────────────────────────────────────────*/
function CartesianBody({ data, keys, xKey, height, showGrid, fmt, fmt2, smooth, W, type, showValues, refLine }) {
  /* 双 Y 轴只用于「一个量 + 一个率」且量级差 ≥10×（DESIGN.md 图表禁令）。
     右轴系列由 series[].axis === "right" 声明，默认全部走左轴。 */
  const right = keys.filter((k) => k.axis === "right");
  const left = keys.filter((k) => k.axis !== "right");
  const padL = 46, padR = right.length ? 48 : 8, padT = 10, padB = 26;
  const iw = Math.max(10, W - padL - padR);
  const ih = Math.max(10, height - padT - padB);
  const stacked = type === "stackedBar" || type === "stackedArea";

  const axisMax = (ks) => {
    if (!ks.length) return 1;
    const totals = data.map((d) => ks.reduce((s, k) => s + (Number(d[k.key]) || 0), 0));
    const flat = data.flatMap((d) => ks.map((k) => Number(d[k.key]) || 0));
    return Math.max(1, stacked ? Math.max(...totals) : Math.max(...flat, 0));
  };

  const ticks = niceTicks(axisMax(left), 4);
  const top = ticks[ticks.length - 1];
  const y = (v) => padT + ih - (v / top) * ih;

  const ticks2 = right.length ? niceTicks(axisMax(right), 4) : null;
  const top2 = ticks2 ? ticks2[ticks2.length - 1] : 1;
  const y2 = (v) => padT + ih - (v / top2) * ih;
  const yOf = (k) => (k.axis === "right" ? y2 : y);

  const n = data.length;
  const bandW = iw / n;
  const isBarish = ["bar", "groupedBar", "stackedBar", "combo"].includes(type);
  const barGroupW = Math.min(bandW * 0.62, 26 * (type === "groupedBar" ? keys.length : 1));
  const cx = (i) => padL + bandW * i + bandW / 2;

  const labelEvery = Math.max(1, Math.ceil(n / Math.max(3, Math.floor(iw / 56))));

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${W} ${height}`} role="img">
      {showGrid && ticks.map((t) => (
        <g key={t}>
          <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="var(--color-data-track)" strokeWidth="1" />
          <text x={padL - 8} y={y(t) + 4} textAnchor="end" {...AXIS} style={{ ...AXIS, fontVariantNumeric: "tabular-nums" }}>{fmt(t)}</text>
        </g>
      ))}
      {ticks2 && ticks2.map((t) => (
        <text key={`r${t}`} x={W - padR + 8} y={y2(t) + 4} textAnchor="start" {...AXIS}
              style={{ ...AXIS, fontVariantNumeric: "tabular-nums" }}>{(fmt2 || fmt)(t)}</text>
      ))}

      {isBarish && data.map((d, i) => {
        if (type === "stackedBar") {
          let acc = 0;
          return (
            <g key={i}>
              {keys.map((k, si) => {
                const v = Number(d[k.key]) || 0;
                const h = (v / top) * ih;
                acc += h;
                return <rect key={k.key} x={cx(i) - barGroupW / 2} y={padT + ih - acc} width={barGroupW} height={Math.max(0, h)}
                             fill={k.color ? `var(${k.color})` : SLOT(si)} rx="2" />;
              })}
            </g>
          );
        }
        const bars = keys.filter((k) => type !== "combo" || k.type !== "line");
        const each = barGroupW / Math.max(1, bars.length);
        return (
          <g key={i}>
            {bars.map((k, si) => {
              const v = Number(d[k.key]) || 0;
              const h = (v / top) * ih;
              return <rect key={k.key} x={cx(i) - barGroupW / 2 + each * si} y={padT + ih - h}
                           width={Math.max(1, each - 2)} height={Math.max(0, h)}
                           fill={k.color ? `var(${k.color})` : SLOT(keys.indexOf(k))} rx="2" />;
            })}
          </g>
        );
      })}

      {!["bar", "groupedBar", "stackedBar"].includes(type) && keys.map((k, si) => {
        if (type === "combo" && k.type !== "line") return null;
        const color = k.color ? `var(${k.color})` : SLOT(si);
        const px = (i) => (isBarish ? cx(i) : padL + (n === 1 ? iw / 2 : (i / (n - 1)) * iw));
        if (type === "stackedArea") {
          const below = keys.slice(0, si);
          const lower = data.map((d) => below.reduce((s, kk) => s + (Number(d[kk.key]) || 0), 0));
          const upper = data.map((d, i) => lower[i] + (Number(d[k.key]) || 0));
          const dUp = upper.map((v, i) => `${i ? "L" : "M"}${px(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
          const dLo = lower.map((v, i) => `${px(i).toFixed(1)},${y(v).toFixed(1)}`).reverse().join(" L");
          return <path key={k.key} d={`${dUp} L${dLo} Z`} fill={color} opacity="0.85" />;
        }
        const yk = yOf(k);
        const pts = data.map((d, i) => [px(i), yk(Number(d[k.key]) || 0)]);
        const line = smooth || type === "spline" ? smoothPath(pts) : pts.map(([X, Y], i) => `${i ? "L" : "M"}${X.toFixed(1)},${Y.toFixed(1)}`).join(" ");
        return (
          <g key={k.key}>
            {type === "area" && (
              <path d={`${line} L${pts[pts.length - 1][0]},${padT + ih} L${pts[0][0]},${padT + ih} Z`} fill={color} opacity="0.12" />
            )}
            <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {(showValues || n <= 12) && pts.map(([X, Y], i) => <circle key={i} cx={X} cy={Y} r="2.5" fill="var(--color-surface)" stroke={color} strokeWidth="1.5" />)}
          </g>
        );
      })}

      {/* 均值参考线：虚线走数据墨色，不占图表色板槽位，也不构成新的着色语义 */}
      {refLine != null && (() => {
        const v = typeof refLine === "number" ? refLine : refLine.value;
        const text = typeof refLine === "number" ? null : refLine.label;
        if (!(v > 0) || v > top) return null;
        return (
          <g>
            <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)}
                  stroke="var(--color-data-line)" strokeWidth="1" strokeDasharray="4 4" opacity="0.7" />
            {text && (
              <text x={W - padR - 4} y={y(v) - 5} textAnchor="end" {...AXIS}
                    style={{ ...AXIS, fontVariantNumeric: "tabular-nums" }}>{text}</text>
            )}
          </g>
        );
      })()}

      {data.map((d, i) => (i % labelEvery === 0 ? (
        <text key={i} x={isBarish ? cx(i) : padL + (n === 1 ? iw / 2 : (i / (n - 1)) * iw)}
              y={height - 8} textAnchor="middle" {...AXIS}>{d[xKey]}</text>
      ) : null))}
    </svg>
  );
}

/* ── 横向条：hbar / stackedHbar ────────────────────────────────────*/
function HBarBody({ data, keys, xKey, height, fmt, W, stacked }) {
  const labelW = Math.min(140, Math.max(72, W * 0.24));
  const valueW = 64;
  const iw = Math.max(10, W - labelW - valueW - 12);
  const rowH = Math.max(22, Math.min(34, height / data.length));
  const vals = stacked
    ? data.map((d) => keys.reduce((s, k) => s + (Number(d[k.key]) || 0), 0))
    : data.map((d) => Number(d.value ?? d[keys[0]?.key]) || 0);
  const max = Math.max(1, ...vals);
  const h = rowH * data.length;

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${W} ${h}`} role="img">
      {data.map((d, i) => {
        const yTop = i * rowH + (rowH - 12) / 2;
        let acc = 0;
        return (
          <g key={i}>
            <text x={0} y={i * rowH + rowH / 2 + 4} {...AXIS} style={{ ...AXIS, fill: "var(--color-fg)" }}>
              {fitText(String(d[xKey]), labelW - 8)}
            </text>
            <rect x={labelW} y={yTop} width={iw} height={12} rx="2" fill="var(--color-data-track)" />
            {stacked ? keys.map((k, si) => {
              const w = ((Number(d[k.key]) || 0) / max) * iw;
              const x = labelW + acc; acc += w;
              return <rect key={k.key} x={x} y={yTop} width={Math.max(0, w)} height={12} rx="2" fill={k.color ? `var(${k.color})` : SLOT(si)} />;
            }) : (
              <rect x={labelW} y={yTop} width={Math.max(0, (vals[i] / max) * iw)} height={12} rx="2"
                    fill={d.color ? `var(${d.color})` : SLOT(i)} />
            )}
            <text x={W} y={i * rowH + rowH / 2 + 4} textAnchor="end" {...AXIS}
                  style={{ ...AXIS, fill: "var(--color-fg)", fontVariantNumeric: "tabular-nums" }}>{fmt(vals[i])}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── 漏斗：逐级流失，自动标出相对首步的转化率 ─────────────────────
   PRD 3.1「SDLC 漏斗」：以当月 AI 生成行数为锚定基数，单调递减。 */
function FunnelBody({ data, height, W, fmt }) {
  const first = Number(data[0]?.value) || 1;
  const gap = 6;
  const rowH = (height - gap * (data.length - 1)) / data.length;
  const maxW = Math.min(W * 0.62, W - 150);
  const cxc = maxW / 2 + 8;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${W} ${height}`} role="img">
      {data.map((d, i) => {
        const v = Number(d.value) || 0;
        const next = Number(data[i + 1]?.value ?? v) || 0;
        const wTop = (v / first) * maxW;
        const wBot = (next / first) * maxW;
        const yTop = i * (rowH + gap);
        const yBot = yTop + rowH;
        const pts = [
          [cxc - wTop / 2, yTop], [cxc + wTop / 2, yTop],
          [cxc + wBot / 2, yBot], [cxc - wBot / 2, yBot],
        ].map((p) => p.join(",")).join(" ");
        const conv = i === 0 ? 100 : (v / first) * 100;
        return (
          <g key={d.label}>
            <polygon points={pts} fill={SLOT(i)} opacity={0.88} />
            {/* 填充色上只允许白色且 ≥13px/500（DESIGN.md 永久禁令之二），
                所以行数与转化率都放到漏斗外，用画布上的深色文字承载。 */}
            <text x={cxc} y={yTop + rowH / 2 + 5} textAnchor="middle"
                  style={{ ...AXIS, fill: "#fff", fontSize: 13, fontWeight: 500 }}>{d.label}</text>
            <text x={W - 4} y={yTop + rowH / 2 - 2} textAnchor="end"
                  style={{ ...AXIS, fontVariantNumeric: "tabular-nums", fill: "var(--color-fg)", fontSize: 13, fontWeight: 500 }}>
              {fmt(v)}
            </text>
            <text x={W - 4} y={yTop + rowH / 2 + 13} textAnchor="end"
                  style={{ ...AXIS, fontVariantNumeric: "tabular-nums", fill: "var(--color-fg-muted)" }}>
              {i === 0 ? "锚定基数" : `${conv.toFixed(1)}%`}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── pie / donut ───────────────────────────────────────────────────*/
function PieBody({ data, height, W, donut, donutLabel, fmt }) {
  const size = Math.min(height, W * 0.55);
  const r = size / 2, cxc = r + 4, cyc = height / 2;
  const inner = donut ? r * 0.62 : 0;
  const total = data.reduce((s, d) => s + (Number(d.value) || 0), 0) || 1;
  let a0 = -Math.PI / 2;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", minWidth: 0 }}>
      <svg width={size + 8} height={height} viewBox={`0 0 ${size + 8} ${height}`} role="img" style={{ flexShrink: 0 }}>
        {data.map((d, i) => {
          const frac = (Number(d.value) || 0) / total;
          const a1 = a0 + frac * Math.PI * 2;
          const path = arcPath(cxc, cyc, r, inner, a0, a1);
          a0 = a1;
          return <path key={d.label} d={path} fill={d.color ? `var(${d.color})` : SLOT(i)} />;
        })}
        {donut && (
          <>
            <text x={cxc} y={cyc - 2} textAnchor="middle"
                  style={{ ...AXIS, fill: "var(--color-fg)", fontSize: 15, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
              {fmt(total)}
            </text>
            <text x={cxc} y={cyc + 14} textAnchor="middle" {...AXIS}>{donutLabel}</text>
          </>
        )}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0, flex: 1 }}>
        {data.map((d, i) => (
          <span key={d.label} style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color ? `var(${d.color})` : SLOT(i), flexShrink: 0 }} />
            <span style={{ fontSize: "var(--th-text-xs)", color: "var(--color-fg-muted)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.label}</span>
            <span className="th-nums" style={{ fontSize: "var(--th-text-xs)", color: "var(--color-fg)", flexShrink: 0 }}>
              {((d.value / total) * 100).toFixed(1)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── helpers ───────────────────────────────────────────────────────*/
function niceTicks(max, count) {
  const raw = max / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const out = [];
  for (let v = 0; v <= max + step * 0.001; v += step) out.push(Math.round(v * 1e6) / 1e6);
  if (out[out.length - 1] < max) out.push(out[out.length - 1] + step);
  return out;
}

function smoothPath(pts) {
  if (pts.length < 3) return pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const mx = (x0 + x1) / 2;
    d += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }
  return d;
}

function arcPath(cx, cy, r, ri, a0, a1) {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const p = (rad, a) => [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
  const [x0, y0] = p(r, a0), [x1, y1] = p(r, a1);
  if (!ri) return `M${cx},${cy} L${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} Z`;
  const [ix1, iy1] = p(ri, a1), [ix0, iy0] = p(ri, a0);
  return `M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} L${ix1},${iy1} A${ri},${ri} 0 ${large} 0 ${ix0},${iy0} Z`;
}

/* 11px 轴标签下按字符宽度估算：CJK/全角约 11px，拉丁与数字约 6.2px。
   统一按「字符数」截断会把 infone-dashboard 砍成 infone-d…，而中文标签
   又留出一大截空白 —— 两种字宽差近一倍，必须分开算。 */
const charPx = (ch) => (/[⺀-鿿＀-｠]/.test(ch) ? 11 : 6.2);

function fitText(s, maxPx) {
  let w = 0;
  for (let i = 0; i < s.length; i++) {
    w += charPx(s[i]);
    if (w > maxPx) return s.slice(0, Math.max(1, i - 1)) + "…";
  }
  return s;
}

export { SLOT as chartSlot, nf };
