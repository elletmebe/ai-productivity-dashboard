/* shared.jsx — 页面级控件与跨页复用片段。
   DESIGN.md 页面骨架：角色/环境/租户切换、时间范围、页面级主按钮都属于
   PageHeader 右侧，放进顶栏会让它看起来全局生效。 */
import React from "react";
import { Segmented, Tag, Tooltip } from "../ds/index.js";

/** 角色切换 —— PRD 3.4「管理员可查看全团队的数据，成员仅可查看本人的数据」。 */
export function RoleSwitch({ ctx }) {
  return (
    <Tooltip text="管理员可查看全团队数据；成员仅可查看本人数据。切换后顶栏可见的一级看板随之变化。">
      <Segmented
        size="sm"
        options={[{ label: "管理员", value: "admin" }, { label: "成员", value: "member" }]}
        value={ctx.role}
        onChange={ctx.setRole}
      />
    </Tooltip>
  );
}

/** 时间范围 —— PRD 3.1「全部 / 30天 / 7天，按自然日分桶，取调用记录的 timestamp 本地时区归日」。 */
export function RangeSwitch({ ctx }) {
  return (
    <Segmented
      size="sm"
      options={[{ label: "全部", value: "all" }, { label: "30 天", value: "30d" }, { label: "7 天", value: "7d" }]}
      value={ctx.range}
      onChange={ctx.setRange}
    />
  );
}

export function BoardActions({ ctx, range = true }) {
  return (
    <>
      {range && <RangeSwitch ctx={ctx} />}
      <RoleSwitch ctx={ctx} />
    </>
  );
}

export const rangeDays = (r) => (r === "7d" ? 7 : r === "30d" ? 30 : 60);

/** 企业 / 团队两档口径标签，挂在 PageHeader 的 title 后面。 */
export function ScopeTag({ scope }) {
  return scope === "team"
    ? <Tag tone="cat2" icon="ri-group-line">基础架构组</Tag>
    : <Tag tone="cat1" icon="ri-building-line">全企业</Tag>;
}

/** 卡内下沉说明面板。一张卡内最多一种内嵌底色（视觉预算）。 */
export function InsetNote({ children, style }) {
  return (
    <div style={{
      background: "var(--color-surface-inset)",
      borderRadius: "var(--th-radius-sm)",
      padding: 12,
      fontSize: "var(--th-text-xs)",
      color: "var(--color-fg-muted)",
      lineHeight: 1.7,
      minWidth: 0,
      ...style,
    }}>{children}</div>
  );
}

/** 一行「标签 : 值」，值等宽。用于口径表、元信息行。 */
export function KV({ label, value, mono = true }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, minWidth: 0 }}>
      <span style={{ fontSize: "var(--th-text-xs)", color: "var(--color-fg-muted)", whiteSpace: "nowrap" }}>{label}</span>
      <span className={mono ? "th-nums" : undefined} style={{
        fontSize: "var(--th-text-xs)", color: "var(--color-fg)", fontWeight: 500,
        textAlign: "right", minWidth: 0,
      }}>{value}</span>
    </div>
  );
}
