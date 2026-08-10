/* App.jsx — A 档骨架（DESIGN.md 页面骨架 · 判断树第 3 条命中）
     有会话 ✓ → 非单任务终点 ✓ → 需要在两个及以上并列一级域之间横向切换 ✓
     PRD 3「权限控制：一级管理看板（全局）- 二级管理看板（团队或部门）- 个人看板」
     正是三个并列一级域，因此顶栏承载一级、侧栏承载二级。

   布局数值不可改：画布 #F8F9FB；nav 下 .shell 容器
   display:flex; gap:16px; padding:16px; align-items:flex-start；
   main{flex:1; min-width:0; display:flex; flex-direction:column; gap:16px}。 */
import React from "react";
import { TopNav, Sidebar } from "./ds/index.js";
import logo from "./assets/tokenhub-logo.svg";

import EnterpriseOverview from "./pages/Overview.jsx";
import Productivity from "./pages/Productivity.jsx";
import Adoption from "./pages/Adoption.jsx";
import FunnelRoi from "./pages/FunnelRoi.jsx";
import Consumption from "./pages/Consumption.jsx";
import Personal from "./pages/Personal.jsx";

/* 一级域 —— 顶栏。PRD 用户角色说明：管理员可查看全团队的数据，成员仅可查看本人的数据。*/
const TABS = [
  { key: "enterprise", label: "企业看板", adminOnly: true },
  { key: "team", label: "团队看板", adminOnly: true },
  { key: "personal", label: "个人看板", adminOnly: false },
];

/* 二级域 —— 侧栏。企业与团队共用同一组模块（PRD 3.1 / 3.2 模块对齐），
   差别只在 scope，页面组件按 scope 取数。*/
const BOARD_ITEMS = [
  { key: "overview", icon: "ri-sparkling-2-line", label: "AI First 概览" },
  { key: "productivity", icon: "ri-bar-chart-grouped-line", label: "生产力监控大盘" },
  { key: "adoption", icon: "ri-team-line", label: "AI 应用情况分析" },
  { key: "funnel", icon: "ri-filter-3-line", label: "SDLC / ROI 转化漏斗" },
  { key: "consumption", icon: "ri-coins-line", label: "消耗来源分析" },
];

const NAV = {
  enterprise: [{ title: "企业管理看板", items: BOARD_ITEMS }],
  team: [{ title: "团队管理看板 · 基础架构组", items: BOARD_ITEMS }],
  /* 个人看板按 PRD 3.3 新版收成单页（「保持页面一页内做完」），
     所以这一组只有一个二级入口 —— 骨架档位不变，仍是 A 档。 */
  personal: [{
    title: "个人看板",
    items: [
      { key: "me", icon: "ri-user-3-line", label: "我的数据" },
    ],
  }],
};

const PAGES = {
  overview: EnterpriseOverview,
  productivity: Productivity,
  adoption: Adoption,
  funnel: FunnelRoi,
  consumption: Consumption,
  me: Personal,
};

export default function App() {
  const [role, setRole] = React.useState("admin");     // admin | member
  const [tab, setTab] = React.useState("enterprise");
  const [page, setPage] = React.useState("overview");
  const [collapsed, setCollapsed] = React.useState(false);
  const [range, setRange] = React.useState("30d");     // all | 30d | 7d
  const [deepLink, setDeepLink] = React.useState(null);

  const visibleTabs = TABS.filter((t) => role === "admin" || !t.adminOnly);

  // 角色降级为「成员」时，只剩个人看板可达。
  React.useEffect(() => {
    if (role === "member" && tab !== "personal") { setTab("personal"); setPage("me"); }
  }, [role, tab]);

  const go = (target) => {
    if (target.tab && target.tab !== tab) setTab(target.tab);
    if (target.page) setPage(target.page);
    setDeepLink(target);
  };

  const onTab = (label) => {
    const next = TABS.find((t) => t.label === label);
    if (!next) return;
    setTab(next.key);
    setPage(NAV[next.key][0].items[0].key);
    setDeepLink(null);
  };

  const groups = NAV[tab];
  const valid = groups.some((g) => g.items.some((i) => i.key === page));
  const activePage = valid ? page : groups[0].items[0].key;
  const Page = PAGES[activePage];

  const ctx = {
    role, setRole, scope: tab, range, setRange, go,
    deepLink: deepLink?.page === activePage ? deepLink : null,
  };

  return (
    <>
      <TopNav
        logoSrc={logo}
        brand="InfOne"
        items={visibleTabs.map((t) => ({ label: t.label }))}
        active={TABS.find((t) => t.key === tab)?.label}
        onSelect={onTab}
        user={role === "admin" ? "admin@infone.ai" : "chen@infone.ai"}
      />
      <div className="shell" style={{
        display: "flex", gap: 16, padding: 16, alignItems: "flex-start",
        minHeight: "calc(100vh - 48px)",
      }}>
        <Sidebar
          groups={groups}
          active={activePage}
          onChange={(k) => { setPage(k); setDeepLink(null); }}
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
        />
        <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <Page key={`${tab}-${activePage}`} ctx={ctx} />
        </main>
      </div>
    </>
  );
}
