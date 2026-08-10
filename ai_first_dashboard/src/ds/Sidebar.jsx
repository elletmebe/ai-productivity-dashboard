/* Sidebar.jsx — 217px (or 64px collapsed) left rail with grouped nav items.
   实现取自 recipes/components/Sidebar.md 的 React 章节，逐值保留。
   A 档骨架第二件套：独立白卡竖轨，不通栏、不贴边、不带阴影分割线。 */
import React from "react";

export function Sidebar({ active, onChange, groups, collapsed = false, onToggle, density = "comfortable", collapseMode = "icon" }) {
  const compact = density === "compact";
  const [peek, setPeek] = React.useState(false);
  const hidden = collapsed && collapseMode === "hover";
  const mini = collapsed && !hidden;

  const rail = (floating) => (
    <aside style={{
      ...sbStyles.rail,
      width: mini ? 64 : 217,
      padding: mini ? "20px 8px" : "20px 10px",
      gap: compact ? 14 : 20,
      ...(floating ? {
        position: "absolute", left: 0, top: 0, zIndex: "var(--z-dropdown)",
        boxShadow: "var(--th-shadow-modal)",
        transform: peek ? "translateX(0)" : "translateX(calc(-100% - 16px))",
        opacity: peek ? 1 : 0, pointerEvents: peek ? "auto" : "none",
        transition: "transform var(--th-dur-2) var(--th-ease), opacity var(--th-dur-1) var(--th-ease)",
      } : null),
    }}>
      {mini && (
        <div style={sbStyles.toggleRow}>
          <button type="button" onClick={onToggle} style={{ ...sbStyles.toggleBtn, position: "relative" }} aria-label="展开导航">
            <i className="ri-side-bar-line" />
          </button>
        </div>
      )}
      {groups.map((g, gi) => (
        <div key={g.title} style={{ ...sbStyles.group, gap: compact ? 6 : 10 }}>
          {!mini && (
            <div style={sbStyles.headingRow}>
              <span style={sbStyles.heading}>{g.title}</span>
              {gi === 0 && (
                <button type="button" onClick={onToggle} style={sbStyles.toggleBtn} title="收起导航" aria-label="收起导航">
                  <i className="ri-side-bar-fill" />
                </button>
              )}
            </div>
          )}
          <div style={sbStyles.list}>
            {g.items.map((it) => {
              const isActive = it.key === active;
              return (
                <button
                  key={it.key} type="button" onClick={() => onChange?.(it.key)}
                  title={mini ? it.label : undefined}
                  aria-current={isActive ? "page" : undefined}
                  style={{
                    ...sbStyles.item,
                    height: compact ? 32 : 40,
                    background: isActive ? "var(--th-teal-50)" : "transparent",
                    justifyContent: mini ? "center" : "flex-start",
                    padding: mini ? "0" : "0 10px",
                    width: mini ? 48 : "100%",
                    marginLeft: mini ? "auto" : 0,
                    marginRight: mini ? "auto" : 0,
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--th-gray-50)"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <i className={it.icon} style={{ fontSize: 16, color: isActive ? "var(--th-teal-600)" : "var(--color-fg)" }} />
                  {!mini && <span style={{ whiteSpace: "nowrap" }}>{it.label}</span>}
                  {!mini && it.chev && <i className="ri-arrow-right-s-line" style={{ marginLeft: "auto", fontSize: 16, color: "var(--color-fg-muted)" }} />}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );

  if (!hidden) return rail(false);
  return (
    <div style={sbStyles.strip} onMouseEnter={() => setPeek(true)} onMouseLeave={() => setPeek(false)}>
      <span style={{ ...sbStyles.handle, opacity: peek ? 0 : 1 }} />
      <button
        type="button" onClick={onToggle} aria-label="展开导航" title="展开导航"
        onFocus={() => setPeek(true)} onBlur={() => setPeek(false)}
        style={sbStyles.stripBtn}
      >
        <i className="ri-side-bar-line" />
      </button>
      {rail(true)}
    </div>
  );
}

const sbStyles = {
  rail: {
    alignSelf: "stretch", background: "var(--th-white)", borderRadius: 8,
    display: "flex", flexDirection: "column", gap: 20,
    border: "var(--th-border-card)",
    transition: "width var(--th-dur-2) var(--th-ease), padding var(--th-dur-2) var(--th-ease)",
    flexShrink: 0,
  },
  strip: { position: "relative", width: 12, flexShrink: 0, alignSelf: "stretch", minHeight: 56 },
  handle: {
    position: "absolute", left: 4, top: 56, width: 4, bottom: 0,
    borderRadius: 2, background: "var(--th-gray-100)",
    transition: "opacity var(--th-dur-1) var(--th-ease)", pointerEvents: "none",
  },
  stripBtn: {
    position: "absolute", left: -6, top: 12, width: 24, height: 24, borderRadius: 6,
    appearance: "none", border: "1px solid var(--color-border)", background: "var(--th-white)",
    color: "var(--color-fg)", cursor: "pointer", fontSize: 15,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    boxShadow: "var(--th-shadow-card)",
  },
  group: { display: "flex", flexDirection: "column", gap: 10 },
  headingRow: { padding: "0 10px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 20 },
  heading: { fontFamily: "var(--th-font-cn)", fontSize: 12, color: "var(--color-fg-muted)", lineHeight: 1 },
  toggleRow: { padding: "0 8px", display: "flex", justifyContent: "center", height: 28 },
  toggleBtn: {
    appearance: "none", width: 24, height: 24, borderRadius: 6, border: "none",
    background: "transparent", color: "var(--color-fg)", cursor: "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 15,
    transition: "background var(--th-dur-1) var(--th-ease)",
  },
  list: { display: "flex", flexDirection: "column", gap: 4 },
  item: {
    appearance: "none", border: "none", textAlign: "left", height: 40,
    display: "flex", alignItems: "center", gap: 8, borderRadius: 6,
    fontFamily: "var(--th-font-cn)", fontSize: "var(--th-text-xs)", color: "var(--color-fg)",
    background: "transparent", cursor: "pointer", transition: "background var(--th-dur-1) var(--th-ease)",
  },
};
