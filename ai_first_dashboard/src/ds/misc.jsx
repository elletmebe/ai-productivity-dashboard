/* misc.jsx — EmptyState / Banner / Skeleton / LogoLockup
   API 权威：recipes/components/{EmptyState,Banner,Skeleton,LogoLockup}.md
   EmptyState 的 graphic 是抽象几何背景，禁止用放大的图标充当插画。 */
import React from "react";

export function EmptyState({ icon = "ri-inbox-line", title, description, action, graphic = "none" }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
      padding: "40px 16px", textAlign: "center",
    }}>
      <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        {graphic !== "none" && <Graphic kind={graphic} />}
        <span style={{
          position: "relative", width: 48, height: 48, borderRadius: "50%",
          background: "var(--color-surface-inset)", color: "var(--color-fg-subtle)",
          display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 22,
        }}><i className={icon} aria-hidden="true" /></span>
      </span>
      <span style={{ fontSize: "var(--th-text-md)", fontWeight: 600, color: "var(--color-fg)" }}>{title}</span>
      {description && (
        <span style={{ fontSize: "var(--th-text-xs)", color: "var(--color-fg-muted)", maxWidth: 380, lineHeight: 1.6 }}>
          {description}
        </span>
      )}
      {action}
    </div>
  );
}

function Graphic({ kind }) {
  const s = { position: "absolute", inset: -26, opacity: 0.6, pointerEvents: "none" };
  if (kind === "dots") {
    return <span style={{
      ...s, backgroundImage: "radial-gradient(var(--th-gray-100) 1px, transparent 1px)",
      backgroundSize: "8px 8px", borderRadius: "50%",
    }} />;
  }
  if (kind === "grid") {
    return <span style={{
      ...s,
      backgroundImage: "linear-gradient(var(--th-gray-100) 1px, transparent 1px), linear-gradient(90deg, var(--th-gray-100) 1px, transparent 1px)",
      backgroundSize: "12px 12px", borderRadius: "50%",
    }} />;
  }
  return (
    <svg style={s} viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="34" fill="none" stroke="var(--th-gray-100)" strokeWidth="1" />
      <circle cx="50" cy="50" r="46" fill="none" stroke="var(--th-gray-100)" strokeWidth="1" strokeDasharray="3 5" />
    </svg>
  );
}

/* ── Banner ────────────────────────────────────────────────────────
   -bg 涂底、-fg 写字与图标；持久内联提示。 */
const B = {
  info: { icon: "ri-information-line" }, success: { icon: "ri-checkbox-circle-line" },
  warning: { icon: "ri-alert-line" }, danger: { icon: "ri-error-warning-line" },
};

export function Banner({ tone = "info", title, description, action, onClose }) {
  return (
    <div role="status" style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: 12, borderRadius: "var(--th-radius-sm)",
      background: `var(--color-${tone}-bg)`, color: `var(--color-${tone}-fg)`,
      minWidth: 0,
    }}>
      <i className={B[tone].icon} aria-hidden="true" style={{ fontSize: 16, lineHeight: 1.4, flexShrink: 0 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: "var(--th-text-sm)", fontWeight: 600, lineHeight: 1.4 }}>{title}</span>
        {description && (
          <span style={{ fontSize: "var(--th-text-xs)", lineHeight: 1.6, opacity: 0.92 }}>{description}</span>
        )}
      </div>
      {action}
      {onClose && (
        <button type="button" onClick={onClose} aria-label="关闭" style={{
          appearance: "none", border: "none", background: "transparent", cursor: "pointer",
          color: "inherit", fontSize: 15, lineHeight: 1, padding: 0, flexShrink: 0,
        }}><i className="ri-close-line" /></button>
      )}
    </div>
  );
}

/* ── Skeleton ──────────────────────────────────────────────────────
   只属于加载中的真实瞬态；内容就绪时必须换成可读的结构摘要。 */
export function Skeleton({ variant = "line", width, height, count = 1, style }) {
  const dims = {
    line: { width: width ?? "100%", height: height ?? 12, borderRadius: 4 },
    card: { width: width ?? "100%", height: height ?? 96, borderRadius: 8 },
    avatar: { width: width ?? 32, height: height ?? 32, borderRadius: "50%" },
    row: { width: width ?? "100%", height: height ?? 44, borderRadius: 6 },
  }[variant];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0, ...style }}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="th-shimmer" style={{ ...dims, display: "block" }} />
      ))}
    </div>
  );
}

/* ── LogoLockup ────────────────────────────────────────────────────*/
export function LogoLockup({ src, icon = "ri-cpu-line", color = "var(--color-fg)", name, meta, tags = [], size = 40 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      <span style={{
        width: size, height: size, borderRadius: "var(--th-radius-sm)", flexShrink: 0,
        background: "var(--color-surface-inset)", color,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: Math.round(size * 0.45), overflow: "hidden",
      }}>
        {src ? <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
             : <i className={icon} aria-hidden="true" />}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <span style={{
            fontSize: "var(--th-text-sm)", fontWeight: 600, color: "var(--color-fg)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{name}</span>
          {tags.map((t) => {
            const o = typeof t === "string" ? { label: t } : t;
            return (
              <span key={o.label} style={{
                height: 18, padding: "0 6px", borderRadius: 4, flexShrink: 0,
                background: o.bg ? `var(${o.bg})` : "var(--th-gray-50)",
                color: o.fg ? `var(${o.fg})` : "var(--color-fg-muted)",
                fontSize: "var(--th-text-2xs)", fontWeight: 500,
                display: "inline-flex", alignItems: "center",
                whiteSpace: "nowrap", lineHeight: 1,
              }}>{o.label}</span>
            );
          })}
        </span>
        {meta && (
          <span style={{
            fontSize: "var(--th-text-2xs)", color: "var(--color-fg-muted)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{meta}</span>
        )}
      </div>
    </div>
  );
}
