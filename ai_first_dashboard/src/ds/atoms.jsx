/* atoms.jsx — Button / Tag / StatusChip / Badge / Avatar / Tooltip / Divider
   API 权威：recipes/components/{Button,Tag,StatusChip,Badge,Avatar,Tooltip,Divider}.md
   的声明章节。取值遵守 DESIGN.md「控件标签（强制）」与「取色决策树」。

   固定高度的裸 <span> 控件（Tag / StatusChip / Badge）不在 tokens.css 的全局
   兜底选择器覆盖范围内，必须在组件自身写死 whiteSpace/flexShrink/lineHeight。 */
import React from "react";

/* ── Button ────────────────────────────────────────────────────────
   md 固定 40px，sm 固定 32px；宽度由 padding 撑开，不写死 px 宽。
   primary 一律消费 --color-cta + --color-cta-fg（维护规则 2，永久）。 */
export function Button({
  children, variant = "primary", size = "md", icon, iconPosition = "left",
  disabled, loading, onClick, type = "button", height, style,
}) {
  const h = height ?? (size === "sm" ? 32 : 40);
  const skin = {
    primary: { background: "var(--color-cta)", color: "var(--color-cta-fg)", border: "1px solid transparent" },
    secondary: { background: "var(--th-white)", color: "var(--color-fg)", border: "1px solid var(--color-border)" },
    ghost: { background: "transparent", color: "var(--color-fg)", border: "1px solid transparent" },
    link: { background: "transparent", color: "var(--color-link)", border: "1px solid transparent", padding: 0, height: "auto" },
  }[variant];

  const glyph = loading
    ? <i className="ri-loader-4-line th-spin" aria-hidden="true" />
    : icon ? <i className={icon} aria-hidden="true" /> : null;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading || undefined}
      className="th-press"
      style={{
        appearance: "none", height: h, borderRadius: "var(--th-radius-sm)",
        padding: variant === "link" ? 0 : size === "sm" ? "0 14px" : "0 20px",
        fontFamily: "var(--th-font-cn)", fontSize: "var(--th-text-sm)", fontWeight: 500,
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1, lineHeight: 1,
        transition: "background var(--th-dur-1) var(--th-ease), box-shadow var(--th-dur-1) var(--th-ease), transform var(--th-dur-1) var(--th-ease)",
        ...skin, ...style,
      }}
      onMouseEnter={(e) => {
        if (disabled || loading) return;
        if (variant === "primary") e.currentTarget.style.boxShadow = "var(--th-shadow-key)";
        if (variant === "secondary" || variant === "ghost") e.currentTarget.style.background = "var(--th-gray-50)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        if (variant === "secondary") e.currentTarget.style.background = "var(--th-white)";
        if (variant === "ghost") e.currentTarget.style.background = "transparent";
      }}
    >
      {iconPosition === "left" && glyph}
      {children}
      {iconPosition === "right" && glyph}
    </button>
  );
}

/* ── Tag ───────────────────────────────────────────────────────────
   cat1…cat6 = 固定分类色（供应商 / 模型系列 / 套餐层级 / 地域），
   派生自图表色环，所以同一对象在 Tag 与图表里天然同色。 */
const TAG_TONES = {
  neutral: { bg: "var(--th-gray-50)", fg: "var(--color-fg-muted)" },
  teal: { bg: "var(--th-teal-50)", fg: "var(--th-teal-600)" },
  pink: { bg: "var(--th-pink-50)", fg: "var(--th-pink-600)" },
  cat1: { bg: "var(--th-cat-1-bg)", fg: "var(--th-cat-1-fg)" },
  cat2: { bg: "var(--th-cat-2-bg)", fg: "var(--th-cat-2-fg)" },
  cat3: { bg: "var(--th-cat-3-bg)", fg: "var(--th-cat-3-fg)" },
  cat4: { bg: "var(--th-cat-4-bg)", fg: "var(--th-cat-4-fg)" },
  cat5: { bg: "var(--th-cat-5-bg)", fg: "var(--th-cat-5-fg)" },
  cat6: { bg: "var(--th-cat-6-bg)", fg: "var(--th-cat-6-fg)" },
};

export function Tag({ children, icon, tone = "neutral", closable, onClose, style }) {
  const t = TAG_TONES[tone === "blue" ? "cat2" : tone] || TAG_TONES.neutral;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      height: 24, padding: "0 8px", borderRadius: "var(--th-radius-xs)",
      background: t.bg, color: t.fg,
      fontFamily: "var(--th-font-cn)", fontSize: "var(--th-text-xs)", fontWeight: 500,
      whiteSpace: "nowrap", flexShrink: 0, lineHeight: 1,
      ...style,
    }}>
      {icon && <i className={icon} aria-hidden="true" />}
      {children}
      {closable && (
        <i className="ri-close-line" role="button" tabIndex={0} aria-label="移除"
           onClick={onClose} style={{ cursor: "pointer", marginLeft: 2 }} />
      )}
    </span>
  );
}

/* ── StatusChip ────────────────────────────────────────────────────
   -bg 涂底、-fg 写字、-solid 填圆点。三档分工不可互换。 */
const STATUS_TONES = {
  success: { bg: "var(--color-success-bg)", fg: "var(--color-success-fg)", dot: "var(--color-success-solid)" },
  warning: { bg: "var(--color-warning-bg)", fg: "var(--color-warning-fg)", dot: "var(--color-warning-solid)" },
  danger: { bg: "var(--color-danger-bg)", fg: "var(--color-danger-fg)", dot: "var(--color-danger-solid)" },
  info: { bg: "var(--color-info-bg)", fg: "var(--color-info-fg)", dot: "var(--color-info-solid)" },
  neutral: { bg: "var(--th-gray-50)", fg: "var(--color-fg-muted)", dot: "var(--th-gray-300)" },
};

export function StatusChip({ tone = "neutral", children, dot = true, style }) {
  const t = STATUS_TONES[tone] || STATUS_TONES.neutral;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      height: 24, padding: "0 8px", borderRadius: "var(--th-radius-xs)",
      background: t.bg, color: t.fg,
      fontFamily: "var(--th-font-cn)", fontSize: "var(--th-text-xs)", fontWeight: 500,
      whiteSpace: "nowrap", flexShrink: 0, lineHeight: 1,
      ...style,
    }}>
      {dot && <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: t.dot, flexShrink: 0 }} />}
      {children}
    </span>
  );
}

/* ── Badge ─────────────────────────────────────────────────────────
   标记也是状态：语气由状态决定，走 -solid 档；不可用品牌色。 */
/* 取值对齐 recipes/components/Badge.md 的官方实现：neutral 用 gray-500
   （白字下 5.2:1），不是 gray-300 —— 300 是弱化文字色，白字压不住。
   白字 10px/600 也照官方值，Badge 是 16px 高的标记，不适用正文的 13px 下限。 */
const BADGE_TONES = {
  danger: "var(--color-danger-solid)", warning: "var(--color-warning-solid)",
  success: "var(--color-success-solid)", info: "var(--color-info-solid)",
  neutral: "var(--th-gray-500)", teal: "var(--color-info-solid)",
  blue: "var(--color-info-solid)", gray: "var(--th-gray-500)",
};

export function Badge({ children, count, dot = false, max = 99, tone = "danger", style }) {
  const show = dot || (count != null && count > 0);
  const mark = (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      minWidth: dot ? 6 : 16, height: dot ? 6 : 16, padding: dot ? 0 : "0 5px",
      borderRadius: 999, background: BADGE_TONES[tone] || BADGE_TONES.danger,
      color: "#fff", fontFamily: "var(--th-font-ui)", fontSize: 10, fontWeight: 600,
      fontVariantNumeric: "tabular-nums",
      whiteSpace: "nowrap", flexShrink: 0, lineHeight: 1, ...style,
    }}>
      {!dot && (count > max ? `${max}+` : count)}
    </span>
  );
  if (!children) return show ? mark : null;
  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      {children}
      {show && <span style={{ position: "absolute", top: -4, right: -6 }}>{mark}</span>}
    </span>
  );
}

/* ── Avatar ────────────────────────────────────────────────────────
   pink-500 是装饰色（头像底），刻意不作文字色使用。 */
const AVATAR_TONES = {
  pink: { bg: "var(--th-pink-100)", fg: "var(--th-pink-600)" },
  teal: { bg: "var(--th-teal-50)", fg: "var(--th-teal-600)" },
  gray: { bg: "var(--th-gray-50)", fg: "var(--color-fg-muted)" },
};

export function Avatar({ name, src, size = "md", tone = "pink", style }) {
  const px = typeof size === "number" ? size : { sm: 24, md: 32, lg: 40 }[size] || 32;
  const t = AVATAR_TONES[tone] || AVATAR_TONES.pink;
  return (
    <span style={{
      width: px, height: px, borderRadius: "50%", flexShrink: 0,
      background: t.bg, color: t.fg, overflow: "hidden",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--th-font-cn)", fontSize: Math.max(11, Math.round(px * 0.42)), fontWeight: 600,
      lineHeight: 1, ...style,
    }}>
      {src ? <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : name ? name.trim().charAt(0).toUpperCase()
        : <i className="ri-user-line" aria-hidden="true" />}
    </span>
  );
}

/* ── Tooltip ───────────────────────────────────────────────────────
   PRD 关键设计 2「指标口径透明可见」的载体：hover 至指标上展现口径。 */
export function Tooltip({ text, children, placement = "top", inline = true }) {
  const [open, setOpen] = React.useState(false);
  if (!text) return children;
  const pos = placement === "right"
    ? { left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" }
    : { bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" };
  return (
    <span
      style={{ position: "relative", display: inline ? "inline-flex" : "flex", alignItems: "center" }}
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
      tabIndex={0}
    >
      {children}
      {open && (
        <span role="tooltip" style={{
          position: "absolute", ...pos, zIndex: "var(--z-tooltip)",
          background: "var(--th-gray-900)", color: "var(--th-white)",
          padding: "6px 10px", borderRadius: "var(--th-radius-sm)",
          fontFamily: "var(--th-font-cn)", fontSize: "var(--th-text-xs)", lineHeight: 1.5,
          maxWidth: 260, width: "max-content", textAlign: "left",
          boxShadow: "var(--th-shadow-soft)", pointerEvents: "none",
        }}>
          {text}
        </span>
      )}
    </span>
  );
}

/* 指标口径提示：标签后跟一个 info 图标，hover 展开公式。 */
export function MetricLabel({ children, hint, style }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, ...style }}>
      {children}
      {hint && (
        <Tooltip text={hint}>
          <i className="ri-information-line" aria-label="指标口径"
             style={{ fontSize: 13, color: "var(--color-fg-subtle)", cursor: "help" }} />
        </Tooltip>
      )}
    </span>
  );
}

/* ── Divider ───────────────────────────────────────────────────────*/
export function Divider({ children, vertical = false, dashed = false, style }) {
  const line = `${dashed ? "dashed" : "solid"} 1px var(--color-divider)`;
  if (vertical) {
    return <span aria-hidden="true" style={{ alignSelf: "stretch", width: 0, borderLeft: line, ...style }} />;
  }
  if (!children) return <hr style={{ border: 0, borderTop: line, margin: 0, ...style }} />;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, ...style }}>
      <span style={{ flex: 1, borderTop: line }} />
      <span style={{ fontSize: "var(--th-text-xs)", color: "var(--color-fg-muted)", whiteSpace: "nowrap" }}>{children}</span>
      <span style={{ flex: 1, borderTop: line }} />
    </div>
  );
}
