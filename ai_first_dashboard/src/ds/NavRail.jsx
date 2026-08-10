/* NavRail.jsx — 240px 全高左导轨，同时承载品牌、导航与账户（页面骨架 D 档）。
   实现取自 recipes/components/NavRail.md 的 React 章节，逐值保留。

   用它而不是 TopNav + Sidebar 的判据：导航只有一层 —— 没有第二排并列的
   一级域要切，48px 顶栏就只剩 logo 和用户 chip，等于白占一条。
   它不是卡：满高、直角、右侧一条 1px 边、无阴影，因为它是页面框。
   禁令：不得同时挂 TopNav；角色/环境切换仍属 PageHeader，不上移进导轨。 */
import React from "react";

export function NavRail({
  logoSrc, brand = "Brand", groups = [], active, onChange,
  user = "admin", collapsed = false, onToggle, onUserClick, onNotifyClick, footer,
  density = "comfortable", collapseMode = "icon",
}) {
  const compact = density === "compact";
  const [peek, setPeek] = React.useState(false);
  const hidden = collapsed && collapseMode === "hover";
  const mini = collapsed && !hidden;

  const rail = (floating) => (
    <aside style={{
      ...nrStyles.rail,
      width: mini ? 64 : 240,
      ...(floating ? {
        position: "absolute", left: 0, top: 0, bottom: 0, zIndex: "var(--z-dropdown)",
        borderRight: "none", boxShadow: "var(--th-shadow-modal)",
        transform: peek ? "translateX(0)" : "translateX(-100%)",
        opacity: peek ? 1 : 0, pointerEvents: peek ? "auto" : "none",
        transition: "transform var(--th-dur-2) var(--th-ease), opacity var(--th-dur-1) var(--th-ease)",
      } : null),
    }}>
      <div style={{ ...nrStyles.brand, justifyContent: mini ? "center" : "flex-start", padding: mini ? 0 : "0 16px" }}>
        {logoSrc && <img src={logoSrc} style={{ width: 20, height: 29 }} alt="" />}
        {!mini && <span style={nrStyles.wm}>{brand}</span>}
      </div>
      <div style={{ ...nrStyles.nav, gap: compact ? 14 : 20, padding: mini ? "16px 8px" : "16px 10px" }}>
        {groups.map((g) => (
          <div key={g.title} style={{ ...nrStyles.group, gap: compact ? 6 : 10 }}>
            {!mini && <div style={nrStyles.heading}>{g.title}</div>}
            <div style={nrStyles.list}>
              {g.items.map((it) => {
                const isActive = it.key === active;
                return (
                  <button
                    key={it.key} type="button" onClick={() => onChange?.(it.key)} title={it.label}
                    aria-current={isActive ? "page" : undefined}
                    style={{
                      ...nrStyles.item,
                      height: compact ? 32 : 40,
                      background: isActive ? "var(--th-teal-50)" : "transparent",
                      justifyContent: mini ? "center" : "flex-start",
                      padding: mini ? 0 : "0 10px",
                      width: mini ? 48 : "100%",
                      marginLeft: mini ? "auto" : 0,
                      marginRight: mini ? "auto" : 0,
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--th-gray-50)"; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    <i className={it.icon} style={{ fontSize: 16, flexShrink: 0, color: isActive ? "var(--th-teal-600)" : "var(--color-fg)" }} />
                    {!mini && <span style={{ whiteSpace: "nowrap" }}>{it.label}</span>}
                    {!mini && it.trailing}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {footer}
      <div style={{ ...nrStyles.foot, flexDirection: mini ? "column" : "row" }}>
        {!mini && (
          <button type="button" style={nrStyles.chip} onClick={onUserClick} aria-haspopup="dialog">
            <span style={nrStyles.avatar} />
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", textAlign: "left" }}>{user}</span>
            <i className="ri-arrow-up-s-line" style={{ color: "var(--color-fg-muted)" }} />
          </button>
        )}
        {mini && <span style={{ ...nrStyles.avatar, width: 24, height: 24 }} />}
        <button type="button" style={nrStyles.iconBtn} aria-label="通知" onClick={onNotifyClick}>
          <i className="ri-notification-3-line" />
        </button>
        <button type="button" style={nrStyles.iconBtn} aria-label={collapsed ? "展开导航" : "收起导航"} onClick={onToggle}>
          <i className={collapsed ? "ri-side-bar-line" : "ri-side-bar-fill"} />
        </button>
      </div>
    </aside>
  );

  if (!hidden) return rail(false);
  return (
    <div style={nrStyles.strip} onMouseEnter={() => setPeek(true)} onMouseLeave={() => setPeek(false)}>
      <span style={{ ...nrStyles.handle, opacity: peek ? 0 : 1 }} />
      <button
        type="button" onClick={onToggle} aria-label="展开导航" title="展开导航"
        onFocus={() => setPeek(true)} onBlur={() => setPeek(false)}
        style={nrStyles.stripBtn}
      >
        <i className="ri-side-bar-line" />
      </button>
      {rail(true)}
    </div>
  );
}

const nrStyles = {
  rail: {
    alignSelf: "stretch", background: "var(--th-white)",
    borderRight: "1px solid var(--color-border)",
    display: "flex", flexDirection: "column", flexShrink: 0,
    transition: "width var(--th-dur-2) var(--th-ease)",
  },
  strip: { position: "relative", width: 12, flexShrink: 0, alignSelf: "stretch", background: "var(--th-white)", borderRight: "1px solid var(--color-border)" },
  handle: {
    position: "absolute", left: 4, top: 56, bottom: 56, width: 4, borderRadius: 2,
    background: "var(--th-gray-100)", transition: "opacity var(--th-dur-1) var(--th-ease)", pointerEvents: "none",
  },
  stripBtn: {
    position: "absolute", left: 6, top: 12, width: 24, height: 24, borderRadius: 6,
    appearance: "none", border: "1px solid var(--color-border)", background: "var(--th-white)",
    color: "var(--color-fg)", cursor: "pointer", fontSize: 15,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    boxShadow: "var(--th-shadow-card)",
  },
  brand: {
    height: 48, flexShrink: 0, display: "flex", alignItems: "center", gap: 10,
    borderBottom: "0.5px solid var(--th-gray-100)",
  },
  /* recipe 原值 14px 不在 DESIGN.md 字号阶梯上，取相邻档 15px（与 TopNav 同一处理）。 */
  wm: { fontFamily: "var(--th-font-brand)", fontWeight: 700, fontSize: "var(--th-text-md)", letterSpacing: "-0.01em", whiteSpace: "nowrap" },
  nav: { flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column" },
  group: { display: "flex", flexDirection: "column" },
  heading: { padding: "0 10px", fontFamily: "var(--th-font-cn)", fontSize: 12, color: "var(--color-fg-muted)", lineHeight: 1, whiteSpace: "nowrap" },
  list: { display: "flex", flexDirection: "column", gap: 4 },
  item: {
    appearance: "none", border: "none", textAlign: "left",
    display: "flex", alignItems: "center", gap: 8, borderRadius: 6,
    fontFamily: "var(--th-font-cn)", fontSize: "var(--th-text-xs)", color: "var(--color-fg)",
    background: "transparent", cursor: "pointer", transition: "background var(--th-dur-1) var(--th-ease)",
  },
  foot: { borderTop: "1px solid var(--color-border)", padding: 10, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 },
  iconBtn: {
    width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
    background: "var(--th-white)", border: "1px solid var(--color-border)",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    color: "var(--color-fg)", fontSize: 13, cursor: "pointer",
  },
  chip: {
    height: 30, padding: "0 8px 0 6px", borderRadius: 6, flex: 1, minWidth: 0,
    background: "var(--th-white)", border: "1px solid var(--color-border)",
    display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
    fontSize: 12, color: "var(--color-fg)", fontFamily: "var(--th-font-cn)", appearance: "none", cursor: "pointer",
  },
  avatar: { width: 20, height: 20, borderRadius: "50%", background: "var(--th-pink-100)", display: "inline-block", flexShrink: 0 },
};
