/* App.jsx — D 档骨架（DESIGN.md 页面骨架 · 判断树第 4 条）

   判断树逐条走：
     1. 有会话吗？有 → 不是 C 档
     2. 单任务收尾、只有一个正确的后续动作吗？否 → 不是 B 档
     3. 需要在两个及以上并列的一级域之间横向切换吗？**否** ——
        企业 / 团队 / 个人不是三个并列域，而是同一张看板在不同账号
        权限下的不同内容，用户不通过导航在其间切换
     4. 都不是，导航只有一层 → **D 档：NavRail 240px 全高，无顶栏**

   D 档布局（不可改）：导轨贴视口左缘满高，右侧 1px 边、无圆角无阴影；
   main{flex:1; min-width:0; padding:16px; display:flex;
   flex-direction:column; gap:16px}。不得同时挂 TopNav。 */
import React from "react";
import { NavRail } from "./ds/index.js";
import logo from "./assets/tokenhub-logo.svg";
import Dashboard from "./pages/Dashboard.jsx";
import { ROLES, SECTION_IDS } from "./pages/shared.jsx";

/* 导航只有一层，也只有一个模块 —— 权限决定看到什么，不靠导航分流。 */
const NAV = [{
  title: "监控",
  items: [{ key: "dashboard", icon: "ri-dashboard-line", label: "Dashboard" }],
}];

export default function App() {
  const [role, setRole] = React.useState("enterprise");
  const [collapsed, setCollapsed] = React.useState(false);
  const [range, setRange] = React.useState("30d");
  const [deepLink, setDeepLink] = React.useState(null);

  /* 页内跳转：模块是同一页的区块，所以「查看工程分布」这类动作是
     滚动到该区块，不是切页。第二个参数把筛选意图（如 dim:"repo"）
     带给目标区块。 */
  const go = React.useCallback((sectionKey, intent) => {
    setDeepLink(intent && intent.page === sectionKey ? intent : null);
    const el = document.getElementById(SECTION_IDS[sectionKey]);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const ctx = { role, setRole, scope: ROLES[role].scope, range, setRange, go, deepLink };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* D 档要求导轨「贴视口左缘满高」。NavRail 自身是 align-self:stretch，
          在长页面里会被文档高度拉长，底部账户区随之滚出视口 —— 所以由外层
          包一个 sticky 容器把它钉在 100vh，品牌、导航、账户三段始终可见。
          NavRail 本体保持与 recipe 一致，不改它的样式。 */}
      <div style={{
        position: "sticky", top: 0, height: "100vh",
        alignSelf: "flex-start", display: "flex", flexShrink: 0,
      }}>
        <NavRail
          logoSrc={logo}
          brand="InfOne"
          groups={NAV}
          active="dashboard"
          user={ROLES[role].account}
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
        />
      </div>
      <main style={{ flex: 1, minWidth: 0, padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        <Dashboard key={role} ctx={ctx} />
      </main>
    </div>
  );
}
