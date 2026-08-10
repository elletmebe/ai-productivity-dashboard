# InfOne · AI First Dashboard

企业 AgentOS 管理后台的 AI First Dashboard 原型 demo。Vite + React 18，无 UI 依赖。

---

## 两条最高优先级规则

在这个仓库里做任何改动前，先读这两份文件；它们的优先级高于你的默认习惯，也高于「看起来更好看」的判断。

### 1. 遵循 PRD

**PRD 权威文件：** [`【WIP】Proposal |  InfOne AI First Dashboard.pdf`](./【WIP】Proposal%20|%20%20InfOne%20AI%20First%20Dashboard.pdf)

- **指标口径以 PRD 第 2 章为准**，一律从 [`src/data/metrics.js`](./src/data/metrics.js) 取 `label` 与 `hint`，不在页面里另写一份口径文案。改口径先改 `metrics.js`。
- **模块划分以 PRD 第 3 章为准**：3.1 企业管理看板五模块（AI First 概览 / 生产力监控大盘 / AI 应用情况分析 / SDLC-ROI 转化漏斗 / 消耗来源分析）、3.2 团队管理看板（同模块 by 团队）、3.3 个人看板（工作记录 / Contribution activity / Token plan）。不擅自增删模块。
- **PRD 关键设计四条必须始终成立**：① 子母板结构；② 指标口径透明可见（hover 至指标上展现含义）；③ 权限控制三级（企业 → 团队 → 个人）；④ 管理员看全团队、成员只看本人。
- **PRD 里写死的数值就是演示数值**（覆盖率 78.9% / 1,247 分之 1,580 人、峰值周五 11:00–12:00 · 1,030 次请求、模型与工程占比、Token plan 19.639 / 50 等），改数据时保持这些锚点不变。
- **指标之间必须自洽**：生成 ≥ 采纳 ≥ 进 PR ≥ 合入，漏斗单调递减；页面上任何一个比率都要能由同页的两个绝对值除出来。新增文案里出现的倍数、占比、差值一律从数据现算，不写死 —— 写死会立刻产生「洞察说 2.6 倍、图表算出来 1.7 倍」这类自相矛盾。

### 2. 遵循设计规范

**设计规范权威文件：** [`infone-design-spec-feat-infone/infone/`](./infone-design-spec-feat-infone/infone/)

阅读顺序按该目录 `USAGE.md` 的规定：`DESIGN.md` 全文（运行时唯一权威）→ `tokens.css`（实际取值，不照正文猜）→ `components.manifest.json`（先确认有没有现成组件）→ `recipes/index.json` → 只读匹配到的 `recipes/`。

不可逾越的几条：

- **`src/styles/tokens.css` 是从规范包字节级复制过来的，禁止本地改值。** 需要新色先判断它属于哪一类（交互 / 状态 / 分类 / 强度 / 构成 / 数据墨色 / 表面），用 oklch 从该类现有色阶推，并回写规范包。
- **组件优先。** 新界面先在 [`src/ds/`](./src/ds/) 找现成组件；拥有 token 不代表可以重画已有组件。组件 API 以 `recipes/components/<Name>.md` 的声明章节为准，只能新增可选 props，不做破坏性变更。
- **骨架已定为 A 档**（`TopNav` 48px + `Sidebar` 217px + 16px 画布），顶栏承载一级域、侧栏承载二级。**档位在填内容阶段不得改变**，也不得为单个页面破例。
- **顶栏只有两组**（左：logo + 一级 tab；右：通知 + 用户 chip）。角色切换、时间范围、页面级主按钮一律属于 `PageHeader` 右侧。
- **取色必须走 `DESIGN.md` 的「取色决策树」。** 三条永久禁令：`-fg` 结尾的 token 不得填充任何形状；`-solid` / `--th-chart-*` / `--color-stack-*` 不得承载深色文字；`--th-blue-*` 不得进入界面。
- **色彩配额是下限、视觉预算是上限，两者都是硬约束。** 每页交付前数一遍：同屏着色语义 ≤3 类、列表行 ≤3 个视觉元素、同一属性只在一处着色、一张卡内 ≤1 种内嵌底色、强度/热力整屏 ≤1 处。
- **字号只走 11/12/13/15/18/24/32/48 一条阶梯**；卡内 padding 只允许 12/16，区块间距只允许 8/12/16，画布层恒为 16px。
- **不写固定列数**：卡片网格一律 `repeat(auto-fill|auto-fit, minmax(<最小可读宽>, 1fr))`；主内容区恒为 `flex:1; min-width:0`。
- **金额一律 ¥**（PRD 把 ROI 定义为「行/元」，`DESIGN.md` 文案规范同样要求 ¥）；数字加 `.th-nums`。

---

## 已记录的两处「PRD ↔ 设计规范」冲突及裁决

| 冲突点 | PRD | 设计规范 | 本项目取值 |
| --- | --- | --- | --- |
| Token plan 币种 | 示意图用 `$112.062` | `DESIGN.md` 文案规范要求 `¥` | **取 ¥** —— PRD 自身把 ROI 定义为「行/元」，统一到 ¥ 两边都成立 |
| 大数字缩写 | 示意图用 `16.5M 入 · 1.4M 出` | `Chart` 默认 `万/亿` 紧凑格式 | **取 万/亿** —— 全站中文界面，混用两套量级读法更差 |

再出现同类冲突：**API 与结构以 PRD 为准，视觉取值与文案以 `DESIGN.md` 为准**，并把裁决补进这张表。

---

## 结构

```
src/
  styles/tokens.css     从规范包字节级复制，禁止本地改值（fonts/ 必须同级同搬）
  ds/                   设计系统组件层，一个组件一份 API，源自 recipes
  data/metrics.js       指标口径字典（PRD 第 2 章），hover 提示的唯一来源
  data/mock.js          演示数据，锚点取自 PRD，其余派生且互相自洽
  pages/                八个页面，一页一个 PRD 模块
  App.jsx               A 档骨架 + 一级/二级导航 + 角色权限
```

## 命令

```bash
npm run dev
```

```bash
npm run build
```

## 交付前自查（每次改完跑一遍，不必等人指出）

除 `DESIGN.md` 的完成前自查清单外，至少确认：

1. 窄宽两态各看一次：没有固定列数的网格、没有按钮/标签换行溢出、表格状态列没被挤换行。
2. 颜色角色扫一遍：`background|stroke|fill|borderColor` 旁边没有 `-fg` 结尾的 token；`--th-gray-300` 没被当数据墨色；`--th-blue-` 没进界面。
3. 视觉预算数一遍（见上「色彩配额是下限」那条）。
4. 全部 `var(--…)` 都能在 `tokens.css` 里解析。
5. 页面上每个比率都能由同页的绝对值除出来。
