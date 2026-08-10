/* metrics.js — 指标口径字典
   逐条对应 PRD 第 2 章「数据指标」的「含义 + 计算公式」。
   PRD 关键设计 2：指标口径透明可见 —— hover 至指标上能展现指标含义，
   确保理解一致性。所有指标标签都必须从这里取 hint，不在页面里另写一份。 */

export const M = {
  // 2.1 代码产出指标
  aiLines: {
    label: "AI 代码量",
    hint: "生成和补全累计代码量。AI 代码量 = Σ(补全建议展示的代码行数) + Σ(对话/编辑模式生成的代码行数)",
  },
  accepted: {
    label: "采纳量",
    hint: "补全 patch + 生成行数中被用户 accept 的代码行数。采纳量 = Σ(被 accept 的补全代码行数) + Σ(被 accept/应用 的生成代码行数)",
  },
  acceptRate: {
    label: "AI 采纳率",
    hint: "AI 生成的代码中被用户接受的比例，衡量生成结果的即时可用性。AI 采纳率 = 采纳量 ÷ AI 生成代码量 × 100%",
  },
  commitLines: {
    label: "Commit 代码行数",
    hint: "代码提交行数 = Σ(commit diff 中新增行数 + 删除行数)",
  },
  retentionRate: {
    label: "AI 代码留存率",
    hint: "采纳代码里有多少进入 PR。AI 代码留存率 = (创建 PR 时 diff 中仍能匹配到的 AI 生成行数) ÷ (此前被 accept 的 AI 代码总行数) × 100%",
  },
  mergeRate: {
    label: "AI 合入率",
    hint: "PR 合入主干后 AI 代码的保留比例，衡量 AI 代码最终存活情况。AI 合入率 = (PR merge 进主干后仍保留的 AI 行数) ÷ (PR 创建时包含的 AI 行数) × 100%",
  },
  aiContribLines: {
    label: "AI 贡献行数",
    hint: "代码贡献中使用 AI 生成行数 = Σ(单次 commit 中被标记为 AI 来源的新增行数)",
  },
  aiShare: {
    label: "AI 代码占比",
    hint: "Commit 级别：提交到代码库后代码库里 AI 占多少 = (提交代码中 AI 贡献行数 ÷ commit 提交代码中总变更行数) × 100%",
  },
  reworkRate: {
    label: "返工率",
    hint: "写完又推翻重来的代码占多少。返工率 = (被 accept 后在合入前又被修改或删除的行数) ÷ (被 accept 的总行数) × 100%",
  },
  delivery: {
    label: "交付量",
    hint: "统计周期内创建的合并请求数量，衡量交付产出。交付量 = COUNT(统计周期内创建的 MR/PR 数量)",
  },

  // 2.2 ROI 衡量指标
  turns: {
    label: "对话轮次",
    hint: "用户与 AI 的有效交互次数，作为效率类指标的分母基数。总对话轮次 = COUNT(用户消息条目，按 session 去重后累加)",
  },
  linesPerTurn: {
    label: "单轮对话平均贡献行数",
    hint: "衡量能在越少的对话内带来越多有效代码产出。单轮对话平均贡献行数 = 有效代码产出总行数 ÷ 总对话轮次",
  },
  roi: {
    label: "ROI",
    hint: "单位金额最终产出的有效代码行数。ROI = 有效代码产出总行数 ÷ 总消耗金额（单位：行/元）",
  },
  modelShare: {
    label: "Token 消耗模型分布",
    hint: "各大模型在总 token 消耗中的占比，用于分析模型使用结构与成本构成。某模型消耗占比 = 该模型消耗 token 数 ÷ 总消耗 token 数 × 100%",
  },
  repoShare: {
    label: "Token 消耗工程分布",
    hint: "各代码仓库（工程）的 token 消耗金额占团队/企业总消耗的比例。某工程消耗占比 = 该工程消耗金额 ÷ 统计周期内总消耗金额 × 100%（按金额算，不按 token 数算，避免模型单价差异导致占比失真）",
  },
  spendRank: {
    label: "消耗排行",
    hint: "月度 token 总消耗排行，用于成本监控与预算分配。月度消耗 = Σ(该用户/团队在自然月内所有模型调用消耗的 token 数)，按消耗量降序生成榜单",
  },

  // 2.3 活跃 / 留存类
  dau: {
    label: "DAU（有对话的用户）",
    hint: "统计口径日内，至少发起过一次有效对话（产生过用户消息）的去重用户数。DAU = COUNT(DISTINCT user_id, WHERE 当日存在 ≥1 条用户消息)",
  },
  daa: {
    label: "DAA（active session）",
    hint: "统计口径日内产生的会话总数，衡量「发生了多少次独立使用」而不是「多少人在用」。DAA = COUNT(当日发起的 session 数，按 session_id 去重，不含编排派生的 subagent)",
  },

  // 3.1 模块级口径
  coverage: {
    label: "全员 AI 覆盖率",
    hint: "从用户覆盖视角展现企业 AI Native 程度，分活跃使用、低频使用、未使用三层。覆盖率 = (周活跃 + 低频) ÷ 在册员工数 × 100%",
  },
  activityDist: {
    label: "AI 应用活跃度",
    hint: "衡量活跃时间分布（大模型请求）。按本地时区把调用按「星期 × 小时」分桶，格子深浅对应该桶的请求量分档",
  },
  funnel: {
    label: "SDLC 漏斗",
    hint: "以当月 AI 生成的代码行数为锚定基数，后续每个节点统计「这批锚定行中，走完到该环节且仍存活的行数」。锚定行只会被保留或被删除/改写（掉出统计），因此该指标单调递减，不受后续人工新增代码影响",
  },
  calls: {
    label: "调用次数",
    hint: "底层模型实际被调用的次数，非用户提问次数",
  },
  inOut: {
    label: "入 / 出",
    hint: "输入 token（含上下文与历史）/ 输出 token（模型生成部分）",
  },

  // 3.3 个人看板（新版）—— 五张统计卡
  biggestContribution: {
    label: "Your biggest contribution",
    hint: "单次最大贡献：统计周期内单次提交/合并中 AI 贡献行数的最高值，附带发生日期与所在分支",
  },
  busiestDay: {
    label: "Your busiest day",
    hint: "调用量最高的那个自然日，按调用记录的 timestamp 本地时区归日",
  },
  longestStreak: {
    label: "Your longest streak",
    hint: "历史上最长的连续活跃天数；当天至少有过一次模型调用算一个活跃日",
  },
  peakTokens: {
    label: "Your peak tokens",
    hint: "单日 token 用量的最高值（各模型合计，缓存命中的部分不重复计入）",
  },
  lifetimeTokens: {
    label: "Your lifetime tokens",
    hint: "账号开通至今的累计 token 用量（各模型合计）",
  },

  // 贡献日历 / Contribution activity
  contributions: {
    label: "贡献日历",
    hint: "按自然日在日历网格中标记贡献强度，格子颜色深浅对应当日贡献值分档（Less → More 共 5 档）。单日贡献值由当日 commit 行数 / 次数换算后得出",
  },
  contribActivity: {
    label: "Contribution activity",
    hint: "按月分组的贡献流水：仓库提交、新建仓库、MR 合并与单次最大贡献。默认展示最近 3 个月，展开后在本区域内滚动，页面高度不变",
  },

  // 本月用量
  monthlyUsage: {
    label: "本月用量",
    hint: "当前重置周期内已消耗 credits ÷ 周期总配额。正常消耗蓝色；接近上限转黄色；额度用尽后进入池化共享额度，转红色",
  },
};
