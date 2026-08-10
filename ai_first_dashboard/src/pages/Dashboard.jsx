/* Dashboard.jsx — 唯一的一张看板。
   PRD 3「权限控制：一级管理看板（全局）- 二级管理看板（团队或部门）-
   个人看板」是**账号权限层级，不是导航层级**：产品只有一个 Dashboard，
   看到哪一档内容由登录账号的权限决定，用户不通过导航切换。

     企业管理员 → 全局大盘：五个模块区块
     团队管理员 → 同样五个模块，口径收敛到本团队
     成员       → 个人看板（PRD 3.3）

   模块是同一页里的区块，不是各自一页 —— 对应 PRD 关键设计 1
  「子母板结构：主面板定义组织大盘，辅面板定义侧重点的关注方向」。 */
import React from "react";
import { PageHeader } from "../ds/index.js";
import { PermissionSwitch, RangeSwitch, ScopeTag, SECTION_IDS } from "./shared.jsx";
import { UPDATED_AT } from "../data/mock.js";

import Overview from "./Overview.jsx";
import Productivity from "./Productivity.jsx";
import Adoption from "./Adoption.jsx";
import FunnelRoi from "./FunnelRoi.jsx";
import Consumption from "./Consumption.jsx";
import Personal from "./Personal.jsx";

const TITLE = {
  enterprise: { title: "企业管理看板", desc: "全局口径：先看有无风险，再看产出、覆盖、转化与消耗归属。" },
  team: { title: "团队管理看板", desc: "团队口径：同一套模块，数据收敛到本团队。" },
  member: { title: "个人看板", desc: "成员权限只能看到本人数据。" },
};

export default function Dashboard({ ctx }) {
  const t = TITLE[ctx.scope];
  const admin = ctx.scope !== "member";

  return (
    <>
      <PageHeader
        title={t.title}
        tags={<ScopeTag scope={ctx.scope} />}
        meta={`更新于 ${UPDATED_AT}`}
        description={t.desc}
        actions={
          <>
            {admin && <RangeSwitch ctx={ctx} />}
            <PermissionSwitch ctx={ctx} />
          </>
        }
      />

      {admin ? (
        <>
          <Overview ctx={ctx} />
          <Productivity ctx={ctx} />
          <Adoption ctx={ctx} />
          <FunnelRoi ctx={ctx} />
          <Consumption ctx={ctx} />
        </>
      ) : (
        <Personal />
      )}
    </>
  );
}

export { SECTION_IDS };
