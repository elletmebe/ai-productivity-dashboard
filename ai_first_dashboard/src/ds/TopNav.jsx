/* TopNav.jsx — 48px glassmorph top navigation bar.
   实现取自 recipes/components/TopNav.md 的 React 章节，逐值保留。
   A 档骨架第一件套：内部只有两组，左组 = logo+wordmark → 48px → 一级 tab；
   右组 = 通知钮 + 用户 chip（margin-left:auto）。tab 禁止居中。 */
import React from "react";

export function TopNav({ logoSrc, brand = "Brand", items = [], active, user = "admin", onSelect, onUserClick, onNotifyClick }) {
  return (
    <header style={tnStyles.bar}>
      <div style={tnStyles.left}>
        <span style={tnStyles.logo}>
          {logoSrc && <img src={logoSrc} style={{ width: 20, height: 29 }} alt="" />}
          <span style={tnStyles.wm}>{brand}</span>
        </span>
        <nav style={tnStyles.items}>
          {items.map(({ label, href }) => {
            const isActive = label === active;
            return (
              <a
                key={label}
                href={href || "#"}
                onClick={(e) => { e.preventDefault(); onSelect?.(label); }}
                aria-current={isActive ? "page" : undefined}
                style={{
                  ...tnStyles.item,
                  opacity: isActive ? 1 : 0.72,
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {label}
                <span style={{
                  ...tnStyles.indicator,
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? "translateX(-50%) scaleX(1)" : "translateX(-50%) scaleX(0.4)",
                }} />
              </a>
            );
          })}
        </nav>
      </div>
      <div style={tnStyles.right}>
        <button type="button" style={tnStyles.iconBtn} aria-label="通知" onClick={onNotifyClick}>
          <i className="ri-notification-3-line" />
        </button>
        <button type="button" style={{ ...tnStyles.userChip, cursor: "pointer" }} onClick={onUserClick} aria-haspopup="dialog">
          <span style={tnStyles.avatar} />
          <span>{user}</span>
          <i className="ri-arrow-down-s-line" style={{ color: "var(--color-fg-muted)" }} />
        </button>
      </div>
    </header>
  );
}

const tnStyles = {
  bar: {
    position: "sticky", top: 0, zIndex: "var(--z-nav)",
    height: 48, width: "100%",
    background: "rgba(255,255,255,0.86)",
    borderBottom: "0.5px solid var(--th-gray-100)",
    backdropFilter: "blur(50px)", WebkitBackdropFilter: "blur(50px)",
    boxShadow: "var(--th-shadow-nav)",
    display: "flex", alignItems: "center", gap: 24, padding: "0 20px",
  },
  /* logo + nav are ONE left-aligned group: the tabs sit 48px after the wordmark
     and never drift toward the center, whatever the viewport width. */
  left: { display: "flex", alignItems: "center", gap: 48, height: "100%", minWidth: 0, marginRight: "auto" },
  logo: { display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit", flexShrink: 0 },
  /* recipe 原值是 14px，但 14 不在 DESIGN.md 的字号阶梯上（11/12/13/15/18/24/32/48）。
     USAGE.md：recipe 实现与 DESIGN.md 冲突时保留 API，以 DESIGN.md 的视觉规则修正实现 —— 取相邻档 15px。 */
  wm: { fontFamily: "var(--th-font-brand)", fontWeight: 700, fontSize: "var(--th-text-md)", letterSpacing: "-0.01em" },
  items: { display: "flex", gap: 40, alignItems: "center", height: "100%" },
  item: {
    fontFamily: "var(--th-font-ui)", fontWeight: 500, fontSize: 13,
    textDecoration: "none", color: "var(--color-fg)",
    position: "relative", height: "100%", display: "inline-flex", alignItems: "center",
  },
  indicator: {
    position: "absolute", left: "50%", bottom: 0,
    width: "calc(100% + 8px)", height: 2,
    background: "var(--th-teal-500)", borderRadius: "2px 2px 0 0",
    transformOrigin: "center bottom",
    transition: "opacity .2s ease, transform .2s cubic-bezier(0.2, 0.7, 0.2, 1)",
  },
  right: { marginLeft: "auto", display: "flex", gap: 20, alignItems: "center" },
  iconBtn: {
    width: 30, height: 30, borderRadius: "50%",
    background: "var(--th-white)", border: "1px solid var(--color-border)",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    color: "var(--color-fg)", fontSize: 13, cursor: "pointer",
  },
  userChip: {
    height: 30, padding: "0 10px 0 6px", borderRadius: 6,
    background: "var(--th-white)", border: "1px solid var(--color-border)",
    display: "inline-flex", alignItems: "center", gap: 8,
    fontSize: 12, color: "var(--color-fg)", fontFamily: "var(--th-font-cn)", appearance: "none",
  },
  avatar: { width: 20, height: 20, borderRadius: "50%", background: "var(--th-pink-100)", display: "inline-block" },
};
