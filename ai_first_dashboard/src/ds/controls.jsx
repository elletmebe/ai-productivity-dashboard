/* controls.jsx — Segmented / Tabs / Select / Pager / Card / CardHead / PageHeader
   API 权威：recipes/components/{Segmented,Tabs,Select,Pager,PageHeader}.md。
   Card / CardHead 不是规范组件，是 DESIGN.md「组件嵌套」里那段卡壳 HTML 的
   一处复用点：外卡负责描边 + 圆角 + 阴影 + 卡头，内部组件传 embedded。 */
import React from "react";

/* ── Segmented ─────────────────────────────────────────────────────*/
export function Segmented({ options, value, defaultValue, onChange, size = "md", style }) {
  const opts = options.map((o) => (typeof o === "string" ? { label: o, value: o } : o));
  const [inner, setInner] = React.useState(defaultValue ?? opts[0]?.value);
  const cur = value ?? inner;
  const h = size === "sm" ? 26 : 28;
  return (
    <div role="tablist" style={{
      display: "inline-flex", gap: 2, padding: 2, borderRadius: "var(--th-radius-sm)",
      background: "var(--color-surface-inset)", flexShrink: 0, ...style,
    }}>
      {opts.map((o) => {
        const on = o.value === cur;
        return (
          <button
            key={o.value} type="button" role="tab" aria-selected={on}
            onClick={() => { setInner(o.value); onChange?.(o.value); }}
            style={{
              appearance: "none", border: "none", height: h, padding: "0 12px",
              borderRadius: "var(--th-radius-xs)", cursor: "pointer",
              background: on ? "var(--th-white)" : "transparent",
              color: on ? "var(--color-fg)" : "var(--color-fg-muted)",
              fontFamily: "var(--th-font-cn)", fontSize: "var(--th-text-xs)",
              fontWeight: on ? 600 : 500, lineHeight: 1,
              boxShadow: on ? "var(--th-shadow-card)" : "none",
              display: "inline-flex", alignItems: "center", gap: 5,
              transition: "background var(--th-dur-1) var(--th-ease), color var(--th-dur-1) var(--th-ease)",
            }}
          >
            {o.icon && <i className={o.icon} aria-hidden="true" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Tabs ──────────────────────────────────────────────────────────
   ≤5 项（视觉预算）。激活项 2px 品牌底部指示条。 */
export function Tabs({ items, active, onChange }) {
  return (
    <div role="tablist" style={{
      display: "flex", gap: 24, borderBottom: "1px solid var(--color-divider)",
      overflowX: "auto",
    }}>
      {items.map((it) => {
        const on = it.key === active;
        return (
          <button
            key={it.key} type="button" role="tab" aria-selected={on}
            onClick={() => onChange?.(it.key)}
            style={{
              appearance: "none", background: "transparent", border: "none",
              padding: "0 0 10px", cursor: "pointer", position: "relative",
              fontFamily: "var(--th-font-cn)", fontSize: "var(--th-text-sm)",
              fontWeight: on ? 600 : 500,
              color: on ? "var(--color-fg)" : "var(--color-fg-muted)",
              lineHeight: 1,
            }}
          >
            {it.label}
            <span aria-hidden="true" style={{
              position: "absolute", left: 0, right: 0, bottom: -1, height: 2,
              background: "var(--th-teal-500)", borderRadius: "2px 2px 0 0",
              opacity: on ? 1 : 0,
              transition: "opacity var(--th-dur-1) var(--th-ease)",
            }} />
          </button>
        );
      })}
    </div>
  );
}

/* ── Select ────────────────────────────────────────────────────────*/
export function Select({ label, value, options, onChange, placeholder = "请选择" }) {
  const id = React.useId();
  return (
    <label htmlFor={id} style={{ display: "inline-flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
      {label && <span style={{ fontSize: "var(--th-text-sm)", color: "var(--color-fg-muted)" }}>{label}</span>}
      <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
        <select
          id={id} value={value ?? ""} onChange={(e) => onChange?.(e.target.value)}
          style={{
            appearance: "none", height: "var(--th-ctl-h)", padding: "0 30px 0 10px",
            borderRadius: "var(--th-radius-sm)", border: "1px solid var(--color-border)",
            background: "var(--th-white)", color: "var(--color-fg)",
            fontFamily: "var(--th-font-cn)", fontSize: "var(--th-text-xs)",
            cursor: "pointer", minWidth: 120,
          }}
        >
          {value == null && <option value="" disabled>{placeholder}</option>}
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <i className="ri-arrow-down-s-line" aria-hidden="true" style={{
          position: "absolute", right: 8, pointerEvents: "none",
          color: "var(--color-fg-muted)", fontSize: 15,
        }} />
      </span>
    </label>
  );
}

/* ── Pager ─────────────────────────────────────────────────────────*/
export function Pager({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const cell = (content, key, opts = {}) => (
    <button
      key={key} type="button" disabled={opts.disabled} onClick={opts.onClick}
      aria-current={opts.active ? "page" : undefined}
      style={{
        appearance: "none", minWidth: 26, height: 26, padding: "0 6px",
        borderRadius: "var(--th-radius-xs)",
        border: `1px solid ${opts.active ? "var(--th-teal-500)" : "var(--color-border)"}`,
        background: opts.active ? "var(--th-teal-50)" : "var(--th-white)",
        color: opts.active ? "var(--th-teal-600)" : opts.disabled ? "var(--color-fg-disabled)" : "var(--color-fg)",
        fontFamily: "var(--th-font-cn)", fontSize: "var(--th-text-xs)",
        fontVariantNumeric: "tabular-nums", lineHeight: 1,
        cursor: opts.disabled ? "not-allowed" : "pointer",
      }}
    >{content}</button>
  );
  const nums = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      nums.push(cell(i, i, { active: i === page, onClick: () => onChange(i) }));
    } else if (nums[nums.length - 1] !== "…") {
      nums.push("…");
    }
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {cell(<i className="ri-arrow-left-s-line" />, "prev", { disabled: page <= 1, onClick: () => onChange(page - 1) })}
      {nums.map((n, i) => (typeof n === "string"
        ? <span key={`e${i}`} style={{ color: "var(--color-fg-subtle)", fontSize: "var(--th-text-xs)", padding: "0 2px" }}>…</span>
        : n))}
      {cell(<i className="ri-arrow-right-s-line" />, "next", { disabled: page >= totalPages, onClick: () => onChange(page + 1) })}
    </div>
  );
}

/* ── Card / CardHead ───────────────────────────────────────────────
   一个边界只画一次，圆角只属于最外层那一圈（DESIGN.md 组件嵌套）。 */
export function Card({ children, pad = true, style }) {
  return (
    <section style={{
      background: "var(--color-surface-raised)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--th-radius-md)",
      boxShadow: "var(--th-shadow-card)",
      overflow: "hidden",
      padding: pad ? "var(--th-card-pad)" : 0,
      display: "flex", flexDirection: "column", gap: "var(--th-stack-gap)",
      minWidth: 0,
      ...style,
    }}>
      {children}
    </section>
  );
}

/* 卡头：标题 + 可选口径提示 + 右侧筛选/操作。padding 只允许 12/16。 */
export function CardHead({ title, hint, meta, actions, style }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 12, flexWrap: "wrap", minWidth: 0, ...style,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
        <h4 style={{
          fontFamily: "var(--th-font-cn)", fontSize: "var(--th-text-md)", fontWeight: 600,
          color: "var(--color-fg)", margin: 0, lineHeight: 1.3,
          display: "inline-flex", alignItems: "center", gap: 5,
        }}>
          {title}
          {hint && <HintIcon text={hint} />}
        </h4>
        {meta && <span style={{ fontSize: "var(--th-text-xs)", color: "var(--color-fg-muted)" }}>{meta}</span>}
      </div>
      {actions && <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}

function HintIcon({ text }) {
  const [open, setOpen] = React.useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} tabIndex={0}>
      <i className="ri-information-line" aria-label="口径说明"
         style={{ fontSize: 14, color: "var(--color-fg-subtle)", cursor: "help" }} />
      {open && (
        <span role="tooltip" style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: 0, zIndex: "var(--z-tooltip)",
          background: "var(--th-gray-900)", color: "var(--th-white)",
          padding: "8px 10px", borderRadius: "var(--th-radius-sm)",
          fontSize: "var(--th-text-xs)", fontWeight: 400, lineHeight: 1.5,
          width: "max-content", maxWidth: 300, textAlign: "left",
          boxShadow: "var(--th-shadow-soft)", pointerEvents: "none",
        }}>{text}</span>
      )}
    </span>
  );
}

/* ── PageHeader ────────────────────────────────────────────────────
   页面级控件（角色切换、时间范围、主操作）都在这里，不上移进顶栏。 */
export function PageHeader({
  title, description, meta, tags, actions, children,
  breadcrumb, onBack, density = "comfortable", divider = false, style,
}) {
  const compact = density === "compact";
  return (
    <header style={{
      display: "flex", flexDirection: "column", gap: compact ? 4 : 6,
      paddingBottom: divider ? (compact ? 8 : 12) : 0,
      borderBottom: divider ? "1px solid var(--color-divider)" : "none",
      minWidth: 0, ...style,
    }}>
      {breadcrumb}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          {onBack && (
            <button type="button" onClick={onBack} aria-label="返回" style={{
              appearance: "none", border: "none", background: "transparent",
              cursor: "pointer", color: "var(--color-fg)", fontSize: 18,
              display: "inline-flex", alignItems: "center",
            }}><i className="ri-arrow-left-line" /></button>
          )}
          <h1 style={{
            fontFamily: "var(--th-font-cn)", fontSize: "var(--th-text-lg)", fontWeight: 600,
            color: "var(--color-fg)", margin: 0, lineHeight: 1.3, letterSpacing: 0,
          }}>{title}</h1>
          {tags}
          {meta && <span style={{ fontSize: "var(--th-text-xs)", color: "var(--color-fg-muted)" }}>{meta}</span>}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {actions}{children}
        </div>
      </div>
      {description && (
        <p style={{ fontSize: "var(--th-text-xs)", color: "var(--color-fg-muted)", margin: 0, lineHeight: 1.5 }}>
          {description}
        </p>
      )}
    </header>
  );
}
