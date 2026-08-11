/* shared.jsx — 页面级控件与跨区块复用片段。
   DESIGN.md D 档禁令：账户与通知只在导轨底部；面包屑、时间范围、
   角色/环境切换仍属 PageHeader，不上移进导轨。 */
import React from "react";
import { Segmented, Tag, Tooltip } from "../ds/index.js";

/* ── 权限档位 ───────────────────────────────────────────────────
   PRD 3「权限控制：一级管理看板（全局）- 二级管理看板（团队或部门）-
   个人看板」是**账号权限层级，不是导航层级** —— 只有一个 Dashboard，
   看到哪一档由账号决定。这里的切换器是演示用的「模拟登录身份」，
   真实产品里由后端下发权限，界面上不会有这个开关。 */
export const ROLES = {
  enterprise: { label: "企业管理员", account: "admin@infone.ai", scope: "enterprise" },
  team: { label: "团队管理员", account: "lead@infone.ai", scope: "team" },
  member: { label: "成员", account: "chen@infone.ai", scope: "member" },
};

export function PermissionSwitch({ ctx }) {
  return (
    <Tooltip text="模拟登录身份。企业管理员看全局大盘，团队管理员看本团队，成员只看本人数据 —— 真实产品由账号权限下发，界面上没有这个开关。">
      <Segmented
        size="sm"
        options={Object.entries(ROLES).map(([value, r]) => ({ label: r.label, value }))}
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

export const rangeDays = (r) => (r === "7d" ? 7 : r === "30d" ? 30 : 60);

/** 当前看板口径标签，挂在 PageHeader 的 title 后面。 */
export function ScopeTag({ scope }) {
  if (scope === "member") return <Tag tone="cat2" icon="ri-user-3-line">个人</Tag>;
  if (scope === "team") return <Tag tone="cat3" icon="ri-group-line">基础架构组</Tag>;
  return <Tag tone="cat1" icon="ri-building-line">全企业</Tag>;
}

/* ── Section ────────────────────────────────────────────────────
   一个 Dashboard 页里的模块区块。PRD 的「子母板结构：主面板定义组织大盘，
   辅面板定义侧重点的关注方向」—— 模块是同一页里的区块，不是各自一页。
   小节标题走 15px（--th-text-md，阶梯上「卡片与小节标题」那一档）。 */
export const SECTION_IDS = {
  kpi: "sec-kpi",
  agent: "sec-agent",
  consumption: "sec-consumption",
  funnel: "sec-funnel",
};

/* 四个模块的有序列表 —— 顺序与 PRD v3「2.1 企业管理看板」的分类顺序、
   以及 Dashboard.jsx 里的渲染顺序一致。右侧鱼眼滑动轨道按它定位区块。 */
export const SECTIONS = [
  { key: "kpi", id: SECTION_IDS.kpi, label: "指标卡" },
  { key: "agent", id: SECTION_IDS.agent, label: "Agent 使用监控大盘" },
  { key: "consumption", id: SECTION_IDS.consumption, label: "消耗来源" },
  { key: "funnel", id: SECTION_IDS.funnel, label: "SDLC / ROI 结果指标" },
];

export function Section({ id, title, children }) {
  return (
    <section
      id={id}
      style={{ display: "flex", flexDirection: "column", gap: "var(--th-block-gap)", minWidth: 0, scrollMarginTop: 16 }}
    >
      <h2 style={{
        fontFamily: "var(--th-font-cn)", fontSize: "var(--th-text-md)", fontWeight: 600,
        color: "var(--color-fg)", margin: 0, lineHeight: 1.3,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span aria-hidden="true" style={{
          width: 3, height: 14, borderRadius: 2, background: "var(--color-accent)", flexShrink: 0,
        }} />
        {title}
      </h2>
      {children}
    </section>
  );
}

/* ── 额度水位三档 ── PRD「颜色状态：正常消耗蓝色 / 接近上限黄色 /
   使用到超额（用到池化共享额度）红色」。企业指标卡与个人本月用量共用
   同一份阈值，避免两处各写一套判断。 */
export const QUOTA_WARN_AT = 80;

export function usageLevel(pct) {
  if (pct >= 100) return { tone: "danger", label: "已用到池化共享额度", chip: "danger" };
  if (pct >= QUOTA_WARN_AT) return { tone: "warning", label: "接近上限", chip: "warning" };
  return { tone: "accent", label: "正常消耗", chip: "info" };
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
